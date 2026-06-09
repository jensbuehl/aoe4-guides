<template>
  <v-card flat rounded="lg">
    <v-row no-gutters class="fill-height d-flex flex-nowrap">
      <!-- Flag column — one responsive block, no hidden-* twins -->
      <v-col cols="3" md="4" lg="3" class="pa-0 ma-0 d-flex flex-column build-header__flag">
        <v-img
          :src="flagSrc"
          :lazy-src="flagLazySrc"
          :gradient="'to right, transparent, ' + $vuetify.theme.current.colors.surface"
          cover
          height="100%"
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
            </v-row>
          </template>
        </v-img>
      </v-col>

      <!-- Body: title + chip group -->
      <v-col class="d-flex flex-column" style="min-width: 0">
        <v-card-title class="py-0 mt-2 build-header-title">{{ build.title || 'New build' }}</v-card-title>
        <v-spacer></v-spacer>
        <v-item-group class="ml-4 py-2 flex-wrap">
          <v-chip class="mr-2 mb-2" v-if="build.isDraft" label color="error" size="small">
            <v-icon start icon="mdi-pencil-circle"></v-icon>Draft
          </v-chip>
          <v-chip
            class="mr-2 mb-2"
            v-if="createdDate && isNew(createdDate)"
            label color="accent" size="small"
          >
            <v-icon start icon="mdi-alert-decagram"></v-icon>NEW
          </v-chip>
          <v-chip
            class="mr-2 mb-2"
            v-if="build.civ"
            label color="accent" size="small"
            :to="shouldLinkChips ? { name: 'Builds', query: { civ: build.civ } } : undefined"
            :clickable="shouldLinkChips"
          >
            <v-icon start icon="mdi-earth"></v-icon>{{ civLabel }}
          </v-chip>
          <v-chip class="mr-2 mb-2" v-if="build.season" label color="accent" size="small">
            <v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}
          </v-chip>
          <v-chip class="mr-2 mb-2" v-if="build.strategy" label color="accent" size="small">
            <v-icon start icon="mdi-strategy"></v-icon>{{ build.strategy }}
          </v-chip>
          <v-chip class="mr-2 mb-2" v-if="build.map" label color="accent" size="small">
            <v-icon start icon="mdi-map"></v-icon>{{ build.map }}
          </v-chip>
          <v-chip
            class="mr-2 mb-2"
            v-if="readonly && build.author"
            label size="small"
            :to="shouldLinkChips ? { name: 'Builds', query: { author: build.authorUid } } : undefined"
          >
            <v-icon start icon="mdi-account-edit"></v-icon>{{ build.author }}
          </v-chip>
          <v-chip class="mr-2 mb-2" v-if="readonly && build.views" label size="small">
            <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}
          </v-chip>
          <v-chip v-if="readonly && build.comments > 0" class="mr-2 mb-2" label size="small">
            <v-icon start icon="mdi-message"></v-icon>{{ build.comments }}
          </v-chip>
          <v-chip v-if="readonly && build.upvotes" class="mr-2 mb-2" label size="small">
            <v-icon start icon="mdi-thumb-up"></v-icon>{{ build.upvotes }}
          </v-chip>
          <v-chip class="mr-2 mb-2" v-if="readonly && createdDate" label size="small">
            <v-icon start icon="mdi-clock-edit-outline"></v-icon>{{ timeSince(createdDate) }}
          </v-chip>
          <v-chip class="mr-2 mb-2" v-if="readonly && updatedDate" label size="small">
            <v-icon start icon="mdi-update"></v-icon>{{ timeSince(updatedDate) }}
          </v-chip>
        </v-item-group>
      </v-col>

      <!-- Actions slot: pinned top-right -->
      <v-col cols="auto" class="d-flex align-start pa-2">
        <slot name="actions"></slot>
      </v-col>
    </v-row>
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
      required: true,
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

    const flagSrc = computed(() => {
      return civEntry.value ? "/" + civEntry.value.flagLarge : "/assets/flags/any-large.webp";
    });

    const flagLazySrc = computed(() => {
      return civEntry.value ? "/" + civEntry.value.flagSmall : "/assets/flags/any-small.webp";
    });

    const civLabel = computed(() => {
      return getCivById(props.build?.civ)?.title ?? props.build?.civ ?? "";
    });

    return {
      timeSince,
      isNew,
      shouldLinkChips,
      flagSrc,
      flagLazySrc,
      civLabel,
      createdDate,
      updatedDate,
    };
  },
};
</script>

<style scoped>
.build-header__flag {
  min-height: 132px;
}

.build-header-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}
</style>
