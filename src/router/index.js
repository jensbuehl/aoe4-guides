import { createWebHistory, createRouter } from "vue-router";
import { auth, onAuthStateChanged } from "@/firebase";
import store from "@/store";

//account
import Login from "@/views/account/Login.vue";
import Register from "@/views/account/Register.vue";
import Account from "@/views/account/Account.vue";
import AccountAction from "@/views/account/AccountAction.vue";
import ResetPassword from "@/views/account/ResetPassword.vue";

//builds
import Builds from '@/views/builds/Builds.vue'
import Dashboard from '@/views/builds/Dashboard.vue'
import BuildDetails from "@/views/builds/BuildDetails.vue";
import BuildEdit from "@/views/builds/BuildEdit.vue";
import BuildNew from "@/views/builds/BuildNew.vue";
import MyBuilds from "@/views/builds/MyBuilds.vue";
import MyFavorites from "@/views/builds/MyFavorites.vue";

import Home from "@/views/Home.vue";
import NotFound from "@/views/NotFound.vue";
import Privacy from "@/views/Privacy.vue";
import About from "@/views/About.vue";

import Admin from "@/views/Admin.vue";

const routes = [
    {
      path: "/",
      name: "Home",
      component: Home,
      meta: {
        title: "Age of Empires IV Build Orders",
        showFab: true
      }
    },
    {
      path: "/dashboard",
      name: "Dashboard",
      component: Dashboard,
      meta: {
        title: "Age of Empires IV Build Orders",
        showFab: true
      }
    },
    {
      path: "/admin",
      name: "Admin",
      component: Admin,
      meta: {
        title: "Admin Console"
      }
    },
    {
      path: "/builds",
      name: "Builds",
      component: Builds,
      meta: {
        title: "All Build Orders - Age of Empires IV Build Orders",
        showFab: true
      }
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
      meta: {
        title: "Login",
        guestOnly: true
      }
    },
    {
      path: "/register",
      name: "Register",
      component: Register,
      meta: {
        title: "Register",
        guestOnly: true
      }
    },
    {
      path: "/resetpassword",
      name: "ResetPassword",
      component: ResetPassword,
      meta: {
        title: "Reset Password"
      }
    },
    {
      path: "/builds/:id",
      name: "BuildDetails",
      component: BuildDetails,
      props: true,
      meta: {
        title: "Age of Empires IV Build Orders"
      }
    },
    {
      path: "/account",
      name: "Account",
      component: Account,
      meta: {
        title: "Account",
        requiresAuth: true
      }
    },
    {
      path: "/account/action",
      name: "AccountAction",
      component: AccountAction,
      meta: {
        title: "Account"
      }
    },
    {
      path: "/edit/:id",
      name: "BuildEdit",
      component: BuildEdit,
      props: true,
      meta: {
        title: "Edit Build Order - Age of Empires IV Build Orders",
        requiresAuth: true,
        requiresVerification: true
      }
    },
    {
      path: "/mybuilds",
      name: "MyBuilds",
      component: MyBuilds,
      meta: {
        title: "My Build Orders - Age of Empires IV Build Orders",
        requiresAuth: true,
        showFab: true
      }
    },
    {
      path: "/favorites",
      name: "MyFavorites",
      component: MyFavorites,
      meta: {
        title: "My Favorites - Age of Empires IV Build Orders",
        requiresAuth: true,
        showFab: true
      }
    },
    {
      path: "/about",
      name: "About",
      component: About,
      meta: {
        title: "About"
      }
    },
    {
      path: "/privacy",
      name: "Privacy",
      component: Privacy,
      meta: {
        title: "Privacy Policy"
      }
    },
    {
      path: "/new",
      name: "BuildNew",
      component: BuildNew,
      meta: {
        title: "Create Build Order - Age of Empires IV Build Orders",
        requiresAuth: true,
        requiresVerification: true
      }
    },
    {
      path: "/github",
      name: "github",
      beforeEnter() {location.href = 'https://github.com/jensbuehl/aoe4-guides'}
    },
    {
      path: "/apidoc",
      name: "api",
      beforeEnter() {location.href = 'https://aoe4guides.com/api/api-docs/'}
    },
    {
      path: "/:catchAll(.*)",
      name: "NotFound",
      component: NotFound,
      meta: {
        title: "Page Not Found"
      }
    }
  ];
  
  const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {

      if (savedPosition) {
        return savedPosition
      } else {
        return { top: 0 }
      }
    },
  });

  router.afterEach(to => {
    if (to.meta.title) {
      document.title = `${to.meta.title}` + " | AOE4 GUIDES"
    }
  });

  // Resolves once Firebase has determined the initial auth state (fires exactly once).
  const waitForAuth = new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    });
  });

  router.beforeEach(async (to) => {
    await waitForAuth;

    if (to.meta.requiresAuth && !auth.currentUser) {
      return { name: "Login", query: { redirect: to.fullPath } };
    }

    if (to.meta.guestOnly && auth.currentUser) {
      return { name: "Home" };
    }

    if (to.meta.requiresVerification && auth.currentUser && !auth.currentUser.emailVerified) {
      store.dispatch("showSnackbar", {
        text: "Please verify your email address to use this feature.",
        type: "warning",
      });
      return { name: "Home" };
    }
  });

  export default router;