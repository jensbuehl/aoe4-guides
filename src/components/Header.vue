<template>
  <!-- Both bars are drawn in the dark theme whatever the site's theme is, as
       ageofempires.com keeps its chrome dark slate with a gold rule over light
       content. The menus and tooltips they open inherit it, so the whole header
       reads as one piece. Inline colours read `chrome`, never
       $vuetify.theme.current: that is the global theme, and in light mode it
       would write slate text on the dark bar. -->
  <v-app-bar
    theme="customDarkTheme"
    flat
    app
    :height="compact ? 60 : 100"
    :style="{
      borderBottom: '2px solid ' + chrome.accent,
      transform: barHidden ? 'translateY(-100%)' : undefined,
    }"
  >
    <v-container class="fill-height d-flex align-center my-0 py-0">
      <v-app-bar-nav-icon
        color="accent"
        class="hidden-md-and-up"
        v-if="!(platform.android || platform.ios)"
      >
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-menu" v-bind="props"></v-btn>
          </template>
          <v-list v-if="authIsReady">
            <v-list-item
              :style="'color: ' + chrome.primary"
              @click="openSearch"
            >
              <v-icon class="mr-4" color="accent">mdi-magnify</v-icon>
              Search
            </v-list-item>
            <v-list-item
              :style="'color: ' + chrome.primary"
              to="/builds"
            >
              <v-icon class="mr-4" color="accent">mdi-hammer</v-icon>
              All Builds
            </v-list-item>
            <v-list-item
              :style="'color: ' + chrome.primary"
              v-if="user"
              to="/favorites"
            >
              <v-icon class="mr-4" color="accent">mdi-heart-outline</v-icon>
              Favorites
            </v-list-item>
            <v-list-item
              :style="'color: ' + chrome.primary"
              v-if="user"
              to="/mybuilds"
            >
              <v-icon class="mr-4" color="accent">mdi-playlist-edit</v-icon>
              My Builds
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item
              :style="'color: ' + chrome.primary"
              to="/builds/new"
            >
              <v-icon class="mr-4" color="accent">mdi-plus</v-icon>
              Create New Build Order
            </v-list-item>
            <v-list-item
              :style="'color: ' + chrome.primary"
              @click="openImportDialog"
            >
              <v-icon class="mr-4" color="accent">mdi-tray-arrow-down</v-icon>
              Import Build Order
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar-nav-icon>

      <v-app-bar-title :style="{ minWidth: compact ? 'fit-content' : '300px' }">
        <v-row no-gutters class="fill-height" align="center" justify="start">
          <v-col cols="12">
            <v-card
              to="/"
              flat
              class="header-brand d-flex align-center"
              :class="{ 'header-brand--compact': compact }"
            >
              <!-- The app icon, so the header and the browser tab are visibly the
                   same site. Decorative: the name beside it is the link text. -->
              <img
                src="/android-chrome-192x192.png"
                alt=""
                class="header-mark"
                width="40"
                height="40"
              />
              <div>
              <!-- One title for every platform. iOS and Android used to get a copy
                   with mt-1, a shift for system fonts rendering differently there.
                   The name is now a self-hosted face that renders alike everywhere,
                   and beside a centred mark that shift put the text 2px low. -->
              <v-card-title
                :style="{
                  color: chrome.primary,
                }"
                class="title my-0 py-0"
                >{{ title }}</v-card-title
              >
              <v-card-subtitle
                v-if="!mobile && !(platform.android || platform.ios)"
                :style="{
                  color: chrome.primary,
                }"
                class="subtitle mb-2"
                >{{ subtitle }}</v-card-subtitle
              >
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <!-- Never shrinks: as a plain inline span it gave way first when the bar
           got tight, and at 375px and below the avatar wrapped onto a second
           line under the bar. The wordmark scales down instead. -->
      <span v-if="authIsReady" class="d-flex align-center flex-shrink-0">
        <!-- Build search (spec 043). Where it lives depends on room, measured:
             - lg and up: a field-like pill, "Search builds…" and the shortcut.
             - md: a bare magnifier. The bar is full there when signed in (four
               nav buttons and the avatar end exactly at the edge), which is
               why Add Build turns into a "+" below lg.
             - below md: not in this bar at all. At 360px production leaves
               ~18px beside the wordmark, and this container wraps, so any
               extra button drops the whole group onto a second line. Phones
               get Search in the bottom navigation, narrow desktop windows in
               the menu above. -->
        <v-btn
          variant="flat"
          rounded="pill"
          class="search-trigger mr-3 hidden-md-and-down"
          aria-label="Search builds, authors and civilizations"
          :aria-keyshortcuts="shortcutAria"
          @click="openSearch"
        >
          <v-icon color="accent" class="mr-2">mdi-magnify</v-icon>
          <span class="search-trigger-label" :style="{ color: chrome.primary }">Search builds…</span>
          <span class="search-trigger-key ml-6" :style="{ color: chrome.primary }" aria-hidden="true">{{
            shortcutLabel
          }}</span>
        </v-btn>
        <v-btn
          icon
          color="accent"
          class="mr-1 hidden-sm-and-down hidden-lg-and-up"
          aria-label="Search builds, authors and civilizations"
          @click="openSearch"
        >
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
        <v-tooltip location="top">
          <span
            :style="{
              color: chrome.primary,
            }"
            >Browse and filter all build orders</span
          >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              to="/builds"
              class="mr-2 hidden-sm-and-down"
              color="primary"
            >
              <template v-slot:prepend>
                <v-icon color="accent">mdi-hammer</v-icon>
              </template>
              All Builds
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip location="top">
          <span
            :style="{
              color: chrome.primary,
            }"
            >Your favorites: Build orders that you have liked</span
          >
          <template v-slot:activator="{ props }">
            <v-btn
              v-if="user"
              v-bind="props"
              color="primary"
              to="/favorites"
              class="mr-2 hidden-sm-and-down"
            >
              <template v-slot:prepend>
                <v-icon color="accent">mdi-heart-outline</v-icon>
              </template>
              Favorites
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip location="top">
          <span
            :style="{
              color: chrome.primary,
            }"
            >Build orders that you have created</span
          >
          <template v-slot:activator="{ props }">
            <v-btn
              v-if="user"
              v-bind="props"
              color="primary"
              to="/mybuilds"
              class="mr-2 hidden-sm-and-down"
            >
              <template v-slot:prepend>
                <v-icon color="accent">mdi-playlist-edit</v-icon>
              </template>
              My Builds
            </v-btn>
          </template>
        </v-tooltip>

        <v-menu>
          <template v-slot:activator="{ props }">
            <!-- Just "+ ▾" below lg: that frees the room the search icon
                 needs at md when signed in. Same menu either way. -->
            <v-btn
              v-bind="props"
              color="primary"
              class="mr-2 hidden-sm-and-down"
              append-icon="mdi-menu-down"
              :aria-label="lgAndUp ? undefined : 'Add build'"
              :title="lgAndUp ? undefined : 'Add build'"
            >
              <template v-slot:prepend>
                <v-icon color="accent">mdi-plus</v-icon>
              </template>
              <template v-if="lgAndUp">Add Build</template>
            </v-btn>
          </template>
          <v-list>
            <v-tooltip>
              <span
                :style="{
                  color: chrome.primary,
                }"
                >Create new build order from scratch</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + chrome.primary"
                  to="/builds/new"
                  v-bind="props"
                >
                  <v-icon class="mr-4" color="accent">mdi-pencil</v-icon>
                  Create New Build Order
                </v-list-item>
              </template>
            </v-tooltip>
            <v-tooltip>
              <span
                :style="{
                  color: chrome.primary,
                }"
                >Import a build order from file or clipboard</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + chrome.primary"
                  v-bind="props"
                  @click="openImportDialog"
                >
                  <v-icon class="mr-4" color="accent">mdi-tray-arrow-down</v-icon>
                  Import Build Order
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-menu>
        <v-menu class="mx-4">
          <template v-slot:activator="{ props }">
            <v-btn class="mr-2" icon v-bind="props">
              <UserAvatar
                :src="avatarSrc"
                :name="user?.displayName"
                :loading="avatarLoading"
              />
            </v-btn>
          </template>
          <v-list v-if="!user">
            <v-list-item>
              <v-btn
                variant="text"
                color="primary"
                prepend-icon="mdi-login"
                @click="openAuthDialog"
              >
                Log in
              </v-btn>
            </v-list-item>
            <VDivider color="surface-variant"></VDivider>
            <v-list-item class="d-flex justify-center px-4 pt-4 pb-2">
              <v-btn-toggle
                v-model="mode"
                variant="tonal"
                density="compact"
                style="width: 100%; max-width: 280px;"
              >
                <v-btn value="system" color="primary" title="System">
                  <v-icon>mdi-monitor</v-icon>
                </v-btn>
                <v-btn value="light" color="primary" title="Light">
                  <v-icon>mdi-white-balance-sunny</v-icon>
                </v-btn>
                <v-btn value="dark" color="primary" title="Dark">
                  <v-icon>mdi-weather-night</v-icon>
                </v-btn>
              </v-btn-toggle>
            </v-list-item>
          </v-list>
          <v-list v-if="user">
            <v-list-item class="d-flex align-center pb-3">
              <v-list-item-content>
                <span class="text-body-2">
                  Logged in as {{ user.displayName }}
                </span>
              </v-list-item-content>
            </v-list-item>
            <VDivider></VDivider>
            <v-list-item
              :style="'color: ' + chrome.primary"
              v-if="user"
              to="/account"
            >
              <v-icon class="mr-4" color="accent">mdi-account-edit</v-icon>
              Your Profile
            </v-list-item>
            <v-list-item
              :style="'color: ' + chrome.primary"
              @click="logout"
            >
              <v-icon class="mr-4" color="accent">mdi-logout</v-icon>
              Logout
            </v-list-item>
            <VDivider color="surface-variant"></VDivider>
            <v-list-item class="d-flex justify-center px-4 pt-4 pb-2">
              <v-btn-toggle
                v-model="mode"
                variant="tonal"
                density="compact"
                style="width: 100%; max-width: 280px;"
              >
                <v-btn value="system" color="primary" title="System">
                  <v-icon>mdi-monitor</v-icon>
                </v-btn>
                <v-btn value="light" color="primary" title="Light">
                  <v-icon>mdi-white-balance-sunny</v-icon>
                </v-btn>
                <v-btn value="dark" color="primary" title="Dark">
                  <v-icon>mdi-weather-night</v-icon>
                </v-btn>
              </v-btn-toggle>
            </v-list-item>
          </v-list>
        </v-menu>
      </span>
    </v-container>
  </v-app-bar>

  <!-- Mounted on the first open only, so its chunk (and the index it loads)
       stays out of every visit that never searches. -->
  <SearchDialog v-if="searchMounted" v-model="searchOpen" @open="openSearchResult" />

  <!-- A provider rather than the `theme` prop, which VBottomNavigation declares
       but ignores (Vuetify 3.8: it calls useTheme(), not provideTheme(props)),
       so the bar came out in the light theme with gold labels on ivory. Without
       `with-background` the provider renders no element of its own, so the
       layout still sees the navigation directly. -->
  <v-theme-provider theme="customDarkTheme">
  <v-bottom-navigation
    hide-on-scroll
    grow
    class="phone-nav"
    scroll-target="#main-content"
    :active="showBottomNavigation"
    :style="'border-top: 2px solid ' + chrome.accent"
    v-if="mobile && (platform.android || platform.ios)"
  >
    <v-btn to="/" color="primary">
      <template v-slot:prepend>
        <v-icon color="accent">mdi-home</v-icon>
      </template>
      <span :style="'color: ' + chrome.primary"
        >Home</span
      >
    </v-btn>

    <v-btn to="/builds" color="primary">
      <template v-slot:prepend>
        <v-icon color="accent">mdi-hammer</v-icon>
      </template>
      <span :style="'color: ' + chrome.primary"
        >All Builds</span
      >
    </v-btn>

    <!-- Build search (spec 043): on phones it lives here, not in the top bar,
         which has no room beside the wordmark. Not a route, so never active. -->
    <v-btn color="primary" :active="false" @click="openSearch">
      <template v-slot:prepend>
        <v-icon color="accent">mdi-magnify</v-icon>
      </template>
      <span :style="'color: ' + chrome.primary"
        >Search</span
      >
    </v-btn>

    <v-btn v-if="user" color="primary" to="/favorites">
      <template v-slot:prepend>
        <v-icon color="accent">mdi-heart-outline</v-icon>
      </template>
      <span :style="'color: ' + chrome.primary"
        >Favorites</span
      >
    </v-btn>

    <v-btn v-if="user" color="primary" to="/mybuilds">
      <template v-slot:prepend>
        <v-icon color="accent">mdi-playlist-edit</v-icon>
      </template>
      <span :style="'color: ' + chrome.primary"
        >My Builds</span
      >
    </v-btn>
  </v-bottom-navigation>
  </v-theme-provider>
