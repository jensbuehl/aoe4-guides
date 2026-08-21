<template>
  <v-container v-if="authIsReady && user" style="max-width: 1100px;">
    <v-row justify="center">
      <!-- Left column: profile -->
      <v-col cols="12" md="5">

        <!-- Profile Hero -->
        <v-card flat rounded="lg" class="text-center pa-6">
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
              <UserAvatar
                size="96"
                :src="avatarSrc"
                :name="user.displayName"
                :loading="avatarLoading"
                text-class="text-h5"
              />
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
              prepend-icon="mdi-lock-outline"
              subtitle="Sign-in method"
              :title="signInMethodLabel"
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

      </v-col>

      <!-- Right column: security + danger -->
      <v-col cols="12" md="7" class="d-flex flex-column ga-6">

        <!-- Security. Hidden entirely for an account with no password sign-in:
             a control that fails when pressed is worse than no control. -->
        <v-card v-if="hasPassword" flat rounded="lg">
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
                variant="flat"
                type="submit"
                :loading="changingPw"
                :disabled="changingPw"
              >
                Change password
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- What other people see. The disclosure line is not decoration: the
             introduction can reach the home page, and someone has to know that
             before writing it rather than on discovering themselves there. -->
        <v-card flat rounded="lg">
          <v-card-title class="px-6 pt-5 pb-2">Public profile</v-card-title>
          <v-card-text class="px-6 pb-5">
            <v-form ref="profileForm" @submit.prevent="saveProfile">
              <v-textarea
                v-model="bio"
                label="About you"
                placeholder="A sentence or two about how you play."
                variant="outlined"
                density="comfortable"
                rows="3"
                auto-grow
                no-resize
                counter
                :counter-value="bioLength"
                :max="bioMax"
                :rules="bioRules"
                class="mb-3"
              />
              <v-text-field
                v-for="kind in linkKinds"
                :key="kind"
                v-model="linkInputs[kind]"
                :label="linkMeta(kind).label"
                :placeholder="linkMeta(kind).placeholder"
                :prepend-inner-icon="linkMeta(kind).icon"
                variant="outlined"
                density="comfortable"
                :hint="linkMeta(kind).hint + ' Optional.'"
                persistent-hint
                :rules="linkRules[kind]"
                class="mb-4"
              />

              <div class="text-caption text-medium-emphasis mb-4">
                Both appear on your author page, and on the home page if you are
                featured there.
              </div>

              <v-btn
                block
                color="primary"
                variant="flat"
                type="submit"
                :loading="savingProfile"
                :disabled="savingProfile || !profileDirty"
              >
                Save profile
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- What the site costs and how far the community has got. Once on this
             page; the footer's copy is suppressed on the Account route. -->
        <FundingStatus />

        <!-- Danger zone -->
        <v-card flat rounded="lg">
          <v-card-text class="px-6 py-5">
            <v-alert type="error" variant="tonal" density="comfortable">
              <div class="text-subtitle-2 mb-1">Danger zone</div>
              <div class="text-body-2 mb-3">
                Permanently delete your account. This cannot be undone. Your published
                build orders stay on the site so the community can keep using them.
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
          Your account will be permanently deleted and you will lose access to it. This
          cannot be undone. Build orders you have published stay on the site — contact us
          if you need one of them removed.
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
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import AvatarPicker from "@/components/account/AvatarPicker.vue";
import UserAvatar from "@/components/common/UserAvatar.vue";
import FundingStatus from "@/components/common/FundingStatus.vue";
import { useAvatar } from "@/composables/auth/useAvatar";
import {
  BIO_MAX_LENGTH,
  PROFILE_LINK_KINDS,
  bioLength,
  normaliseBio,
  extractLink,
  linkMeta,
} from "@/composables/useContributorProfile";
import {
  getContributorProfile,
  updateContributorProfile,
} from "@/composables/data/userService";

