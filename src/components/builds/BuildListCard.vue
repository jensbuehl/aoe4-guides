<template>
  <v-card @click="" class="mb-2" rounded="lg" flat :min-height="height" style="overflow: hidden">
    <v-skeleton-loader
      v-if="build.loading"
      :loading="build.loading"
      :color="build.loading ? 'loading' : 'surface'"
      :height="height"
    >
    </v-skeleton-loader
    ><v-row
      v-if="!build.loading"
      no-gutters
      class="flex-nowrap"
      :style="{ minHeight: height + 'px' }"
    >
      <div v-if="build.civ" class="blc-flag d-flex flex-column">
        <v-img
          :min-height="height"
          :src="
            civs.find((item) => {
              return item.shortName === build.civ;
            }).flagLarge
          "
          :lazy-src="
            civs.find((item) => {
              return item.shortName === build.civ;
            }).flagSmall
          "
          :gradient="'to right, transparent, ' + $vuetify.theme.current.colors.surface"
          alt="{{build.civ}}"
          cover
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
            </v-row>
          </template>
        </v-img>
      </div>
      <div v-if="!build.civ" class="blc-flag">
        <v-img
          :min-height="height"
          src="/assets/flags/any-large.webp"
          lazy-src="/assets/flags/any-small.webp"
          :gradient="'to right, transparent, ' + $vuetify.theme.current.colors.surface"
          alt="{{build.civ}}"
          cover
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
            </v-row>
          </template>
        </v-img>
      </div>

      <!--mobile body: title · age chips · one quiet meta line-->
      <div class="blc-body blc-body--xs hidden-md-and-up">
        <v-tooltip
          location="top"
          v-model="titleTipXs.isOpen"
          :target="titleTipXs.target"
          :open-on-hover="false"
        >
          <span :style="{ color: $vuetify.theme.current.colors.primary }">{{ build.title }}</span>
          <template v-slot:activator="{ props }">
            <div
              v-bind="props"
              v-on="titleTipXs.on"
              class="blc-title blc-title--xs"
              :style="{ color: $vuetify.theme.current.colors.primary }"
            >
              {{ build.title }}
            </div>
          </template>
        </v-tooltip>
        <div class="blc-chiprow">
          <v-chip class="mr-1 mt-1" v-if="build.isDraft" label color="error" size="x-small"
            ><v-icon start icon="mdi-pencil-circle"></v-icon>Draft</v-chip
          >
          <v-chip
            class="mr-1 mt-1"
            v-if="isNew(toDateSafe(build.timeCreated))"
            label
            color="accent"
            size="x-small"
            ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
          >
          <!--age chips take the slot season and map used to occupy-->
          <AgeChips :timings="ageTimings" />
        </div>
        <!--everything passive collapses to one wrapping line-->
        <div class="blc-meta blc-meta--xs">
          <router-link
            v-if="showAuthor"
            class="text-decoration-none blc-link"
            :to="{ name: 'Builds', query: { author: build.authorUid } }"
            @click.stop
            ><v-icon size="12" icon="mdi-account-edit"></v-icon>{{ build.author }}</router-link
          >
          <span v-if="showAuthor && showCreator" class="blc-sep">·</span>
          <span v-if="showCreator" class="blc-link">
            <v-icon size="12" icon="mdi-youtube"></v-icon>{{ build.creatorName }}
          </span>
          <span v-if="(showAuthor || showCreator) && build.timeCreated" class="blc-sep">·</span>
          <span v-if="build.timeCreated" 
            ><v-icon size="12" icon="mdi-clock-edit-outline"></v-icon
            >{{ timeSince(toDateSafe(build.timeCreated)) }}</span
          >
          <span class="blc-sep">·</span>
          <span 
            ><v-icon size="12" icon="mdi-eye"></v-icon>{{ formatCount(build.views || 0) }}</span
          >
          <template v-if="showLikes">
            <span class="blc-sep">·</span>
            <span 
              ><v-icon size="12" icon="mdi-heart"></v-icon>{{ formatCount(build.likes) }}</span
            >
          </template>
        </div>
      </div>

        <!--desktop body: title + people line + stats line-->
        <div class="blc-body hidden-sm-and-down" :class="{ 'blc-body--cols': ageTimings.length }">
          <!-- Full title on hover, for when it is clipped -->
          <v-tooltip
            location="top"
            v-model="titleTip.isOpen"
            :target="titleTip.target"
            :open-on-hover="false"
          >
            <span :style="{ color: $vuetify.theme.current.colors.primary }">{{ build.title }}</span>
            <template v-slot:activator="{ props }">
              <div
                v-bind="props"
                v-on="titleTip.on"
                class="blc-title"
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
              >
                {{ build.title }}
              </div>
            </template>
          </v-tooltip>
          <!--people: actionable, so accent-coloured with their own glyphs-->
          <div v-if="showPeopleLine" class="blc-meta blc-meta--who">
            <router-link
              v-if="showAuthor"
              class="text-decoration-none blc-link"
              :to="{ name: 'Builds', query: { author: build.authorUid } }"
              @click.stop
              ><v-icon size="13" icon="mdi-account-edit"></v-icon>{{ build.author }}</router-link
            >
            <span v-if="showAuthor && showCreator" class="blc-sep">·</span>
            <span v-if="showCreator" class="blc-link">
              <v-icon size="13" icon="mdi-youtube"></v-icon>{{ build.creatorName }}
            </span>
          </div>
          <!--stats: passive, so one quiet line of glyph + value-->
          <div class="blc-meta">
            <v-chip v-if="build.isDraft" label color="error" size="x-small" class="mr-2"
              ><v-icon start icon="mdi-pencil-circle"></v-icon>Draft</v-chip
            >
            <v-chip
              v-if="build.timeCreated && isNew(toDateSafe(build.timeCreated))"
              label
              color="accent"
              size="x-small"
              class="mr-2"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
            <span v-if="build.timeCreated" 
              ><v-icon size="13" icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(toDateSafe(build.timeCreated)) }}</span
            >
            <span v-if="build.timeCreated" class="blc-sep">·</span>
            <span 
              ><v-icon size="13" icon="mdi-eye"></v-icon>{{ formatCount(build.views || 0) }}</span
            >
            <template v-if="showLikes">
              <span class="blc-sep">·</span>
              <span 
                ><v-icon size="13" icon="mdi-heart"></v-icon>{{ formatCount(build.likes) }}</span
              >
            </template>
            <template v-if="build.comments > 0">
              <span class="blc-sep">·</span>
              <span 
                ><v-icon size="13" icon="mdi-message-outline"></v-icon>{{ build.comments }}</span
              >
            </template>
            <template v-if="showSeason">
              <span class="blc-sep">·</span>
              <span 
                ><v-icon size="13" icon="mdi-trophy"></v-icon>{{ build.season }}</span
              >
            </template>
            <template v-if="showMap">
              <span class="blc-sep">·</span>
              <span 
                ><v-icon size="13" icon="mdi-map"></v-icon>{{ build.map }}</span
              >
            </template>
          </div>
        </div>

      <!--
        Age column, omitted entirely when the build has no derivable timings.
        Deliberately a plain element rather than a v-col: the row uses
        no-gutters, whose ".v-row--no-gutters > [class*=v-col-] { padding: 0 }"
        outranks this component's own class and would strip the padding either
        side of the times. v-row is a flex container, so a plain div sits in it
        exactly the same way.
      -->
      <div v-if="ageTimings.length" class="blc-ages hidden-sm-and-down">
        <div
          v-for="row in ageRows"
          :key="row.age"
          class="blc-agerow"
          :class="{ 'blc-agerow--derived': row.timing && row.timing.derived }"
        >
          <img :src="row.crest" alt="" width="17" height="17" class="blc-agecrest" />
          <b v-if="!row.timing" class="blc-agedash">&mdash;</b>
          <v-tooltip v-else-if="row.timing.derived" location="top">
            <span :style="{ color: $vuetify.theme.current.colors.primary }"
              >Estimated, not stated by the author</span
            >
            <template v-slot:activator="{ props }">
              <b v-bind="props">~{{ formatAgeTime(row.timing.seconds) }}</b>
            </template>
          </v-tooltip>
          <b v-else>{{ formatAgeTime(row.timing.seconds) }}</b>
          <span class="blc-sr">{{ row.label }}</span>
        </div>
      </div>
    </v-row>
  </v-card>
