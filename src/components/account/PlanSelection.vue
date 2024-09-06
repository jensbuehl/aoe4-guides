<template>
  <v-card flat rounded="lg" color="background" max-width="1200" class="text-center pa-4"
    ><v-card-title class="mb-6">Choose your Subscription</v-card-title>
    <v-row no-gutters>
      <v-col cols="12" md="4"
        ><PlanCard
          title="FREE"
          :price="0"
          text1="10 favorites"
          text2="2 unlisted build orders"
          text3="unlimited total build orders"
          :user="user"
          :hideButton="true"
      /></v-col>
      <v-col cols="12" md="4"
        ><PlanCard
          title="FAN"
          :price="1"
          buttonText="Subscribe"
          text1="30 favorites"
          text2="5 unlisted build orders"
          text3="unlimited total build orders"
          text4="FAN badge to show FAN tier"
          :priceId="priceIdFAN"
          :user="user"
      /></v-col>
      <v-col cols="12" md="4"
        ><PlanCard
          title="PRO"
          :price="5"
          buttonText="Subscribe"
          text1="30 favorites"
          text2="unlimited unlisted build orders"
          text3="unlimited total build orders"
          text4="PRO badge to show PRO tier"
          :priceId="priceIdPRO"
          :user="user"
      /></v-col> </v-row
  ></v-card>
</template>

<script>
import PlanCard from "@/components/account/PlanCard.vue";

export default {
  name: "PlanSelection",
  props: ["user"],
  emits: ["planSelected"],
  components: {
    PlanCard,
  },

  setup(props, context) {
    const priceIdFAN = import.meta.env.VITE_FAN_PLAN;
    const priceIdPRO = import.meta.env.VITE_PRO_PLAN;

    return { priceIdFAN, priceIdPRO };
  },
};
</script>
