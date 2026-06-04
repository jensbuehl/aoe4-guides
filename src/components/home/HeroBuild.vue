<template>
  <router-link
    v-if="!loading && build"
    :to="{ name: 'BuildDetails', params: { id: build.id } }"
    style="text-decoration: none"
  >
    <v-card class="aoe-featured my-4" flat>
      <v-img
        class="aoe-featured-bg"
        :src="flagUrl ?? ''"
        cover
        alt=""
        aria-hidden="true"
      />
      <span class="aoe-featured-scrim" />
      <div class="aoe-featured-content">
        <span class="aoe-featured-eyebrow">
          <v-icon size="16">{{ icon }}</v-icon>
          {{ eyebrow }}
        </span>
        <h2 class="aoe-featured-title">{{ build.title }}</h2>
        <p v-if="build.description" class="aoe-featured-opening">{{ build.description }}</p>
        <div class="aoe-featured-row">
          <v-chip
            v-if="build.strategy"
            size="small"
            class="aoe-badge aoe-badge--strat"
          >
            <v-icon size="13" start>mdi-strategy</v-icon>
            {{ build.strategy }}
          </v-chip>
          <span v-if="build.author" class="aoe-featured-meta">
            <v-icon size="14">mdi-account-edit</v-icon>
            {{ build.author }}
          </span>
          <span v-if="build.timeCreated" class="aoe-featured-meta">
            <v-icon size="14">mdi-clock-edit-outline</v-icon>
            {{ timeSince(build.timeCreated.toDate()) }}
          </span>
          <span v-if="build.views" class="aoe-featured-meta">
            <v-icon size="14">mdi-eye</v-icon>
            {{ formatCount(build.views) }} views
          </span>
        </div>
      </div>
    </v-card>
  </router-link>

  <v-skeleton-loader
    v-else-if="loading"
    type="image"
    height="230"
    width="100%"
    class="aoe-featured-skeleton"
  />
</template>

<script>
import useTimeSince from "@/composables/useTimeSince";

export default {
  name: "HeroBuild",
  props: {
    build:    { type: Object, default: null },
    flagUrl:  { type: String, default: null },
    civName:  { type: String, default: null },
    eyebrow:  { type: String, required: true },
    icon:     { type: String, required: true },
    loading:  { type: Boolean, default: false },
  },
  setup() {
    const { timeSince, formatCount } = useTimeSince();
    return { timeSince, formatCount };
  },
};
</script>

<style scoped>
/* ---- hero shell ---- */
.aoe-featured {
  position: relative;
  display: block;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  min-height: 230px;
  text-align: left;
  cursor: pointer;
}

/* flag, full-bleed behind everything */
.aoe-featured-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.aoe-featured:hover .aoe-featured-bg {
  transform: scale(1.05);
}

/* theme-aware diagonal fade — flag stays visible on the right */
.aoe-featured-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    rgba(var(--hero-fade), .96) 30%,
    rgba(var(--hero-fade), .58) 62%,
    rgba(var(--hero-fade), .14) 100%
  );
}

/* text column */
.aoe-featured-content {
  position: relative;
  padding: 26px 30px;
  max-width: 640px;
}

.aoe-featured-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent);
  font-weight: 700;
  font-size: 12.5px;
  letter-spacing: .4px;
}

.aoe-featured-title {
  color: var(--hero-title);
  font-size: 27px;
  font-weight: 800;
  line-height: 1.15;
  margin: 10px 0 8px;
  text-shadow: var(--hero-shadow);
}

.aoe-featured-opening {
  color: var(--hero-text);
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.aoe-featured-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.aoe-featured-meta {
  color: var(--hero-meta);
  font-size: 12.5px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

/* strategy badge — fixed franchise navy */
.aoe-badge--strat {
  background: #294790 !important;
  color: #fff !important;
  font-size: 11.5px;
  font-weight: 600;
  border-radius: 7px;
}

/* focus ring for keyboard users */
.aoe-featured:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}

/* skeleton matches hero dimensions */
.aoe-featured-skeleton {
  border-radius: 16px;
  overflow: hidden;
}

/* responsive */
@media (max-width: 720px) {
  .aoe-featured-title {
    font-size: 22px;
  }
}
</style>
