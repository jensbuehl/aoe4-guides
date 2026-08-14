<template>
  <div height="100px">
    <v-footer padless class="text-center d-flex flex-column">
      <v-row justify="center" class="mt-2 mb-16 mb-sm-4 text-center">
        <v-col cols="12">
          <a href="https://discord.gg/Nau9BN5E7J"
            ><v-btn class="mx-1" variant="text" color="primary">
              <template v-slot:prepend>
                <v-icon color="primary">mdi-chat</v-icon>
              </template>
              Discord
            </v-btn></a
          >
          <v-btn prepend-icon="mdi-github" class="mx-1" variant="text" color="primary" to="/github"
            >Contribute
          </v-btn>
          <v-btn prepend-icon="mdi-api" class="mx-1" variant="text" color="primary" to="/apidoc"
            >Interface
          </v-btn>
          <v-btn
            prepend-icon="mdi-shield-account"
            class="mx-1"
            variant="text"
            color="primary"
            to="/privacy"
            >Privacy Policy
          </v-btn>
          <v-btn
            prepend-icon="mdi-information"
            class="mx-1"
            variant="text"
            color="primary"
            to="/about"
            >About
          </v-btn>
        </v-col>
        <v-col cols="12" md="8"
          >Age of Empires IV&copy; Microsoft Corporation. aoe4guides.com was created under
          Microsoft's
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            style="text-decoration: none"
            href="https://www.xbox.com/en-US/developers/rules"
            >Game Content Usage Rules</a
          >
          using assets from
          <a
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            style="text-decoration: none"
            href="https://www.ageofempires.com/games/age-of-empires-iv/"
            >Age of Empires IV</a
          >, and it is not endorsed by or affiliated with Microsoft.</v-col
        >
        <v-col v-if="showFunding" cols="12" class="pt-0">
          <FundingStatus variant="compact" />
        </v-col>
        <v-col cols="12"
          ><v-label>v{{ version }}</v-label></v-col
        >
      </v-row>
    </v-footer>

  </div>
</template>

<script>
//External
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

//Components
import FundingStatus from "@/components/common/FundingStatus.vue";

/**
 * Routes that render their own funding block, and so must not also get the
 * footer's. Exactly one ask per page: a second, plainer one sitting below a
 * specific "€85 of €240" line makes the specific one read as decoration.
 *
 * ADD TO THIS LIST whenever a page gains its own <FundingStatus>. The footer
 * cannot detect it — a reactive registry could, but the footer and the page do
 * not mount in a guaranteed order, so it would render the line and retract it a
 * tick later on every single page load. A visible flicker everywhere is a bad
 * trade for avoiding a list of three.
 */
const ROUTES_WITH_OWN_FUNDING_BLOCK = ["Home", "About", "Account"];

export default {
  name: "Footer",
  components: { FundingStatus },
  setup() {
    const version = APP_VERSION;
    const route = useRoute();

    const showFunding = computed(
      () => !ROUTES_WITH_OWN_FUNDING_BLOCK.includes(route.name)
    );

    return {
      showFunding,
      version,
    };
  },
};
</script>


