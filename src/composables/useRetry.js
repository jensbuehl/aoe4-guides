import { ref } from "vue";

/**
 * "Try again" for a list that could not be read: `retrying` stays true until the
 * read answers, so a second failure reads as a new attempt rather than a button
 * that did nothing.
 *
 * @param {() => Promise<void>} read - The view's own load.
 * @return {{ retrying: import("vue").Ref<boolean>, retry: () => Promise<void> }}
 */
export function useRetry(read) {
  const retrying = ref(false);
  const retry = async () => {
    retrying.value = true;
    try {
      await read();
    } finally {
      retrying.value = false;
    }
  };
  return { retrying, retry };
}
