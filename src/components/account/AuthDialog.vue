<template>
  <v-dialog
    v-model="visible"
    max-width="430"
    :persistent="isCompleting"
  >
    <v-card rounded="lg">
      <!-- Title row with close button. The completion step has no way out:
           behind it sits an authenticated user whose account has no name, and
           a backdrop click or an X would strand them. -->
      <v-card-title class="d-flex align-center justify-space-between pt-5 px-6 pb-1">
        {{ title }}
        <v-btn v-if="!isCompleting" icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-card-subtitle class="px-6 pb-3">{{ subtitle }}</v-card-subtitle>

      <!-- Error banner (login / register modes only) -->
      <v-alert
        v-if="authError && mode !== 'reset'"
        type="error"
        variant="tonal"
        density="comfortable"
        class="mx-6 mb-3"
      >
        {{ authError }}
        <v-btn
          v-if="isEmailInUse"
          variant="text"
          size="small"
          class="ml-1"
          @click="switchMode('login')"
        >
          Log in instead
        </v-btn>
      </v-alert>

      <!-- The completion step has no footer, so it has to close the card itself
           — `pb-5` matches the padding the footer gives every other mode. -->
      <v-card-text class="px-6 pt-0" :class="isCompleting ? 'pb-5' : 'pb-2'">
        <!-- Continue with Google — above the form, because it is an alternative
             to it rather than a footnote. Identical in login and register: for
             Google the same click does both, and two labels would imply
             otherwise. -->
        <template v-if="showGoogle">
          <v-btn
            block
            variant="outlined"
            size="large"
            class="mb-4 text-none"
            :loading="googleLoading"
            @click="signInWithGoogle"
          >
            <template #prepend>
              <v-img src="/assets/google-g.svg" width="18" height="18" alt="" />
            </template>
            Continue with Google
          </v-btn>

          <div class="d-flex align-center mb-4">
            <v-divider />
            <span class="text-medium-emphasis text-caption px-3">or</span>
            <v-divider />
          </div>
        </template>

        <v-form ref="form" @submit.prevent="submit">
          <!-- Display name — register, and the completion step.
               Deliberately NOT pre-filled with the name Google supplied. That
               name is a real, legal-looking one, and this field feeds
               `build.author` on every build the user publishes: a pre-fill is
               one un-noticed Enter away from publishing someone's real name.
               It also invited appending rather than replacing — "Jens" plus a
               typed suffix became "Jens (Google-Test)" on a live account. -->
          <v-text-field
            v-if="mode === 'register' || isCompleting"
            v-model="displayName"
            label="Display name"
            :autofocus="isCompleting"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            autocomplete="username"
            :rules="displayNameRules"
            @keydown.enter.prevent="submit"
          />

          <!-- Email — every mode except the completion step, which already
               knows who it is talking to -->
          <v-text-field
            v-if="!isCompleting"
            v-model="email"
            label="E-mail"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            autocomplete="off"
            :rules="emailRules"
            @keydown.enter.prevent="submit"
          />

          <!-- Password — login and register only -->
          <v-text-field
            v-if="mode !== 'reset' && !isCompleting"
            v-model="password"
            label="Password"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            class="mb-1"
            autocomplete="new-password"
            :rules="mode === 'register' ? passwordRegisterRules : passwordLoginRules"
            @click:append-inner="showPassword = !showPassword"
            @keydown.enter.prevent="submit"
          />

          <!-- Forgot password — login only -->
          <div v-if="mode === 'login'" class="mb-3">
            <v-btn
              variant="text"
              size="small"
              class="px-0 text-medium-emphasis"
              @click="switchMode('reset')"
            >
              Forgot password?
            </v-btn>
          </div>

          <!-- Spacing for reset mode (no password/forgot rows) -->
          <div v-if="mode === 'reset'" class="mb-3" />

          <!-- Submit button -->
          <v-btn
            block
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="loading"
          >
            {{ submitLabel }}
          </v-btn>
        </v-form>
      </v-card-text>

      <!-- Footer mode switcher. Absent while completing: there is nowhere else
           to go from here. -->
      <v-card-text v-if="!isCompleting" class="text-center text-medium-emphasis pt-2 pb-5">
        <template v-if="mode === 'login'">
          Don't have an account?
          <v-btn variant="text" size="small" @click="switchMode('register')">Sign up</v-btn>
        </template>
        <template v-else-if="mode === 'register'">
          Already have an account?
          <v-btn variant="text" size="small" @click="switchMode('login')">Log in</v-btn>
        </template>
        <template v-else>
          <v-btn variant="text" size="small" @click="switchMode('login')">← Back to log in</v-btn>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { computed, nextTick, ref, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  mapAuthError,
  isEmailAlreadyInUse,
  isAccountExistsWithDifferentCredential,
  isPopupCancelled,
} from "@/composables/auth/useAuthErrors";

