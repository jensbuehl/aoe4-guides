<template>
  <!-- Mobile (xs/sm): lean hero — title + overflow in card top-right + 3 chips -->
  <!-- The global Header.vue already provides page nav; no extra bar needed here -->
  <v-card flat rounded="lg" class="d-md-none">
    <div class="d-flex align-start pt-2 pl-4 pr-1">
      <!-- Plain div avoids v-card-title's internal 16px padding so text aligns with chips -->
      <div class="flex-grow-1 py-1 pr-2 text-subtitle-1 font-weight-bold build-header-title">
        {{ build.title || 'New build' }}
      </div>
      <!-- Overflow ⋮: slot renders the v-btn icon directly, no extra wrapper padding -->
      <slot name="actions"></slot>
    </div>
    <div :class="['px-4 pt-1 d-flex flex-wrap ga-2', readonly ? 'pb-1' : 'pb-4']">
      <v-chip v-if="build.isDraft" label color="error" size="small">
        <v-icon start icon="mdi-pencil-circle"></v-icon>Draft
      </v-chip>
      <v-chip v-if="createdDate && isNew(createdDate)" label color="accent" size="small">
        <v-icon start icon="mdi-alert-decagram"></v-icon>New
      </v-chip>
      <v-chip v-if="build.civ" label color="accent" size="small">
        <v-icon start icon="mdi-earth"></v-icon>{{ civLabel }}
      </v-chip>
      <v-chip v-if="build.season" label color="accent" size="small">
        <v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}
      </v-chip>
    </div>

    <!-- Author · upvotes · views · time — view route only -->
    <div
      v-if="readonly && (build.author || build.upvotes || build.views || createdDate)"
      class="px-4 pb-3 pt-1 d-flex align-center flex-wrap ga-2 text-caption text-medium-emphasis"
    >
      <span v-if="build.author" class="font-weight-bold">{{ build.author }}</span>
      <template v-if="build.upvotes">
        <span>·</span><v-icon size="12">mdi-thumb-up</v-icon><span>{{ build.upvotes }}</span>
      </template>
      <template v-if="build.views">
        <span>·</span><v-icon size="12">mdi-eye</v-icon><span>{{ build.views }}</span>
      </template>
      <template v-if="createdDate">
        <span>·</span><span>{{ timeSince(createdDate) }}</span>
      </template>
    </div>
  </v-card>

  <!-- Desktop (md+): flat card — mirrors mobile structure, adds civ lockup left of actions -->
  <v-card flat rounded="lg" class="d-none d-md-block">
    <!-- Top bar: civ lockup (left) + actions slot (right) -->
    <div class="d-flex align-center pt-3 pl-4 pr-2 pb-1">
      <template v-if="civEntry">
        <img :src="civEntry.flagSmall" alt="" style="width:46px;height:34px;border-radius:4px;object-fit:cover;flex-shrink:0;" />
        <span class="text-subtitle-1 font-weight-bold ml-2 mr-4">{{ civLabel }}</span>
      </template>
      <v-spacer></v-spacer>
      <slot name="actions"></slot>
    </div>
    <!-- Title -->
    <div class="px-4 pt-1 pr-2">
      <div class="text-h5 font-weight-bold build-header-title">{{ build.title || 'New build' }}</div>
    </div>
    <!-- Chips -->
    <div :class="['px-4 pt-2 d-flex flex-wrap ga-2', readonly ? 'pb-2' : 'pb-4']">
      <v-chip v-if="build.isDraft" label color="error" size="small">
        <v-icon start icon="mdi-pencil-circle"></v-icon>Draft
      </v-chip>
      <v-chip v-if="createdDate && isNew(createdDate)" label color="accent" size="small">
        <v-icon start icon="mdi-alert-decagram"></v-icon>New
      </v-chip>
      <v-chip v-if="build.season" label color="accent" size="small">
        <v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}
      </v-chip>
      <v-chip v-if="build.strategy" label color="accent" size="small">
        <v-icon start icon="mdi-strategy"></v-icon>{{ build.strategy }}
      </v-chip>
      <v-chip v-if="build.map" label color="accent" size="small">
        <v-icon start icon="mdi-map"></v-icon>{{ build.map }}
      </v-chip>
    </div>
    <!-- Author · upvotes · views · time — view only -->
    <div
      v-if="readonly && (build.author || build.upvotes || build.views || createdDate)"
      class="px-4 pb-3 pt-0 d-flex align-center flex-wrap ga-2 text-caption text-medium-emphasis"
    >
      <span v-if="build.author" class="font-weight-bold">
        <a v-if="shouldLinkChips && build.authorUid"
          :href="`/builds?author=${build.authorUid}`"
          class="text-medium-emphasis text-decoration-none">{{ build.author }}</a>
        <template v-else>{{ build.author }}</template>
      </span>
      <template v-if="build.upvotes">
        <span>·</span><v-icon size="12">mdi-thumb-up</v-icon><span>{{ build.upvotes }}</span>
      </template>
      <template v-if="build.views">
        <span>·</span><v-icon size="12">mdi-eye</v-icon><span>{{ build.views }}</span>
      </template>
      <template v-if="createdDate">
        <span>·</span><span>{{ timeSince(createdDate) }}</span>
      </template>
    </div>
  </v-card>
</template>

<script>
import { computed } from "vue";
import { civs as allCivs, getCivById } from "@/composables/filter/civDefaultProvider";
import useTimeSince from "@/composables/useTimeSince";

export default {
  name: "BuildHeader",
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
    const { timeSince, isNew } = useTimeSince();

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
      timeSince,
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

</style>
