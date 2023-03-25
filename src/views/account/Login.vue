<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-card rounded="lg" style="max-width: 350px; width: 350px">
        <v-card-title class="mb-4">Login</v-card-title>
        <v-form ref="form" @submit.prevent="login()">
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
          <v-btn
            size="x-small"
            style="background-color: transparent"
            class="ml-2"
            variant="plain"
            to="/resetpassword"
          >
            Forgot Password?
          </v-btn>
          <v-btn type="submit" block class="mt-2 submit">Login</v-btn>
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
    const router = useRouter();
    const error = ref(null);

    const login = async () => {
      try {
        await store.dispatch("signin", {
          email: email.value,
          password: password.value
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
      router,
      error,
      login
    };
  },
};
</script>
