<template>
  <v-container v-if="authIsReady && user">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="7" lg="6">

        <!-- Profile Hero -->
        <v-card flat rounded="lg" class="mb-4 text-center pa-6">
          <!-- Verification banner (unverified only) -->
          <v-alert
            v-if="!user.emailVerified"
            type="warning"
            variant="tonal"
            density="comfortable"
            class="mb-4 text-left"
          >
            Please confirm your email address.
            <template #append>
              <v-btn variant="text" size="small" :loading="verifying" @click="resendVerification">
                Resend email
              </v-btn>
            </template>
          </v-alert>

          <!-- Avatar with camera overlay — entire area is clickable -->
          <div class="d-flex justify-center mb-4">
            <div
              style="position: relative; display: inline-block; cursor: pointer;"
              @click="pickerOpen = true"
            >
              <v-avatar size="96" color="accent">
                <v-img v-if="avatarSrc" :src="avatarSrc" cover />
                <span v-else class="text-h5">{{ avatarInitials }}</span>
              </v-avatar>
              <v-avatar
                size="28"
                color="primary"
                style="position: absolute; bottom: 0; right: 0; border: 2px solid rgba(var(--v-theme-surface));"
              >
                <v-icon size="16">mdi-camera</v-icon>
              </v-avatar>
            </div>
          </div>

          <v-card-title class="pa-0 mb-1">{{ user.displayName }}</v-card-title>
          <div class="text-medium-emphasis text-body-2 mb-3">{{ user.email }}</div>

          <v-chip
            :color="user.emailVerified ? 'success' : 'warning'"
            variant="tonal"
            size="small"
            :prepend-icon="user.emailVerified ? 'mdi-check-circle' : 'mdi-alert-circle'"
          >
            {{ user.emailVerified ? 'Verified' : 'Unverified' }}
          </v-chip>

          <v-divider class="my-5" />

          <!-- Identity rows -->
          <v-list lines="two" class="text-left pa-0">
            <v-list-item
              prepend-icon="mdi-email-outline"
              subtitle="Email"
              :title="user.email"
            />
            <v-list-item
              prepend-icon="mdi-identifier"
              subtitle="User ID"
              :title="user.uid"
            >
              <template #append>
                <v-btn
                  icon="mdi-content-copy"
                  variant="text"
                  size="small"
                  @click="copyUid"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Security -->
        <v-card flat rounded="lg" class="mb-4">
          <v-card-title class="px-6 pt-5 pb-2">Security</v-card-title>
          <v-card-text class="px-6 pb-5">
            <v-form ref="passwordForm" @submit.prevent="changePassword">
              <v-text-field
                v-model="newPassword"
                label="New password"
                prepend-inner-icon="mdi-lock-outline"
                :append-inner-icon="showPw ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                :type="showPw ? 'text' : 'password'"
                variant="outlined"
                density="comfortable"
                class="mb-3"
                autocomplete="new-password"
                :rules="[v => !!v || 'Password is required.', v => (v && v.length >= 6) || 'Use at least 6 characters.']"
                @click:append-inner="showPw = !showPw"
                @keydown.enter.prevent="changePassword"
              />
              <v-text-field
                v-model="confirmPassword"
                label="Confirm new password"
                prepend-inner-icon="mdi-lock-check-outline"
                :append-inner-icon="showPwConfirm ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                :type="showPwConfirm ? 'text' : 'password'"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                autocomplete="new-password"
                :rules="[v => !!v || 'Please confirm your password.', v => v === newPassword || 'Passwords do not match.']"
                @click:append-inner="showPwConfirm = !showPwConfirm"
                @keydown.enter.prevent="changePassword"
              />
              <v-btn
                block
                color="primary"
                type="submit"
                :loading="changingPw"
                :disabled="changingPw"
              >
                Change password
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Danger zone -->
        <v-card flat rounded="lg" class="mb-4">
          <v-card-text class="px-6 py-5">
            <v-alert type="error" variant="tonal" density="comfortable">
              <div class="text-subtitle-2 mb-1">Danger zone</div>
              <div class="text-body-2 mb-3">
                Permanently delete your account and all your build orders. This cannot be undone.
              </div>
              <v-btn color="error" variant="flat" size="small" @click="deleteDialog = true">
                Delete account
              </v-btn>
            </v-alert>
          </v-card-text>
        </v-card>

      </v-col>
    </v-row>

    <!-- Avatar picker -->
    <AvatarPicker v-model="pickerOpen" />

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card rounded="lg">
        <v-card-title class="pt-5 px-6">Delete account?</v-card-title>
        <v-card-text class="px-6">
          Your account and all your build orders will be permanently deleted. This cannot be undone.
        </v-card-text>
        <v-card-actions class="px-6 pb-5">
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" :loading="deleting" @click="confirmDelete">
            Delete permanently
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import AvatarPicker from "@/components/account/AvatarPicker.vue";
import { useAvatar } from "@/composables/auth/useAvatar";

export default {
  name: "Account",
  components: { AvatarPicker },
  setup() {
    const store = useStore();
    const router = useRouter();
    const user = computed(() => store.state.user);
    const userAvatar = computed(() => store.state.userAvatar);
    const { src: avatarSrc, initials: avatarInitials } = useAvatar(userAvatar, user);

    const pickerOpen = ref(false);
    const deleteDialog = ref(false);

    const passwordForm = ref(null);
    const newPassword = ref("");
    const confirmPassword = ref("");
    const showPw = ref(false);
    const showPwConfirm = ref(false);
    const changingPw = ref(false);
    const deleting = ref(false);
    const verifying = ref(false);

    async function copyUid() {
      await navigator.clipboard.writeText(user.value.uid);
      store.dispatch("showSnackbar", { text: "User ID copied to clipboard.", type: "success" });
    }

    async function resendVerification() {
      verifying.value = true;
      try {
        await store.dispatch("verifyEmail");
        store.dispatch("showSnackbar", { text: "Verification email sent!", type: "success" });
      } catch (err) {
        store.dispatch("showSnackbar", { text: err.message, type: "error" });
      } finally {
        verifying.value = false;
      }
    }

    async function changePassword() {
      const { valid } = await passwordForm.value.validate();
      if (!valid) return;
      changingPw.value = true;
      try {
        await store.dispatch("changePassword", { password: newPassword.value });
        store.dispatch("showSnackbar", { text: "Password changed successfully!", type: "success" });
        newPassword.value = "";
        confirmPassword.value = "";
        passwordForm.value.resetValidation();
      } catch (err) {
        store.dispatch("showSnackbar", { text: err.message, type: "error" });
      } finally {
        changingPw.value = false;
      }
    }

    async function confirmDelete() {
      deleting.value = true;
      try {
        deleteDialog.value = false;
        await store.dispatch("deleteAccount");
        store.dispatch("showSnackbar", { text: "Account deleted.", type: "success" });
        router.push("/");
      } catch (err) {
        store.dispatch("showSnackbar", { text: err.message, type: "error" });
      } finally {
        deleting.value = false;
      }
    }

    return {
      user,
      authIsReady: computed(() => store.state.authIsReady),
      avatarSrc,
      avatarInitials,
      pickerOpen,
      deleteDialog,
      passwordForm,
      newPassword,
      confirmPassword,
      showPw,
      showPwConfirm,
      changingPw,
      deleting,
      verifying,
      copyUid,
      resendVerification,
      changePassword,
      confirmDelete,
    };
  },
};
</script>
