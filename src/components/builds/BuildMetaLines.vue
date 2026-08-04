<template>
  <!--
    The two quiet metadata lines shared by the build header's mobile and desktop
    variants, using the same vocabulary as BuildListCard: people are actionable
    so they read as accent links, everything passive is a glyph and a value on
    one low-emphasis line.
  -->
  <div v-if="hasPeople || hasStats" :class="wrapperClass">
    <!--people-->
    <div v-if="hasPeople" class="d-flex align-center flex-wrap ga-2 bml-line">
      <span v-if="build.author" class="d-inline-flex align-center bml-link">
        <v-icon size="12">mdi-account-edit</v-icon>
        <a
          v-if="linkAuthor && build.authorUid"
          :href="`/builds?author=${build.authorUid}`"
          class="text-decoration-none bml-link"
          >{{ build.author }}</a
        >
        <template v-else>{{ build.author }}</template>
      </span>
      <template v-if="build.author && build.creatorId"><span class="bml-sep">·</span></template>
      <span v-if="build.creatorId" class="d-inline-flex align-center bml-link">
        <v-icon size="12">mdi-youtube</v-icon>{{ build.creatorName }}
      </span>
      <!--
        Remix lineage sits with the people because it is attribution, not passive
        metadata. It is one flex child so the phrase keeps normal word spacing,
        and its · lives inside the span, unlike the separators above: this is the
        only item long enough to be pushed onto its own line, and a lone · left
        behind on the previous line reads like a typo.
      -->
      <span v-if="build.remixOf?.id" class="bml-remix">
        <span class="mr-2">·</span>Remix of
        <router-link
          :to="{ name: 'BuildDetails', params: { id: build.remixOf.id } }"
          :title="build.remixOf.title"
          class="text-accent text-decoration-none"
          >{{ build.remixOf.title }}</router-link
        ><template v-if="build.remixOf.author"> by {{ build.remixOf.author }}</template>
      </span>
    </div>

    <!--stats-->
    <div v-if="hasStats" class="d-flex align-center flex-wrap ga-2 bml-line">
      <span v-if="createdDate" class="d-inline-flex align-center">
        <v-icon size="12">mdi-clock-edit-outline</v-icon>{{ timeSince(createdDate) }}
      </span>
      <template v-if="createdDate && build.views"><span class="bml-sep">·</span></template>
      <span v-if="build.views" class="d-inline-flex align-center">
        <v-icon size="12">mdi-eye</v-icon>{{ formatCount(build.views) }}
      </span>
      <template v-if="build.upvotes"><span class="bml-sep">·</span></template>
      <span v-if="build.upvotes" class="d-inline-flex align-center">
        <v-icon size="12">mdi-thumb-up</v-icon>{{ formatCount(build.upvotes) }}
      </span>
      <template v-if="build.comments > 0"><span class="bml-sep">·</span></template>
      <span v-if="build.comments > 0" class="d-inline-flex align-center">
        <v-icon size="12">mdi-message-outline</v-icon>{{ build.comments }}
      </span>
      <template v-if="build.season"><span class="bml-sep">·</span></template>
      <span v-if="build.season" class="d-inline-flex align-center">
        <v-icon size="12">mdi-trophy</v-icon>{{ build.season }}
      </span>
      <template v-if="showSecondary && build.map"><span class="bml-sep">·</span></template>
      <span v-if="showSecondary && build.map" class="d-inline-flex align-center">
        <v-icon size="12">mdi-map</v-icon>{{ build.map }}
      </span>
      <template v-if="showSecondary && build.strategy"><span class="bml-sep">·</span></template>
      <span v-if="showSecondary && build.strategy" class="d-inline-flex align-center">
        <v-icon size="12">mdi-strategy</v-icon>{{ build.strategy }}
      </span>
    </div>
  </div>
</template>

<script>
//External
import { computed } from "vue";

//Composables
import useTimeSince from "@/composables/useTimeSince";

export default {
  name: "BuildMetaLines",
  props: {
    build: { type: Object, default: () => ({}) },
    createdDate: { type: Date, default: null },
    /** Author links out to their build list on the view route, not while editing */
    linkAuthor: { type: Boolean, default: false },
    /**
     * Map and strategy are dropped in the single-column layout, where the row is
     * narrow and the space is better spent on the vote and favourite actions.
     */
    showSecondary: { type: Boolean, default: true },
    wrapperClass: { type: String, default: "" },
  },
  setup(props) {
    const { timeSince, formatCount } = useTimeSince();

    const hasPeople = computed(() =>
      Boolean(props.build?.author || props.build?.creatorId || props.build?.remixOf?.id)
    );

    const hasStats = computed(() =>
      Boolean(
        props.createdDate ||
          props.build?.views ||
          props.build?.upvotes ||
          props.build?.comments > 0 ||
          props.build?.season ||
          (props.showSecondary && (props.build?.map || props.build?.strategy))
      )
    );

    return { timeSince, formatCount, hasPeople, hasStats };
  },
};
</script>

<style scoped>
.bml-line {
  font-size: 12px;
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

/* Glyphs carry the meaning, so they sit tight against their value */
.bml-line :deep(.v-icon) {
  margin-right: 4px;
  opacity: 0.8;
}

.bml-link {
  color: rgb(var(--v-theme-accent));
}

.bml-link :deep(.v-icon) {
  opacity: 1;
}

.bml-sep {
  opacity: 0.4;
}

/* The remix item stays one line tall: a long original title ellipsizes instead of
   wrapping the caption into a paragraph. min-width:0 is what lets this flex item
   shrink below its content width at all; the full title stays on the link's
   tooltip. Truncation eats "by <author>" first, which is the right priority. */
.bml-remix {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
