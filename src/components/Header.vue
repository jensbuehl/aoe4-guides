<template>
  <v-app-bar app height="80">
    <v-container class="fill-height d-flex align-center pr-0">
      <v-app-bar-nav-icon color="primary" class="hidden-md-and-up">
        <v-menu v-if="authIsReady">
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-menu" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item v-if="user" to="/favorites">
              <v-icon class="mr-4">mdi-heart-outline</v-icon>
              Favorites
            </v-list-item>
            <v-list-item v-if="user" to="/mybuilds">
              <v-icon class="mr-4">mdi-playlist-edit</v-icon>
              My Builds
            </v-list-item>
            <v-list-item v-if="!user" to="/register">
              <v-icon class="mr-4">mdi-account-edit</v-icon>
              Register
            </v-list-item>
            <v-list-item v-if="!user" to="/login">
              <v-icon class="mr-4">mdi-login</v-icon>
              Login
            </v-list-item>
            <v-list-item v-if="user" to="/account">
              <v-icon class="mr-4">mdi-account-edit</v-icon>
              Profile
            </v-list-item>
            <v-list-item @click="logout" v-if="user">
              <v-icon class="mr-4">mdi-logout</v-icon>
              Logout
            </v-list-item>
            <v-divider></v-divider>
            <v-list-item to="/new">
              <v-icon class="mr-4" color="primary">mdi-plus</v-icon>
              New Build
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar-nav-icon>

      <v-app-bar-title
        style="cursor: pointer; min-width: 150px"
        @click="$router.push('/')"
      >
        <div
          class="title"
          :style="{
            color: $vuetify.theme.themes.customDarkTheme.colors.primary,
          }"
        >
          {{ title }}
        </div>
      </v-app-bar-title>
      <v-spacer></v-spacer>
      <div v-if="authIsReady" class="hidden-sm-and-down">
        <v-btn
          flat
          to="/new"
          color="primary"
          class="mx-1"
          prepend-icon="mdi-plus"
        >
          New Build
        </v-btn>
        <v-btn
          v-if="user"
          flat
          to="/favorites"
          class="mx-1"
          prepend-icon="mdi-heart-outline"
        >
          Favorites
        </v-btn>
        <v-btn
          v-if="user"
          flat
          to="/mybuilds"
          class="mx-1"
          prepend-icon="mdi-playlist-edit"
        >
          My Builds
        </v-btn>
        <v-btn
          v-if="!user"
          flat
          to="/register"
          class="mx-1"
          prepend-icon="mdi-account-edit"
        >
          Register
        </v-btn>
        <v-btn
          v-if="!user"
          flat
          to="/login"
          class="mx-1"
          prepend-icon="mdi-login"
        >
          Login
        </v-btn>
        <v-btn
          v-if="user"
          flat
          to="/account"
          class="mx-1"
          prepend-icon="mdi-account-edit"
        >
          Profile
        </v-btn>
        <v-btn
          v-if="user"
          flat
          class="mx-1"
          prepend-icon="mdi-logout"
          @click="logout"
        >
          Logout
        </v-btn>
      </div>
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
