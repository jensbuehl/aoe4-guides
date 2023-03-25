<template>
  <v-app-bar app height="80">
    <v-container class="fill-height d-flex align-center pr-0">
      <v-app-bar-nav-icon class="hidden-md-and-up">
        <v-menu v-if="authIsReady">
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-menu" v-bind="props"></v-btn>
          </template>
          <v-list>
            <v-list-item to="/builds">
              <v-list-item-icon class="pr-5">
                <v-icon>mdi-home</v-icon>
              </v-list-item-icon>
              <v-list-item-content> Home </v-list-item-content>
            </v-list-item>
            <v-list-item to="/new">
              <v-list-item-icon class="pr-5">
                <v-icon>mdi-plus</v-icon>
              </v-list-item-icon>
              <v-list-item-content> New Build </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="user" to="/mybuilds">
              <v-list-item-icon class="pr-5">
                <v-icon>mdi-playlist-edit</v-icon>
              </v-list-item-icon>
              <v-list-item-content> My Builds </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="!user" to="/register">
              <v-list-item-icon class="pr-5">
                <v-icon>mdi-account-edit</v-icon>
              </v-list-item-icon>
              <v-list-item-content> Register </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="!user" to="/login">
              <v-list-item-icon class="pr-5">
                <v-icon>mdi-login</v-icon>
              </v-list-item-icon>
              <v-list-item-content> Login </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="user" to="/logout">
              <v-list-item-icon class="pr-5">
                <v-icon>mdi-logout</v-icon>
              </v-list-item-icon>
              <v-list-item-content> Logout </v-list-item-content>
            </v-list-item>
            <v-list-item v-if="user" to="/account">
              <v-list-item-icon class="pr-5">
                <v-icon>mdi-account-edit</v-icon>
              </v-list-item-icon>
              <v-list-item-content> Profile </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-app-bar-nav-icon>

      <v-app-bar-title
        style="cursor: pointer; min-width: 350px"
        @click="$router.push('/')"
      >
      <div class="title" :style="{color: $vuetify.theme.themes.customDarkTheme.colors.primary}">{{ title }}</div>

      </v-app-bar-title>
      <v-spacer></v-spacer>
      <v-app-bar-items v-if="authIsReady" class="hidden-sm-and-down">
        <v-btn flat to="/builds" class="mx-1" prepend-icon="mdi-home">
          Home
        </v-btn>
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
          to="/"
          class="mx-1"
          prepend-icon="mdi-logout"
          @click="logout"
        >
          Logout
        </v-btn>
        <v-btn
          class="mx-1"
          flat
          onclick="location.href='https://paypal.me/jensbuehl'"
        >
          <template v-slot:prepend>
            <v-icon color="red">mdi-heart</v-icon>
          </template>
          Support Us
        </v-btn>
      </v-app-bar-items>
    </v-container>
  </v-app-bar>
</template>

<script>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  name: "AppBar",
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
