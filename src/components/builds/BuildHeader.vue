<template>
  <!-- Mobile (xs/sm): lean hero — title + overflow in card top-right + 3 chips -->
  <!-- The global Header.vue already provides page nav; no extra bar needed here -->
  <v-card flat rounded="lg" class="d-md-none">
    <!-- Civ lockup + overflow ⋮, mirroring the desktop top bar: civ is identity,
         so it reads as a flag and a name rather than as one more chip. -->
    <div class="d-flex align-center pt-2 pl-4 pr-1">
      <template v-if="civEntry">
        <img
          :src="civEntry.flagLarge"
          alt=""
          style="width:32px;height:24px;border-radius:3px;object-fit:cover;flex-shrink:0;"
        />
        <span class="text-body-2 font-weight-bold ml-2 mr-2">{{ civLabel }}</span>
      </template>
      <v-spacer></v-spacer>
      <!-- Slot renders the v-btn icon directly, no extra wrapper padding -->
      <slot name="actions"></slot>
    </div>
    <!-- Plain div avoids v-card-title's internal 16px padding so text aligns below.
         State chips lead the title inline, so they cost no vertical room and the
         title simply wraps around them. -->
    <div class="px-4 pt-1 pb-1 text-subtitle-1 font-weight-bold build-header-title">
      <v-chip
        v-if="build.isDraft"
        label
        color="error"
        size="x-small"
        class="build-header-badge mr-1"
      >
        <v-icon start icon="mdi-pencil-circle"></v-icon>Draft
      </v-chip>
      <v-chip
        v-if="createdDate && isNew(createdDate)"
        label
        color="accent"
        size="x-small"
        class="build-header-badge mr-1"
      >
        <v-icon start icon="mdi-alert-decagram"></v-icon>New
      </v-chip>
      {{ build.title || 'New build' }}
    </div>
    <div v-if="!readonly" class="pb-2"></div>

    <!-- Season moved onto the stats line, matching BuildListCard: chips are
         reserved for state, everything passive reads as quiet text. Map and
         strategy are dropped here — the single column is narrow, and the room
         goes to the vote and favourite actions below, which have no other
         route in on mobile. -->
    <BuildMetaLines
      v-if="readonly"
      :build="build"
      :created-date="createdDate"
      :link-author="shouldLinkChips"
      :show-secondary="false"
      wrapper-class="px-4 pt-1 pb-2 d-flex flex-column ga-1"
    />
    <div v-if="readonly && $slots['mobile-actions']" class="px-2 pb-1">
      <slot name="mobile-actions"></slot>
    </div>
  </v-card>

  <!-- Desktop (md+): flat card — mirrors mobile structure, adds civ lockup left of actions -->
  <v-card flat rounded="lg" class="d-none d-md-block">
    <!-- Top bar: civ lockup (left) + actions slot (right) -->
    <div class="d-flex align-center pt-3 pl-4 pr-2 pb-1">
      <template v-if="civEntry">
        <img :src="civEntry.flagLarge" alt="" style="width:46px;height:34px;border-radius:4px;object-fit:cover;flex-shrink:0;" />
        <span class="text-subtitle-1 font-weight-bold ml-2 mr-4">{{ civLabel }}</span>
      </template>
      <v-spacer></v-spacer>
      <slot name="actions"></slot>
    </div>
    <!-- Title, with the state chips leading it inline (see mobile) -->
    <div :class="['px-4 pt-1 pr-2', readonly ? 'pb-2' : 'pb-4']">
      <div class="text-h5 font-weight-bold build-header-title">
        <v-chip
          v-if="build.isDraft"
          label
          color="error"
          size="small"
          class="build-header-badge mr-2"
        >
          <v-icon start icon="mdi-pencil-circle"></v-icon>Draft
        </v-chip>
        <v-chip
          v-if="createdDate && isNew(createdDate)"
          label
          color="accent"
          size="small"
          class="build-header-badge mr-2"
        >
          <v-icon start icon="mdi-alert-decagram"></v-icon>New
        </v-chip>
        {{ build.title || 'New build' }}
      </div>
    </div>
    <!-- Same two quiet lines as the list card — view route only -->
    <BuildMetaLines
      v-if="readonly"
      :build="build"
      :created-date="createdDate"
      :link-author="shouldLinkChips"
      wrapper-class="px-4 pb-3 pt-0 d-flex flex-column ga-1"
    />
  </v-card>
</template>

<script>
import { computed } from "vue";
import { civs as allCivs, getCivById } from "@/composables/filter/civDefaultProvider";
import useTimeSince from "@/composables/useTimeSince";
import BuildMetaLines from "@/components/builds/BuildMetaLines.vue";

export default {
  name: "BuildHeader",
  components: { BuildMetaLines },
  props: {
    build: {
      type: Object,
      default: () => ({}),
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    linkChips: {
      type: Boolean,
      default: undefined,
    },
  },
  setup(props) {
    const { isNew } = useTimeSince();

    const tsToDate = (ts) => {
      if (!ts) return null;
      if (typeof ts.toDate === "function") return ts.toDate();
      if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
      return null;
    };

    const createdDate = computed(() => tsToDate(props.build?.timeCreated));
    const updatedDate = computed(() => tsToDate(props.build?.timeUpdated));

    const shouldLinkChips = computed(() => {
      return props.linkChips !== undefined ? props.linkChips : props.readonly;
    });

    const civEntry = computed(() => {
      const civ = props.build?.civ;
      if (!civ || civ === "ANY") return null;
      return allCivs.value.find((c) => c.shortName === civ) ?? null;
    });

    const civLabel = computed(() => {
      return getCivById(props.build?.civ)?.title ?? props.build?.civ ?? "";
    });

    return {
      isNew,
      shouldLinkChips,
      civEntry,
      civLabel,
      createdDate,
      updatedDate,
    };
  },
};
</script>

<style scoped>
.build-header-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}

/* The badges sit in the title's text flow, so they must not inherit the
   heading's weight, tracking or line-height — only its baseline. */
.build-header-badge {
  vertical-align: text-bottom;
  font-weight: 500;
  letter-spacing: normal;
  line-height: 1;
}
</style>
