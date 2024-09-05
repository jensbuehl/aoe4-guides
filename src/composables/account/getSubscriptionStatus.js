import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useStore } from "vuex";
import { db } from "@/firebase";

export const getSubscriptionStatus = async () => {
  const store = useStore();
  //todo wait for auth to be ready
  const userId = store.state.user.uid;
  if (!userId) throw new Error("User not logged in");

  const subscriptionsRef = collection(db, "customers", userId, "subscriptions");
  const q = query(subscriptionsRef, where("status", "in", ["trialing", "active"]));

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // In this implementation we only expect one active or trialing subscription to exist.
        if (snapshot.docs.length === 0) {
          console.log("No active subscriptions found");
          resolve(false);
        } else if (snapshot.docs[0].data().items["0"].price.product.name == "Test Product") {
          console.log("FAN subscription found");
          resolve("FAN");
        } else if (snapshot.docs[0].data().items["0"].price.product.name == "Test Product") {
          console.log("FAN subscription found");
          resolve("FAN");
        } else {
          console.log("Unknown subscription found");
          resolve(false);
        }
        unsubscribe();
      },
      reject
    );  
  });
};
