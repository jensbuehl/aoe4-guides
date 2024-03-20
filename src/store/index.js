import { createStore } from "vuex";
import useCollection from "@/composables/useCollection";
import { createUserFavorites, getUserFavorites, deleteUserFavorites } from "@/composables/data/favoriteService";

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

export const store = createStore({
    state: {
        //general
        loading: true,
        resultsCount: 0,
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
            orderBy: "score",
        },
        //snackbar
        snackbar: {
            visible: false,
            text: null,
            timeout: 5000,
            multiline: false,
        },
        //cache
        cache: {
            builds: {},
            popularBuildsList: Array(5).fill({ loading: true }),
            recentBuildsList: Array(5).fill({ loading: true }),
            allBuildsList: null,
            myBuildsList: null,
            myFavoritesList: null,
        },
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
        setMaps(state, payload) {
            state.filterConfig.maps = payload;
            console.log("maps state changed:", state.filterConfig.maps);
        },
        setStrategies(state, payload) {
            state.filterConfig.strategies = payload;
            console.log(
                "strategies state changed:",
                state.filterConfig.strategies
            );
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
        setBuild(state, payload) {
            state.cache.builds[payload.id] = payload;
            console.log(
                "cache.builds updated. The following build has been added:",
                payload
            );
        },
        removeBuild(state, payload) {
            delete state.cache.builds[payload];
            console.log(
                "cache.builds updated. The following build has been removed:",
                payload
            );
        },
        setBuilds(state, payload) {
            for (const build of payload) {
                state.cache.builds[build.id] = build;
            }
            console.log("cache.builds updated. The following builds have been added:", payload);
        },
        setRecentBuildsList(state, payload) {
            state.cache.recentBuildsList = payload;
            console.log(
                "recentBuildsList state changed:",
                state.cache.recentBuildsList
            );
        },
        setPopularBuildsList(state, payload) {
            state.cache.popularBuildsList = payload;
            console.log(
                "popularBuildsList state changed:",
                state.cache.popularBuildsList
            );
        },
        setMyFavoritesList(state, payload) {
            state.cache.myFavoritesList = payload;
            console.log(
                "myFavoritesList state changed:",
                state.cache.myFavoritesList
            );
        },
        setMyBuildsList(state, payload) {
            state.cache.myBuildsList = payload;
            console.log(
                "myBuildsList state changed:",
                state.cache.myBuildsList
            );
        },
        setAllBuildsList(state, payload) {
            state.cache.allBuildsList = payload;
            console.log(
                "allBuildsList state changed:",
                state.cache.allBuildsList
            );
        },
        //Snackbar module
        setSnackbar(state, payload) {
            state.snackbar = payload;
            console.log("snackbar state changed:", state.snackbar);
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
                    const updateUserDisplayName = httpsCallable(
                        functions,
                        "updateUserDisplayName"
                    );
                    updateUserDisplayName({
                        displayName: displayName,
                        uid: auth.currentUser.uid,
                    }).then(() => {
                        //send email verification including updated display name
                        sendEmailVerification(
                            auth.currentUser,
                            actionCodeSettings
                        );
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

            await sendEmailVerification(
                auth.currentUser,
                actionCodeSettings
            ).catch((error) => {
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
            const { decrementLikes } = useCollection("builds");

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
    },
});

const unsub = onAuthStateChanged(auth, (user) => {
    store.commit("setAuthIsReady", true);
    store.commit("setUser", user);
    unsub();
});

//export store
export default store;
