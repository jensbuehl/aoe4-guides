<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-row no-gutters class="fill-height" align="center" justify="center">
        <v-col cols="12" sm="6" lg="4">
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row
              no-gutters
              class="fill-height"
              align="center"
              justify="center"
            >
              <v-col cols="12">
                <v-card-title class="mb-4">Register</v-card-title>
              </v-col>
              <v-col cols="12">
                <v-form ref="form" @submit.prevent="register()">
                  <v-text-field
                    v-model="displayName"
                    name="displayName"
                    label="Display Name"
                    :rules="[(v) => !!v || 'Display name is required']"
                    type="text"
                    placeholder="Your display name"
                    required
                  ></v-text-field>

                  <v-text-field
                    v-model="email"
                    name="email"
                    label="E-mail"
                    :rules="[(v) => !!v || 'Email is required']"
                    type="email"
                    placeholder="Your e-mail"
                    required
                  ></v-text-field>

                  <v-text-field
                    v-model="password"
                    name="password"
                    label="Password"
                    :rules="[(v) => !!v || 'Password is required']"
                    type="password"
                    placeholder="Your password"
                    required
                  ></v-text-field>
                  <v-btn
                    variant="text"
                    color="primary"
                    type="submit"
                    block
                    class="mt-2"
                    >Register</v-btn
                  >
                </v-form>
              </v-col>
            </v-row>
          </v-card></v-col
        ></v-row
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
    const store = useStore();
    const form = ref(null);
    const email = ref("");
    const password = ref("");
    const displayName = ref("");
    const router = useRouter();

    const register = async () => {
      try {
        const validation = await form.value.validate();
        if (!validation.valid) return;

        await store.dispatch("signup", {
          email: email.value,
          password: password.value,
          displayName: displayName.value,
        });
        store.dispatch("showSnackbar", {
          text: `Signup email sent to ${email.value}.`,
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
    return {
      email,
      password,
      displayName,
      router,
      form,
      register,
    };
  },
};
</script>
