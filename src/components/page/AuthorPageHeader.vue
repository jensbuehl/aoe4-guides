<template>
  <v-card flat rounded="lg" class="author-header" :style="{ minHeight: height + 'px' }">
    <v-row no-gutters align="center" class="fill-height pa-3" style="min-height: inherit;">
      <v-col cols="auto" class="mr-3">
        <v-avatar :size="avatarSize" color="primary">
          <v-img
            v-if="contributor.icon"
            :src="contributor.icon"
            :alt="contributor.displayName"
          />
          <span v-else class="author-initials">{{ initials }}</span>
        </v-avatar>
      </v-col>
      <v-col>
        <div class="author-name">{{ contributor.displayName }}</div>
      </v-col>
      <v-col cols="auto">
        <div class="d-flex align-center" style="gap: 8px;">
          <v-chip v-if="count != null" size="small" variant="tonal">
            <v-icon start size="13">mdi-pencil</v-icon>
            {{ count }} {{ count === 1 ? "build" : "builds" }}
          </v-chip>
          <v-chip v-if="contributor.viewCount" size="small" variant="tonal">
            <v-icon start size="13">mdi-eye</v-icon>
            {{ formatCount(contributor.viewCount) }}
          </v-chip>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import useTimeSince from "@/composables/useTimeSince";

export default {
  name: "AuthorPageHeader",
  props: {
    contributor: { type: Object, required: true },
    count:       { type: Number, default: null },
  },
  setup(props) {
    const { formatCount } = useTimeSince();
    const { name } = useDisplay();
    const initials = props.contributor.displayName?.slice(0, 2).toUpperCase() ?? "?";

    const height = computed(() => {
      switch (name.value) {
        case "xs":  return 90;
        case "sm":  return 125;
        case "md":  return 90;
        case "lg":  return 112;
        case "xl":  return 125;
        case "xxl": return 125;
        default:    return 90;
      }
    });

    const avatarSize = computed(() => (height.value >= 112 ? 54 : 44));

    return { initials, formatCount, height, avatarSize };
  },
};
</script>

<style scoped>
.author-header {
  background: rgb(var(--v-theme-surface));
}

.author-name {
  font-size: 18px;
  font-weight: 700;
}

.author-initials {
  font-size: 18px;
  font-weight: 800;
  color: #fff;
}
</style>
