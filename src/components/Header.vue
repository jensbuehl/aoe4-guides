<template>
  <v-app-bar app height="80">
    <v-container class="fill-height d-flex align-center pr-0">
      <v-app-bar-nav-icon color="primary" class="hidden-md-and-up">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-menu" v-bind="props"></v-btn>
          </template>
          <v-list v-if="authIsReady">
            <v-list-item to="/builds">
              <v-icon class="mr-4" color="primary">mdi-hammer</v-icon>
              All Builds
            </v-list-item>
            <v-list-item v-if="user" to="/favorites">
              <v-icon class="mr-4" color="primary">mdi-heart-outline</v-icon>
              Favorites
            </v-list-item>
            <v-list-item v-if="user" to="/mybuilds">
              <v-icon class="mr-4" color="primary">mdi-playlist-edit</v-icon>
              My Builds
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item to="/new">
              <v-icon class="mr-4" color="primary">mdi-plus</v-icon>
              Create New Build
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar-nav-icon>

      <v-app-bar-title style="min-width: 200px">
        <router-link style="text-decoration: none" to="/">
          <v-btn color="primary" class="title px-0" flat>{{ title }}</v-btn>
        </router-link>
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <span v-if="authIsReady">
        <v-tooltip location="top">
          <span
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Browse and filter all build orders</span
          >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              flat
              to="/builds"
              class="mr-2 hidden-sm-and-down"
              prepend-icon="mdi-hammer"
              color="primary"
            >
              All Builds
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip location="top">
          <span
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Your favorites: Build orders that you have liked</span
          >
          <template v-slot:activator="{ props }">
            <v-btn
              v-if="user"
              v-bind="props"
              color="primary"
              flat
              to="/favorites"
              class="mr-2 hidden-sm-and-down"
              prepend-icon="mdi-heart-outline"
            >
              Favorites
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip location="top">
          <span
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            >Build orders that you have created</span
          >
          <template v-slot:activator="{ props }">
            <v-btn
              v-if="user"
              v-bind="props"
              color="primary"
              flat
              to="/mybuilds"
              class="mr-2 hidden-sm-and-down"
              prepend-icon="mdi-playlist-edit"
            >
              My Builds
            </v-btn>
          </template>
        </v-tooltip>

        <v-menu open-on-hover v-if="authIsReady">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              flat
              color="primary"
              class="mr-2 hidden-sm-and-down"
              prepend-icon="mdi-plus"
              append-icon="mdi-menu-down"
            >
              Add Build
            </v-btn>
          </template>
          <v-list>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                >Create new build order from scratch</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item to="/new" v-bind="props">
                  <v-icon class="mr-4" color="primary">mdi-pencil</v-icon>
                  Create New Build
                </v-list-item>
              </template>
            </v-tooltip>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.themes.customDarkTheme.colors.primary,
                }"
                >Import build order from file (e.g. from overlay tool)</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item to="/import" v-bind="props">
                  <v-icon class="mr-4" color="primary">mdi-import</v-icon>
                  Import Build
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-menu>
        <v-menu open-on-hover class="mx-4">
          <template v-slot:activator="{ props }">
            <v-btn class="mr-2" icon>
              <v-avatar v-if="user" color="primary" v-bind="props" con>{{
                user.displayName.slice(0, 2)
              }}</v-avatar>
              <v-avatar v-if="!user" color="primary" v-bind="props" con>
                <v-icon icon="mdi-account"></v-icon
              ></v-avatar>
            </v-btn>
          </template>
          <v-list v-if="!user">
            <v-list-item>
              <v-label>New Villager?</v-label>
              <v-btn
                size="small"
                class="pb-1"
                color="primary"
                style="background-color: transparent"
                variant="plain"
                to="/register"
              >
                Register now!
              </v-btn>
            </v-list-item>
            <VDivider></VDivider>
            <v-list-item v-if="!user" to="/login">
              <v-icon class="mr-4" color="primary">mdi-login</v-icon>
              Login
            </v-list-item>
          </v-list>
          <v-list v-if="user">
            <v-list-item
              :style="{
                color: $vuetify.theme.themes.customDarkTheme.colors.primary,
              }"
            >
              Logged in as {{ user.displayName }}
            </v-list-item>
            <VDivider></VDivider>
            <v-list-item v-if="user" to="/account">
              <v-icon class="mr-4" color="primary">mdi-account-edit</v-icon>
              Your Profile
            </v-list-item>
            <v-list-item @click="logout">
              <v-icon class="mr-4" color="primary">mdi-logout</v-icon>
              Logout
            </v-list-item>
          </v-list>
        </v-menu>
      </span>
    </v-container>
  </v-app-bar>
</template>

<script>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  name: "Header",
  setup() {
    const title = ref("AoE4 Guides");
    const store = useStore();
    const user = computed(() => store.state.user);
    const error = ref(null);
    const router = useRouter();
    const logout = async () => {
      try {
        await store.dispatch("logout");
        router.push("/");
      } catch (err) {
        error.value = err.message;
        console.log(error.value);
      }
    };

    return {
      title,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      logout,
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
}
</style>
