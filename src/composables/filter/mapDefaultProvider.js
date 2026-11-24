import { ref } from "vue";

// The only map types a build may store (spec 045). Open and Closed were folded
// into Land: they do not change a build order, while water and hybrid maps do.
//
// MIRRORED in allowedFacets() in firestore.rules, which refuses any other value.
// Rules cannot import, so the list is transcribed there: change both together.
export const MAP_TYPES = ["Land", "Water", "Hybrid"];

// What a build without a stated map is. An author who did not tag a map wrote
// a land build in practice; water and hybrid builds are distinct enough that
// their authors tag them.
export const DEFAULT_MAP = "Land";

export const maps = ref(MAP_TYPES.map((title) => ({ title })));

/**
 * The allowed map type any incoming value stands for.
 *
 * Used on every save, on import and by the one-off cleanup, so a stored map is
 * always one of MAP_TYPES. Water and Hybrid are recognised in any case; every
 * other value — empty, missing, legacy Open/Closed or junk — is Land.
 *
 * @param {*} value - A map value from a build, an import or a legacy document.
 * @return {string} One of MAP_TYPES.
 */
export function normaliseMap(value) {
  const folded = typeof value === "string" ? value.trim().toLowerCase() : "";
  return MAP_TYPES.find((type) => type.toLowerCase() === folded) ?? DEFAULT_MAP;
}
