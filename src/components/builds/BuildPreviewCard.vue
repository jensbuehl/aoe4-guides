<template>
  <div>
    <div class="d-flex align-center ga-1 mb-2">
      <v-icon size="14" color="success">mdi-check-circle</v-icon>
      <span
        class="text-caption font-weight-bold text-success"
        style="letter-spacing: 0.4px; text-transform: uppercase"
      >Build detected</span>
    </div>
    <div class="d-flex align-center ga-3 mb-2">
      <v-img
        :src="build.civFlag"
        width="52"
        height="52"
        cover
        rounded="lg"
      />
      <div>
        <div class="text-body-2 font-weight-bold">{{ build.title }}</div>
        <div class="text-caption text-medium-emphasis">by {{ build.author }} · {{ build.civName }}</div>
      </div>
    </div>
    <div class="d-flex flex-wrap ga-1">
      <v-chip size="small" variant="tonal" prepend-icon="mdi-format-list-numbered">
        {{ build.steps }} steps
      </v-chip>
      <v-chip v-if="build.strategy" size="small" variant="tonal" prepend-icon="mdi-sword-cross">
        {{ build.strategy }}
      </v-chip>
      <v-chip v-if="build.season" size="small" variant="tonal" prepend-icon="mdi-calendar">
        {{ build.season }}
      </v-chip>
      <v-chip v-if="build.hasVideo" size="small" variant="tonal" prepend-icon="mdi-youtube">
        Video
      </v-chip>
    </div>
  </div>
</template>

<script>
export default {
  name: "BuildPreviewCard",
  props: {
    build: { type: Object, required: true },
  },
};
</script>
