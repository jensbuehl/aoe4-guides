<template>
  <!-- Compact: one line, for the footer, where this sits on every page that
       does not carry its own. Kept to a single wrapping sentence so it cannot
       push the footer into horizontal overflow on a phone. -->
  <div v-if="variant === 'compact'" class="fs-compact text-body-2 text-medium-emphasis">
    <!-- One span per sentence, so that when this wraps it wraps *between*
         sentences. As one string the break lands wherever the container edge
         happens to fall, which orphaned the "€10" away from "of that is covered
         so far" — the number is the point of the line, and a number alone at
         the end of a row reads as a truncation. -->
    <span v-for="(part, index) in headlineParts" :key="index" class="fs-sentence">
      {{ part }}
    </span>
    <a :href="kofiUrl" target="_blank" rel="noopener" class="fs-compact-link">
      <v-btn variant="text" size="small" color="primary" class="ml-1">
        <template v-slot:prepend>
          <v-icon color="red" size="small">mdi-heart</v-icon>
        </template>
        {{ actionLabel }}
      </v-btn>
    </a>
  </div>

  <!-- Card: the primary treatment, for the home sidebar, About and the account
       page. Borrows RegisterAd's card shape so the sidebar stack reads as one
       set rather than as this being bolted on. -->
  <v-card
    v-else
    flat
    rounded="lg"
    class="mb-4"
    :style="{ border: '1px solid ' + $vuetify.theme.current.colors.accent }"
  >
    <!-- Default title colour with a primary icon, matching News, TopContributors
         and YoutubeGuides. RegisterAd's accent title is the exception in this
         stack, not the rule — it is a call to action and is coloured to stand
         out from its neighbours, which is precisely what this card should not
         do beside it. -->
    <v-card-title class="px-4 py-2 pb-2">
      <span class="v-card-title pa-0 d-flex align-center">
        <v-icon icon="mdi-heart" size="small" class="mr-4" color="primary"></v-icon>
        {{ title }}
      </span>
    </v-card-title>
    <v-card-text class="px-4">
      <div class="text-body-2 text-medium-emphasis">{{ headlineParts.join(" ") }}</div>

      <!-- Only once something has come in. An empty bar under an empty month
           reads as a failure notice, which is the one thing the empty state
           must not do. -->
      <v-progress-linear
        v-if="state !== 'empty'"
        :model-value="percentCovered"
        :color="isCovered ? 'success' : 'accent'"
        height="6"
        rounded
        class="mt-3"
      ></v-progress-linear>

      <div v-if="state !== 'empty'" class="text-caption text-medium-emphasis mt-2">
        {{ detail }}
      </div>

      <!-- One button. Ko-fi presents €2/€5/€10 and one-off-or-monthly on the
           page itself and there is no deep link into a particular choice, so
           splitting this in two would only pre-empt a decision the destination
           asks better. -->
      <div class="d-flex justify-center mt-3">
        <a :href="kofiUrl" target="_blank" rel="noopener" style="text-decoration: none">
          <v-btn variant="text" size="small" color="primary">
            <template v-slot:prepend>
              <v-icon color="red">mdi-heart</v-icon>
            </template>
            {{ actionLabel }}
          </v-btn>
        </a>
      </div>
      <div class="text-caption text-medium-emphasis text-center mt-1">
        {{ kofiTiers }}.
      </div>
      <div class="text-caption text-medium-emphasis text-center mt-1">
        Nothing on the site is behind this, and nothing will be.
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { computed } from "vue";
import { useFunding } from "@/composables/useFunding";

/**
 * What a year of running this site costs and how far the community has got.
 *
 * Deliberately not a generic "Donate" button: a heart with no number attached
 * is what the site had for two years, and it never covered the costs. A finite,
 * nearly-reached goal asks someone to finish something rather than to give into
 * a void.
 *
 * The three readings come from `state` rather than being re-derived here, so
 * the empty and over-covered wordings cannot drift apart between the four
 * places this renders.
 */
