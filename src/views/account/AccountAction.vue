<template>
  <v-container>
    <div v-if="authIsReady" class="d-flex justify-center">
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
                <v-form ref="form" @submit.prevent="changePassword()">
                  <v-card-title>{{ title }}</v-card-title>
                  <v-card-text>{{ message }}</v-card-text>

                  <v-text-field
                    v-if="!passwordSet && (mode == 'resetPassword')"
                    name="new password"
                    label="New password"
                    type="password"
                    :rules="[(v) => !!v || 'Password is required']"
                    v-model="newPassword"
                    placeholder="Your new password"
                    required
                  ></v-text-field>
                  <v-btn
                    v-if="!error && !passwordSet && (mode == 'resetPassword')"
                    color="primary"
                    variant="text"
                    @click="saveNewPassword"
                    block
                    type="submit"
                    >Apply</v-btn
                  >
                  <v-btn
                    v-if="newPassword && passwordSet && !error && (mode == 'resetPassword')"
                    color="primary"
                    :to="!user ? '../login' : '/'"
                    variant="text"
                    block
                    type="submit"
                    >Continue</v-btn
                  >
                  <v-btn
                    v-if="!error && (mode == 'verifyEmail')"
                    color="primary"
                    :to="!user ? '../login' : '/'"
                    variant="text"
                    block
                    type="submit"
                    >Continue</v-btn
                  >
                </v-form>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>

//External
import { onMounted, ref } from "vue";
import { computed } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import { auth } from "@/firebase";
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";

export default {
  name: "AccountAction",
  setup() {
    window.scrollTo(0, 0);

    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const user = computed(() => store.state.user);

    var message = ref("");
    var title = ref("");
    var newPassword = ref("");
    var mail = ref("");
    var error = ref(null);
    var passwordSet = ref(false);

    const getParameterByName = (name) => {
      switch (name) {
        case "mode":
          return route.query.mode;
        case "oobCode":
          return route.query.oobCode;
        case "continueUrl":
          return route.query.continueUrl;
        case "lang":
          return route.query.lang;
        default:
          break;
      }
    };

    // Get the action to complete.
    const mode = getParameterByName("mode");
    // Get the one-time code from the query parameter.
    const actionCode = getParameterByName("oobCode");
    // (Optional) Get the continue URL from the query parameter if available.
    const continueUrl = getParameterByName("continueUrl");
    // (Optional) Get the language code if available.
    const lang = getParameterByName("lang") || "en";

    onMounted(() => {
      // Handle the user management action.
      switch (mode) {
        case "resetPassword":
          handleResetPassword(auth, actionCode, continueUrl, lang);
          break;
        case "recoverEmail":
          // Not handled yet!
          break;
        case "verifyEmail":
          handleVerifyEmail(auth, actionCode, continueUrl, lang);
          break;
        default:
        // Error: invalid mode.
      }
    });

    function handleVerifyEmail(auth, actionCode) {
      error.value = false;
      applyActionCode(auth, actionCode)
        .then((resp) => {
          title.value = "Email Verified";
          message.value =
            "Your Email has been verified. Please continue to gather your first build order.";
        })
        .catch((error) => {
          error.value = error;
          title.value = "Link Expired";
          message.value =
            "Your Email verification code has expired or is invalid. Please verify again.";
        });
    }

    function handleResetPassword(auth, actionCode) {
      error.value = false;
      verifyPasswordResetCode(auth, actionCode)
        .then((email) => {
          mail.value = email;
          title.value = "Reset Password for " + email;
          message.value = "Please set your new password.";
        })
        .catch((error) => {
          error.value = error;
          title.value = "Link xpired";
          message.value =
            "Your password reset code has expired or is invalid. Please try again.";
        });
    }

    function saveNewPassword() {
      error.value = false;
      confirmPasswordReset(auth, actionCode, newPassword.value)
        .then((resp) => {
          passwordSet.value = true;
          title.value = "Reset Password for " + mail.value;
          message.value =
            "Password successfully set. Please continue to gather your next build order.";
        })
        .catch((error) => {
          error.value = error;
          title.value = "Reset Password for " + mail.value;
          message.value = error + "ww";
        });
    }

    return {
      mode,
      message,
      newPassword,
      passwordSet,
      saveNewPassword,
      mail,
      error,
      title,
      router,
      user,
      auth,
      authIsReady: computed(() => store.state.authIsReady),
    };
  },
};
</script>
