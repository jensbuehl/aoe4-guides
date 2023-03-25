import { createStore } from "vuex";

// firebase imports
import {
  auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  updatePassword,
} from "../firebase";

const store = createStore({
  state: {
    user: null,
    authIsReady: false
  },
  mutations: {
    setUser(state, payload) {
      state.user = payload;
      console.log("user state changed:", state.user);
    },
    setDisplayName(state, payload) {
      state.user.displayName = payload;
      console.log("user display name changed:", state.user.displayName);
    },
    setAuthIsReady(state, payload) {
      state.authIsReady = payload;
    },
  },
  actions: {
    async signup(context, { email, password, displayName }) {
      const actionCodeSettings = {
        url: "http://localhost:5173/login",
      };

      createUserWithEmailAndPassword(auth, email, password)
        .then((data) => {
          sendEmailVerification(auth.currentUser, actionCodeSettings);
          context.commit("setUser", data.user);
        })
        .then(() => {
          updateProfile(auth.currentUser, {
            displayName: displayName,
          });
        })
        .then(() => {
          context.commit("setDisplayName", displayName);
        })
        .catch(() => {
          throw new Error("Could not create account");
        });
    },
    async signin(context, { email, password }) {
      await signInWithEmailAndPassword(auth, email, password)
        .then((data) => {
          context.commit("setUser", data.user);
        })
        .catch(() => {
          throw new Error("Could not login");
        });
    },
    async logout(context) {
      await signOut(auth);
      context.commit("setUser", null);
    },
    async deleteAccount(context) {
      await deleteUser(auth.currentUser);
      context.commit("setUser", null);
    },
    async changePassword(context, { password }) {
      await updatePassword(auth.currentUser, password);
    },
  },
});

const unsub = onAuthStateChanged(auth, (user) => {
  store.commit("setAuthIsReady", true);
  store.commit("setUser", user);
  unsub();
});

//export store
export default store;
