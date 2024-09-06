import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase";

export const getSubscriptionStatus = async (user) => {
  const subscriptionsRef = collection(db, "customers", user?.uid, "subscriptions");
  const q = query(subscriptionsRef, where("status", "in", ["trialing", "active"]));

  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // In this implementation we only expect one active or trialing subscription to exist.
        if (snapshot.docs.length === 0) {
          console.log("No active subscriptions found");
          resolve("FREE");
        } else if (snapshot.docs[0].data().items["0"].price.product.name == "Test Product") {
          console.log("FAN subscription found");
          resolve("FAN");
        } else if (snapshot.docs[0].data().items["0"].price.product.name == "Test Product") {
          console.log("PRO subscription found");
          resolve("PRO");
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
