import { ref, computed, watch } from "vue";
import { useStore } from "vuex";

function arraysEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return a === b;
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

export function useDraftFilterConfig() {
  const store = useStore();

  const draft = ref({ ...store.state.filterConfig });

  // Re-sync draft when applied config changes externally (route nav, page resets).
  //
  // A change of sort alone is the exception: the sort is applied from the list
  // header while the sidebar card may hold filter edits not yet applied, and a
  // full re-sync would throw those away. The getter copies, so `prev` is the
  // config as it was rather than the same mutated object.
  watch(
    () => ({ ...store.state.filterConfig }),
    (applied, prev) => {
      const sortOnly =
        prev &&
        applied.orderBy !== prev.orderBy &&
        Object.keys({ ...applied, ...prev }).every(
          (k) => k === "orderBy" || arraysEqual(applied[k], prev[k])
        );
      if (sortOnly) draft.value.orderBy = applied.orderBy;
      else draft.value = { ...applied };
    },
    { deep: true }
  );

  const dirtyFields = computed(() => {
    const a = store.state.filterConfig;
    const d = draft.value;
    return {
      civs:       d.civs !== a.civs,
      creator:    d.creator !== a.creator,
      maps:       !arraysEqual(d.maps, a.maps),
      strategies: !arraysEqual(d.strategies, a.strategies),
      seasons:    !arraysEqual(d.seasons, a.seasons),
      orderBy:    d.orderBy !== a.orderBy,
    };
  });

  const dirtyCount = computed(() => Object.values(dirtyFields.value).filter(Boolean).length);
  const isDirty = computed(() => dirtyCount.value > 0);

  function resetField(field) {
    draft.value[field] = store.state.filterConfig[field];
  }

  function applyDraft(emit) {
    store.commit("setFilterConfig", { ...draft.value });
    store.commit("setAllBuildsList", null);
    store.commit("setMyBuildsList", null);
    store.commit("setMyFavoritesList", null);
    emit("configChanged");
  }

  return { draft, dirtyFields, dirtyCount, isDirty, resetField, applyDraft };
}