</template>

<script>
//External
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import { useDisplay, useTheme } from "vuetify";
import {
  applyVuetifyTheme,
  getSavedTheme,
  setSavedTheme,
  clearSavedTheme,
} from "@/composables/useThemePreference";
import { useAvatar } from "@/composables/auth/useAvatar";
import UserAvatar from "@/components/common/UserAvatar.vue";
import { useOverlayHistory } from "@/composables/useOverlayHistory.js";

// Its own chunk: only a visit that opens search downloads it (spec 043, SC-006).
const SearchDialog = defineAsyncComponent(() => import("@/components/search/SearchDialog.vue"));

/**
 * Whether a key press came from somewhere the reader is typing. The build editor
 * is made of contenteditable step fields, and "/" is a character authors type,
 * so the search shortcut must never fire there.
 *
 * @param {EventTarget|null} target
 * @return {boolean}
 */
function isTyping(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/**
 * Scroll offset in px below which the phone's navigation is always shown: the
 * top bar here, and the bottom navigation a build page hid by swiping
 * (BuildDetails.vue). One line for both, so the two bars return together.
 */
export const HIDE_AFTER = 150;

/**
 * Whether the phone's top bar has slid away. Module state rather than the
 * Header's own, so a sticky element under the bar (FilterConfig's toolbar) can
 * leave and return with it instead of hanging below an empty band.
 */
export const appBarHidden = ref(false);

/**
 * Lets another component open build search (spec 043), e.g. the Home news card.
 * Module state for the same reason as appBarHidden: the Header owns the dialog
 * and its history entry, so others ask rather than open one of their own.
 */
const searchRequests = ref(0);
export const requestSearch = () => searchRequests.value++;

export default {
  name: "Header",
  components: { UserAvatar, SearchDialog },
  setup() {
    const title = ref("AOE4 GUIDES");
    const subtitle = ref("Age of Empires IV Build Orders");
    const store = useStore();
    const user = computed(() => store.state.user);
    const router = useRouter();
    const route = useRoute();
    const theme = useTheme();
    // The dark theme's colours, which both bars use in either theme
    const chrome = computed(() => theme.themes.value.customDarkTheme.colors);
    const { mobile, platform, lgAndUp } = useDisplay();
    // The 60px bar, as opposed to the 100px one; the mark shrinks with it.
    const compact = computed(() => platform.value.android || platform.value.ios || mobile.value);
    // Through the guarded helpers: blocked site data makes `localStorage`
    // itself throw, and this runs in the first render.
    const savedMode = ref(getSavedTheme() || "system");

    const mode = computed({
      get: () => savedMode.value,
      set: (newMode) => {
        if (newMode === "system") {
          clearSavedTheme();
          applyVuetifyTheme(
            theme,
            window.matchMedia("(prefers-color-scheme: dark)").matches
          );
        } else {
          setSavedTheme(newMode);
          applyVuetifyTheme(theme, newMode === "dark");
        }
        savedMode.value = newMode;
      },
    });

    const logout = async () => {
      try {
        await store.dispatch("logout");
        store.dispatch("showSnackbar", {
          text: `Logged out successfully!`,
          type: "success",
        });
        router.push("/");
      } catch (err) {
        await store.dispatch("showSnackbar", {
          text: err.message,
          type: "error",
        });
        console.error(err.message);
      }
    };

    // On phones the bar slides away while scrolling down and returns on the way
    // up. This is done here rather than with Vuetify's scroll-behavior="hide",
    // because a hidden layout item counts as size 0 (composables/layout.js), so
    // v-main's padding-top collapsed with the bar and every build order moved
    // 60px under the reader's finger. The bar stays active and keeps its space
    // reserved at the top of the page; hiding it is only a transform, which our
    // style overrides because VAppBar applies props.style after its own.
    const barHidden = appBarHidden;
    let lastScroll = 0;
    let lastScrollHeight = 0;
    const onScroll = () => {
      const root = document.documentElement;
      // Clamped, so iOS rubber-banding past either end does not read as a
      // change of direction.
      const scroll = Math.min(
        Math.max(window.scrollY, 0),
        root.scrollHeight - window.innerHeight
      );
      // Content that grew or shrank (lazy lists, images) moved the scroll
      // position without the reader doing anything; take the new baseline.
      if (root.scrollHeight !== lastScrollHeight) {
        lastScrollHeight = root.scrollHeight;
      } else if (scroll < HIDE_AFTER) {
        barHidden.value = false;
      } else if (scroll !== lastScroll) {
        barHidden.value = scroll > lastScroll;
      }
      lastScroll = scroll;
    };

    // A new page arrives with the bar shown. The scroll to the top that comes
    // with it does not bring the bar back by itself: the new page's height
    // differs, so the handler only takes a new baseline, and the bar would stay
    // hidden over an empty band until the reader scrolled again. Keyed on the
    // path like `<router-view>`, so a query change on the same page is not one.
    watch(
      () => route.path,
      () => {
        barHidden.value = false;
      }
    );

    onMounted(() => {
      if (platform.value.android || platform.value.ios) {
        window.addEventListener("scroll", onScroll, { passive: true });
      }
    });
    onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));

    // Build search. The header owns its open state because the header is where
    // it opens, and so it also owns the history entry that lets Back close it.
    const searchOpen = ref(false);
    const searchMounted = ref(false);
    const { open: openOverlay, closeThen } = useOverlayHistory(searchOpen, "search");
    const openSearch = () => {
      searchMounted.value = true;
      openOverlay();
    };
    watch(searchRequests, () => openSearch());
    // Navigate only after the dialog's history entry is gone; pushed sooner,
    // the asynchronous step back would undo the navigation.
    const openSearchResult = (to) => closeThen(() => router.push(to));

    // Ctrl+K (⌘K on a Mac) is the advertised shortcut: K is the same key on
    // every layout. "/" also works but is not shown, because on a German
    // keyboard it is Shift+7. Shift is therefore NOT a reason to ignore "/":
    // `event.key` is already the character the layout produced, and an earlier
    // version that ignored Shift made "/" unreachable on German keyboards.
    const isMac = /Mac|iPhone|iPad/.test(navigator.userAgentData?.platform ?? navigator.platform ?? "");
    const shortcutLabel = isMac ? "⌘K" : "Ctrl K";
    const shortcutAria = isMac ? "Meta+K /" : "Control+K /";
    const onSearchShortcut = (event) => {
      if (searchOpen.value || isTyping(event.target) || event.altKey) return;
      const slash = event.key === "/" && !event.ctrlKey && !event.metaKey;
      const ctrlK = event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey) && !event.shiftKey;
      if (!slash && !ctrlK) return;
      event.preventDefault();
      openSearch();
    };
    onMounted(() => window.addEventListener("keydown", onSearchShortcut));
    onBeforeUnmount(() => window.removeEventListener("keydown", onSearchShortcut));

    const openAuthDialog = () => store.dispatch("openAuthDialog", { mode: "login" });
    const openImportDialog = () => store.dispatch("openImportDialog");

    const userAvatar = computed(() => store.state.userAvatar);
    const { src: avatarSrc, loading: avatarLoading } = useAvatar(userAvatar);

    return {
      title,
      subtitle,
      chrome,
      compact,
      barHidden,
      user,
      showBottomNavigation: computed(() => store.state.showBottomNavigation),
      authIsReady: computed(() => store.state.authIsReady),
      logout,
      platform,
      mobile,
      mode,
      openAuthDialog,
      openImportDialog,
      avatarSrc,
      avatarLoading,
      lgAndUp,
      shortcutLabel,
      shortcutAria,
      searchOpen,
      searchMounted,
      openSearch,
      openSearchResult,
    };
  },
};
</script>

