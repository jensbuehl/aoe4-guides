<template>
  <!--Somewhere to go from a build (spec 046). A visitor from search lands on one
      build; if it is not the one they wanted, the page used to end with nothing
      to open next. Two rails: the same civ, and the same author.

      The root is always rendered, empty until near the viewport, because it is
      what the visibility observer watches.-->
  <div ref="railsEl" style="min-height: 1px">
    <section v-for="rail in visibleRails" :key="rail.key" class="related-rail">
      <SectionHeader :icon="rail.icon" :label="rail.title" class="px-0 mb-2" />

      <template v-if="rail.state === 'loading'">
        <BuildListCard v-for="i in RAIL_SIZE" :key="i" :build="SKELETON" />
      </template>
      <template v-else>
        <router-link
          v-for="item in rail.builds"
          :key="item.id"
          style="text-decoration: none"
          :to="{ name: 'BuildDetails', params: { id: item.id } }"
        >
          <BuildListCard :build="item" :context="rail.context" />
        </router-link>
      </template>
      <!--Shown from the first skeleton, not after the data: its route depends
          only on the build being read, and adding it on arrival grew the rail
          by its 42px and pushed everything below down (FR-009).-->
      <ViewAllButton :to="rail.viewAllRoute" :label="rail.viewAllLabel" />
    </section>
  </div>
</template>

<script>
import { computed, reactive, ref, watch } from "vue";
import { useElementVisibility } from "@vueuse/core";
import BuildListCard from "@/components/builds/BuildListCard.vue";
import SectionHeader from "@/components/common/SectionHeader.vue";
import ViewAllButton from "@/components/common/ViewAllButton.vue";
import { getBuilds, getCivBuilds } from "@/composables/data/buildService";
import { getDefaultConfig } from "@/composables/filter/configDefaultProvider";
import { civPageRoute, getCivById } from "@/composables/filter/civDefaultProvider";

//How many builds each rail shows (FR-003). The queries over-fetch from it: the
//civ rail by one, for the build being read; the author rail by RAIL_SIZE + 1,
//so it can still fill after dropping the build being read and whatever the civ
//rail already shows (FR-004, research R4). At most 11 reads, once.
const RAIL_SIZE = 3;

//BuildListCard renders its own skeleton at its measured per-breakpoint height
//for a build with `loading` set, so a full rail loads without moving (FR-009).
const SKELETON = Object.freeze({ loading: true });

export default {
  name: "RelatedBuilds",
  components: { BuildListCard, SectionHeader, ViewAllButton },
  props: {
    build: { type: Object, required: true },
    //From the route, not build.id: a build served from the in-app cache need
    //not carry its own id (see BuildDetails).
    buildId: { type: String, required: true },
  },
  setup(props) {
    const railsEl = ref(null);

    //Fetch only once the rails are about a screen away (FR-008). A reader who
    //follows the build at the top of the page, which is most of its use,
    //never pays for them. `once` stops observing after the first time.
    const near = useElementVisibility(railsEl, { rootMargin: "600px", once: true });

    const civ = getCivById(props.build.civ) ?? null;
    const author = props.build.author?.trim() ? props.build.author : null;

    //"Any civilization" has no civ page (no slug): its title cannot be "More Any
    //Civilization builds", and civPageRoute sends its exit to the dashboard
    //filtered to it, as every other link to a civ without a page does.
    const civRail = reactive({
      key: "civ",
      eligible: Boolean(civ),
      icon: "mdi-flag-outline",
      title: civ?.slug ? `More ${civ.title} builds` : "More builds for any civilization",
      viewAllLabel: civ?.slug ? `View all ${civ.title} builds` : "View all",
      viewAllRoute: civPageRoute(props.build.civ),
      context: "default",
      state: "idle",
      builds: [],
    });

    //`author` in the builds list's query string is the author's uid (research R1).
    const authorRail = reactive({
      key: "author",
      eligible: Boolean(author && props.build.authorUid),
      icon: "mdi-account-outline",
      title: `More by ${author}`,
      viewAllLabel: `View all by ${author}`,
      viewAllRoute: { path: "/builds", query: { author: props.build.authorUid, orderBy: "score" } },
      //The header already names the author, so the cards do not repeat it.
      context: "author-locked",
      state: "idle",
      builds: [],
    });

    const visibleRails = computed(() =>
      [civRail, authorRail].filter((rail) => rail.state === "loading" || rail.state === "ready")
    );

    //Rails settle independently, and a rail that cannot be read or has nothing
    //to show is removed without a word (FR-010). That moves only what is below
    //it: everything above is already in place (US3-AS4).
    const settle = (rail, builds) => {
      rail.builds = builds;
      rail.state = builds.length ? "ready" : "hidden";
    };

    const load = async () => {
      for (const rail of [civRail, authorRail]) if (rail.eligible) rail.state = "loading";
      const config = { ...getDefaultConfig(), orderBy: "score" };

      //Both start at once; the author rail waits for the civ rail only to
      //deduplicate against it. getCivBuilds falls back to the public API when
      //Firestore refuses the read (FR-011); the author query has no such
      //fallback, and the narrow /api proxy is not widened for it.
      const civQuery = civRail.eligible
        ? getCivBuilds({ ...config, civs: props.build.civ }, RAIL_SIZE + 1).catch(() => undefined)
        : Promise.resolve(undefined);
      const authorQuery = authorRail.eligible
        ? getBuilds({ ...config, author: props.build.authorUid }, 2 * RAIL_SIZE + 1).catch(() => undefined)
        : Promise.resolve(undefined);

      const civResult = await civQuery;
      const civBuilds = Array.isArray(civResult)
        ? civResult.filter((item) => item.id !== props.buildId).slice(0, RAIL_SIZE)
        : [];
      if (civRail.eligible) settle(civRail, civBuilds);

      const authorResult = await authorQuery;
      if (authorRail.eligible) {
        const taken = new Set([props.buildId, ...civBuilds.map((item) => item.id)]);
        settle(
          authorRail,
          Array.isArray(authorResult)
            ? authorResult.filter((item) => !taken.has(item.id)).slice(0, RAIL_SIZE)
            : []
        );
      }
    };

    watch(near, (isNear) => {
      if (isNear) load();
    });

    return { railsEl, visibleRails, RAIL_SIZE, SKELETON };
  },
};
</script>

<style scoped>
.related-rail {
  margin-top: 16px;
}
</style>
