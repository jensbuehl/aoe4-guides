<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-row no-gutters class="fill-height" align="center" justify="center">
        <v-col cols="12" sm="6" lg="4">
          <v-card flat rounded="lg" class="d-flex align-center">
            <v-row
              no-gutters
              class="fill-height"
              align="center"
              justify="center"
            >
              <v-col cols="12">
                <v-card-title>Login</v-card-title>
              </v-col>
              <v-col cols="12">
                <v-form ref="form" @submit.prevent="login()">
                  <v-text-field
                    rounded="0"
                    v-model="email"
                    name="email"
                    label="E-mail"
                    :rules="[(v) => !!v || 'Email is required']"
                    type="email"
                    placeholder="Your e-mail"
                    required
                  ></v-text-field>

                  <v-text-field
                  rounded="0"
                    v-model="password"
                    name="password"
                    label="Password"
                    type="password"
                    :rules="[(v) => !!v || 'Password is required']"
                    placeholder="Your password"
                    required
                  ></v-text-field>
                  <v-btn
                    size="x-small"
                    color="primary"
                    style="background-color: transparent"
                    class="ml-2"
                    variant="text"
                    to="/resetpassword"
                  >
                    Forgot Password?
                  </v-btn>
                  <v-btn
                    variant="text"
                    type="submit"
                    block
                    class="submit"
                    color="primary"
                    >Login</v-btn
                  >
                  <v-card flat v-if="error" rounded="lg" color="error">
                    <v-card-text>{{ error }}</v-card-text>
                  </v-card>
                </v-form>
              </v-col>
            </v-row>
          </v-card>
        </v-col></v-row
      >
    </div>
  </v-container>
</template>

<script>

//External
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
    const form = ref(null);

    const login = async () => {
      try {
        const validation = await form.value.validate();
        if (!validation.valid) return;

        await store.dispatch("signin", {
          email: email.value,
          password: password.value,
        });

        router.push("/");
      } catch (err) {
        error.value = err.message;
        console.log(error.value);
      }
    };
    return {
      email,
      password,
      router,
      error,
      form,
      login,
    };
  },
};
</script>
