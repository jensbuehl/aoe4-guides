<template>
  <v-app-bar
    flat
    scroll-threshold="150"
    :scroll-behavior= "(platform.android || platform.ios) ? 'hide' : '' "
    app
    :height="platform.android || platform.ios ? 60 : 100"
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

      <v-app-bar-title style="min-width: 240px">
        <v-row no-gutters class="fill-height" align="center" justify="start">
          <v-col cols="12">
            <v-card to="/" flat width="240">
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
                v-if="!(platform.android || platform.ios)"
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                class="subtitle mb-1"
                >{{ subtitle }}</v-card-subtitle
              >
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
            <v-btn class="mr-2" icon>
              <v-avatar color="accent" v-bind="props">
                <v-img v-if="avatarSrc" :src="avatarSrc" cover />
                <span v-else>{{ avatarInitials }}</span>
              </v-avatar>
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

export default {
  name: "Header",
  setup() {
    const title = ref("AOE4 GUIDES");
    const subtitle = ref("Age of Empires IV Build Orders");
    const store = useStore();
    const user = computed(() => store.state.user);
    const router = useRouter();
    const theme = useTheme();
    const { mobile, platform } = useDisplay();
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
    const { src: avatarSrc, initials: avatarInitials } = useAvatar(userAvatar, user);

    return {
      title,
      subtitle,
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
      avatarInitials,
    };
  },
};
</script>

<style scoped>
.v-container {
  max-width: 1400px !important;
}
.title {
  font-size: 1.5rem;
  font-family: "Segoe UI";
  text-transform: uppercase;
  letter-spacing: 2px;
}
.subtitle {
  font-size: 0.8rem;
  font-family: "Segoe UI";
  text-transform: uppercase;
}
</style>
