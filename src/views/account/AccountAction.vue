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
                <v-form ref="form" @submit.prevent="saveNewPassword">
                  <v-card-title>{{ title }}</v-card-title>
                  <v-card-text>{{ message }}</v-card-text>

                  <!-- The account the new password belongs to, for password
                       managers: without it they save the password under no
                       login at all, or ask the user which one it was. Both
                       fields exist only once the link has checked out, so a
                       manager is never offered a new password it cannot set. -->
                  <input
                    v-if="canSetPassword"
                    type="text"
                    autocomplete="username"
                    :value="mail"
                    hidden
                  />
                  <v-text-field
                    v-if="canSetPassword"
                    name="new password"
                    label="New password"
                    type="password"
                    autocomplete="new-password"
                    enterkeyhint="done"
                    :rules="passwordRules"
                    v-model="newPassword"
                    placeholder="Your new password"
                    required
                  ></v-text-field>
                  <v-btn
                    v-if="canSetPassword"
                    color="primary"
                    variant="text"
                    :loading="saving"
                    :disabled="saving"
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
import { mapAuthError } from "@/composables/auth/useAuthErrors";

export default {
  name: "AccountAction",
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const user = computed(() => store.state.user);

    const SET_PASSWORD_PROMPT = "Please set your new password.";
    var message = ref("");
    var title = ref("");
    var newPassword = ref("");
    var mail = ref("");
    var error = ref(null);
    var passwordSet = ref(false);
    const form = ref(null);
    const saving = ref(false);

    // `error` is a dead link, the one failure nothing on this page can fix.
    // `mail` is known only once the link has checked out.
    const canSetPassword = computed(
      () => mode == "resetPassword" && !!mail.value && !error.value && !passwordSet.value
    );
    const passwordRules = [
      (v) => !!v || "Password is required.",
      (v) => (v && v.length >= 6) || "Use at least 6 characters.",
    ];

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

    async function handleVerifyEmail(auth, actionCode) {
      error.value = false;
      try {
        await applyActionCode(auth, actionCode);
        await auth.currentUser?.reload();
        store.commit("setUser", auth.currentUser.toJSON());
        title.value = "Email Verified";
        message.value =
          "Your Email has been verified. Please continue to gather your first build order.";
      } catch (err) {
        error.value = err;
        title.value = "Link Expired";
        message.value =
          "Your Email verification code has expired or is invalid. Please verify again.";
      }
    }

    function handleResetPassword(auth, actionCode) {
      error.value = false;
      verifyPasswordResetCode(auth, actionCode)
        .then((email) => {
          mail.value = email;
          title.value = "Reset Password for " + email;
          message.value = SET_PASSWORD_PROMPT;
        })
        .catch((err) => {
          error.value = err;
          title.value = "Link expired";
          message.value =
            "Your password reset code has expired or is invalid. Please try again.";
        });
    }

    async function saveNewPassword() {
      if (saving.value) return;
      const { valid } = await form.value.validate();
      if (!valid) return;
      saving.value = true;
      // Back to the prompt while the retry is out: the previous attempt's
      // error stayed on screen through the next one, reading as its answer.
      message.value = SET_PASSWORD_PROMPT;
      try {
        await confirmPasswordReset(auth, actionCode, newPassword.value);
        passwordSet.value = true;
        title.value = "Reset Password for " + mail.value;
        message.value =
          "Password successfully set. Please continue to gather your next build order.";
      } catch (err) {
        // A link that died while the page was open cannot be retried; a
        // rejected password can, so that one leaves the field in place.
        if (String(err?.code || err).includes("action-code")) {
          error.value = err;
          title.value = "Link expired";
          message.value =
            "Your password reset code has expired or is invalid. Please try again.";
        } else {
          message.value = mapAuthError(err);
        }
      } finally {
        saving.value = false;
      }
    }

    return {
      form,
      saving,
      canSetPassword,
      passwordRules,
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
