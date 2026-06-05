import { ref, watch } from "vue";
import { getBuildsCount } from "@/composables/data/buildService";

function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function useFilterCountPreview(draftConfig, { enabled } = {}) {
  const previewCount = ref(null);
  const previewLoading = ref(false);

  const doFetch = debounce(async (config) => {
    if (enabled && !enabled.value) return;
    previewLoading.value = true;
    try {
      previewCount.value = await getBuildsCount(config);
    } finally {
      previewLoading.value = false;
    }
  }, 300);

  watch(
    draftConfig,
    (cfg) => doFetch({ ...cfg }),
    { deep: true }
  );

  return { previewCount, previewLoading };
}