<style scoped>
/* The bar's width is the site-wide container width (assets/main.css), so the
   logo and the avatar stand on the same edges as every page's content. */
/* The tile's navy is the dark bar's navy, so without the ring only the gold
   letters show and the mark reads as stray text. The radius follows the
   tile's own rounded corners.

   Edge to edge with the drawn text, not the boxes: with EB Garamond loaded
   the ink runs 30px to 70px down the 100px bar (pixel scan), so the tile is
   40px and spans exactly that. Deliberately not inset for optical effect;
   the edges are meant to line up. A different title face, size or tagline
   gap moves both edges, so re-measure rather than adjust. */
/* The link card is what the hover overlay fills, so it hugs its content and
   frames the mark with the same 12px on every side: 12px margin on the left,
   and the text block's empty space above the name matched by the tagline's
   bottom margin (mb-2) below. That symmetry is also what lets plain centring
   put the mark on the ink, with no nudge. */
.header-brand {
  width: fit-content;
}
/* Five items signed in (with Search, spec 043). Vuetify gives each bar button
   min-width 80px and 12px side padding, so five overflowed 360px on both sides;
   four had filled it exactly. With `grow` they share the width, and the
   narrower padding leaves "All Builds" room at 72px each. The selector mirrors
   Vuetify's own min-width rule; written as plain `.v-btn` it tied on
   specificity and lost to that rule's later position. */
