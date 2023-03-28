<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-card rounded="lg" style="max-width: 350px; width: 350px" fluid>
        <v-card-title class="mb-4">Register</v-card-title>
        <v-form ref="form" @submit.prevent="register()">
          <v-text-field
            v-model="displayName"
            name="displayName"
            label="Display Name"
            type="text"
            placeholder="Your display name"
            required
          ></v-text-field>

          <v-text-field
            v-model="email"
            name="email"
            label="E-mail"
            type="email"
            placeholder="Your e-mail"
            required
          ></v-text-field>

          <v-text-field
            v-model="password"
            name="password"
            label="Password"
            type="password"
            placeholder="Your password"
            required
          ></v-text-field>
          <v-btn variant="text" color="primary" type="submit" block class="mt-2">Register</v-btn>
        </v-form>
      </v-card>
    </div>
  </v-container>
</template>

<script>
import { ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  name: "Login",
  setup() {
    window.scrollTo(0, 0);
    
    const store = useStore();
    const email = ref("");
    const password = ref("");
    const displayName = ref("");
    const router = useRouter();
    const error = ref(null);

    const register = async () => {
      try {
        await store.dispatch("signup", {
          email: email.value,
          password: password.value,
          displayName: displayName.value
        });
        router.push("/");
      } catch (err) {
        error.value = err.message;
        console.log(error.value)
      }
    };
    return {
      email,
      password,
      displayName,
      router,
      error,
      register
    };
  },
};
</script>
