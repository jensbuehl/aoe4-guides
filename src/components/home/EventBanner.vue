<template>
  <!-- Nothing to announce once the last final is played: the banner removes
       itself rather than waiting for someone to remember to delete it. -->
  <v-card
    v-if="!isOver"
    flat
    rounded="lg"
    class="event-banner mb-6"
    :style="{ border: '1px solid ' + $vuetify.theme.current.colors.accent }"
  >
    <div class="event-banner__body">
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

      <div class="event-banner__text">
        <span class="event-banner__eyebrow">
          <v-icon size="16">mdi-sword-cross</v-icon>
          {{ hasStarted ? "Tournament · Playing now" : "Tournament · Registration open" }}
        </span>

        <h2 class="event-banner__title">{{ EVENT.title }}</h2>

        <p class="event-banner__lead">
          {{ EVENT.lead.before }} <strong>{{ EVENT.lead.host }}</strong>{{ EVENT.lead.after }}
        </p>

        <div class="event-banner__facts">
          <v-chip size="small" variant="tonal" color="accent" class="event-banner__chip">
            <v-icon size="13" start>mdi-calendar</v-icon>
            {{ EVENT.dateLabel }}
          </v-chip>
          <v-chip size="small" variant="tonal" color="accent" class="event-banner__chip">
            <v-icon size="13" start>mdi-trophy</v-icon>
            {{ EVENT.prizePool }} prize pool
          </v-chip>
          <v-chip size="small" variant="tonal" color="accent" class="event-banner__chip">
            <v-icon size="13" start>mdi-earth</v-icon>
            {{ EVENT.region }}
          </v-chip>
        </div>

        <div class="event-banner__actions">
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
        </div>
      </div>
    </div>
  </v-card>
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

export default {
  name: "EventBanner",
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
.event-banner {
  overflow: hidden;
}

/* A wash of the badge's own navy and gold across the card, so the banner reads
   as the tournament's rather than as another sidebar card. Both stops are
   translucent, which lets the light and dark surfaces underneath show through
   unchanged — no second palette to keep in sync. */
.event-banner__body {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 20px 24px;
  background:
    radial-gradient(120% 160% at 0% 50%, rgba(41, 71, 144, 0.16), transparent 62%),
    radial-gradient(90% 140% at 100% 0%, rgba(185, 150, 47, 0.14), transparent 60%);
}

.event-banner__badge {
  flex: 0 0 auto;
  width: 92px;
  height: auto;
  filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.28));
}

.event-banner__text {
  min-width: 0;
}

.event-banner__eyebrow {
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
.event-banner__title {
  color: var(--hero-title);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.15;
  margin: 6px 0 8px;
}

.event-banner__lead {
  color: var(--hero-text);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.event-banner__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.event-banner__chip {
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 7px;
}

.event-banner__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

/* Stack below the point where the badge plus a readable text column no longer
   fit side by side — measured on the md=8 home column, not guessed from a
   device width. */
@media (max-width: 620px) {
  .event-banner__body {
    flex-direction: column;
    text-align: center;
    gap: 14px;
    padding: 18px 16px;
  }

  .event-banner__badge {
    width: 76px;
  }

  .event-banner__title {
    font-size: 20px;
  }

  .event-banner__facts,
  .event-banner__actions {
    justify-content: center;
  }
}
</style>
