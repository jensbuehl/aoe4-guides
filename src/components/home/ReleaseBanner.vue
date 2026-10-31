<template>
  <!-- Retires itself after RELEASE.ends; Home asks the same predicate to hand
       the slot to the contributor spotlight. See src/config/release.js. -->
  <HomeBanner
    v-if="!isOver"
    eyebrow-icon="mdi-alert-decagram"
    :eyebrow="released ? 'New expansion · Available now' : 'New expansion · ' + RELEASE.dateLabel"
    :title="RELEASE.title"
    v-model:expanded="expanded"
    :compact="seen"
  >
    <!-- The strip keeps the one thing a returning reader came back for: a way
         to the new civs. Flags alone: at 360px the names would truncate the
         title to a few letters, and a reader only ever gets the strip after
         the full banner has named the flags for them. -->
    <template #strip>
      <v-btn
        v-for="civ in civs"
        :key="civ.code"
        icon
        variant="text"
        size="44"
        :aria-label="released ? civ.title + ' builds' : civ.title + ' on ageofempires.com'"
        v-bind="civLink(civ)"
      >
        <img class="release-banner__strip-flag" :src="civ.flagSmall" alt="" width="32" height="18" />
      </v-btn>
    </template>

    <template #media>
      <div class="release-banner__flags">
        <img
          v-for="civ in civs"
          :key="civ.code"
          class="release-banner__flag"
          :src="civ.flagLarge"
          :alt="civ.title + ' flag'"
          width="455"
          height="256"
          loading="lazy"
          decoding="async"
        />
      </div>
    </template>

    <template #lead>
      {{ RELEASE.lead }}
      <strong v-if="released">Both are in the build order editor now, every unit, building, technology and landmark.</strong>
      <strong v-else>Both are prepared in the build order editor and will be available on release day.</strong>
    </template>

    <!-- One chip per civ and one path: before release to the official civ page,
         after it to our builds for that civ, with a chevron to say so. There
         are no separate civ buttons below, which would only repeat these. -->
    <template #facts>
      <v-chip
        v-for="civ in civs"
        :key="civ.code"
        size="small"
        variant="tonal"
        color="accent"
        v-bind="civLink(civ)"
      >
        <CivFlag :civ="civ.code" class="mr-2" />
        {{ civ.title }} · {{ civ.tagLine }}
        <v-icon v-if="released" end size="14">mdi-chevron-right</v-icon>
      </v-chip>
    </template>

    <template #actions>
      <v-btn
        :href="RELEASE.links.steam"
        target="_blank"
        rel="noopener"
        color="primary"
        variant="flat"
        size="small"
        prepend-icon="mdi-steam"
      >
        {{ released ? "Get it on Steam" : "Pre-order on Steam" }}
      </v-btn>
      <v-btn :href="RELEASE.links.xbox" target="_blank" rel="noopener" variant="text" size="small" color="primary" prepend-icon="mdi-microsoft-xbox">
        Xbox &amp; PC
      </v-btn>
      <!-- After release the store links are all that is left here: the civ chips
           above lead to the builds, and the trailer is in the news card by then.
           Before it, the chips lead to the official civ pages, so the dev blog
           is left out. -->
      <template v-if="!released">
        <v-btn :href="RELEASE.links.trailer" target="_blank" rel="noopener" variant="text" size="small" color="primary" prepend-icon="mdi-youtube">
          Trailer
        </v-btn>
        <v-btn :href="RELEASE.links.reddit" target="_blank" rel="noopener" variant="text" size="small" color="primary" prepend-icon="mdi-reddit">
          Reddit
        </v-btn>
      </template>
    </template>
  </HomeBanner>
</template>

<script>
import { computed, onMounted, ref } from "vue";
import { RELEASE, isReleased, isReleaseLive } from "@/config/release";
import { getCivById, civPageRoute } from "@/composables/filter/civDefaultProvider";
import HomeBanner from "@/components/home/HomeBanner.vue";
import CivFlag from "@/components/common/CivFlag.vue";

// Which announcement this browser has already been shown in full. One key,
// overwritten by each announcement, holding *which* one: the next DLC has a
// new title, so it is unseen without anyone remembering to clear anything.
// The release-day flip counts as a new announcement too — "pre-order" and
// "available now, in the editor" are different news, and a reader who saw the
// first should see the second once.
const SEEN_KEY = "aoe4guides.releaseSeen";

// Both decided once per page load, not per mount. Home remounts on every Back,
// and the router restores the scroll position it saved for the old layout. A
// banner that turned into the strip between those two mounts — because the
// first mount just wrote the key — moved every civ tile up by ~370px, and Back
// landed the reader half under the app bar. So the form chosen on a load's
// first mount holds for the rest of that load, and the strip appears on the
// next full load. `expanded` is kept the same way, so Back restores an opened
// banner open.
let seenThisLoad = null;
const expanded = ref(false);

export default {
  name: "ReleaseBanner",
  components: { HomeBanner, CivFlag },
  setup() {
    // Read once per mount, as EventBanner does — the wording changes twice in
    // the banner's life and nobody keeps the page open across either.
    const now = new Date();
    const civs = RELEASE.civs.map((c) => ({ ...c, ...getCivById(c.code) }));
    const released = computed(() => isReleased(now));

    // The chip's link props for the current state: our builds once the civ is
    // out, the official civ page until then.
    const civLink = (civ) =>
      released.value
        ? { to: civPageRoute(civ.code) }
        : { href: civ.page, target: "_blank", rel: "noopener" };

    // Read in setup, before the first render, so the page paints in its final
    // form — reading it after mount would paint the full banner and then fold
    // it, the largest layout shift this page could produce. When storage is
    // unavailable (private mode, blocked site data) nothing is ever "seen" and
    // the banner shows in full, as it did before the strip existed.
    const announcement = RELEASE.title + (released.value ? " · out" : " · pre-order");
    if (seenThisLoad === null) {
      seenThisLoad = false;
      try {
        seenThisLoad = localStorage.getItem(SEEN_KEY) === announcement;
      } catch {
        // Unreadable storage: show it in full.
      }
    }

    // Shown, so seen — whichever form was on screen, and it takes effect on
    // the next page load (see seenThisLoad). Writing on every mount keeps this
    // one line: after the first, the value is already there.
    onMounted(() => {
      if (!isReleaseLive(now)) return;
      try {
        localStorage.setItem(SEEN_KEY, announcement);
      } catch {
        // Unwritable storage: the next visit shows it in full again.
      }
    });

    return {
      RELEASE,
      civs,
      released,
      civLink,
      seen: seenThisLoad,
      expanded,
      isOver: computed(() => !isReleaseLive(now)),
    };
  },
};
</script>

<style scoped>
/* Two flags fanned like cards, the second overlapping the first. */
.release-banner__flags {
  position: relative;
  width: 150px;
  height: 104px;
}

.release-banner__flag {
  position: absolute;
  width: 112px;
  height: 63px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
}

.release-banner__flag:first-child {
  top: 0;
  left: 0;
  transform: rotate(-6deg);
}

.release-banner__flag:last-child {
  bottom: 0;
  right: 0;
  transform: rotate(5deg);
}

/* The flag at its own 16:9, drawn small inside a 44px target. */
.release-banner__strip-flag {
  width: 32px;
  height: 18px;
  object-fit: cover;
  border-radius: 3px;
}

/* Smaller media once HomeBanner stacks; the same container and width as its
   own narrow layout. */
@container home-banner (width < 553px) {
  .release-banner__flags {
    width: 132px;
    height: 92px;
  }

  .release-banner__flag {
    width: 98px;
    height: 55px;
  }
}
</style>
