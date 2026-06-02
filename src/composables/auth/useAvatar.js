import { computed } from "vue";
import { civs } from "@/composables/filter/civDefaultProvider";

export function useAvatar(userAvatar, user) {
  const src = computed(() => {
    const av = userAvatar.value;
    if (!av?.type || av.type === "initials") return null;
    if (av.type === "civ") {
      const civ = civs.value.find((c) => c.shortName === av.ref);
      return civ ? civ.flagLarge : null;
    }
    if (av.type === "upload") return av.ref || null;
    return null;
  });

  const initials = computed(() => {
    const name = user.value?.displayName ?? "";
    return name.slice(0, 2).toUpperCase() || "?";
  });

  return { src, initials };
}
