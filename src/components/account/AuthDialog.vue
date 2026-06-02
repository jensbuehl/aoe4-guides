<template>
  <v-dialog
    v-model="visible"
    max-width="430"
    :persistent="false"
  >
    <v-card rounded="lg">
      <!-- Title row with close button -->
      <v-card-title class="d-flex align-center justify-space-between pt-5 px-6 pb-1">
        {{ title }}
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
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

      <v-card-text class="px-6 pt-0 pb-2">
        <v-form ref="form" @submit.prevent="submit">
          <!-- Display name — register only -->
          <v-text-field
            v-if="mode === 'register'"
            v-model="displayName"
            label="Display name"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            class="mb-3"
            autocomplete="username"
            :rules="displayNameRules"
            @keydown.enter.prevent="submit"
          />

          <!-- Email — all modes -->
          <v-text-field
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
            v-if="mode !== 'reset'"
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

      <!-- Footer mode switcher -->
      <v-card-text class="text-center text-medium-emphasis pt-2 pb-5">
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
import { computed, ref, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { mapAuthError, isEmailAlreadyInUse } from "@/composables/auth/useAuthErrors";

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
    const authError = ref(null);
    const isEmailInUse = ref(false);

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
    }[mode.value]));

    const subtitle = computed(() => ({
      login: "Welcome back to AOE4 Guides.",
      register: "Join AOE4 Guides to save and share build orders.",
      reset: "Enter your email and we'll send you a password reset link.",
    }[mode.value]));

    const submitLabel = computed(() => ({
      login: "Log In",
      register: "Create Account",
      reset: "Send Reset Link",
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
          const redirect = store.state.ui.authDialog.redirect;
          store.dispatch("closeAuthDialog");
          store.dispatch("showSnackbar", { text: "Logged in successfully!", type: "success" });
          if (redirect) router.push(redirect);

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

    return {
      form,
      visible,
      mode,
      email,
      password,
      displayName,
      showPassword,
      loading,
      authError,
      isEmailInUse,
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
    };
  },
};
</script>
