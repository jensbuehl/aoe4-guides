<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-row no-gutters class="fill-height" align="center" justify="center">
        <v-col cols="12" sm="6" lg="4">
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row no-gutters class="fill-height" align="center" justify="center">
              <v-col cols="12">

                <!-- Loading -->
                <template v-if="state === 'loading'">
                  <v-card-text>Processing your request…</v-card-text>
                </template>

                <!-- Unsubscribed -->
                <template v-else-if="state === 'unsubscribed'">
                  <v-card-title>Unsubscribed</v-card-title>
                  <v-card-text>
                    You will no longer receive comment notifications for this build order.
                  </v-card-text>
                  <v-btn
                    color="primary"
                    variant="text"
                    block
                    @click="resubscribe"
                  >Re-subscribe</v-btn>
                </template>

                <!-- Re-subscribed -->
                <template v-else-if="state === 'resubscribed'">
                  <v-card-title>Re-subscribed</v-card-title>
                  <v-card-text>
                    You will receive comment notifications for this build order again.
                  </v-card-text>
                </template>

                <!-- Error -->
                <template v-else-if="state === 'error'">
                  <v-card-title>Invalid Link</v-card-title>
                  <v-card-text>This unsubscribe link is invalid or has already been used.</v-card-text>
                </template>

              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { processUnsubscribeNotification } from "@/composables/data/notificationService";

export default {
  name: "Unsubscribe",
  setup() {
    const route = useRoute();
    const state = ref("loading");
    const userId = route.query.uid;
    const buildId = route.query.bid;
    const token = route.query.t;

    onMounted(async () => {
      if (!userId || !buildId || !token) {
        state.value = "error";
        return;
      }
      try {
        await processUnsubscribeNotification({ userId, buildId, token, action: "unsubscribe" });
        state.value = "unsubscribed";
      } catch {
        state.value = "error";
      }
    });

    async function resubscribe() {
      try {
        await processUnsubscribeNotification({ userId, buildId, token, action: "resubscribe" });
        state.value = "resubscribed";
      } catch {
        state.value = "error";
      }
    }

    return { state, resubscribe };
  },
};
</script>