.phone-nav :deep(.v-bottom-navigation__content > .v-btn) {
  min-width: 0;
  padding: 0 4px;
}
/* Reads as a field in the dark bar, not as one more nav button: a pill like
   the site's other search fields, a faint fill of the chrome's own text colour
   instead of a gold outline, sentence case and normal tracking. */
.search-trigger {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
  background: rgba(255, 255, 255, 0.08) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}
.search-trigger:hover {
  background: rgba(255, 255, 255, 0.13) !important;
}
.search-trigger-label {
  opacity: 0.85;
}
/* The shortcut as quiet text, not a boxed key: boxed, a lone "/" read as an
   empty checkbox. */
.search-trigger-key {
  font-size: 0.75rem;
  opacity: 0.55;
}
/* 11.5px, not Vuetify's 16px: the tracking after the last letter and the
   glyph's side bearing add about 4.5px of their own, and this lands the drawn
   text 12px from the card's right edge like the other three sides. */
.header-brand .title,
.header-brand .subtitle {
  padding-right: 11.5px;
}
/* The ring sits outside the image, which is 2px smaller than its slot and
   centred in it by a 1px margin. So the ring's outer edge is where the slot's
   edge is and still meets the text, but no longer lies over the tile's own
   edge right beside the monogram, whose letters nearly fill it. Drawn inside,
   it looked cramped. A stopgap until the mark itself is reworked: a CSS
   "BO" in EB Garamond was tried and rejected, because it is not the icon's
   lettering. */
