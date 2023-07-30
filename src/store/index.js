import { createStore } from "vuex";
import useCollection from "../composables/useCollection";

// firebase imports
import {
  auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  updatePassword,
  functions,
} from "../firebase";
import {  httpsCallable } from 'firebase/functions';

const store = createStore({
  state: {
    user: null,
    authIsReady: false,
    filterConfig: null,
    resultsCount: 0,
    template: null,
  },
  mutations: {
    //User module
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
    //Config module
    setFilterConfig(state, payload) {
      state.filterConfig = payload;
      console.log("filter config state changed:", state.filterConfig);
    },
    setCreator(state, payload) {
      state.filterConfig.creator = payload;
      console.log("creator state changed:", state.filterConfig.creator);
    },
    setAuthor(state, payload) {
      state.filterConfig.author = payload;
      console.log("author state changed:", state.filterConfig.author);
    },
    setCivs(state, payload) {
      state.filterConfig.civs = payload;
      console.log("civs state changed:", state.filterConfig.civs);
    },
    setMatchups(state, payload) {
      state.filterConfig.matchups = payload;
      console.log("matchups state changed:", state.filterConfig.matchups);
    },
    setMaps(state, payload) {
      state.filterConfig.maps = payload;
      console.log("maps state changed:", state.filterConfig.maps);
    },
    setStrategies(state, payload) {
      state.filterConfig.strategies = payload;
      console.log("strategies state changed:", state.filterConfig.strategies);
    },
    setSeasons(state, payload) {
      state.filterConfig.seasons = payload;
      console.log("seasons state changed:", state.filterConfig.seasons);
    },
    setOrderBy(state, payload) {
      state.filterConfig.orderBy = payload;
      console.log("orderBy state changed:", state.filterConfig.orderBy);
    },
    setResultsCount(state, payload) {
      state.resultsCount = payload;
      console.log("results count state changed:", state.resultsCount);
    },
    //Template module
    setTemplate(state, payload) {
      state.template = payload;
      console.log("template state changed:", state.template);
    },
  },
  actions: {
    //User module
    async signup(context, { email, password, displayName }) {
      const actionCodeSettings = {
        url: "https://aoe4guides.com/login",
      };

      await createUserWithEmailAndPassword(auth, email, password)
        .then((data) => {
          sendEmailVerification(auth.currentUser, actionCodeSettings);
          context.commit("setUser", data.user);
        })
        .then(() => {
          const updateUserDisplayName = httpsCallable(functions,
            "updateUserDisplayName"
          );
          updateUserDisplayName({
            displayName: displayName,
            uid: auth.currentUser.uid,
          }).then(() => {
            context.commit("setDisplayName", displayName);
          });
        })
        .then(() => {
          //add to favorites collection
          const { add } = useCollection("favorites");
          add({ favorites: [] }, auth.currentUser.uid);
        })
        .catch((error) => {
          throw new Error("Could not create account: " + error.code);
        });
    },
    async signin(context, { email, password }) {
      await signInWithEmailAndPassword(auth, email, password)
        .then((data) => {
          context.commit("setUser", data.user);
        })
        .catch((error) => {
          throw new Error("Could not signin: " + error.code);
        });
    },
    async logout(context) {
      await signOut(auth);
      context.commit("setUser", null);
    },
    async deleteAccount(context) {
      const { del, get } = useCollection("favorites");
      const { decrementLikes } = useCollection("builds");

      //remove user from auth db
      const uid = auth.currentUser.uid;
      await deleteUser(auth.currentUser).catch((error) => {
        throw new Error("Could not delete account: " + error.code);
      });

      //decrement likes on all builds
      const favorites = await get(uid).then((favorites) => {
        return favorites?.favorites;
      });

      if(favorites){
        await favorites.forEach((element) => {
          decrementLikes(element);
        });

        //remove from favorites collection
        await del(uid);
      }

      //clear state
      context.commit("setUser", null);
    },
    async changePassword(context, { password }) {
      await updatePassword(auth.currentUser, password).catch((error) => {
        throw new Error("Could not change password: " + error.code);
      });
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