</template>

<script>
//External
import { computed, toRef } from "vue";
import { useDisplay } from "vuetify";

//Components
import AgeChips from "@/components/builds/AgeChips.vue";

//Composables
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";
import useTimeSince, { toDateSafe } from "@/composables/useTimeSince";
import { useCursorTooltip } from "@/composables/useCursorTooltip";
import {
  useAgeTimings,
  AGE_DISPLAY,
  formatAgeTime,
  ageTimingLabel,
} from "@/composables/builds/useAgeTimings.js";

export default {
  components: { AgeChips },
  name: "BuildListCard",
  props: {
    build: { type: Object, required: true },
    /**
     * What the surrounding list has already established, mirroring FilterConfig's
     * own contexts plus author-locked. Taken as an explicit prop rather than
     * inferred from the route.
     */
    context: {
      type: String,
      default: "default",
      validator: (value) => ["default", "civ-locked", "author-locked"].includes(value),
    },
    /**
     * The filter config actually applied to this list, or null for lists that
     * are not filter-driven (the home and dashboard lanes). Passed in rather
     * than read from the store: the store holds whatever was last applied on
     * /builds, which would wrongly hide fields on lanes that never used it.
     */
    filterConfig: { type: Object, default: null },
  },
  setup(props) {
    const civs = allCivs.value;
    const { name } = useDisplay();
    const { timeSince, isNew, formatCount } = useTimeSince();

    //Skeleton cards are handled inside the composable, which returns an empty
    //list while build.loading is set, so no derivation runs for them.
    const ageTimings = useAgeTimings(toRef(props, "build"));

    //The title is a full-width block, so an activator-anchored tooltip lands
    //over the middle of the card rather than near the pointer. Two instances
    //because the two layouts are separate elements — one is display:none at any
    //given width, and a shared open flag would light up the hidden one too.
    const titleTip = useCursorTooltip();
    const titleTipXs = useCursorTooltip();

    /**
     * The rail always renders one row per age so the column positions stay
     * learnable; an age the build never reaches shows an em dash rather than a
     * gap. The rail as a whole is hidden when there are no timings at all.
     */
    const ageRows = computed(() =>
      AGE_DISPLAY.map((display) => {
        const timing = ageTimings.value.find((item) => item.age === display.age) ?? null;
        return { ...display, timing, label: ageTimingLabel(display, timing) };
      })
    );

    /**
     * A field that is constant across the current list is not repeated on every
     * row — it is already stated by the filter bar or the page header. "Constant"
     * means the applied filter selected exactly one value for it.
     */
    const showAuthor = computed(
      () =>
        Boolean(props.build?.author) &&
        props.context !== "author-locked" &&
        !props.filterConfig?.author
    );

    const showCreator = computed(
      () => Boolean(props.build?.creatorId) && !props.filterConfig?.creator
    );

    const showSeason = computed(
      () => Boolean(props.build?.season) && props.filterConfig?.seasons?.length !== 1
    );

    //Replaces a guard on filterConfig.map, which does not exist — the field is
    //maps[] — so the map has never rendered at all.
    const showMap = computed(
      () => Boolean(props.build?.map) && props.filterConfig?.maps?.length !== 1
    );

    //Views are shown regardless of sort key, so the row's content no longer
    //changes under the reader when they re-sort. Only the favorites count is
    //sort-dependent, because nothing else surfaces it.
    const showLikes = computed(
      () => props.filterConfig?.orderBy === "likes" && props.build?.likes > 0
    );

    const showPeopleLine = computed(() => showAuthor.value || showCreator.value);

    const height = computed(() => {
      switch (name.value) {
        case "xs":
          return 96;
        case "sm":
          return 125;
        case "md":
          return 112;
        case "lg":
          return 112;
        case "xl":
          return 125;
        case "xxl":
          return 125;
      }
    });

    return {
      toDateSafe,
      civs,
      height,
      timeSince,
      isNew,
      name,
      ageTimings,
      ageRows,
      titleTip,
      titleTipXs,
      showAuthor,
      showCreator,
      showSeason,
      showMap,
      showLikes,
      showPeopleLine,
      formatAgeTime,
      formatCount,
    };
  },
};
</script>

