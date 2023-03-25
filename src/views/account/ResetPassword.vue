<template>
    <v-container>
      <div class="d-flex justify-center">
        <v-card class="elevation-10" rounded="lg" style="max-width: 350px; width: 350px" fluid>
          <v-card-title class="mb-4">Reset Password</v-card-title>
          <v-form ref="form" @submit.prevent="reset()">
            <v-text-field
              v-model="email"
              name="email"
              label="E-mail"
              type="email"
              placeholder="Your e-mail"
              required
            ></v-text-field>
            <v-btn type="submit" block class="mt-2">Reset Password</v-btn>
          </v-form>
        </v-card>
      </div>
    </v-container>
  </template>

<script setup>
import { ref } from "vue";
import { auth, sendPasswordResetEmail } from "../../firebase/index.js";
import { useRouter } from "vue-router";

window.scrollTo(0, 0);
const email = ref("");
const router = useRouter();

const actionCodeSettings = {
    url: "http://localhost:5173/login",
};
const reset = () => {
  sendPasswordResetEmail(auth, email.value, actionCodeSettings)
    .then(() => {
      alert('Password reset email sent!');
      router.push('/');
    })
    .catch((error) => {
      console.log(error.message);
    });
};
</script>

<script>
export default {
  name: "Login"
};
</script>