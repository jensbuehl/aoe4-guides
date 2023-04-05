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
import MyBuilds from "../views/builds/MyBuilds.vue";
import MyFavorites from "../views/builds/MyFavorites.vue";

import NotFound from "../views/NotFound.vue";
import Privacy from "../views/Privacy.vue";
import About from "../views/About.vue";

const routes = [
    {
      path: "/",
      name: "Home",
      component: Builds,
    },
    {
      path: "/login",
      name: "Login",
      component: Login,
    },
    {
      path: "/register",
      name: "Register",
      component: Register,
    },
    {
      path: "/resetpassword",
      name: "ResetPassword",
      component: ResetPassword,
    },
    {
      path: "/builds/:id",
      name: "BuildDetails",
      component: BuildDetails,
      props: true
    },
    {
      path: "/account",
      name: "Account",
      component: Account,
    },
    {
      path: "/edit/:id",
      name: "BuildEdit",
      component: BuildEdit,
      props: true
    },
    {
      path: "/mybuilds",
      name: "MyBuilds",
      component: MyBuilds
    },
    {
      path: "/favorites",
      name: "MyFavorites",
      component: MyFavorites
    },
    {
      path: "/about",
      name: "About",
      component: About
    },
    {
      path: "/privacy",
      name: "Privacy",
      component: Privacy
    },
    {
      path: "/new",
      name: "BuildNew",
      component: BuildNew
    },
    {
      path: "/:catchAll(.*)",
      name: "NotFound",
      component: NotFound
    }
  ];
  
  const router = createRouter({
    history: createWebHistory(),
    routes,
  });
  
  export default router;