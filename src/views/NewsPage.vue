<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-card flat class="py-6 px-4 px-sm-10" rounded="lg" width="1024px" fluid>
        <div class="text-body-2 text-medium-emphasis">November 2026</div>
        <h1>The mobile update</h1>
        <p class="mt-4 text-body-1">
          AoE4 Guides now feels at home on your phone. Reading, filtering, playing and writing a
          build order have all been reworked for a small screen, there is a new light theme, and a
          long list of bugs is gone.
        </p>

        <v-divider class="my-8" />

        <h2>Made for your phone</h2>
        <div class="nw-grid mt-6">
          <div v-for="feature in features" :key="feature.title">
            <v-img
              :src="themedShot(feature.shot)"
              :alt="feature.alt"
              :aspect-ratio="TILE_RATIO"
              :position="feature.position"
              cover
              rounded="lg"
              class="nw-shot"
            ></v-img>
            <h3 class="mt-3">{{ feature.title }}</h3>
            <p class="mt-1 text-body-2 text-medium-emphasis">{{ feature.text }}</p>
          </div>
        </div>

        <v-divider class="my-8" />

        <h2>A new light theme</h2>
        <p class="mt-4">
          For bright rooms and daytime reading, the light theme is drawn from Age of Empires' own
          parchment, slate and gold. Open the profile icon at the top right and pick the sun or the
          moon, or the screen to follow your device.
        </p>
        <v-img
          :src="shot('desktop-light')"
          alt="A build order's step table in the light theme, on a desktop screen"
          :aspect-ratio="DESKTOP_RATIO"
          rounded="lg"
          class="nw-shot mt-6 d-none d-sm-block"
        ></v-img>
        <!-- The desktop shot is unreadable at phone width, so phones compare the
             two themes on the screen they are holding. -->
        <div class="nw-pair mt-6 d-sm-none">
          <v-img
            v-for="theme in ['light', 'dark']"
            :key="theme"
            :src="shot(`builds-${theme}`)"
            :alt="`The build list on a phone in the ${theme} theme`"
            :aspect-ratio="PHONE_RATIO"
            rounded="lg"
            class="nw-shot"
          ></v-img>
        </div>

        <v-divider class="my-8" />

        <h2>Tell us how it feels</h2>
        <p class="mt-4">
          Something still awkward on your phone, or a bug that made it through? The Discord is the
          best place to say so.
        </p>
        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn
            href="https://discord.gg/Nau9BN5E7J"
            target="_blank"
            rel="noopener"
            prepend-icon="mdi-chat"
            height="44"
            variant="tonal"
          >
            Discord
          </v-btn>
          <v-btn to="/builds" prepend-icon="mdi-hammer" height="44" variant="tonal">
            Browse builds
          </v-btn>
        </div>
      </v-card>
    </div>
  </v-container>
</template>

<script>
import { useTheme } from "vuetify";

const SHOTS = "/assets/news/mobile-update";

// Set on the images, so the page does not jump as they load in.
const PHONE_RATIO = 393 / 780;
const DESKTOP_RATIO = 1280 / 800;
// Tiles crop the phone shots: at full height a screenshot dwarfs the two lines
// under it. `position` keeps the end of the shot that shows the feature.
const TILE_RATIO = 3 / 4;

const features = [
  {
    title: "Filters in thumb reach",
    text: "Filters and Sort stay above the list as you scroll. Filters open from the bottom and show how many builds match.",
    shot: "filters",
    position: "top",
    alt: "The filter sheet open over the build list on a phone",
  },
  {
    title: "Every civ, by name",
    text: "The civ picker is an A–Z list, with each name beside its flag rather than on top of it.",
    shot: "civs",
    position: "top",
    alt: "The civilization picker as a two-column A–Z list on a phone",
  },
  {
    title: "One tap into Focus mode",
    text: "Play goes straight to Focus mode, one big step at a time. Back closes it, and Play picks up at the same step.",
    shot: "focus",
    position: "bottom",
    alt: "Focus mode on a phone, showing one step with playback controls",
  },
  {
    title: "Timings without a mouse",
    text: "The Timeline has a Details button with click-up and age-up times, and tapping a season shows when it ran.",
    shot: "timeline",
    position: "top",
    alt: "The Timeline with its details open, above the steps of a build order",
  },
  {
    title: "Write builds on the go",
    text: "Every icon has its name, sorted into eight sections. Fields bring up the right keyboard, and 130 becomes 1:30.",
    shot: "icons",
    position: "top",
    alt: "The full-screen icon picker on a phone, with named icons and section chips",
  },
  {
    title: "Your work is kept",
    text: "If your phone closes the tab in the background, your unsaved work is offered back when you return.",
    shot: "draft",
    position: "top",
    alt: "The build editor on a phone, offering to restore unsaved changes",
  },
];

export default {
  name: "NewsPage",
  setup() {
    const theme = useTheme();
    const shot = (name) => `${SHOTS}/${name}.webp`;
    // The screenshots follow the reader's theme, so the page doesn't flash a
    // dark phone at someone reading in light.
    const themedShot = (name) => shot(`${name}-${theme.current.value.dark ? "dark" : "light"}`);

    return { DESKTOP_RATIO, PHONE_RATIO, TILE_RATIO, features, shot, themedShot };
  },
};
</script>

<style scoped>
/* Six tiles divide evenly into one, two or three columns, so no width leaves a
   hole in the last row. */
.nw-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 32px 24px;
}

.nw-shot {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* Two shots side by side, shrinking together on the narrowest phones. */
.nw-pair {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 260px));
  justify-content: center;
  gap: 16px;
}
</style>
