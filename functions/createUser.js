const functions = require("firebase-functions");
const { getFirestore } = require("firebase-admin/firestore");

//Adds the new user from auth to its own document collection 
exports.createUser = functions.auth.user().onCreate((user) => {
    return getFirestore().collection("users").doc(user.uid).set(
      {
        email: user.email,
        id: user.uid,
      },
      { merge: true }
    );
  });