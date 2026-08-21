<template>
  <v-card flat rounded="lg" class="author-header">
    <div class="author-header__body">
      <ContributorIdentity
        :contributor="contributor ?? {}"
        :loading="loading"
        :avatar-size="avatarSize"
        :build-count="loading ? null : count"
      />
    </div>
  </v-card>
</template>

<script>
import { computed } from "vue";
import { useDisplay } from "vuetify";
import ContributorIdentity from "@/components/page/ContributorIdentity.vue";

/**
 * Who wrote the build orders being listed.
 *
 * The body is ContributorIdentity, shared with the home page spotlight rather
 * than reimplemented: a visitor who arrives here from that card has to see the
 * same person presented the same way, so two implementations would be a defect
 * and not merely duplication. What this component still owns is the frame — the
 * card, and the measured floor height below.
 *
 * The build count comes from the page's own query rather than from the
 * contributor's running total, because it is the number of results the visitor
 * is actually looking at.
 */
export default {
  name: "AuthorPageHeader",
  components: { ContributorIdentity },
  props: {
    contributor: { type: Object, default: null },
    count:       { type: Number, default: null },
    // Rendered as a placeholder of the real card's shape while the contributor
    // record is in flight, so the build list below does not get shoved down
    // when it lands.
    loading:     { type: Boolean, default: false },
  },
  setup() {
    const { name } = useDisplay();

    // Sizes the avatar only. The card's own height is whatever its content
    // needs — there is no reserved floor here, because the placeholder mirrors
    // the content and produces the same height on its own.
    const avatarSize = computed(() =>
      ["lg", "xl", "xxl", "sm"].includes(name.value) ? 72 : 60
    );

    return { avatarSize };
  },
};
</script>

<style scoped>
.author-header {
  background: rgb(var(--v-theme-surface));
}

.author-header__body {
  padding: 16px 20px;
}

@media (max-width: 620px) {
  .author-header__body {
    padding: 16px;
  }
}
</style>