export default {
  name: "AuthDialog",
  setup() {
    const store = useStore();
    const router = useRouter();
    const form = ref(null);

    const visible = computed({
      get: () => store.state.ui.authDialog.visible,
      set: (val) => { if (!val) close(); },
    });
    const mode = computed(() => store.state.ui.authDialog.mode);

    const email = ref("");
    const password = ref("");
    const displayName = ref("");
    const showPassword = ref(false);
    const loading = ref(false);
    const googleLoading = ref(false);
    const authError = ref(null);
    const isEmailInUse = ref(false);

    const isCompleting = computed(() => mode.value === "complete-profile");
    const showGoogle = computed(() => mode.value === "login" || mode.value === "register");

    // Clear all form state whenever the dialog opens — prevents stale/autofilled values
    // from a previous session leaking to the next user who opens the dialog.
    watch(visible, (isOpen) => {
      if (isOpen) {
        email.value = "";
        password.value = "";
        displayName.value = "";
        showPassword.value = false;
        authError.value = null;
        isEmailInUse.value = false;
        if (form.value) form.value.resetValidation();
      }
    });

    // Reset error + validation on mode change; preserve email/password across login↔register
    watch(mode, () => {
      authError.value = null;
      isEmailInUse.value = false;
      if (form.value) form.value.resetValidation();
      if (mode.value === "reset") {
        password.value = "";
        showPassword.value = false;
      }
      if (mode.value === "login") {
        displayName.value = "";
      }
    });

    const title = computed(() => ({
      login: "Log in",
      register: "Create account",
      reset: "Reset password",
      "complete-profile": "Pick your display name",
    }[mode.value]));

    const subtitle = computed(() => ({
      login: "Welcome back to AOE4 Guides.",
      register: "Join AOE4 Guides to save and share build orders.",
      reset: "Enter your email and we'll send you a password reset link.",
      "complete-profile": "This is the name that will appear on your build orders.",
    }[mode.value]));

    const submitLabel = computed(() => ({
      login: "Log In",
      register: "Create Account",
      reset: "Send Reset Link",
      "complete-profile": "Continue",
    }[mode.value]));

    const emailRules = [
      (v) => !!v || "Email is required.",
      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Enter a valid email address.",
    ];
    const passwordLoginRules = [(v) => !!v || "Password is required."];
    const passwordRegisterRules = [
      (v) => !!v || "Password is required.",
      (v) => (v && v.length >= 6) || "Use at least 6 characters.",
    ];
    const displayNameRules = [
      (v) => !!v || "Display name is required.",
      (v) => (v && v.trim().length >= 3) || "Pick a display name (min. 3 characters).",
    ];

    function switchMode(newMode) {
      store.commit("setAuthDialog", { mode: newMode });
    }

    function close() {
      store.dispatch("closeAuthDialog");
      email.value = "";
      password.value = "";
      displayName.value = "";
      showPassword.value = false;
      authError.value = null;
      isEmailInUse.value = false;
      if (form.value) form.value.resetValidation();
    }

    async function submit() {
      const { valid } = await form.value.validate();
      if (!valid) return;

      authError.value = null;
      isEmailInUse.value = false;
      loading.value = true;

      try {
        if (mode.value === "login") {
          await store.dispatch("signin", { email: email.value, password: password.value });
          finishSignIn("Logged in successfully!");

        } else if (mode.value === "register") {
          await store.dispatch("signup", {
            email: email.value,
            password: password.value,
            displayName: displayName.value,
          });
          store.dispatch("closeAuthDialog");
          store.dispatch("showSnackbar", {
            text: `Verification email sent to ${email.value}.`,
            type: "success",
          });

        } else if (mode.value === "complete-profile") {
          await store.dispatch("completeProfile", { displayName: displayName.value });
          finishSignIn("Welcome to AOE4 Guides!");

        } else {
          await store.dispatch("resetPassword", { email: email.value });
          store.dispatch("showSnackbar", {
            text: `Reset email sent to ${email.value}.`,
            type: "success",
          });
          switchMode("login");
        }
      } catch (err) {
        authError.value = mapAuthError(err);
        isEmailInUse.value = isEmailAlreadyInUse(err);
      } finally {
        loading.value = false;
      }
    }

    /**
     * Closes the dialog and honours whatever page the user was headed for.
     * Shared by the password login and by the two Google exits, so a first-time
     * user who detours through the name step still lands where they meant to —
     * the sign-in that preceded it must not eat the redirect.
     */
    function finishSignIn(message) {
      const redirect = store.state.ui.authDialog.redirect;
      store.dispatch("closeAuthDialog");
      store.dispatch("showSnackbar", { text: message, type: "success" });
      if (redirect) router.push(redirect);
    }

    async function signInWithGoogle() {
      authError.value = null;
      isEmailInUse.value = false;
      googleLoading.value = true;

      try {
        // Nothing is awaited between this click and `signInWithPopup` inside the
        // action — an await here would end the user gesture and the browser
        // would block the popup.
        const { incomplete } = await store.dispatch("signinWithGoogle");

        // An unfinished account keeps the dialog: the auth-state handler has
        // already switched it to the name step, and the redirect is still
        // waiting for that step to finish.
        if (!incomplete) finishSignIn("Logged in successfully!");

      } catch (err) {
        // Closing the window is a change of mind, not a failure.
        if (isPopupCancelled(err)) return;

        authError.value = mapAuthError(err);

        // The address already belongs to a password account. Send them to the
        // form that will work, with the address filled in and the reset link in
        // reach — switchMode clears the banner, so re-set it afterwards.
        if (isAccountExistsWithDifferentCredential(err)) {
          const collidingEmail = err?.customData?.email || "";
          const message = authError.value;
          switchMode("login");
          await nextTick();
          email.value = collidingEmail;
          authError.value = message;
        }
      } finally {
        googleLoading.value = false;
      }
    }

    return {
      form,
      visible,
      mode,
      email,
      password,
      displayName,
      showPassword,
      loading,
      googleLoading,
      authError,
      isEmailInUse,
      isCompleting,
      showGoogle,
      title,
      subtitle,
      submitLabel,
      emailRules,
      passwordLoginRules,
      passwordRegisterRules,
      displayNameRules,
      switchMode,
      close,
      submit,
      signInWithGoogle,
    };
  },
};
</script>
