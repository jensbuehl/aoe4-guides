<template>
  <v-card v-if="contributors && contributors.length" flat rounded="lg" class="mb-4">
    <v-card-title class="px-4 py-2 pb-2">
      <v-icon icon="mdi-account-star" size="small" class="mr-2" color="primary"></v-icon>
      Top Contributors
    </v-card-title>

    <v-list nav class="pa-2 pt-0" bg-color="transparent">
      <v-list-item
        v-for="(contributor, index) in contributors"
        :key="contributor.authorId ?? index"
        :value="contributor.authorId ?? index"
        :to="contributor.loading ? undefined : { name: 'Builds', query: { author: contributor.authorId } }"
        :ripple="false"
        rounded="lg"
        min-height="48"
        class="px-3"
      >
        <template v-slot:prepend>
          <span
            class="text-caption text-medium-emphasis mr-3"
            style="min-width: 18px; text-align: center; flex-shrink: 0"
          >{{ index + 1 }}</span>
          <v-avatar v-if="iconFor(contributor)" size="36" color="accent" :image="iconFor(contributor)" class="mr-3"></v-avatar>
          <v-avatar v-else size="36" color="accent" class="mr-3">
            <span class="text-caption font-weight-bold">{{ contributor.displayName?.slice(0, 2).toUpperCase() ?? '' }}</span>
          </v-avatar>
        </template>

        <v-list-item-title
          class="text-body-2 font-weight-medium text-truncate"
          :style="{ color: $vuetify.theme.current.colors.primary }"
        >{{ contributor.displayName }}</v-list-item-title>

        <template v-slot:append>
          <div class="d-flex ga-3 text-caption text-medium-emphasis align-center">
            <span class="d-flex align-center ga-1">
              <v-icon size="12" icon="mdi-eye"></v-icon>
              {{ contributor.viewCount }}
            </span>
            <span class="d-flex align-center ga-1">
              <v-icon size="12" icon="mdi-hammer"></v-icon>
              {{ contributor.boCount }}
            </span>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
import { computed } from "vue";
import { useStore } from "vuex";
import { civs as allCivs } from "@/composables/filter/civDefaultProvider";

export default {
  name: "TopContributors",
  props: {
    contributors: {
      type: Array,
      required: true,
    },
  },
  setup() {
    const store = useStore();

    const currentUserId = computed(() => store.state.user?.uid ?? null);

    const currentUserIcon = computed(() => {
      const av = store.state.userAvatar;
      if (!av) return null;
      if (av.type === "civ") {
        const match = allCivs.value.find((c) => c.shortName === av.ref);
        return match ? match.flagLarge : null;
      }
      if (av.type === "upload") return av.ref;
      return null;
    });

    function iconFor(contributor) {
      const uid = currentUserId.value;
      if (uid && (contributor.authorId === uid || contributor.id === uid)) {
        return currentUserIcon.value;
      }
      return contributor.icon;
    }

    return { iconFor };
  },
};
</script>
