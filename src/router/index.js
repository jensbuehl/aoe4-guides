import { createWebHistory, createRouter } from "vue-router";

//account
import Login from "../views/account/Login.vue";
import Register from "../views/account/Register.vue";
import Account from "../views/account/Account.vue";
import ResetPassword from "../views/account/ResetPassword.vue";

//builds
import Builds from '../views/builds/Builds.vue'
import BuildDetails from "../views/builds/BuildDetails.vue";
import BuildEdit from "../views/builds/BuildEdit.vue";
import BuildNew from "../views/builds/BuildNew.vue";
import BuildImport from "../views/builds/BuildImport.vue";
import MyBuilds from "../views/builds/MyBuilds.vue";
import MyFavorites from "../views/builds/MyFavorites.vue";

import Home from "../views/Home.vue";
import NotFound from "../views/NotFound.vue";
import Privacy from "../views/Privacy.vue";
import About from "../views/About.vue";

import Admin from "../views/Admin.vue";

const routes = [
    {
      path: "/",
      name: "Home",
      component: Home,
      meta: {
        title: "Home - Create and share build orders for Age of Empires IV"
      }
    },
    /*{
      path: "/admin",
      name: "Admin",
      component: Admin,
      meta: {
        title: "Admin Console"
      }
    },*/
    {
      path: "/builds",
      name: "Builds",
      component: Builds,
      meta: {
        title: "All Build Orders - Create and share build orders for Age of Empires IV"
      }
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
      meta: {
        title: "Login"
      }
    },
    {
      path: "/register",
      name: "Register",
      component: Register,
      meta: {
        title: "Register"
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
        title: "View"
      }
    },
    {
      path: "/account",
      name: "Account",
      component: Account,
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
        title: "Edit"
      }
    },
    {
      path: "/mybuilds",
      name: "MyBuilds",
      component: MyBuilds,
      meta: {
        title: "My Build Orders"
      }
    },
    {
      path: "/favorites",
      name: "MyFavorites",
      component: MyFavorites,
      meta: {
        title: "My Favorites"
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
        title: "Create Build Order"
      }
    },
    {
      path: "/import",
      name: "BuildImport",
      component: BuildImport,
      meta: {
        title: "Import Build Order"
      }
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
  });


  router.afterEach(to => {
    if (to.meta.title) {
      document.title = `${to.meta.title}` + " | AoE4 Guides"
    }
  });
  
  export default router;