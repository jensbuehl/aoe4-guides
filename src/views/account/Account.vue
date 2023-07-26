<template>
  <v-container>
    <div v-if="authIsReady && user" class="d-flex justify-center">
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
                <v-card-title class="mb-4">Account Info</v-card-title>
              </v-col>
              <v-col cols="12">
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
                <v-text-field
                  class="text-grey"
                  name="user id"
                  label="User ID"
                  type="text"
                  v-model="user.uid"
                  placeholder="Your user id"
                  readonly
                ></v-text-field>
                <v-card flat v-if="error" rounded="lg" color="error">
                  <v-card-text>{{ error }}</v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row
              no-gutters
              class="fill-height"
              align="center"
              justify="center"
            >
              <v-col cols="12">
                <v-card-title class="mb-4">Change Password</v-card-title>
              </v-col>
              <v-col cols="12">
                <v-form ref="form" @submit.prevent="changePassword()">
                  <v-text-field
                    name="new password"
                    label="New password"
                    type="password"
                    :rules="[(v) => !!v || 'Password is required']"
                    v-model="newPassword"
                    placeholder="Your new password"
                    required
                  ></v-text-field>
                  <v-btn
                    color="primary"
                    variant="text"
                    type="submit"
                    block
                    class="mt-2"
                    >Change Password</v-btn
                  >
                </v-form>
              </v-col>
            </v-row>
          </v-card>
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row
              no-gutters
              class="fill-height"
              align="center"
              justify="center"
            >
              <v-col cols="12">
                <v-card-title class="mb-4">Delete Account</v-card-title>
              </v-col>
              <v-col cols="12">
                <v-form ref="form" @submit.prevent="dialog = true">
                  <v-btn
                    color="primary"
                    variant="text"
                    type="submit"
                    block
                    class="mt-2"
                    >Delete Account</v-btn
                  >
                  <v-dialog v-model="dialog" width="auto">
                    <v-card flat rounded="lg" class="text-center primary">
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
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>
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
    const form = ref(null);
    const dialog = ref(false);
    const user = computed(() => store.state.user);

    const changePassword = async () => {
      try {
        const validation = await form.value.validate();
        console.log(validation);
        if (!validation.valid) return;

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
      error,
      form,
      authIsReady: computed(() => store.state.authIsReady),
      changePassword,
      deleteAccount,
    };
  },
};
</script>