.header-mark {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  margin: 1px 1px 1px 13px;
  border-radius: 5px;
  box-shadow: 0 0 0 1px rgba(var(--v-theme-accent), 0.55);
}
/* The compact 60px bar (phones, and desktop below 1280px): one line, no
   tagline, so the mark is centred on the name instead of spanning two lines.
   Everything is in em of the card's font size, which scales with the viewport
   from 1.1rem up to the full bar's 1.65rem. The bar's fixed parts (container
   padding, menu icon, avatar) take about 136px, and the lockup is about 9.75em
   wide, which is where 10vw - 14px comes from: it still fits at 320px and
   reaches full size near 400px. The hover frame is 0.3em on every side, so it
   stays even at every size. The right padding is 0.085em less, because the
   tracking after the last letter and its side bearing already leave that much. */
.header-brand--compact {
  font-size: clamp(1.1rem, 10vw - 14px, 1.65rem);
  padding: 0 0.215em 0 0.3em;
}
.header-brand--compact .header-mark {
  width: calc(1.2em - 2px);
  height: calc(1.2em - 2px);
  margin: 1px;
  border-radius: calc(0.15em - 1px);
}
.header-brand--compact .title {
  font-size: 1em;
  line-height: 1.8em;
  letter-spacing: 0.057em;
  padding: 0 0 0 0.45em;
  white-space: nowrap;
}
/* The name is set in EB Garamond, the same classical serif voice as the BO
   monogram beside it, and self-hosted (main.js) so it looks the same on every
   platform. The tagline stays a UI sans, which reads better small. Segoe UI is
   not a web font and cannot be served, so it exists only on Windows; the
   fallbacks are each platform's own UI face. Brand.vue restates both. */
.title {
  font-size: 1.65rem;
  font-family: "EB Garamond", Georgia, "Times New Roman", serif;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}
.subtitle {
  font-size: 0.8rem;
  font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif;
  text-transform: uppercase;
  /* Pulls the tagline up under the name: 12px between their ink instead of
     16px. The mark above is sized to the result, so change both together. */
  margin-top: -4px;
}
</style>
