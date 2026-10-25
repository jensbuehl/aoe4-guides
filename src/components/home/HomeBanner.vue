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
        <div class="home-banner__head">
          <span class="home-banner__eyebrow">
            <v-icon size="16">{{ eyebrowIcon }}</v-icon>
            {{ eyebrow }}
          </span>

          <h2 class="home-banner__title">{{ title }}</h2>

          <p class="home-banner__lead"><slot name="lead" /></p>
        </div>

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
/* The layout follows the card's own width, not the viewport's: the card is the
   whole column on phones but 8/12 of it from md up, so at 960px the window
   grows while the card shrinks, and a viewport breakpoint wrapped the chips
   and buttons there. Callers query the same container for their media. */
.home-banner {
  overflow: hidden;
  container: home-banner / inline-size;
}

/* A wash of navy and gold across the card, so the banner reads as an
   announcement rather than as another sidebar card. Both stops are
   translucent, which lets the light and dark surfaces underneath show through
   unchanged — no second palette to keep in sync. */
.home-banner__body {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas: "media text";
  align-items: center;
  column-gap: 22px;
  padding: 20px 24px;
  background:
    radial-gradient(120% 160% at 0% 50%, rgba(41, 71, 144, 0.16), transparent 62%),
    radial-gradient(90% 140% at 100% 0%, rgba(185, 150, 47, 0.14), transparent 60%);
}

.home-banner__media {
  grid-area: media;
}

.home-banner__text {
  grid-area: text;
  min-width: 0;
}

.home-banner__head {
  grid-area: head;
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
  grid-area: facts;
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
  grid-area: actions;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

/* Three layouts, by the card's inner width. Measured, not guessed, on the
   release banner in both of its states: the widest row is 505px (the civ
   chips after release; the buttons before it are 503px). Side by side needs
   that plus 150px of flags, the 22px gap and 48px of padding, so 725px. The
   middle layout keeps the media beside the heading and gives the chips and
   buttons the full width, which needs 505 + 48 = 553px. Below that, stack.
   EventBanner shares these, so re-measure if either banner's rows grow. */
@container home-banner (width < 725px) {
  .home-banner__body {
    grid-template-areas:
      "media head"
      "facts facts"
      "actions actions";
  }

  /* Its three children become grid items of the body, so the chips and
     buttons can span under the media. */
  .home-banner__text {
    display: contents;
  }

  .home-banner__facts {
    margin-top: 4px;
  }
}

@container home-banner (width < 553px) {
  .home-banner__body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "media"
      "text";
    justify-items: center;
    row-gap: 14px;
    text-align: center;
    padding: 18px 16px;
  }

  .home-banner__text {
    display: block;
  }

  .home-banner__facts {
    margin-top: 0;
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
