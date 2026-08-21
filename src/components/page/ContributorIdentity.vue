<template>
  <!-- A contributor with no display name is not presented at all.
       Every account that completed setup has one; a record without one belongs
       to an account whose setup never finished, and can now exist because the
       profile form is allowed to create the document (spec FR-032). A card
       showing a face, a bio and no name is broken, so the guard is here, once,
       rather than in each surface that embeds this. -->
  <div v-if="loading || displayName" class="contributor-identity">
    <UserAvatar
      class="contributor-identity__avatar"
      :size="avatarSize"
      :src="loading ? null : contributor.icon"
      :name="loading ? null : displayName"
      :loading="loading"
      text-class="contributor-identity__initials"
    />

    <div class="contributor-identity__text">
      <!-- The eyebrow is static copy, known before any data arrives, so it
           renders as itself while loading rather than as a grey bar. -->
      <slot name="eyebrow"></slot>

      <!-- Every placeholder below sits INSIDE the element it replaces, so it
           inherits that element's font-size, line-height and margins. The
           reserved height is therefore the real height by construction, at
           every width, and it stays correct when the type scale changes — which
           a hand-measured `min-height` on the card would not. -->
      <div class="contributor-identity__name">
        <span v-if="loading" class="contributor-identity__ghost" style="width: 40%">&nbsp;</span>
        <template v-else>{{ displayName }}</template>
      </div>

      <p v-if="loading" class="contributor-identity__bio">
        <span class="contributor-identity__ghost" style="width: 85%">&nbsp;</span>
      </p>
      <p v-else-if="bio" class="contributor-identity__bio">{{ bio }}</p>

      <div v-if="loading" class="contributor-identity__facts">
        <v-chip size="small" variant="tonal" class="contributor-identity__chip">
          <span class="contributor-identity__ghost" style="width: 70px">&nbsp;</span>
        </v-chip>
        <v-chip size="small" variant="tonal" class="contributor-identity__chip">
          <span class="contributor-identity__ghost" style="width: 48px">&nbsp;</span>
        </v-chip>
      </div>
      <div v-else class="contributor-identity__facts">
        <!-- mdi-star, not mdi-trophy: About.vue already spends the trophy on
             aoe4world, and the same card can carry an aoe4world link. One icon
             cannot mean two things a few pixels apart. -->
        <v-chip
          v-if="contributor.rank"
          size="small"
          variant="tonal"
          color="accent"
          class="contributor-identity__chip"
        >
          <v-icon start size="13">mdi-star</v-icon>
          #{{ contributor.rank }} contributor
        </v-chip>
        <v-chip v-if="builds != null" size="small" variant="tonal" class="contributor-identity__chip">
          <v-icon start size="13">mdi-hammer</v-icon>
          {{ builds }} {{ builds === 1 ? "build" : "builds" }}
        </v-chip>
        <v-chip v-if="contributor.viewCount" size="small" variant="tonal" class="contributor-identity__chip">
          <v-icon start size="13">mdi-eye</v-icon>
          {{ formatCount(contributor.viewCount) }}
        </v-chip>
      </div>

      <!-- The action slot is suppressed while loading: the spotlight's button
           routes to `contributor.id`, which does not exist yet, so rendering it
           would offer a link to nowhere. A ghost of the same height keeps the
           row reserved. -->
      <div v-if="loading" class="contributor-identity__actions">
        <span class="contributor-identity__ghost contributor-identity__ghost--button"></span>
      </div>
      <div v-else-if="$slots.actions || links.length" class="contributor-identity__actions">
        <slot name="actions"></slot>
        <v-btn
          v-for="link in links"
          :key="link.kind"
          :href="link.href"
          target="_blank"
          rel="noopener"
          variant="text"
          size="small"
          color="primary"
          :prepend-icon="link.icon"
        >
          {{ link.label }}
          <v-icon v-if="link.recognised" end size="14" class="contributor-identity__verified">
            mdi-check-circle
          </v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from "vue";
import useTimeSince from "@/composables/useTimeSince";
import UserAvatar from "@/components/common/UserAvatar.vue";
import {
  PROFILE_LINK_KINDS,
  linkMeta,
  linkUrl,
  isRecognisedChannel,
} from "@/composables/useContributorProfile";

