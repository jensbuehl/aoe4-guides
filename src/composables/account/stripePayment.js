import { httpsCallable, getFunctions } from "firebase/functions";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db, app } from "@/firebase";

export const getCheckoutUrl = async (user, priceId) => {
  const checkoutSessionRef = collection(db, "customers", user?.uid, "checkout_sessions");
  const docRef = await addDoc(checkoutSessionRef, {
    price: priceId,
    success_url: window.location.origin,
    cancel_url: window.location.origin,
  });
  
  return new Promise((resolve, reject) => {
    const unsubscribe = onSnapshot(docRef, (snap) => {
      const { error, url } = snap.data();
      if (error) {
        unsubscribe();
        reject(new Error(`An error occurred: ${error.message}`));
      }
      if (url) {
        console.log("Stripe Checkout URL:", url);
        unsubscribe();
        resolve(url);
      }
    });
  });
};

export const getPortalUrl = async (user) => {
  let dataWithUrl;
  try {
    const functions = getFunctions(app, "europe-west3");
    const functionRef = httpsCallable(functions, "ext-firestore-stripe-payments-createPortalLink");
    const { data } = await functionRef({
      customerId: user?.uid,
      returnUrl: window.location.origin,
    });

    console.log("getPortalUrl:", data);

    // Add a type to the data
    dataWithUrl = data;
    console.log("Reroute to Stripe portal: ", dataWithUrl.url);
  } catch (error) {
    console.error(error);
  }

  return (
    new Promise((resolve, reject) => {
      if (dataWithUrl.url) {
        resolve(dataWithUrl.url);
      } else {
        reject(new Error("No url returned"));
      }
    })
  );
};
