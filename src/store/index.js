import { createStore } from "vuex";
import useCollection from "@/composables/useCollection";

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
} from "@/firebase";
import { httpsCallable } from "firebase/functions";

const store = createStore({
  state: {
    user: null,
    authIsReady: false,
    filterConfig: {
      creator: null,
      author: null,
      civs: null,
      maps: [],
      strategies: [],
      seasons: [],
      orderBy: "score",
      drafts: false,
    },
    snackbar: {
      visible: false,
      text: null,
      timeout: 3000,
      multiline: false,
    },
    resultsCount: 0,
    loading: true,
    template: null,
    //cache
    creators: null,
    popularBuilds: Array(5).fill({ loading: true }),
    mostRecentBuilds: Array(5).fill({ loading: true }),
    villagerOfTheDay: null,
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
    setDrafts(state, payload) {
      state.filterConfig.drafts = payload;
      console.log("drafts state changed:", state.filterConfig.drafts);
    },
    setAuthor(state, payload) {
      state.filterConfig.author = payload;
      console.log("author state changed:", state.filterConfig.author);
    },
    setCivs(state, payload) {
      state.filterConfig.civs = payload;
      console.log("civs state changed:", state.filterConfig.civs);
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
    setLoading(state, payload) {
      state.loading = payload;
      console.log("loading state changed:", state.loading);
    },
    //Template module
    setTemplate(state, payload) {
      state.template = payload;
      console.log("template state changed:", state.template);
    },
    //Cache module
    setCreators(state, payload) {
      state.creators = payload;
      console.log("creators state changed:", state.creators);
    },
    setMostRecentBuilds(state, payload) {
      state.mostRecentBuilds = payload;
      console.log("mostRecentBuilds state changed:", state.mostRecentBuilds);
    },
    setPopularBuilds(state, payload) {
      state.popularBuilds = payload;
      console.log("popularBuilds state changed:", state.popularBuilds);
    },
    addCreator(state, payload) {
      state.creators.push(payload);
      console.log("creators state changed:", state.creators);
    },
    setSnackbar(state, payload) {
      state.snackbar = payload;
      console.log("snackbar state changed:", state.snackbar);
    },
  },
  actions: {

    /**
     * Asynchronously shows a snackbar with the given text.
     *
     * @param {Object} context - the context object
     * @param {string} text - the text to be displayed in the snackbar
     */
    async showSnackbar(context, text) {
      const multiline = text.length > 50 ? true : false;
      const snackbar = {
        visible: true,
        multiline: multiline,
        timeout: 3000,
        text: text,
      };
      context.commit("setSnackbar", snackbar);
    },

    /**
     * Closes the snackbar in the given context.
     *
     * @param {Object} context - The context in which the snackbar is to be closed
     * @return {Promise} - A promise representing the completion of the snackbar closing operation
     */
    async closeSnackbar(context) {
      const snackbar = {
        visible: false,
        multiline: false,
        timeout: 3000,
        text: null,
      };
      context.commit("setSnackbar", snackbar);
    },

    /**
     * Asynchronously signs up a user with the provided email, password, and display name.
     *
     * @param {Object} context - the Vuex context object
     * @param {string} email - the user's email address
     * @param {string} password - the user's password
     * @param {string} displayName - the user's display name
     * @return {Promise<void>} a promise that resolves when the signup process is complete
     */
    async signup(context, { email, password, displayName }) {
      const actionCodeSettings = {
        url: "https://aoe4guides.com/login",
      };

      await createUserWithEmailAndPassword(auth, email, password)
        .then((data) => {
          context.commit("setUser", data.user);
          context.commit("setDisplayName", displayName);
        })
        .then(() => {
          const updateUserDisplayName = httpsCallable(
            functions,
            "updateUserDisplayName"
          );
          updateUserDisplayName({
            displayName: displayName,
            uid: auth.currentUser.uid,
          }).then(() => {
            //send email verification including updated display name
            sendEmailVerification(auth.currentUser, actionCodeSettings);
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

    /**
     * Perform user signin with email and password.
     *
     * @param {Object} context - the Vuex context object
     * @param {string} email - the user's email
     * @param {string} password - the user's password
     * @return {Promise} a promise that resolves after the signin is successful, or rejects with an error
     */
    async signin(context, { email, password }) {
      await signInWithEmailAndPassword(auth, email, password)
        .then((data) => {
          context.commit("setUser", data.user);
        })
        .catch((error) => {
          throw new Error("Could not signin: " + error.code);
        });
    },
    
    /**
     * Logout the user and clear user data from the context.
     *
     * @param {Object} context - the Vuex context object
     * @return {Promise<void>} a promise that resolves once the user is logged out
     */
    async logout(context) {
      await signOut(auth);
      context.commit("setUser", null);
    },

    /**
     * Verify the email of the user using the provided context.
     *
     * @param {Object} context - the Vuex context object
     * @return {Promise<void>} A promise that resolves when the email is verified.
     */
    async verifyEmail(context) {
      const actionCodeSettings = {
        url: "https://aoe4guides.com/login",
      };

      await sendEmailVerification(auth.currentUser, actionCodeSettings).catch(
        (error) => {
          throw new Error("Could not signin: " + error.code);
        }
      );
    },

    /**
     * Deletes the user account which is currently logged-in, 
     * removes user from auth database, 
     * decrements likes on all builds, 
     * removes user from favorites collection, and clears the state.
     *
     * @param {Object} context - the Vuex context object
     * @return {Promise} a promise that resolves when the account is deleted
     */
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

      if (favorites) {
        await favorites.forEach((element) => {
          decrementLikes(element);
        });

        //remove from favorites collection
        await del(uid);
      }

      //clear state
      context.commit("setUser", null);
    },

    /**
     * Asynchronously changes the user's password.
     *
     * @param {Object} context - the Vuex context object
     * @param {string} password - the new password to be set
     * @return {Promise<void>} a promise that resolves when the password is successfully updated
     */
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
