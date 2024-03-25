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
              to="/new"
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
                  to="/new"
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
                >Import build order from file (e.g. from overlay tool)</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  to="/import"
                  v-bind="props"
                >
                  <v-icon class="mr-4" color="accent">mdi-import</v-icon>
                  Import from File
                </v-list-item>
              </template>
            </v-tooltip>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Import build order from clipboard (e.g. from age4builder)</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  :to="{
                    name: 'BuildImport',
                    params: { paste: true },
                  }"
                  v-bind="props"
                >
                  <v-icon class="mr-4" color="accent">mdi-content-paste</v-icon>
                  Import from Clipboard
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-menu>
        <v-menu class="mx-4">
          <template v-slot:activator="{ props }">
            <v-btn class="mr-2" icon>
              <v-avatar
                v-if="user && user.displayName"
                color="accent"
                v-bind="props"
                >{{ user.displayName.slice(0, 2) }}</v-avatar
              >
              <v-avatar v-if="!user?.displayName" color="accent" v-bind="props">
                <v-icon icon="mdi-account"></v-icon
              ></v-avatar>
            </v-btn>
          </template>
          <v-list v-if="!user">
            <v-list-item>
              <span>New Villager?</span>
              <v-btn
                size="small"
                color="primary"
                variant="text"
                style="background-color: transparent"
                to="/register"
              >
                Register now!
              </v-btn>
            </v-list-item>
            <VDivider></VDivider>
            <v-list-item v-if="!user" to="/login">
              <v-icon class="mr-4" color="accent">mdi-login</v-icon>
              Login
            </v-list-item>
          </v-list>
          <v-list v-if="user">
            <v-list-item
              :style="{
                color: $vuetify.theme.current.colors.primary,
              }"
            >
              Logged in as {{ user.displayName }}
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
import { useDisplay } from "vuetify";

export default {
  name: "Header",
  setup() {
    const title = ref("AOE4 GUIDES");
    const subtitle = ref("Age of Empires IV Build Orders");
    const store = useStore();
    const user = computed(() => store.state.user);
    const router = useRouter();
    const { mobile, platform } = useDisplay();
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
        console.log(err.message);
      }
    };

    onMounted(() => {
      console.log("mobile", mobile.value);
      console.log("platform", platform.value);
    });

    return {
      title,
      subtitle,
      user,
      showBottomNavigation: computed(() => store.state.showBottomNavigation),
      authIsReady: computed(() => store.state.authIsReady),
      logout,
      platform,
      mobile,
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
