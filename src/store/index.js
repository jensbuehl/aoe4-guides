import { createStore } from "vuex";
import { getUserProfile, updateUserAvatar, updateContributorIcon } from "@/composables/data/userService";
import { completeAccountSetup } from "@/composables/auth/useAccountSetup";
import { mapAuthError } from "@/composables/auth/useAuthErrors";
import { civs } from "@/composables/filter/civDefaultProvider";
import {
  readCachedAvatar,
  writeCachedAvatar,
  clearCachedAvatar,
} from "@/composables/auth/avatarCache";
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
  GoogleAuthProvider,
  signInWithPopup,
  reauthenticateWithPopup,
} from "@/firebase";

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
    isAdmin: false,
    // A Google account that has been authenticated but never named. Set on
    // every sign-in, not just the first, so a sign-up someone walked away from
    // is picked up rather than left as a nameless author (spec 032, R-6).
    profileIncomplete: false,
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
    //undefined = not fetched yet, null = user has no picture
    userAvatar: undefined,
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
    setIsAdmin(state, payload) {
      state.isAdmin = payload;
    },
    setProfileIncomplete(state, payload) {
      state.profileIncomplete = payload;
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
    clearUserProfileCache(state) {
      state.cache.userProfiles = {};
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

      try {
        const data = await createUserWithEmailAndPassword(auth, email, password);
        context.commit("setUser", data.user);
        context.commit("setDisplayName", displayName);

        await completeAccountSetup({ uid: auth.currentUser.uid, displayName });
      } catch (error) {
        throw new Error("Could not create account: " + error.code);
      }

      // Sent after setup so the mail carries the display name the user chose,
      // and outside the try on purpose: by this point the account exists and
      // works. A send failure is worth saying out loud — the old code dropped
      // it into an unhandled rejection, and awaiting it inside the try above
      // reported a perfectly good account as "could not create". Neither was
      // true. The account page's resend button is the way out.
      try {
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
      } catch (error) {
        context.dispatch("showSnackbar", {
          text: "Account created, but the confirmation email could not be sent. You can resend it from your account page.",
          type: "warning",
        });
        console.error("sendEmailVerification failed:", error?.code, error?.message);
      }
    },

    /**
     * Signs in with Google, creating the account if this address has never been
     * here before.
     *
     * `signInWithPopup` is called on the first line on purpose. A browser only
     * permits a popup while the user's click is still being handled, so any
     * awaited work ahead of it — a token, a read, another action — ends the
     * gesture and the popup is blocked. That failure hits every user in every
     * strict browser and does not reproduce in a permissive dev tab, which is
     * what makes it worth guarding by construction (spec 032, R-2).
     *
     * Nothing here checks whether the address already exists. Asking would mean
     * `fetchSignInMethodsForEmail`, which is an account enumeration oracle and
     * would cost the await above; the collision surfaces as a rejection instead
     * and the dialog handles it (R-4).
     *
     * Account setup is not this action's job either — `onAuthStateChanged` finds
     * an unfinished account and prompts, which is also what repairs a sign-up
     * someone walked away from (R-6).
     *
     * @param {Object} context - the Vuex context object
     * @return {Promise<void>} resolves once the user is signed in
     */
    async signinWithGoogle(context) {
      // Synchronous, so the gesture survives to the popup call below.
      if (auth.currentUser) {
        throw new Error(
          "You're already signed in. Please sign out first to use a different account."
        );
      }

      const provider = new GoogleAuthProvider();
      const data = await signInWithPopup(auth, provider);
      context.commit("setUser", data.user.toJSON());

      // Answer the completeness question here rather than leaving the caller to
      // race the auth-state handler for it. The read is shared with that
      // handler through the profile cache, so it still costs nothing extra.
      const incomplete = await context.dispatch("checkProfileComplete", data.user);
      return { incomplete };
    },

    /**
     * Decides whether an account has been authenticated but never named, and
     * records the answer.
     *
     * Two clauses, each load-bearing. `users/{uid}.displayName` is written only
     * by our callable — the auth trigger writes just the email and id — so its
     * absence means nobody has chosen a name through our flow. And the account
     * must have a Google sign-in: password accounts predate the `createUser`
     * function and some have no `users/{uid}` document at all, so testing the
     * name alone would ambush authors who finished years ago (spec 032, R-6).
     *
     * Costs no read. `loadUserAvatar` fetches the same document on every
     * sign-in, and `getCachedUserProfile` hands both callers one promise.
     *
     * @param {Object} context - the Vuex context object
     * @param {Object} user - the Firebase user, for its providerData
     * @return {Promise<boolean>} true when the account still needs a name
     */
    async checkProfileComplete(context, user) {
      const hasGoogle = user.providerData?.some((p) => p.providerId === "google.com");
      if (!hasGoogle) {
        context.commit("setProfileIncomplete", false);
        return false;
      }

      const profile = await context.dispatch("getCachedUserProfile", user.uid);
      const chosen = profile?.displayName;
      const incomplete = !chosen;
      context.commit("setProfileIncomplete", incomplete);

      // Linking Google to an account that already had one overwrites the auth
      // record's displayName with the Google profile name — observed live on a
      // verified account, 2026-08-11. Firestore keeps the name the user chose,
      // so the two disagree and the account goes split-brained: the header
      // shows the real name while builds show the chosen one, and the next
      // build published would be stamped with the real one (BuildEditor copies
      // `user.displayName` into `build.author`). `users/{uid}.displayName` is
      // the authoritative answer to "what did they choose", so put it back.
      if (!incomplete && user.displayName !== chosen) {
        await completeAccountSetup({ uid: user.uid, displayName: chosen });
        await auth.currentUser.reload();
        context.commit("setUser", auth.currentUser.toJSON());
      }

      return incomplete;
    },

    /**
     * Finishes an account that has been authenticated but never named.
     *
     * Rejects without closing anything, deliberately: an account with no display
     * name has to keep asking, and the caller leaves the dialog open on failure.
     *
     * @param {Object} context - the Vuex context object
     * @param {string} displayName - already validated by the form that collected it
     * @return {Promise<void>} resolves once the name is stored everywhere it is read
     */
    async completeProfile(context, { displayName }) {
      const uid = auth.currentUser.uid;
      await completeAccountSetup({ uid, displayName });

      // The callable wrote the name onto the auth record too; reload so the
      // header, the account page and anything else reading state.user see it
      // without waiting for the next page load.
      await auth.currentUser.reload();
      context.commit("setUser", auth.currentUser.toJSON());

      // Keep the cached profile in step, or the completeness test would read a
      // document it just made out of date and ask for the name a second time.
      const cachedProfile = context.state.cache.userProfiles[uid] || {};
      context.commit("setUserProfile", { uid, profile: { ...cachedProfile, displayName } });
      context.commit("setProfileIncomplete", false);
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

      // The message used to read "Could not signin", copied from the action
      // above it, and handed the raw code to a snackbar that shows it verbatim.
      await sendEmailVerification(auth.currentUser, actionCodeSettings).catch((error) => {
        throw new Error(mapAuthError(error));
      });
    },

    /**
     * Deletes the account which is currently logged-in and clears the state.
     *
     * Auth concerns only. Giving back the likes, upvotes and downvotes the
     * account cast belongs to the `deleteUser` trigger, which runs on the admin
     * SDK — so it also covers deletions made by an administrator, and it cannot
     * be refused by security rules the way cleanup from here could be. Doing it
     * here as well would be worse than redundant: this used to delete
     * `favorites/{uid}`, which is the trigger's entire work list.
     *
     * Returns as soon as the account itself is gone. The cleanup continues
     * server-side, so someone with years of history waits no longer than
     * someone with none.
     *
     * The account goes; the user's build orders stay published. That is
     * deliberate — the community still uses them, and anything sensitive is
     * removed by hand.
     *
     * @param {Object} context - the Vuex context object
     * @return {Promise} a promise that resolves when the account is deleted
     */
    async deleteAccount(context) {
      try {
        await deleteUser(auth.currentUser);
      } catch (error) {
        if (error.code === "auth/requires-recent-login") {
          await context.dispatch("reauthenticate");
          await deleteUser(auth.currentUser).catch((retryError) => {
            throw new Error("Could not delete account: " + retryError.code);
          });
        } else {
          throw new Error("Could not delete account: " + error.code);
        }
      }

      context.commit("setUser", null);
    },

    /**
     * Proves who the signed-in user is, again, for an action Firebase considers
     * too sensitive for an old session.
     *
     * Branches on how they sign in, because there is no single way to ask. A
     * Google account re-opens the popup — which means callers must reach this
     * from a user gesture, as in `signinWithGoogle`. A password account has no
     * equivalent here yet, so it gets a sentence it can act on instead of a
     * failure it cannot; an in-place password prompt is a later feature.
     *
     * @param {Object} context - the Vuex context object
     * @return {Promise<void>} resolves once identity is re-proven
     */
    async reauthenticate() {
      const user = auth.currentUser;
      const hasGoogle = user.providerData.some((p) => p.providerId === "google.com");

      if (!hasGoogle) {
        throw new Error(
          "For your security, please sign out and sign back in, then try again."
        );
      }

      await reauthenticateWithPopup(user, new GoogleAuthProvider());
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
      const avatar = profile?.avatar ?? null;
      commit("setUserAvatar", avatar);
      writeCachedAvatar(uid, avatar);
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
      writeCachedAvatar(uid, { type, ref });

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

onAuthStateChanged(auth, async (user) => {
  if (!store.state.authIsReady) {
    store.commit("setAuthIsReady", true);
  }
  store.commit("setUser", user ? user.toJSON() : null);
  if (user) {
    // Paint the remembered avatar now rather than after the profile read.
    // loadUserAvatar still runs and overwrites it, so a change made on another
    // device corrects itself within the same page load.
    const cached = readCachedAvatar();
    if (cached?.uid === user.uid) {
      store.commit("setUserAvatar", cached.avatar);
    }
    const tokenResult = await user.getIdTokenResult();
    store.commit("setIsAdmin", tokenResult.claims.admin === true);
    store.dispatch("loadUserAvatar", user.uid);

    // Runs on every sign-in, not only the first. That is the whole point: it is
    // what picks up a Google sign-up somebody walked away from at the name step,
    // on this device or another one.
    const incomplete = await store.dispatch("checkProfileComplete", user);
    if (incomplete) {
      // Committed rather than dispatched: openAuthDialog would reset `redirect`
      // to null, and a first-time user who arrived here from a guarded page
      // still has somewhere to be sent afterwards.
      store.commit("setAuthDialog", { visible: true, mode: "complete-profile" });
    }
  } else {
    store.commit("setUserAvatar", null);
    store.commit("setIsAdmin", false);
    store.commit("setProfileIncomplete", false);

    // A profile cached during one session must not answer questions in the
    // next. It caused a real misfire: registering with a password reads
    // `users/{uid}` before the onCreate trigger has written it, caching `null`;
    // the callable then writes the display name straight to Firestore, which
    // the cache never sees. Signing back in without a page reload asked an
    // already-named user to name themselves again. The mirror case is worse —
    // a stale populated profile would skip the prompt and leave a nameless
    // author (FR-007b).
    store.commit("clearUserProfileCache");
    clearCachedAvatar();
  }
});

//export store
export default store;
