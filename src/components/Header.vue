<template>
  <v-app-bar
    flat
    scroll-threshold="150"
    :scroll-behavior= "(platform.android || platform.ios) ? 'hide' : '' "
    app
    :height="compact ? 60 : 100"
    :style="'border-bottom: 2px solid ' + $vuetify.theme.current.colors.accent"
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
              :style="'color: ' + $vuetify.theme.current.colors.primary"
              to="/builds"
            >
              <v-icon class="mr-4" color="accent">mdi-hammer</v-icon>
              All Builds
            </v-list-item>
            <v-list-item
              :style="'color: ' + $vuetify.theme.current.colors.primary"
              v-if="user"
              to="/favorites"
            >
              <v-icon class="mr-4" color="accent">mdi-heart-outline</v-icon>
              Favorites
            </v-list-item>
            <v-list-item
              :style="'color: ' + $vuetify.theme.current.colors.primary"
              v-if="user"
              to="/mybuilds"
            >
              <v-icon class="mr-4" color="accent">mdi-playlist-edit</v-icon>
              My Builds
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item
              :style="'color: ' + $vuetify.theme.current.colors.primary"
              to="/builds/new"
            >
              <v-icon class="mr-4" color="accent">mdi-plus</v-icon>
              Create New Build Order
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar-nav-icon>

      <v-app-bar-title :style="{ minWidth: compact ? '240px' : '300px' }">
        <v-row no-gutters class="fill-height" align="center" justify="start">
          <v-col cols="12">
            <v-card to="/" flat :width="compact ? 240 : undefined" class="d-flex align-center" :class="{ 'header-brand': !compact }">
              <!-- The app icon, so the header and the browser tab are visibly the
                   same site. Decorative: the name beside it is the link text.
                   Full bar only: at 375px the compact bar has no 56px to spare
                   beside the menu and avatar, and the title wraps out of it. -->
              <img
                v-if="!compact"
                src="/android-chrome-192x192.png"
                alt=""
                class="header-mark"
                width="40"
                height="40"
              />
              <div>
              <!--xs has other padding to compensate for rendering difference between mobile browser and desktop browser-->
              <v-card-title
                v-if="!(platform.android || platform.ios)"
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                class="title my-0 py-0"
                >{{ title }}</v-card-title
              >
              <v-card-title
                v-if="platform.android || platform.ios"
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                class="title mb-0 mt-1 pb-0 pt-0"
                >{{ title }}</v-card-title
              >
              <v-card-subtitle
                v-if="!mobile && !(platform.android || platform.ios)"
                :style="{
                  color: $vuetify.theme.current.colors.primary,
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
      <span v-if="authIsReady">
        <v-tooltip location="top">
          <span
            :style="{
              color: $vuetify.theme.current.colors.primary,
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
              color: $vuetify.theme.current.colors.primary,
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
              color: $vuetify.theme.current.colors.primary,
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
            <v-btn
              v-bind="props"
              color="primary"
              class="mr-2 hidden-sm-and-down"
              append-icon="mdi-menu-down"
            >
              <template v-slot:prepend>
                <v-icon color="accent">mdi-plus</v-icon>
              </template>
              Add Build
            </v-btn>
          </template>
          <v-list>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Create new build order from scratch</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
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
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Import a build order from file or clipboard</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
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
              :style="'color: ' + $vuetify.theme.current.colors.primary"
              v-if="user"
              to="/account"
            >
              <v-icon class="mr-4" color="accent">mdi-account-edit</v-icon>
              Your Profile
            </v-list-item>
            <v-list-item
              :style="'color: ' + $vuetify.theme.current.colors.primary"
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

  <v-bottom-navigation
    hide-on-scroll
    scroll-target="#main-content"
    :active="showBottomNavigation"
    :style="'border-top: 2px solid ' + $vuetify.theme.current.colors.accent"
    v-if="mobile && (platform.android || platform.ios)"
  >
    <v-btn to="/" color="primary">
      <template v-slot:prepend>
        <v-icon color="accent">mdi-home</v-icon>
      </template>
      <span :style="'color: ' + $vuetify.theme.current.colors.primary"
        >Home</span
      >
    </v-btn>

    <v-btn to="/builds" color="primary">
      <template v-slot:prepend>
        <v-icon color="accent">mdi-hammer</v-icon>
      </template>
      <span :style="'color: ' + $vuetify.theme.current.colors.primary"
        >All Builds</span
      >
    </v-btn>

    <v-btn v-if="user" color="primary" to="/favorites">
      <template v-slot:prepend>
        <v-icon color="accent">mdi-heart-outline</v-icon>
      </template>
      <span :style="'color: ' + $vuetify.theme.current.colors.primary"
        >Favorites</span
      >
    </v-btn>

    <v-btn v-if="user" color="primary" to="/mybuilds">
      <template v-slot:prepend>
        <v-icon color="accent">mdi-playlist-edit</v-icon>
      </template>
      <span :style="'color: ' + $vuetify.theme.current.colors.primary"
        >My Builds</span
      >
    </v-btn>
  </v-bottom-navigation>
</template>

<script>
//External
import { ref, computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { useDisplay, useTheme } from "vuetify";
import {
  applyVuetifyTheme,
  THEME_STORAGE_KEY,
} from "@/composables/useThemePreference";
import { useAvatar } from "@/composables/auth/useAvatar";
import UserAvatar from "@/components/common/UserAvatar.vue";

export default {
  name: "Header",
  components: { UserAvatar },
  setup() {
    const title = ref("AOE4 GUIDES");
    const subtitle = ref("Age of Empires IV Build Orders");
    const store = useStore();
    const user = computed(() => store.state.user);
    const router = useRouter();
    const theme = useTheme();
    const { mobile, platform } = useDisplay();
    // The 60px bar, as opposed to the 100px one; the mark shrinks with it.
    const compact = computed(() => platform.value.android || platform.value.ios || mobile.value);
    const savedMode = ref(localStorage.getItem(THEME_STORAGE_KEY) || "system");

    const mode = computed({
      get: () => savedMode.value,
      set: (newMode) => {
        if (newMode === "system") {
          localStorage.removeItem(THEME_STORAGE_KEY);
          applyVuetifyTheme(
            theme,
            window.matchMedia("(prefers-color-scheme: dark)").matches
          );
        } else {
          localStorage.setItem(THEME_STORAGE_KEY, newMode);
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

    onMounted(() => {});

    const openAuthDialog = () => store.dispatch("openAuthDialog", { mode: "login" });
    const openImportDialog = () => store.dispatch("openImportDialog");

    const userAvatar = computed(() => store.state.userAvatar);
    const { src: avatarSrc, loading: avatarLoading } = useAvatar(userAvatar);

    return {
      title,
      subtitle,
      compact,
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
    };
  },
};
</script>

<style scoped>
.v-container {
  max-width: 1400px !important;
}
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
/* 11.5px, not Vuetify's 16px: the tracking after the last letter and the
   glyph's side bearing add about 4.5px of their own, and this lands the drawn
   text 12px from the card's right edge like the other three sides. */
.header-brand .title,
.header-brand .subtitle {
  padding-right: 11.5px;
}
.header-mark {
  flex-shrink: 0;
  margin-left: 12px;
  border-radius: 6px;
  /* Inside the edge, not a box-shadow ring: a ring outside adds a pixel at
     each end and the mark visibly overshoots the text it was sized to. */
  outline: 1px solid rgba(var(--v-theme-accent), 0.55);
  outline-offset: -1px;
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
