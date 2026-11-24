<template>
  <!--
    Build search (spec 043, layout A). Opened from the header on every page;
    full screen on phones, a panel near the top on larger screens.

    Everything here runs on the device: the index is downloaded once, when the
    dialog first opens (useSearchIndex), and each keystroke is answered from it.
    This component is loaded only on that first open, so a visit that never
    searches pays for neither the index nor this code.

    Back on a phone closes it without leaving the page; the header owns that
    (useOverlayHistory) because the header is where it opens.
  -->
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :fullscreen="smAndDown"
    :max-width="smAndDown ? undefined : 640"
    :content-class="smAndDown ? 'search-dialog' : 'search-dialog search-dialog--top'"
    scrollable
    @after-enter="selectQuery"
  >
    <!-- The app's dialog conventions (PickerDialog): 8px corners on desktop,
         square as a full-screen sheet, where rounded corners would show the
         scrim at the screen's own corners. -->
    <v-card class="search-card" :rounded="smAndDown ? 0 : 'lg'">
      <div class="search-bar d-flex align-center">
        <v-text-field
          ref="field"
          v-model="query"
          autofocus
          clearable
          hide-details
          variant="solo"
          flat
          density="comfortable"
          prepend-inner-icon="mdi-magnify"
          placeholder="Search builds, authors, civs"
          autocomplete="off"
          spellcheck="false"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="rows.length > 0 ? 'true' : 'false'"
          aria-controls="search-results"
          :aria-activedescendant="activeIndex >= 0 ? rowId(activeIndex) : undefined"
          aria-label="Search builds, authors and civilizations"
          @keydown="onKeydown"
        ></v-text-field>
        <!-- Small on desktop, full size on a phone, where it is the main way out
             (as in PickerDialog). -->
        <v-btn
          icon="mdi-close"
          variant="text"
          :size="smAndDown ? 'default' : 'small'"
          aria-label="Close search"
          class="ml-1"
          @click="$emit('update:modelValue', false)"
        ></v-btn>
      </div>
      <v-divider></v-divider>

      <v-card-text class="pa-0 search-body">
        <!-- Still downloading. A query typed now is kept and answered the
             moment the index arrives (US4 #4). -->
        <div v-if="status === 'loading' || status === 'idle'" aria-busy="true">
          <v-skeleton-loader v-for="n in 4" :key="n" type="list-item-two-line"></v-skeleton-loader>
        </div>

        <div v-else-if="status === 'error'" class="search-message">
          <p class="mb-3">Search can't load right now.</p>
          <v-btn variant="tonal" color="primary" to="/builds" @click="$emit('update:modelValue', false)">
            Browse all builds
          </v-btn>
        </div>

        <div v-else-if="trimmed.length === 1" class="search-message">Keep typing…</div>

        <div v-else-if="rows.length === 0 && trimmed" class="search-message">
          <p class="mb-3">No builds found for “{{ trimmed }}”.</p>
          <v-btn variant="tonal" color="primary" to="/builds" @click="$emit('update:modelValue', false)">
            Browse all builds
          </v-btn>
        </div>

        <v-list v-else id="search-results" role="listbox" class="py-0" aria-label="Search results">
          <!-- No hint line above the list: the field's placeholder already says
               what can be searched, and the list below shows what is there. -->
          <template v-for="(group, g) in groups" :key="group.label">
            <v-list-subheader :class="{ 'mt-1': g > 0 }">
              <v-icon v-if="group.icon" size="small" class="mr-1">{{ group.icon }}</v-icon>{{ group.label }}
            </v-list-subheader>
            <!-- Plain rows, not v-list-item, measured: up to 24 rows are
                 rebuilt on every keystroke, and as v-list-items that took
                 150ms median (290ms worst) per keystroke on a 4x-throttled
                 phone, against SC-002's 50ms; the matching itself is 5-22ms.
                 The look comes from the theme tokens and the app's base font
                 (Inter). Not Vuetify's text-body-* classes: they set Roboto
                 of their own, which showed beside the Inter field above. -->
            <div
              v-for="row in group.rows"
              :key="row.key"
              :id="rowId(row.index)"
              role="option"
              :aria-selected="row.index === activeIndex ? 'true' : 'false'"
              class="search-row"
              :class="{ 'search-row--active': row.index === activeIndex }"
              @click="openRow(row)"
              @mousemove="activeIndex = row.index"
            >
              <!-- One fixed lead box for flags and avatars alike, so every
                   title starts on the same line. -->
              <div class="search-lead">
                <CivFlag v-if="row.civ" :civ="row.civ" />
                <UserAvatar v-else :name="row.title" :size="28" />
              </div>
              <div class="search-text">
                <div class="search-title">
                  <template v-if="row.segments">
                    <span
                      v-for="(segment, s) in row.segments"
                      :key="s"
                      :class="{ 'search-hit': segment.hit }"
                      >{{ segment.text }}</span
                    >
                  </template>
                  <template v-else>{{ row.title }}</template>
                </div>
                <div class="search-subtitle">{{ row.subtitle }}</div>
              </div>
              <!-- A wrapper, not a class on AgeChips: it renders a bare list of
                   chips (a fragment), which cannot take a class and warned. -->
              <div v-if="row.timings" class="search-ages">
                <AgeChips :timings="row.timings" />
              </div>
            </div>
          </template>
          <div v-if="result.total > result.builds.length" class="search-more">
            Showing {{ result.builds.length }} of {{ result.total }}. Add a word or a civ to narrow it.
          </div>
        </v-list>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { computed, nextTick, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import CivFlag from "@/components/common/CivFlag.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import AgeChips from "@/components/builds/AgeChips.vue";
import { civs } from "@/composables/filter/civDefaultProvider.js";
import { useSearchIndex } from "@/composables/search/useSearchIndex.js";
import { prepare, search } from "@/composables/search/searchIndex.js";
import { hiddenIds } from "@/composables/search/hiddenBuilds.js";

const FEUDAL_AGE = 2;
const CASTLE_AGE = 3;

/**
 * The ages the index carries, in AgeChips' shape. Null when the build has
 * neither, so the row draws nothing rather than an empty chip group.
 */
function ageTimings(entry) {
  const timings = [];
  if (entry.feudalSeconds !== null) {
    timings.push({ age: FEUDAL_AGE, seconds: entry.feudalSeconds, derived: entry.feudalEstimated });
  }
  if (entry.castleSeconds !== null) {
    timings.push({ age: CASTLE_AGE, seconds: entry.castleSeconds, derived: entry.castleEstimated });
  }
  return timings.length ? timings : null;
}
/** Builds shown before anything is typed. */
const TRENDING_COUNT = 8;

// Prepared once per page session, not per open: normalising 4,000+ titles is
// cheap but not free on a phone, and the index does not change in a session.
let preparedFor = null;
let prepared = null;
function preparedIndex(raw) {
  if (raw !== preparedFor) {
    prepared = prepare(raw, civs.value);
    preparedFor = raw;
  }
  return prepared;
}

/** Splits a title into plain and highlighted runs, from the matcher's ranges. */
function segmentsOf(title, ranges) {
  const segments = [];
  let at = 0;
  for (const [start, end] of ranges) {
    if (start > at) segments.push({ text: title.slice(at, start), hit: false });
    segments.push({ text: title.slice(start, end), hit: true });
    at = end;
  }
  if (at < title.length) segments.push({ text: title.slice(at), hit: false });
  return segments;
}

export default {
  name: "SearchDialog",
  components: { CivFlag, UserAvatar, AgeChips },
  props: {
    modelValue: { type: Boolean, default: false },
  },
  emits: ["update:modelValue", "open"],
  setup(props, { emit }) {
    const { smAndDown } = useDisplay();
    const { index, status, load } = useSearchIndex();
    const query = ref("");
    const hidden = ref(new Set());
    const activeIndex = ref(-1);

    const trimmed = computed(() => (query.value ?? "").trim());

    const result = computed(() => {
      if (status.value !== "ready" || !index.value) return { civ: null, authors: [], builds: [], total: 0 };
      return search(preparedIndex(index.value), query.value ?? "", { hiddenIds: hidden.value });
    });

    const buildRow = (entry, ranges, index) => {
      const authorList = preparedIndex(index.value).authors;
      return {
        key: `build-${entry.id}`,
        civ: entry.civ,
        title: entry.title,
        segments: ranges ? segmentsOf(entry.title, ranges) : null,
        subtitle: [authorList[entry.authorIndex]?.name, entry.season ? `Season ${entry.season}` : null]
          .filter(Boolean)
          .join(" · "),
        timings: ageTimings(entry),
        to: `/builds/${entry.id}`,
      };
    };

    // Before anything is typed: what is trending now, straight from the index,
    // which arrives sorted by the Trending score. No extra read, and a first
    // open shows builds rather than an empty panel.
    const trending = computed(() => {
      if (status.value !== "ready" || !index.value) return [];
      const out = [];
      for (const entry of preparedIndex(index.value).entries) {
        if (hidden.value.has(entry.id)) continue;
        out.push(entry);
        if (out.length === TRENDING_COUNT) break;
      }
      return out;
    });

    // One flat list for the keyboard, grouped for display.
    const groups = computed(() => {
      if (!trimmed.value) {
        if (!trending.value.length) return [];
        return [
          {
            label: "Trending",
            // The Home tab's icon, so it reads as the same list.
            icon: "mdi-trending-up",
            rows: trending.value.map((entry, i) => ({ ...buildRow(entry, null, index), index: i })),
          },
        ];
      }
      const out = [];
      let i = 0;
      const { civ, authors, builds, total } = result.value;
      if (civ) {
        out.push({
          label: "Civilization",
          rows: [
            {
              key: `civ-${civ.code}`,
              index: i++,
              civ: civ.code,
              title: civ.title,
              subtitle: `Civ page · ${civ.count} ${civ.count === 1 ? "build" : "builds"}`,
              to: civ.slug ? `/civ/${civ.slug}` : `/builds?civ=${civ.code}`,
            },
          ],
        });
      }
      // An author without an id has no page to open, so is not offered.
      const linkable = authors.filter((author) => author.uid);
      if (linkable.length) {
        out.push({
          label: linkable.length === 1 ? "Author" : "Authors",
          rows: linkable.map((author) => ({
            key: `author-${author.uid}`,
            index: i++,
            civ: null,
            title: author.name,
            subtitle: `${author.count} ${author.count === 1 ? "build" : "builds"}`,
            to: `/builds?author=${encodeURIComponent(author.uid)}`,
          })),
        });
      }
      if (builds.length) {
        out.push({
          label: `Builds · ${total}`,
          rows: builds.map(({ entry, ranges }) => ({ ...buildRow(entry, ranges, index), index: i++ })),
        });
      }
      return out;
    });

    const rows = computed(() => groups.value.flatMap((group) => group.rows));
    const rowId = (i) => `search-option-${i}`;

    // A new query starts with nothing highlighted; Enter then opens the first.
    watch(trimmed, () => {
      activeIndex.value = -1;
    });

    watch(
      () => props.modelValue,
      (open) => {
        if (!open) return;
        load().then(() => {
          // Read on every open, not once: a build unlisted earlier in this
          // session must already be gone (FR-009).
          if (index.value) hidden.value = hiddenIds(preparedIndex(index.value).generatedAt);
        });
      },
      { immediate: true }
    );

    // The query outlives the dialog (this component stays mounted once
    // loaded), so a reopen shows the last search. Selected, so typing replaces
    // it and the arrow keys still keep it. On afterEnter, not on open: the
    // dialog moves focus into its content while it transitions in, which
    // would land after a select() made earlier and collapse it.
    const field = ref(null);
    const selectQuery = () => {
      const input = field.value?.$el?.querySelector("input");
      if (!input) return;
      input.focus();
      if (input.value) input.select();
    };

    const openRow = (row) => emit("open", row.to);

    const scrollActiveIntoView = () =>
      nextTick(() => document.getElementById(rowId(activeIndex.value))?.scrollIntoView({ block: "nearest" }));

    const onKeydown = (event) => {
      const count = rows.value.length;
      if (event.key === "ArrowDown" && count) {
        event.preventDefault();
        activeIndex.value = (activeIndex.value + 1) % count;
        scrollActiveIntoView();
      } else if (event.key === "ArrowUp" && count) {
        event.preventDefault();
        activeIndex.value = activeIndex.value <= 0 ? count - 1 : activeIndex.value - 1;
        scrollActiveIntoView();
      } else if (event.key === "Enter" && count) {
        event.preventDefault();
        openRow(rows.value[Math.max(activeIndex.value, 0)]);
      }
    };

    return {
      smAndDown,
      status,
      query,
      trimmed,
      result,
      groups,
      rows,
      rowId,
      activeIndex,
      openRow,
      onKeydown,
      field,
      selectQuery,
    };
  },
};
</script>

<style scoped>
.search-bar {
  padding: 8px 8px 8px 4px;
}
.search-body {
  min-height: 120px;
}
.search-message {
  padding: 24px 20px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.search-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 6px 16px;
  cursor: pointer;
}
/* The same pair a Vuetify list uses: a tint of the text colour on hover, and
   of the primary colour for the keyboard's active row. */
.search-row:hover {
  background: rgba(var(--v-theme-on-surface), var(--v-hover-opacity));
}
.search-row--active,
.search-row--active:hover {
  background: rgba(var(--v-theme-primary), var(--v-activated-opacity));
}
.search-text {
  flex: 1 1 auto;
  min-width: 0;
}
/* Feudal and Castle side by side where there is room; stacked on a phone, so
   the title keeps its width. */
/* No gap of its own: AgeChips' chips already carry their spacing. */
.search-ages {
  flex: 0 0 auto;
  display: flex;
}
@media (max-width: 599.98px) {
  .search-ages {
    flex-direction: column;
    align-items: flex-end;
  }
}
/* Inter, inherited from the app's base font. Normal tracking: v-card-text
   would otherwise pass down its 0.47px, which Inter does not need. */
.search-title {
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: normal;
}
.search-subtitle {
  font-size: 0.8125rem;
  line-height: 1.4;
  letter-spacing: normal;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
.search-hit {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}
.search-lead {
  width: 28px;
  flex: 0 0 28px;
  display: flex;
  justify-content: center;
}
.search-more {
  padding: 8px 16px 12px;
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>

<style>
/* Teleported content: scoped styles cannot reach it. Near the top rather than
   centred, so the panel does not jump as results come and go. */
.search-dialog--top {
  align-self: flex-start;
  margin-top: 10vh !important;
}
</style>
