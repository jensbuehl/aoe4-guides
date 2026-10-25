<template>
  <!-- Retires itself after RELEASE.ends; Home asks the same predicate to hand
       the slot to the contributor spotlight. See src/config/release.js. -->
  <HomeBanner
    v-if="!isOver"
    eyebrow-icon="mdi-alert-decagram"
    :eyebrow="released ? 'New expansion · Available now' : 'New expansion · ' + RELEASE.dateLabel"
    :title="RELEASE.title"
  >
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

    <template #facts>
      <v-chip
        v-for="civ in civs"
        :key="civ.code"
        size="small"
        variant="tonal"
        color="accent"
        :href="civ.page"
        target="_blank"
        rel="noopener"
      >
        <CivFlag :civ="civ.code" class="mr-2" />
        {{ civ.title }} · {{ civ.tagLine }}
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
      <!-- Four buttons per state, so none wraps alone onto a second row at the
           md=8 column. After release the builds take the trailer's place; the
           trailer is in the news card by then. Before it, the civ chips above
           already lead to the official civ pages, so the dev blog is left out. -->
      <template v-if="released">
        <v-btn
          v-for="civ in civs"
          :key="civ.code"
          :to="{ name: 'Dashboard', query: { civ: civ.code } }"
          variant="text"
          size="small"
          color="primary"
        >
          <template #prepend><CivFlag :civ="civ.code" /></template>
          {{ civ.title }}
        </v-btn>
      </template>
      <template v-else>
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
import { computed } from "vue";
import { RELEASE, isReleased, isReleaseLive } from "@/config/release";
import { getCivById } from "@/composables/filter/civDefaultProvider";
import HomeBanner from "@/components/home/HomeBanner.vue";
import CivFlag from "@/components/common/CivFlag.vue";

export default {
  name: "ReleaseBanner",
  components: { HomeBanner, CivFlag },
  setup() {
    // Read once per mount, as EventBanner does — the wording changes twice in
    // the banner's life and nobody keeps the page open across either.
    const now = new Date();
    const civs = RELEASE.civs.map((c) => ({ ...c, ...getCivById(c.code) }));
    return {
      RELEASE,
      civs,
      released: computed(() => isReleased(now)),
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

@media (max-width: 620px) {
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
