<template>
  <!-- Nothing to announce once the last final is played: the banner removes
       itself rather than waiting for someone to remember to delete it. -->
  <HomeBanner
    v-if="!isOver"
    eyebrow-icon="mdi-sword-cross"
    :eyebrow="hasStarted ? 'Tournament · Playing now' : 'Tournament · Registration open'"
    :title="EVENT.title"
  >
    <template #media>
      <!-- A plain <img>, like the other fixed-size art on the site. -->
      <img
        class="event-banner__badge"
        :src="EVENT.badge.src"
        :width="EVENT.badge.width"
        :height="EVENT.badge.height"
        :alt="EVENT.badge.alt"
        loading="lazy"
        decoding="async"
      />
    </template>

    <template #lead>
      {{ EVENT.lead.before }} <strong>{{ EVENT.lead.host }}</strong>{{ EVENT.lead.after }}
    </template>

    <template #facts>
      <v-chip size="small" variant="tonal" color="accent">
        <v-icon size="13" start>mdi-calendar</v-icon>
        {{ EVENT.dateLabel }}
      </v-chip>
      <v-chip size="small" variant="tonal" color="accent">
        <v-icon size="13" start>mdi-trophy</v-icon>
        {{ EVENT.prizePool }} prize pool
      </v-chip>
      <v-chip size="small" variant="tonal" color="accent">
        <v-icon size="13" start>mdi-earth</v-icon>
        {{ EVENT.region }}
      </v-chip>
    </template>

    <template #actions>
      <v-btn
        :href="EVENT.links.signup"
        target="_blank"
        rel="noopener"
        color="primary"
        variant="flat"
        size="small"
        append-icon="mdi-open-in-new"
      >
        {{ hasStarted ? "Follow on start.gg" : "Sign up on start.gg" }}
      </v-btn>
      <v-btn
        :href="EVENT.links.twitch"
        target="_blank"
        rel="noopener"
        variant="text"
        size="small"
        color="primary"
        prepend-icon="mdi-twitch"
      >
        Watch
      </v-btn>
      <v-btn
        :href="EVENT.links.liquipedia"
        target="_blank"
        rel="noopener"
        variant="text"
        size="small"
        color="primary"
        prepend-icon="mdi-information-outline"
      >
        Format &amp; maps
      </v-btn>
      <v-btn
        :href="EVENT.links.matcherino"
        target="_blank"
        rel="noopener"
        variant="text"
        size="small"
        color="primary"
      >
        <template v-slot:prepend>
          <v-icon color="red">mdi-heart</v-icon>
        </template>
        Fund the pot
      </v-btn>
    </template>
  </HomeBanner>
</template>

<script>
import { computed } from "vue";

// What this tournament *is* lives in the config module; what an event banner
// *looks like* lives here. The eyebrow wording and the button labels stay
// because they describe any tournament, not this one.
//
// The dates went first and forced the rest: the banner hides itself with
// `v-if`, and a component hidden that way never mounts, so it cannot report its
// own absence. Home reads isEventLive() to decide whether the contributor
// spotlight takes the slot instead.
import { EVENT, hasEventStarted, isEventLive } from "@/config/event";
import HomeBanner from "@/components/home/HomeBanner.vue";

export default {
  name: "EventBanner",
  components: { HomeBanner },
  setup() {
    // Read once per mount rather than on a timer: nobody keeps the home page
    // open across the boundary, and a ticking clock would re-render the page
    // every second for a chip that changes twice in its life.
    const now = new Date();
    return {
      EVENT,
      hasStarted: computed(() => hasEventStarted(now)),
      isOver: computed(() => !isEventLive(now)),
    };
  },
};
</script>

<style scoped>
/* The card, wash, text and layout are HomeBanner's; only the badge is this
   banner's own. */
.event-banner__badge {
  width: 92px;
  height: auto;
  filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.28));
}

/* Smaller media once HomeBanner stacks; the same container and width as its
   own narrow layout. */
@container home-banner (width < 553px) {
  .event-banner__badge {
    width: 76px;
  }
}
</style>