export default {
  name: "FundingStatus",
  props: {
    variant: {
      type: String,
      default: "card",
      validator: (value) => ["compact", "card"].includes(value),
    },
  },
  setup() {
    const {
      year,
      costEur,
      coveredEur,
      supporterCount,
      showSupporterCount,
      percentCovered,
      isCovered,
      state,
      kofiUrl,
      kofiTiers,
    } = useFunding();

    const money = (value) => "€" + (Math.round(value * 100) / 100).toLocaleString("en-GB");

    const title = computed(() => (state === "covered" ? `${year} is paid for` : "Running costs"));

    //Leads with what actually costs money rather than with the total, which
    //reads less like a fundraising template and more like an explanation.
    //
    //The list has to name everything the figure contains. Naming three things
    //while the number covers four would make the specificity do deceptive work
    //— it reads as more transparent than a vague "running costs" would, so an
    //omission here costs more trust than the vaguer wording ever would have.
    //Returned as separate sentences rather than one string so the compact
    //variant can wrap between them instead of mid-phrase.
    const headlineParts = computed(() => {
      const bill = `Hosting, domain and storage come to about ${money(costEur)} a year, paid out of pocket.`;
      if (state === "empty") {
        return [bill, `Nothing has come in towards ${year} yet.`];
      }
      if (state === "covered") {
        //Does not repeat the title, which already says the year is paid for.
        //Surplus gets a stated destination instead: "over the goal" with no
        //purpose invites the question of why you are still asking.
        return [
          "The community covered the year's hosting.",
          "Anything past the goal goes into the tools I build it with.",
        ];
      }
      return [bill, `${money(coveredEur)} of that is covered so far.`];
    });

    //The count is withheld while it is small — see `showSupporterCount` in the
    //composable. Both branches have to read as finished sentences, not as one
    //with a hole where a number was.
    const detail = computed(() => {
      const people = supporterCount === 1 ? "1 person has" : `${supporterCount} people have`;
      if (isCovered) {
        //Surplus is stated rather than hidden: it is the good news, and a bar
        //stuck at 100% with no explanation looks like a rounding error.
        const surplus = coveredEur - costEur;
        const extra = surplus > 0 ? `${money(surplus)} past the goal` : "";
        if (!showSupporterCount) return extra ? `${extra} — thank you.` : "Thank you.";
        return extra ? `${people} chipped in, ${extra} — thank you.` : `${people} chipped in — thank you.`;
      }
      const togo = `${money(costEur - coveredEur)} to go.`;
      return showSupporterCount ? `${people} chipped in. ${togo}` : togo;
    });

    const actionLabel = computed(() => (isCovered ? "Chip in anyway" : "Support the site"));

    return {
      year,
      percentCovered,
      isCovered,
      state,
      kofiUrl,
      kofiTiers,
      title,
      headlineParts,
      detail,
      actionLabel,
    };
  },
};
</script>

<style scoped>
/* Wraps rather than overflowing: the footer is the one placement where this
   shares a narrow row with other content, and a long year total on a small
   phone would otherwise push the whole footer sideways. */
.fs-compact {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  /* Column gap only: a wrapped sentence should sit directly under the one
     above, not float away from it. */
  gap: 0 6px;
  /* Wide enough for the long sentence to hold one line on a desktop footer,
     bounded so it never runs the full width of a monitor. Not a tuned number:
     the sentences carry their own break points, so this only has to stop the
     line growing unreadably wide. */
  max-width: 46rem;
  margin: 0 auto;
  padding: 0 12px;
  text-align: center;
}

/* Each sentence wraps as a unit where it can, and internally only when it must
   — which on a phone is the correct behaviour for the long one and never
   happens to the short one. */
.fs-sentence {
  display: inline-block;
}

.fs-compact-link {
  text-decoration: none;
}
</style>
