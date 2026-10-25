<template>
  <!-- The shell every announcement in the home page's top slot shares — the
       tournament banner and the expansion banner. What is shown is the
       caller's; how a top-slot announcement looks lives here once, so the two
       cannot drift apart. -->
  <v-card
    flat
    rounded="lg"
    class="home-banner mb-6"
    :style="{ border: '1px solid ' + $vuetify.theme.current.colors.accent }"
  >
    <div class="home-banner__body">
      <div class="home-banner__media"><slot name="media" /></div>

      <div class="home-banner__text">
        <span class="home-banner__eyebrow">
          <v-icon size="16">{{ eyebrowIcon }}</v-icon>
          {{ eyebrow }}
        </span>

        <h2 class="home-banner__title">{{ title }}</h2>

        <p class="home-banner__lead"><slot name="lead" /></p>

        <div v-if="$slots.facts" class="home-banner__facts"><slot name="facts" /></div>

        <div class="home-banner__actions"><slot name="actions" /></div>
      </div>
    </div>
  </v-card>
</template>

<script>
export default {
  name: "HomeBanner",
  props: {
    eyebrow: { type: String, required: true },
    eyebrowIcon: { type: String, required: true },
    title: { type: String, required: true },
  },
};
</script>

<style scoped>
.home-banner {
  overflow: hidden;
}

/* A wash of navy and gold across the card, so the banner reads as an
   announcement rather than as another sidebar card. Both stops are
   translucent, which lets the light and dark surfaces underneath show through
   unchanged — no second palette to keep in sync. */
.home-banner__body {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 20px 24px;
  background:
    radial-gradient(120% 160% at 0% 50%, rgba(41, 71, 144, 0.16), transparent 62%),
    radial-gradient(90% 140% at 100% 0%, rgba(185, 150, 47, 0.14), transparent 60%);
}

.home-banner__media {
  flex: 0 0 auto;
}

.home-banner__text {
  min-width: 0;
}

.home-banner__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--hero-eyebrow);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: 0.4px;
}

/* No text-shadow — see the note in ContributorIdentity.vue. --hero-shadow
   belongs to text sitting on an image (HeroBuild), not to text on a flat
   surface under a translucent wash. */
.home-banner__title {
  color: var(--hero-title);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.15;
  margin: 6px 0 8px;
}

.home-banner__lead {
  color: var(--hero-text);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.home-banner__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.home-banner__facts :slotted(.v-chip) {
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 7px;
}

.home-banner__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

/* Stack below the point where the media plus a readable text column no longer
   fit side by side — measured on the md=8 home column, not guessed from a
   device width. Callers shrink their own media at the same width. */
@media (max-width: 620px) {
  .home-banner__body {
    flex-direction: column;
    text-align: center;
    gap: 14px;
    padding: 18px 16px;
  }

  .home-banner__title {
    font-size: 20px;
  }

  .home-banner__facts,
  .home-banner__actions {
    justify-content: center;
  }
}
</style>