export default {
  name: "Account",
  components: { AvatarPicker, UserAvatar, FundingStatus },
  setup() {
    const store = useStore();
    const router = useRouter();
    const user = computed(() => store.state.user);
    const userAvatar = computed(() => store.state.userAvatar);
    const { src: avatarSrc, loading: avatarLoading } = useAvatar(userAvatar);

    // How this person signs in. `state.user` is already `user.toJSON()`, so
    // providerData is in hand — no extra read to answer either question.
    const hasPassword = computed(() =>
      (user.value?.providerData || []).some((p) => p.providerId === "password")
    );
    const hasGoogle = computed(() =>
      (user.value?.providerData || []).some((p) => p.providerId === "google.com")
    );
    const signInMethodLabel = computed(() => {
      if (hasPassword.value && hasGoogle.value) return "Google, or email and password";
      if (hasGoogle.value) return "Google";
      return "Email and password";
    });

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

    // Public profile. Loaded from the contributor record rather than from the
    // store, which holds the account's private side and never carries these.
    // One read, on a page nobody visits in bulk — the read budget that matters
    // is the home page's, and this is not it.
    const profileForm = ref(null);
    const bio = ref("");
    const savingProfile = ref(false);

    // One entry per link kind, driven by the same table the display components
    // read. Adding a fourth link is then a change in one module, not in three
    // files that must be kept in step.
    const blankLinks = () =>
      Object.fromEntries(PROFILE_LINK_KINDS.map((kind) => [kind, ""]));

    const linkInputs = ref(blankLinks());

    // What the server currently holds, in the form it holds it. Kept alongside
    // the editable fields so the save control can tell whether pressing it
    // would change anything.
    const savedBio = ref(null);
    const savedLinks = ref(Object.fromEntries(PROFILE_LINK_KINDS.map((k) => [k, null])));

    // Compared after normalisation rather than on the raw text, because that is
    // what would actually be written: a trailing space, or a pasted profile URL
    // that resolves to the id already stored, are not changes, and offering to
    // save them would spend a write to store what is already there.
    const profileDirty = computed(
      () =>
        normaliseBio(bio.value) !== savedBio.value ||
        PROFILE_LINK_KINDS.some(
          (kind) => extractLink(kind, linkInputs.value[kind]) !== savedLinks.value[kind]
        )
    );

    watch(
      user,
      async (current) => {
        if (!current?.uid) return;
        try {
          const profile = await getContributorProfile(current.uid);
          savedBio.value = profile.bio ?? null;
          bio.value = profile.bio ?? "";
          for (const kind of PROFILE_LINK_KINDS) {
            savedLinks.value[kind] = profile[kind] ?? null;
            linkInputs.value[kind] = profile[kind] ?? "";
          }
        } catch {
          // An unreadable profile leaves the fields empty rather than blocking
          // the rest of the page. Saving still works and will create the record.
        }
      },
      { immediate: true }
    );

    const bioRules = [
      (v) => bioLength(v ?? "") <= BIO_MAX_LENGTH || "A little too long — trim it slightly.",
    ];

    // Built once rather than from a template call, so Vuetify is not handed a
    // freshly allocated rules array on every render.
    const linkRules = Object.fromEntries(
      PROFILE_LINK_KINDS.map((kind) => [
        kind,
        [
          (v) =>
            !v ||
            !!extractLink(kind, v) ||
            `Use your ${linkMeta(kind).label} address or name.`,
        ],
      ])
    );

    async function saveProfile() {
      // Guarded here as well as on the button, because pressing Enter in either
      // field submits the form and never touches the disabled control.
      if (!profileDirty.value) return;

      const { valid } = await profileForm.value.validate();
      if (!valid) return;

      savingProfile.value = true;
      try {
        const nextBio = normaliseBio(bio.value);
        const nextLinks = Object.fromEntries(
          PROFILE_LINK_KINDS.map((kind) => [kind, extractLink(kind, linkInputs.value[kind])])
        );

        await updateContributorProfile(user.value.uid, { bio: nextBio, ...nextLinks });

        // Show what was actually stored, not what was typed: a pasted profile
        // address becomes a bare identifier, and a bio loses its line breaks.
        // Leaving the raw input on screen would suggest the site kept it.
        savedBio.value = nextBio;
        bio.value = nextBio ?? "";
        for (const kind of PROFILE_LINK_KINDS) {
          savedLinks.value[kind] = nextLinks[kind];
          linkInputs.value[kind] = nextLinks[kind] ?? "";
        }

        store.dispatch("showSnackbar", { text: "Profile saved.", type: "success" });
      } catch (err) {
        store.dispatch("showSnackbar", { text: err.message, type: "error" });
      } finally {
        savingProfile.value = false;
      }
    }

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
      hasPassword,
      signInMethodLabel,
      authIsReady: computed(() => store.state.authIsReady),
      avatarSrc,
      avatarLoading,
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
      profileForm,
      bio,
      linkInputs,
      linkKinds: PROFILE_LINK_KINDS,
      linkMeta,
      linkRules,
      savingProfile,
      profileDirty,
      saveProfile,
      bioRules,
      bioLength,
      bioMax: BIO_MAX_LENGTH,
    };
  },
};
</script>
