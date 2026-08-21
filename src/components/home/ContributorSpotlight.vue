<template>
  <!-- The skeleton is the same shell, so the space the card will occupy is
       reserved before the snapshot arrives and the build lists below do not get
       shoved down when it does. Both states share `min-height` through the body
       class rather than restating a number, which is what keeps them the same
       height as the design changes. -->
  <v-card
    v-if="loading || contributor"
    flat
    rounded="lg"
    class="contributor-spotlight mb-6"
    :style="{ border: '1px solid ' + $vuetify.theme.current.colors.accent }"
  >
    <div class="contributor-spotlight__body">
      <ContributorIdentity :contributor="contributor ?? {}" :loading="loading" :avatar-size="92">
        <template v-slot:eyebrow>
          <!-- No "·" separator here, unlike the event banner. There it divides a
               category from a changing state ("Registration open" → "Playing
               now"); a contributor has no state, so the second half would be
               filler pretending to be information. -->
          <span class="contributor-spotlight__eyebrow">
            <v-icon size="16">mdi-account-star</v-icon>
            Contributor spotlight
          </span>
        </template>

        <template v-slot:actions>
          <v-btn
            :to="{ name: 'Builds', query: { author: contributor.id } }"
            color="primary"
            variant="flat"
            size="small"
          >
            See all builds
          </v-btn>
        </template>
      </ContributorIdentity>
    </div>
  </v-card>
</template>

<script>
import ContributorIdentity from "@/components/page/ContributorIdentity.vue";

/**
 * One member of the community, introduced at the top of the home page.
 *
 * Occupies the same slot as EventBanner and renders only when that banner is
 * not showing — Home makes that decision, because a component hidden by `v-if`
 * cannot report its own absence. Deliberately the same construction as the
 * banner: a translucent wash over whatever surface the theme provides, so there
 * is no second palette to keep in step.
 *
 * The card is not itself a link. It carries a secondary outbound link to the
 * contributor's channel, and wrapping the whole card would swallow it.
 */
export default {
  name: "ContributorSpotlight",
  components: { ContributorIdentity },
  props: {
    // The featuredContributor object from the home snapshot, or null when
    // nobody is nominated. Null renders nothing at all — no card, no
    // placeholder, no gap above the build lists.
    contributor: { type: Object, default: null },
    // True while the home snapshot is still in flight. Home only sets this when
    // it has reason to believe a card is coming; see the note there.
    loading: { type: Boolean, default: false },
  },
};
</script>

<style scoped>
.contributor-spotlight {
  overflow: hidden;
}

/* The same technique as the event banner, mirrored — gold-led rather than
   navy-led — so the two read as one family without being confusable at a
   glance. Both stops are translucent, which lets the light and dark surfaces
   underneath show through unchanged. */
/* No min-height. The placeholder inside ContributorIdentity mirrors the real
   card's own structure, so the reserved height IS the card's height at every
   width. A hand-measured floor here was wrong on desktop and right on mobile
   only by luck, and it would have gone stale the next time the type scale
   moved. */
.contributor-spotlight__body {
  padding: 20px 24px;
  background:
    radial-gradient(110% 150% at 0% 50%, rgba(185, 150, 47, 0.16), transparent 62%),
    radial-gradient(90% 140% at 100% 0%, rgba(41, 71, 144, 0.12), transparent 60%);
}

.contributor-spotlight__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--hero-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.4px;
}

/* Matches the event banner's stacking point, because they share a slot and must
   break at the same width. */
@media (max-width: 620px) {
  .contributor-spotlight__body {
    padding: 18px 16px;
  }
}
</style>
