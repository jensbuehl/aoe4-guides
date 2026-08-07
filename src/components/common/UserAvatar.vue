<template>
  <!-- The image is layered *over* the initials rather than swapped in for
       them. v-img renders nothing until the file has been fetched and
       decoded, so a v-if swap leaves an empty coloured circle on screen for
       the whole download. Stacking means the fallback stays visible
       underneath and the avatar only ever fades in on top of it. -->
  <v-avatar :size="size" :color="color" class="user-avatar">
    <template v-if="!loading">
      <v-icon v-if="anonymous" :size="iconSize">mdi-account</v-icon>
      <span v-else-if="initials" :class="textClass">{{ initials }}</span>
    </template>
    <v-img v-if="src" :src="src" :alt="alt ?? name" cover class="user-avatar__image" />
  </v-avatar>
</template>

<script>
import { computed } from "vue";

export default {
  name: "UserAvatar",
  props: {
    // Resolved image URL, or null when the user has no picture.
    src: { type: String, default: null },
    // Display name; initials are derived from it.
    name: { type: String, default: null },
    // True while the avatar choice is still unknown. Renders a plain circle
    // so we never show initials that a picture is about to replace.
    loading: { type: Boolean, default: false },
    size: { type: [Number, String], default: undefined },
    color: { type: String, default: "accent" },
    textClass: { type: String, default: null },
    alt: { type: String, default: null },
  },
  setup(props) {
    const initials = computed(() => (props.name ?? "").slice(0, 2).toUpperCase());

    // No picture and nothing to spell out: a logged-out or nameless user.
    const anonymous = computed(() => !props.src && !initials.value);

    const iconSize = computed(() => {
      const px = Number(props.size);
      return Number.isFinite(px) ? Math.round(px * 0.6) : undefined;
    });

    return { initials, anonymous, iconSize };
  },
};
</script>

<style scoped>
.user-avatar {
  position: relative;
}

.user-avatar__image {
  position: absolute;
  inset: 0;
}
</style>
