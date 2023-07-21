import { createStore } from "vuex";
import useCollection from "../composables/useCollection";

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
    setResultsCount(state, payload){
      state.resultsCount = payload;
      console.log("results count state changed:", state.resultsCount);
    },
    //Template module
    setTemplate(state, payload) {
      state.template = payload;
      console.log("template state changed:", state.template);
    }
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
          updateProfile(auth.currentUser, {
            displayName: displayName,
          });
        })
        .then(() => {
          //add to favorites collection
          const { add } = useCollection("favorites");
          add({ favorites: [] }, auth.currentUser.uid);
          context.commit("setDisplayName", displayName);
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

      //decrement likes on all builds
      const favorites = await get(auth.currentUser.uid).then((favorites) => {return favorites.favorites});
      console.log("favorites", favorites)

      await favorites.forEach(element => {
        decrementLikes(element)
      });
      
      //remove from users collection
      await del(auth.currentUser.uid);

      //remove user from auth db
      await deleteUser(auth.currentUser).catch((error) => {
        throw new Error("Could not delete account: " + error.code);
      });

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
