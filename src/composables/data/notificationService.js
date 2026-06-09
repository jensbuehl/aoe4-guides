import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();
const processUnsubscribeFn = httpsCallable(functions, "processUnsubscribe");

export async function processUnsubscribeNotification({ userId, buildId, token, action }) {
  const result = await processUnsubscribeFn({ userId, buildId, token, action });
  return result.data;
}