/**
 * Who a contributor is, in the site's hero language.
 *
 * Shared by the home spotlight and the author page header rather than copied
 * into both: the spec requires a visitor moving between them to see one design,
 * so two implementations would be a defect by definition and not merely
 * duplication. What differs between the surfaces is the frame around this —
 * the wash, the eyebrow, the call to action — which is why those are slots.
 *
 * Defines no colour of its own. The --hero-* tokens in src/assets/base.css
 * already carry both themes.
 */
export default {
  name: "ContributorIdentity",
  components: { UserAvatar },
  props: {
    contributor: { type: Object, required: true },
    // Reserve the layout while the data is in flight. The placeholder mirrors
    // this component's own structure, so both surfaces that embed it get the
    // same reservation without either restating a height.
    loading: { type: Boolean, default: false },
    avatarSize: { type: [Number, String], default: 64 },
    // The author page counts the builds its own query returned, which is the
    // number the visitor is actually looking at; everywhere else falls back to
    // the running total on the contributor record.
    buildCount: { type: Number, default: null },
  },
  setup(props) {
    const { formatCount } = useTimeSince();

    const displayName = computed(() => props.contributor?.displayName || null);
    const bio = computed(() => props.contributor?.bio || null);
    const builds = computed(() => props.buildCount ?? props.contributor?.boCount ?? null);

    // Whatever the contributor has actually set, in a fixed order. A kind with
    // no stored value, or one whose value no longer satisfies its pattern,
    // produces no href and drops out here rather than rendering a dead button.
    const links = computed(() =>
      PROFILE_LINK_KINDS.map((kind) => ({
        kind,
        ...linkMeta(kind),
        href: linkUrl(kind, props.contributor?.[kind]),
        recognised: kind === "youtube" && isRecognisedChannel(props.contributor?.youtube),
      })).filter((link) => link.href)
    );

    return { formatCount, displayName, bio, builds, links };
  },
};
</script>

<style scoped>
.contributor-identity {
  display: flex;
  align-items: center;
  gap: 20px;
}

.contributor-identity__avatar {
  flex: 0 0 auto;
}

/* Without this the flex child refuses to shrink below its content, and a long
   display name pushes the card into horizontal overflow instead of truncating. */
.contributor-identity__text {
  min-width: 0;
}

/* Deliberately no text-shadow, though the --hero-* family carries one.
   HeroBuild needs it because its title sits on a full-bleed civ flag and has to
   stay legible over whatever pixels land behind it. This name sits on a flat
   themed surface under a translucent wash, where the same shadow is not
   contrast — it is soot on a clean background. The token is the rule for text
   over an image, not for hero text in general. */
.contributor-identity__name {
  color: var(--hero-title);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.15;
  margin: 4px 0 6px;
  overflow-wrap: anywhere;
}

.contributor-identity__bio {
  color: var(--hero-text);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 10px;
}

.contributor-identity__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contributor-identity__chip {
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 7px;
}

.contributor-identity__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
}

.contributor-identity__verified {
  opacity: 0.75;
}

/* Placeholder bars. `inline-block` with a non-breaking space inside means the
   bar takes the height of the line it replaces — that is what makes the
   reserved layout match the real one without a measured number anywhere. */
.contributor-identity__ghost {
  display: inline-block;
  max-width: 100%;
  border-radius: 4px;
  background: currentColor;
  opacity: 0.13;
  animation: contributor-identity-pulse 1.4s ease-in-out infinite;
}

.contributor-identity__ghost--button {
  width: 116px;
  height: 28px;
  border-radius: 7px;
}

@keyframes contributor-identity-pulse {
  0%, 100% { opacity: 0.13; }
  50%      { opacity: 0.22; }
}

/* Someone who has asked for less motion gets a flat bar, not a pulsing one. */
@media (prefers-reduced-motion: reduce) {
  .contributor-identity__ghost {
    animation: none;
  }
}

/* Deep: the initials are rendered inside UserAvatar, past this component's scope. */
.contributor-identity :deep(.contributor-identity__initials) {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
}

/* Stack below the width at which the avatar plus a readable text column stop
   fitting the md=8 home column — the same measured breakpoint EventBanner uses,
   because they occupy the same slot and must break at the same moment. */
@media (max-width: 620px) {
  .contributor-identity {
    flex-direction: column;
    text-align: center;
    gap: 14px;
  }

  .contributor-identity__name {
    font-size: 20px;
  }

  .contributor-identity__facts,
  .contributor-identity__actions {
    justify-content: center;
  }
}
</style>