<style scoped>
/* Plain elements rather than v-col: the row uses no-gutters, whose
   ".v-row--no-gutters > [class*=v-col-]" rule outranks this component's classes
   and would strip the padding these zones depend on */
.blc-flag {
  flex: 0 0 30%;
  position: relative;
}

@media (min-width: 960px) {
  .blc-flag {
    flex: 0 0 26%;
  }
}

/* --- mobile body (xs/sm) --- */
.blc-body--xs {
  padding: 10px 12px;
  gap: 6px;
}

.blc-chiprow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: -4px;
}

/* The one mobile meta line wraps rather than truncates — there is no age column
   at this breakpoint competing for the width, so the room is there to use */
.blc-meta--xs {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  font-size: 11px;
}

/* --- three-line body (md+) --- */
/* flex:1 makes this fill the card's height, so justify-content actually centres
   the three lines instead of them sitting wherever the padding leaves them */
.blc-body {
  flex: 1;
  width: 100%;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
  min-width: 0;
}

.blc-title {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* The age rail supplies its own left padding, so the body drops its right one */
.blc-body--cols {
  padding-right: 0;
}

/* Inline flow rather than flex: text-overflow only ellipsizes a block container's
   inline content, so as a flex row this clipped mid-word instead of truncating.
   Never wraps, so a long name cannot change the card's height. */
.blc-meta {
  display: block;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.blc-meta > * {
  vertical-align: middle;
}

.blc-meta--who {
  font-size: 12px;
}

/* Glyphs carry the meaning here, so they sit tight against their value. The
   values stay plain inline text — wrapping them in inline-flex would make each
   one an atomic box that gets dropped whole instead of truncating. */
.blc-meta :deep(.v-icon) {
  font-size: 13px;
  margin-right: 4px;
  opacity: 0.8;
  vertical-align: -0.18em;
}

/* Margins rather than the parent's gap, now that the line is inline flow */
.blc-sep {
  opacity: 0.4;
  margin: 0 6px;
}

.blc-link {
  color: rgb(var(--v-theme-accent));
}

.blc-link :deep(.v-icon) {
  opacity: 1;
}

/* With the meta reduced to three items, a two-line title still fits the xs card */
.blc-title--xs {
  font-size: 13.5px;
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.25;
}

/* --- age rail (md+) --- */
/* Fixed width so the times share one right edge down the whole list */
.blc-ages {
  flex: 0 0 132px;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
}

.blc-agerow {
  display: grid;
  grid-template-columns: 17px 1fr;
  align-items: center;
  gap: 8px;
  min-height: 18px;
  font-size: 12px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

/* Same primary the age chips use at sm-and-down, where this row is replaced by
   them: one build's age times should not change colour with the breakpoint. */
.blc-agerow b {
  text-align: right;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

/* An estimate is set lighter than a time the author actually stated */
.blc-agerow--derived b {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.blc-agedash {
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
  font-weight: 500 !important;
}

.blc-agecrest {
  width: 17px;
  height: 17px;
  object-fit: contain;
  flex-shrink: 0;
  opacity: 0.95;
  display: block;
}

/* Keeps the spoken label out of the layout without hiding it from readers */
.blc-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
