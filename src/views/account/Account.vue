<template>
  <v-container>
    <v-row class="justify-center">
      <v-col>
        <div v-if="authIsReady && user" class="d-flex justify-center">
          <v-card rounded="lg">
            <v-card-title class="mb-4">Account Info</v-card-title>
            <v-card rounded="lg" style="max-width: 350px; width: 350px" fluid>
              <v-text-field
                class="text-grey"
                name="displayname"
                label="Display name"
                type="text"
                v-model="user.displayName"
                placeholder="Your display name"
                readonly
              ></v-text-field>
              <v-text-field
                class="text-grey"
                name="email"
                label="Email"
                type="email"
                v-model="user.email"
                placeholder="Your email"
                readonly
              ></v-text-field>
            </v-card>
          </v-card>
        </div>
        <div class="d-flex justify-center mt-4">
          <v-card rounded="lg">
            <v-card-title class="mb-4">Change Password</v-card-title>
            <v-card rounded="lg" style="max-width: 350px; width: 350px" fluid>
              <v-form ref="form" @submit.prevent="changePassword()">
                <v-text-field
                  name="new password"
                  label="New password"
                  type="password"
                  v-model="newPassword"
                  content="New password"
                  placeholder="Your new password"
                ></v-text-field>
                <v-btn color="primary" variant="text" type="submit" block class="mt-2">Change Password</v-btn>
              </v-form>
            </v-card>
          </v-card>
        </div>
        <div class="d-flex justify-center">
          <v-card rounded="lg" class="mt-4">
            <v-card-title class="mb-4">Delete Account</v-card-title>
            <v-card rounded="lg" style="max-width: 350px; width: 350px" fluid>
              <v-form ref="form" @submit.prevent="dialog = true">
                <v-btn color="primary" variant="text" type="submit" block class="mt-2"
                  >Delete Account</v-btn
                >
                <v-dialog v-model="dialog" width="auto">
                  <v-card rounded="lg" class="text-center primary">
                    <v-card-title>Delete Account</v-card-title>
                    <v-card-text>
                      Do you really want to delete your account?<br />
                      The action cannot be undone.
                    </v-card-text>
                    <v-card-actions>
                      <v-btn color="error" block @click="deleteAccount()"
                        >Delete</v-btn
                      >
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </v-form>
            </v-card>
          </v-card>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref } from "vue";
import { computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  name: "Account",
  setup() {
    window.scrollTo(0, 0);
    
    const newPassword = ref("");
    const router = useRouter();
    const store = useStore();
    const error = ref(null);
    const dialog = ref(false);
    const user = computed(() => store.state.user);
    
    const changePassword = async () => {
      try {
        await store.dispatch("changePassword", {
          password: newPassword.value,
        });
        router.push("/");
      } catch (err) {
        error.value = err.message;
        console.log(error.value);
      }
    };

    const deleteAccount = async () => {
      try {
        dialog.value = false;
        await store.dispatch("deleteAccount");
        router.push("/");
      } catch (err) {
        error.value = err.message;
        console.log(error.value);
      }
    };

    return {
      newPassword,
      router,
      user,
      dialog,
      authIsReady: computed(() => store.state.authIsReady),
      changePassword,
      deleteAccount,
    };
  },
};
</script>
