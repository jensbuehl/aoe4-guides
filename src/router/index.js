import { createWebHistory, createRouter } from "vue-router";
import { auth, onAuthStateChanged } from "@/firebase";
import store from "@/store";

// Views are lazy-loaded so each route ships as its own chunk — the initial
// bundle only contains what the landing route needs, not every view (heavy
// editor, admin, account flows) up front.

//account
const Login = () => import("@/views/account/Login.vue");
const Register = () => import("@/views/account/Register.vue");
const Account = () => import("@/views/account/Account.vue");
const AccountAction = () => import("@/views/account/AccountAction.vue");
const ResetPassword = () => import("@/views/account/ResetPassword.vue");
const Unsubscribe = () => import("@/views/account/Unsubscribe.vue");

//builds
const Builds = () => import("@/views/builds/Builds.vue");
const Dashboard = () => import("@/views/builds/Dashboard.vue");
const BuildDetails = () => import("@/views/builds/BuildDetails.vue");
const BuildEditor = () => import("@/views/builds/BuildEditor.vue");
const MyBuilds = () => import("@/views/builds/MyBuilds.vue");
const MyFavorites = () => import("@/views/builds/MyFavorites.vue");

const Home = () => import("@/views/Home.vue");
const NotFound = () => import("@/views/NotFound.vue");
const Privacy = () => import("@/views/Privacy.vue");
const About = () => import("@/views/About.vue");

const Admin = () => import("@/views/Admin.vue");

const SITE_ORIGIN = "https://aoe4guides.com";

// Pages that must never claim to be canonical: auth screens, per-user pages,
// and anything that isn't a real page. Kept in step with public/robots.txt and
// public/sitemap.xml — a URL disallowed there should be absent here too.
const NON_CANONICAL_ROUTES = new Set([
  "Login",
  "Register",
  "ResetPassword",
  "Account",
  "AccountAction",
  "Unsubscribe",
  "MyBuilds",
  "MyFavorites",
  "Admin",
  "NotFound",
]);

/**
 * Points <link rel="canonical"> at the route currently being shown.
 *
 * index.html deliberately ships without a canonical tag: the same file is
 * served for every path, so a static one would declare every build order a
 * duplicate of the homepage. Injecting it here means crawlers that execute
 * JavaScript (Google does) see the right URL, and those that don't see none at
 * all — absent is neutral, wrong is harmful.
 *
 * @param {import("vue-router").RouteLocationNormalized} to - The route navigated to.
 */
function setCanonical(to) {
  let link = document.querySelector('link[rel="canonical"]');

  if (NON_CANONICAL_ROUTES.has(to.name)) {
    link?.remove();
    return;
  }

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  // to.path, not to.fullPath: filter and redirect query strings are different
  // views of the same page, not pages in their own right.
  const path = to.path.length > 1 ? to.path.replace(/\/+$/, "") : "";
  link.setAttribute("href", `${SITE_ORIGIN}/${path.replace(/^\//, "")}`);
}

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
      path: "/account/unsubscribe",
      name: "Unsubscribe",
      component: Unsubscribe,
      meta: {
        title: "Unsubscribe"
      }
    },
    {
      path: "/edit/:id",
      name: "BuildEdit",
      component: BuildEditor,
      props: (route) => ({ mode: "edit", id: route.params.id }),
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
        title: "About AoE4 Guides"
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
      path: "/builds/new",
      name: "BuildNew",
      component: BuildEditor,
      props: () => ({ mode: "new" }),
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

  // With route-level code splitting, each view is a separate hashed chunk that
  // is fetched on demand. When a new version is deployed, the old chunk files
  // are removed — so a tab that was opened *before* the deploy will 404 the
  // moment it navigates to a not-yet-loaded route, and the navigation silently
  // dies. The onError handler below detects that specific failure and
  // hard-reloads; this key guards against a reload loop.
  const CHUNK_RELOAD_KEY = "chunk-reload";

  router.afterEach(to => {
    // A navigation succeeded, so any earlier chunk-load failure is resolved.
    // Clear the one-shot guard so a later deploy in this same session is
    // still handled by the reload logic below.
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);

    if (to.meta.title) {
      document.title = `${to.meta.title}` + " | AOE4 GUIDES"
    }

    setCanonical(to);
  });

  router.onError((error, to) => {
    const isChunkLoadError = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(
      error?.message || ""
    );
    if (!isChunkLoadError) return;

    // Guard against a reload loop: if a reload didn't fix it (e.g. the route
    // genuinely no longer exists, or the user is offline), don't keep looping.
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY)) return;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");

    // Full page load to the intended destination so the browser re-requests
    // index.html and the current chunk graph.
    window.location.assign(to?.fullPath || window.location.href);
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

    // A Google account is verified on arrival but may still be unnamed, and an
    // unnamed author must not reach the editor (spec 032, FR-007b). The dialog
    // is already open asking for the name.
    if (to.meta.requiresVerification && auth.currentUser && store.state.profileIncomplete) {
      store.dispatch("showSnackbar", {
        text: "Please choose a display name first.",
        type: "warning",
      });
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