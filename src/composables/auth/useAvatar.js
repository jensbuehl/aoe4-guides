import { computed } from "vue";
import { civs } from "@/composables/filter/civDefaultProvider";

/**
 * Turns a stored avatar ({type, ref}) into an image URL, or null when the
 * user has no picture. Shared with the boot-time preload, which needs the
 * same answer before any component exists.
 */
export function resolveAvatarUrl(avatar) {
  if (!avatar?.type || avatar.type === "initials") return null;
  if (avatar.type === "civ") {
    const civ = civs.value.find((c) => c.shortName === avatar.ref);
    return civ ? civ.flagLarge : null;
  }
  if (avatar.type === "upload") return avatar.ref || null;
  return null;
}

export function useAvatar(userAvatar) {
  // `undefined` means the avatar has not been fetched yet, `null` means the
  // user deliberately has none. Collapsing the two made callers render
  // initials during loading, only to replace them once the picture arrived.
  const loading = computed(() => userAvatar.value === undefined);

  const src = computed(() => resolveAvatarUrl(userAvatar.value));

  // Initials are derived by UserAvatar from the display name it is given.
  return { src, loading };
}
