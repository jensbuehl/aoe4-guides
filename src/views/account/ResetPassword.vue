<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-card
        class="elevation-10"
        rounded="lg"
        style="max-width: 350px; width: 350px"
        fluid
      >
        <v-card-title class="mb-4">Reset Password</v-card-title>
        <v-form ref="form" @submit.prevent="reset()">
          <v-text-field
            v-model="email"
            name="email"
            label="E-mail"
            type="email"
            placeholder="Your e-mail"
            :rules="[v => !!v || 'Email is required']"
            required
          ></v-text-field>
          <v-btn variant="text" color="primary" type="submit" block class="mt-2"
            >Reset Password</v-btn
          >
          <v-card v-if="error" rounded="lg" color="error">
            <v-card-text>{{ error }}</v-card-text>
          </v-card>
        </v-form>
      </v-card>
    </div>
  </v-container>
</template>

<script>
import { ref } from "vue";
import { auth, sendPasswordResetEmail } from "../../firebase/index.js";
import { useRouter } from "vue-router";

export default {
  name: "Login",
  setup() {
    window.scrollTo(0, 0);
    const email = ref("");
    const router = useRouter();
    const error = ref(null);

    const actionCodeSettings = {
      url: "https://aoe4guides.com/login",
    };
    const reset = async () => {
      await sendPasswordResetEmail(auth, email.value, actionCodeSettings)
        .then(() => {
          alert("Password reset email sent!");
          router.push("/");
        })
        .catch((err) => {
          error.value =  "Could not reset password. " + err.code;
        });
    };
    return {
      error,
      email,
      reset,
    };
  },
};
</script>
