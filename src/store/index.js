import { createStore } from "vuex";
import { decrementLikes } from "@/composables/data/buildService";
import {
  createUserFavorites,
  getUserFavorites,
  deleteUserFavorites,
} from "@/composables/data/favoriteService";
import { getUserProfile, updateUserAvatar, updateContributorIcon } from "@/composables/data/userService";
import { civs } from "@/composables/filter/civDefaultProvider";
import { storage, storageRef, uploadBytes, getDownloadURL } from "@/firebase";

// firebase imports
import {
  auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
  updatePassword,
  functions,
} from "@/firebase";
import { httpsCallable } from "firebase/functions";

const pendingFetches = new Map();

export const store = createStore({
  state: {
    //general
    loading: true,
    resultsCount: 0,
    showBottomNavigation: true,
    //user
    user: null,
    authIsReady: false,
    //template
    template: null,
    //filter configuration
    filterConfig: {
      creator: null,
      author: null,
      civs: null,
      maps: [],
      strategies: [],
      seasons: [],
      orderBy: "scoreAllTime",
    },
    //snackbar
    snackbar: {
      visible: false,
      text: null,
      timeout: 5000,
      multiline: false,
    },
    //ui
    ui: {
      authDialog: { visible: false, mode: "login", redirect: null },
      importDialog: { open: false },
    },
    //avatar
    userAvatar: null,
    //cache
    cache: {
      builds: {},
      popularBuildsList: Array(10).fill({ loading: true }),
      recentBuildsList: Array(10).fill({ loading: true }),
      allTimeClassicsList: Array(10).fill({ loading: true }),
      topContributorsList: Array(8).fill({ loading: true }),
      allBuildsList: null,
      myBuildsList: null,
      myFavoritesList: null,
      userProfiles: {},
    },
  },
  mutations: {
    //User module
    setUser(state, payload) {
      state.user = payload;
    },
    setDisplayName(state, payload) {
      state.user.displayName = payload;
    },
    setShowBottomNavigation(state, payload) {
      state.showBottomNavigation = payload;
    },
    setAuthIsReady(state, payload) {
      state.authIsReady = payload;
    },
    //Config module
    setFilterConfig(state, payload) {
      state.filterConfig = payload;
    },
    setCreator(state, payload) {
      state.filterConfig.creator = payload;
    },
    setAuthor(state, payload) {
      state.filterConfig.author = payload;
    },
    setCivs(state, payload) {
      state.filterConfig.civs = payload;
    },
    setMaps(state, payload) {
      state.filterConfig.maps = payload;
    },
    setStrategies(state, payload) {
      state.filterConfig.strategies = payload;
    },
    setSeasons(state, payload) {
      state.filterConfig.seasons = payload;
    },
    setOrderBy(state, payload) {
      state.filterConfig.orderBy = payload;
    },
    setResultsCount(state, payload) {
      state.resultsCount = payload;
    },
    setLoading(state, payload) {
      state.loading = payload;
    },
    //Template module
    setTemplate(state, payload) {
      state.template = payload;
    },
    //Cache module
    setBuild(state, payload) {
      state.cache.builds[payload.id] = payload;
    },
    removeBuild(state, payload) {
      delete state.cache.builds[payload];
    },
    setBuilds(state, payload) {
      for (const build of payload) {
        state.cache.builds[build.id] = build;
      }
    },
    setTopContributorsList(state, payload) {
      state.cache.topContributorsList = payload;
    },
    setRecentBuildsList(state, payload) {
      state.cache.recentBuildsList = payload;
    },
    setAllTimeClassicsList(state, payload) {
      state.cache.allTimeClassicsList = payload;
    },
    setPopularBuildsList(state, payload) {
      state.cache.popularBuildsList = payload;
    },
    setMyFavoritesList(state, payload) {
      state.cache.myFavoritesList = payload;
    },
    setMyBuildsList(state, payload) {
      state.cache.myBuildsList = payload;
    },
    setAllBuildsList(state, payload) {
      state.cache.allBuildsList = payload;
    },
    setUserProfile(state, { uid, profile }) {
      state.cache.userProfiles[uid] = profile;
    },
    //Snackbar module
    setSnackbar(state, payload) {
      state.snackbar = payload;
    },
    //UI module
    setAuthDialog(state, payload) {
      state.ui.authDialog = { ...state.ui.authDialog, ...payload };
    },
    setImportDialog(state, open) {
      state.ui.importDialog.open = open;
    },
    //Avatar module
    setUserAvatar(state, payload) {
      state.userAvatar = payload ?? null;
    },
  },
  actions: {
    /**
     * Show a snackbar with the given text and type.
     *
     * @param {Object} context - The context for the snackbar
     * @param {string} text - The text to display in the snackbar
     * @param {string} type - The type of snackbar (default is "info")
     * @return {void}
     */
    async showSnackbar(context, { text, type }) {
      const snackbar = {
        visible: true,
        timeout: 5000,
        text: text,
        color: type || "info",
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
        timeout: 5000,
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
          const updateContributorDisplayName = httpsCallable(
            functions,
            "updateContributorDisplayName"
          );
          updateContributorDisplayName({
            displayName: displayName,
            uid: auth.currentUser.uid,
          });
          const updateUserDisplayName = httpsCallable(functions, "updateUserDisplayName");
          updateUserDisplayName({
            displayName: displayName,
            uid: auth.currentUser.uid,
          }).then(() => {
            //send email verification including updated display name
            sendEmailVerification(auth.currentUser, actionCodeSettings);
          });
        })
        .then(() => {
          createUserFavorites(auth.currentUser.uid);
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

      await sendEmailVerification(auth.currentUser, actionCodeSettings).catch((error) => {
        throw new Error("Could not signin: " + error.code);
      });
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
      //remove user from auth db
      const uid = auth.currentUser.uid;
      await deleteUser(auth.currentUser).catch((error) => {
        throw new Error("Could not delete account: " + error.code);
      });

      //decrement likes on all builds
      const favorites = await getUserFavorites(uid).then((favorites) => {
        return favorites?.favorites;
      });

      if (favorites) {
        await favorites.forEach((element) => {
          decrementLikes(element);
        });

        //remove from favorites collection
        await deleteUserFavorites(uid);
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

    openAuthDialog({ commit }, { mode = "login", redirect = null } = {}) {
      commit("setAuthDialog", { visible: true, mode, redirect });
    },

    closeAuthDialog({ commit }) {
      commit("setAuthDialog", { visible: false, redirect: null });
    },

    openImportDialog({ commit }) {
      commit("setImportDialog", true);
    },

    closeImportDialog({ commit }) {
      commit("setImportDialog", false);
    },

    async loadUserAvatar({ commit, dispatch }, uid) {
      const profile = await dispatch("getCachedUserProfile", uid);
      commit("setUserAvatar", profile?.avatar ?? null);
    },

    getCachedUserProfile({ commit, state }, uid) {
      if (state.cache.userProfiles[uid] !== undefined) {
        return Promise.resolve(state.cache.userProfiles[uid]);
      }
      if (pendingFetches.has(uid)) {
        return pendingFetches.get(uid);
      }
      const fetch = getUserProfile(uid).then((profile) => {
        commit("setUserProfile", { uid, profile: profile ?? null });
        pendingFetches.delete(uid);
        return profile ?? null;
      });
      pendingFetches.set(uid, fetch);
      return fetch;
    },

    async updateAvatar({ commit, state }, { type, ref = null }) {
      const uid = state.user.uid;
      await updateUserAvatar(uid, { type, ref });
      commit("setUserAvatar", { type, ref });

      // Resolve icon URL for contributors collection so it shows on author
      // filter pages and Top Contributors without extra reads at render time.
      let iconUrl = null;
      if (type === "civ") {
        const civ = civs.value.find((c) => c.shortName === ref);
        iconUrl = civ ? civ.flagLarge : null;
      } else if (type === "upload") {
        iconUrl = ref;
      }
      await updateContributorIcon(uid, iconUrl);

      // Optimistically patch the in-memory list so the UI reflects the new
      // icon immediately. The hourly Cloud Function will persist it to the
      // home snapshot; a full page reload picks that up.
      const patched = state.cache.topContributorsList.map((c) =>
        c.authorId === uid ? { ...c, icon: iconUrl } : c
      );
      commit("setTopContributorsList", patched);
    },

    async uploadAndSetAvatar({ dispatch, state }, blob) {
      const path = storageRef(storage, `avatars/${state.user.uid}.webp`);
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Upload timed out. Please check your connection and try again.")), 20000)
      );
      await Promise.race([uploadBytes(path, blob), timeout]);
      const url = await getDownloadURL(path);
      await dispatch("updateAvatar", { type: "upload", ref: url });
    },

    async resetPassword(_, { email }) {
      const actionCodeSettings = { url: "https://aoe4guides.com/login" };
      await sendPasswordResetEmail(auth, email, actionCodeSettings).catch((error) => {
        throw new Error("Could not send reset email: " + error.code);
      });
    },
  },
});

onAuthStateChanged(auth, (user) => {
  if (!store.state.authIsReady) {
    store.commit("setAuthIsReady", true);
  }
  store.commit("setUser", user ? user.toJSON() : null);
  if (user) {
    store.dispatch("loadUserAvatar", user.uid);
  } else {
    store.commit("setUserAvatar", null);
  }
});

//export store
export default store;
