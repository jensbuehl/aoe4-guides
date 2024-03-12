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
                  <v-btn variant="text" color="primary" type="submit" block
                    >Reset Password</v-btn
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
import { auth, sendPasswordResetEmail } from "@/firebase/index.js";
import { useRouter } from "vue-router";

export default {
  name: "Login",
  setup() {    
    const email = ref("");
    const router = useRouter();
    const form = ref(null);
    const store = useStore();

    const actionCodeSettings = {
      url: "https://aoe4guides.com/login",
    };
    const reset = async () => {
      try {
        const validation = await form.value.validate();
        if (!validation.valid) return;

        await sendPasswordResetEmail(auth, email.value, actionCodeSettings);
        store.dispatch("showSnackbar", {
          text: `Reset email sent to ${email.value}`,
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
      form,
      reset,
    };
  },
};
</script>
