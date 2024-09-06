<template>
  <v-card class="ma-4" flat rounded="lg">
    <v-card-text class="mt-2">
      <v-row align="center" justify="center">
        <div>
          <span class="text-h5">€</span>
          <span class="text-h3">{{ price }}</span>
          <v-label class="ml-1 text-xl font-normal text-gray-500">/ month</v-label>
        </div>
      </v-row>
      <v-row no-gutters class="mt-8 ml-6">
        <v-col cols="12" align="start" align-content="start">
          <v-icon color="primary" start icon="mdi-check-bold"></v-icon><span>{{ text1 }}</span>
        </v-col>
        <v-col cols="12" align="start" align-content="start">
          <v-icon color="primary" start icon="mdi-check-bold"></v-icon><span>{{ text2 }}</span>
        </v-col>
        <v-col cols="12" align="start" align-content="start">
          <v-icon color="primary" start icon="mdi-check-bold"></v-icon><span>{{ text3 }}</span>
        </v-col>
        <v-col cols="12" align="start" align-content="start">
          <v-icon v-if="!text4" color="transparent" start icon="mdi-check-bold"></v-icon
          ><v-icon v-else color="primary" start icon="mdi-check-bold"></v-icon
          ><span>{{ text4 }}</span>
        </v-col>
      </v-row>
    </v-card-text>
    <a @click="pricingTableDialog = false" :href="checkoutUrl" style="text-decoration: none"
      ><v-btn v-if="!hideButton" class="mb-2" variant="text" color="primary" block>{{
        buttonText
      }}</v-btn>
      <v-btn v-else disabled class="mb-2" variant="text" color="primary" block></v-btn
    ></a>
  </v-card>
</template>

<script>
//External
import { onMounted, ref } from "vue";

//Composables
import { getCheckoutUrl } from "@/composables/account/stripePayment";

export default {
  name: "PlanCard",
  props: [
    "price",
    "hideButton",
    "buttonText",
    "text1",
    "text2",
    "text3",
    "text4",
    "priceId",
    "user",
  ],
  emits: ["planSelected"],
  setup(props, context) {
    const checkoutUrl = ref("");

    onMounted(async () => {
      //TODO: Open session only on click (window.location.href = "http://example.com";)
      //TODO: Close dialog on click
      //TODO: Use QUOTA and add appropriate error messages if quota is exceeded
      //TODO: Add "Subscribe" Deep Link in error message
      //TODO: Test "auto delete subscriptions when account deleted"
      //TODO: Switch to production keys
      if (props.user && props.priceId)
        checkoutUrl.value = await getCheckoutUrl(props.user, props.priceId);
    });

    return { checkoutUrl };
  },
};
</script>
