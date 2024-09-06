<template>
  <v-container>
    <div v-if="authIsReady && user" class="d-flex justify-center">
      <v-row no-gutters class="fill-height" align="center" justify="center">
        <v-col cols="12" sm="6" lg="4">
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row no-gutters class="fill-height" align="center" justify="center">
              <v-col cols="12">
                <v-card-title>Account Info</v-card-title>
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
                <v-text-field
                  class="text-grey"
                  name="user id"
                  label="Subscription plan"
                  type="text"
                  v-model="subscriptionStatus"
                  placeholder="Your current subscription plan"
                  readonly
                ></v-text-field>
                <v-btn
                  @click="pricingTableDialog = true"
                  class="mb-2"
                  v-if="!subscriptionStatus || subscriptionStatus == 'FREE'"
                  color="primary"
                  variant="text"
                  block
                >
                  <v-dialog v-model="pricingTableDialog" width="auto">
                    <v-card flat rounded="lg" class="text-center primary">
                      <v-card-title>Subscription Plan Selection</v-card-title>
                      <a
                        @click="pricingTableDialog = false"
                        :href="checkoutUrlPRO"
                        style="text-decoration: none"
                        ><v-btn class="mb-2" variant="text" color="primary" block>Go PRO</v-btn></a
                      >
                      <a
                        @click="pricingTableDialog = false"
                        :href="checkoutUrlFAN"
                        style="text-decoration: none"
                        ><v-btn class="mb-2" variant="text" color="primary" block
                          >Become a FAN</v-btn
                        ></a
                      >
                    </v-card> </v-dialog
                  >Subscribe</v-btn
                >
                <a v-else :href="portalUrl" style="text-decoration: none"
                  ><v-btn class="mb-2" variant="text" color="primary" block
                    >Manage Subscription</v-btn
                  ></a
                >
              </v-col>
            </v-row>
          </v-card>
          <v-card v-if="!user.emailVerified" flat rounded="lg" class="d-flex align-center mb-4">
            <v-row no-gutters class="fill-height" align="center" justify="center">
              <v-col cols="12">
                <v-card-title>Verify Email</v-card-title>
                <v-card-text
                  >Re-send email verification link. Verification is needed for build order
                  notifications.</v-card-text
                >
              </v-col>
              <v-col cols="12">
                <v-form ref="form" @submit.prevent="verifyEmail()">
                  <v-btn color="primary" variant="text" type="submit" block>Verify Email</v-btn>
                </v-form>
              </v-col>
            </v-row>
          </v-card>
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row no-gutters class="fill-height" align="center" justify="center">
              <v-col cols="12">
                <v-card-title>Change Password</v-card-title>
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
                  <v-btn class="mb-2" color="primary" variant="text" type="submit" block
                    >Change Password</v-btn
                  >
                </v-form>
              </v-col>
            </v-row>
          </v-card>
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row no-gutters class="fill-height" align="center" justify="center">
              <v-col cols="12">
                <v-card-title>Delete Account</v-card-title>
                <v-card-text>Permanently delete your account.<br /> </v-card-text>
              </v-col>
              <v-col cols="12">
                <v-form ref="form" @submit.prevent="deleteAccountDialog = true">
                  <v-btn
                    class="mb-2"
                    color="primary"
                    variant="text"
                    type="submit"
                    block
                    >Delete Account</v-btn
                  >
                  <v-dialog v-model="deleteAccountDialog" width="auto">
                    <v-card flat rounded="lg" class="text-center primary">
                      <v-card-title>Delete Account</v-card-title>
                      <v-card-text>
                        Do you really want to delete your account?<br />
                        The action cannot be undone. Open subscriptions will be cancelled for you.
                      </v-card-text>
                      <v-card-actions>
                        <v-btn color="error" block @click="deleteAccount()">Delete</v-btn>
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
//Composables
import { getCheckoutUrl, getPortalUrl } from "@/composables/account/stripePayment";
import { getSubscriptionStatus } from "@/composables/account/getSubscriptionStatus";

//External
import { ref } from "vue";
import { computed, onMounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

export default {
  name: "Account",
  setup() {
    const newPassword = ref("");
    const router = useRouter();
    const store = useStore();
    const form = ref(null);
    const deleteAccountDialog = ref(false);
    const user = computed(() => store.state.user);

    //subscriptions
    const pricingTableDialog = ref(false);
    const subscriptionStatus = ref("");
    const portalUrl = ref("");
    const checkoutUrlPRO = ref("");
    const checkoutUrlFAN = ref("");

    onMounted(async () => {
      //TODO: Test if customer is deleted automatically when deleting the user!
      if (user.value) {
        updateSubscriptionStatus();
        updatePortalUrl();
        updatePurchaseURLs();
      }
    });

    watch(user, async (newUser, oldUser) => {
      if (newUser) {
        updateSubscriptionStatus();
        updatePortalUrl();
        updatePurchaseURLs();
      }
    });

    const updatePurchaseURLs = async () => {
      checkoutUrlPRO.value = await getCheckoutUrl(user.value, "price_1PvdIIRtu5kQ0RoUGRX41jvI");
      checkoutUrlFAN.value = await getCheckoutUrl(user.value, "price_1PvdIIRtu5kQ0RoUGRX41jvI");
      console.log("checkoutUrlPRO", checkoutUrlFAN.value);
      console.log("checkoutUrlFAN", checkoutUrlPRO.value);
    };

    const updateSubscriptionStatus = async () => {
      subscriptionStatus.value = await getSubscriptionStatus(user.value);
    };

    const updatePortalUrl = async () => {
      portalUrl.value = await getPortalUrl(user);
    };

    const changePassword = async () => {
      try {
        const validation = await form.value.validate();
        console.log(validation);
        if (!validation.valid) return;

        await store.dispatch("changePassword", {
          password: newPassword.value,
        });
        store.dispatch("showSnackbar", {
          text: `Password changed successfully!`,
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

    const deleteAccount = async () => {
      try {
        deleteAccountDialog.value = false;
        await store.dispatch("deleteAccount");
        store.dispatch("showSnackbar", {
          text: `Account deleted successfully!`,
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

    const verifyEmail = async () => {
      try {
        await store.dispatch("verifyEmail");
        store.dispatch("showSnackbar", {
          text: `Verification email sent!`,
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
      newPassword,
      router,
      user,
      deleteAccountDialog,
      form,
      authIsReady: computed(() => store.state.authIsReady),
      changePassword,
      deleteAccount,
      verifyEmail,
      //subscriptions
      pricingTableDialog,
      portalUrl,
      subscriptionStatus,
      checkoutUrlPRO,
      checkoutUrlFAN,
    };
  },
};
</script>
