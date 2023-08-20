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
                <v-card-title>Reset Password</v-card-title>
              </v-col>
              <v-col cols="12">
                <v-form ref="form" @submit.prevent="reset()">
                  <v-text-field
                    rounded="0"
                    v-model="email"
                    name="email"
                    label="E-mail"
                    type="email"
                    placeholder="Your e-mail"
                    :rules="[(v) => !!v || 'Email is required']"
                    required
                  ></v-text-field>
                  <v-btn
                    variant="text"
                    color="primary"
                    type="submit"
                    block
                    >Reset Password</v-btn
                  >
                  <v-card flat v-if="error" rounded="lg" color="error">
                    <v-card-text>{{ error }}</v-card-text>
                  </v-card>
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
    const form = ref(null);

    const actionCodeSettings = {
      url: "https://aoe4guides.com/login",
    };
    const reset = async () => {
      const validation = await form.value.validate();
      if (!validation.valid) return;

      await sendPasswordResetEmail(auth, email.value, actionCodeSettings)
        .then(() => {
          alert("Password reset email sent!");
          router.push("/");
        })
        .catch((err) => {
          error.value = "Could not reset password. " + err.code;
        });
    };
    return {
      error,
      email,
      form,
      reset,
    };
  },
};
</script>
