<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-card flat class="py-6 px-10" rounded="lg" width="1024px" fluid>
        <h1>About AoE4 Guides</h1>
        <p class="mt-4 text-body-1">
          AoE4 Guides is a free, community-run library of build orders for Age of Empires IV.
          Anyone can write one, illustrate it with in-game icons, and share it; anyone can browse,
          filter and follow one while they play. No account is needed to read.
        </p>

        <!-- Live rather than hardcoded: a stale number on this page would be
             worse than no number. Hidden entirely if the count can't be read. -->
        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-chip v-if="buildCount" size="small" variant="tonal" prepend-icon="mdi-format-list-numbered">
            {{ buildCount.toLocaleString("en-US") }} published build orders
          </v-chip>
          <v-chip size="small" variant="tonal" prepend-icon="mdi-github">Open source</v-chip>
          <v-chip size="small" variant="tonal" prepend-icon="mdi-api">Public REST API</v-chip>
          <v-chip size="small" variant="tonal" prepend-icon="mdi-calendar">Online since April 2023</v-chip>
        </div>

        <v-divider class="my-8" />

        <h2>What you can do here</h2>
        <v-row class="mt-2" dense>
          <v-col v-for="feature in features" :key="feature.title" cols="12" sm="6">
            <div class="d-flex ga-3 py-2">
              <v-icon :icon="feature.icon" color="primary" class="mt-1" />
              <div>
                <div class="font-weight-medium">{{ feature.title }}</div>
                <div class="text-body-2 text-medium-emphasis">{{ feature.text }}</div>
              </div>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-8" />

        <h2>The story</h2>
        <p class="mt-4">
          AoE4 Guides started as a hobby project to learn the basics of web development. It went
          public for the Age of Empires IV community in April 2023, as a tribute to my best friend,
          and as a way to keep myself occupied after his loss. It has been growing ever since,
          driven by what the community asks for.
        </p>

        <v-divider class="my-8" />

        <h2>Who builds it</h2>
        <v-card variant="outlined" rounded="lg" class="mt-4 pa-5">
          <div class="d-flex flex-column flex-sm-row ga-5">
            <!-- UserAvatar layers the image over the initials, so if the photo
                 file is missing the card degrades to "JE" instead of breaking. -->
            <UserAvatar
              :src="author.photo"
              :name="author.name"
              :alt="author.name"
              size="96"
              text-class="text-h5"
              class="flex-0-0 align-self-start"
            />
            <div>
              <div class="text-h6">{{ author.name }}</div>
              <div class="text-body-2 text-medium-emphasis mb-3">{{ author.role }}</div>
              <p class="text-body-2">
                I design, build and run AoE4 Guides on my own — the Vue frontend, the Firebase
                backend, the public API, and the hosting bill. It is a purely for-fun project made
                out of love for the game, and the goal has not changed since day one: be the most
                useful place for AoE4 build orders. In game you will find me as
                <a class="text-primary" :href="links.aoe4world" target="_blank" rel="noopener">"exe"</a>.
              </p>
              <!-- Buttons, not chips: on this page (and in BuildPreviewCard and
                   the footer) a tonal chip states a fact and a button goes
                   somewhere. The stat chips above are not clickable, so these
                   must not look like them. -->
              <div class="d-flex flex-wrap ga-2 mt-4">
                <v-btn
                  v-for="link in authorLinks"
                  :key="link.label"
                  :href="link.href"
                  target="_blank"
                  rel="noopener"
                  :prepend-icon="link.icon"
                  size="small"
                  variant="tonal"
                >
                  {{ link.label }}
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>

        <v-divider class="my-8" />

        <h2>How it is built</h2>
        <p class="mt-4">
          The site is a Vue 3 single-page app on Vuetify, with Vuex for state and Vite for the
          build. Data lives in Cloud Firestore; authentication, scheduled jobs and privileged
          actions run on Firebase Auth and Cloud Functions, with App Check in front. The public
          API is a separate service on Cloud Run. Everything is hosted on Firebase Hosting.
        </p>
        <p class="mt-4">A few pieces I am particularly happy with:</p>
        <ul class="pl-6 mt-2">
          <li v-for="item in engineering" :key="item" class="mb-2">{{ item }}</li>
        </ul>
        <p class="mt-4">
          The full source is on
          <a class="text-primary" :href="links.github" target="_blank" rel="noopener">GitHub</a>
          and the API is documented at
          <a class="text-primary" :href="links.apiDocs" target="_blank" rel="noopener">/api/api-docs</a>.
          If you know some Vue, JavaScript or Firebase, contributions are genuinely welcome.
        </p>

        <v-divider class="my-8" />

        <h2>Credits</h2>
        <p class="mt-4">
          The idea at the heart of this site — a build order written in game icons rather than
          words — is not mine. I saw it for the first time in
          <a class="text-primary" :href="links.len" target="_blank" rel="noopener">Len</a>'s
          <a class="text-primary" :href="links.lenProject" target="_blank" rel="noopener"
            >Build Order Tool for AoE4</a
          >, and wanted to build on it and take it all the way to something mature.
        </p>
        <p class="mt-4">
          It is mostly a solo project, but not entirely — these people have contributed code, fixes
          and improvements:
        </p>
        <ul class="pl-6 mt-2">
          <li v-for="person in contributors" :key="person" class="mb-1">{{ person }}</li>
        </ul>
        <p class="mt-4">
          The current list is always on the
          <a class="text-primary" :href="links.contributors" target="_blank" rel="noopener"
            >contributors page</a
          >. And the largest group of all: everyone who has written and maintained a
          <router-link class="text-primary" to="/builds">build order</router-link> here. The site is
          only ever as good as the builds in it.
        </p>

        <v-divider class="my-8" />

        <h2>How you can support it</h2>
        <p class="mt-4">
          The cheapest way is to use the site and tell people about it: write build orders, keep
          them current, and share them with your clan or Discord. The second way is money — the
          servers, domain and storage are paid out of pocket, and anything given goes straight into
          them. The third way is code.
        </p>
        <p class="mt-4 text-body-2 text-medium-emphasis">
          For the sake of being specific: the goal below is the infrastructure alone — hosting, the
          domain and storage. It is not everything the project costs. The other running expense is
          an AI coding subscription, which is what lets a solo maintainer keep shipping at this
          pace; it serves two projects, so only half of it would ever be counted here. That is
          where anything above the goal goes.
        </p>

        <!-- The money ask lives entirely in this card. The old "Donate on Ko-fi"
             button that stood here is gone: a generic ask beside a specific
             figure makes the figure read as decoration. -->
        <FundingStatus class="mt-4" />

        <!-- The wall. Same markup idiom as the code-contributors list above, so
             the page reads as one convention rather than two. Keyed by index,
             not by name: two people can share a Ko-fi display name, and both
             must appear. -->
        <template v-if="supporters.length">
          <p class="mt-6">
            Helping cover {{ fundingYear }}'s running costs:
          </p>
          <ul class="pl-6 mt-2">
            <li v-for="(person, index) in supporters" :key="index" class="mb-1">
              {{ person.name }}
            </li>
          </ul>
        </template>

        <!-- While this year's group is too small to hide anyone in, the two
             lists are merged and this heading carries everyone — otherwise
             naming this year's supporters beside the year's total would say
             what each of them gave. -->
        <template v-if="earlierSupporters.length">
          <p class="mt-4">
            {{
              groupByYear
                ? "And everyone who has chipped in over the years before that:"
                : "Everyone who has chipped in over the years:"
            }}
          </p>
          <ul class="pl-6 mt-2">
            <li v-for="(person, index) in earlierSupporters" :key="index" class="mb-1">
              {{ person.name }}
            </li>
          </ul>
        </template>

        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn :href="links.github" target="_blank" rel="noopener" variant="tonal" prepend-icon="mdi-github">
            Contribute on GitHub
          </v-btn>
          <v-btn to="/builds/new" variant="tonal" prepend-icon="mdi-playlist-edit">
            Write a build order
          </v-btn>
        </div>

        <v-divider class="my-8" />

        <h2>Get in touch</h2>
        <p class="mt-4">For feedback, questions, bug reports, or just build order arguments:</p>
        <ul class="pl-6 mt-2">
          <li class="mb-2">
            Join the
            <a class="text-primary" :href="links.discord" target="_blank" rel="noopener">Discord server</a>
            — the fastest way to reach me and the rest of the community.
          </li>
          <li class="mb-2">
            Report a bug or request a feature on
            <a class="text-primary" :href="links.issues" target="_blank" rel="noopener">GitHub Issues</a>.
          </li>
          <li class="mb-2">Or write to info (at) aoe4guides (dot) com.</li>
        </ul>
        <!-- No fan-project disclaimer here on purpose: the global footer
             already carries the Game Content Usage Rules attribution and the
             "not endorsed by or affiliated with Microsoft" line on every page,
             and it renders a few hundred pixels below this. -->
      </v-card>
    </div>
  </v-container>
</template>

<script>
//External
import { onMounted, onUnmounted, ref } from "vue";

//Components
import UserAvatar from "@/components/common/UserAvatar.vue";
import FundingStatus from "@/components/common/FundingStatus.vue";

//Composables
import { getBuildsCount } from "@/composables/data/buildService";
import { useFunding, useSupporters } from "@/composables/useFunding";

// Square 320px portrait — enough for the 96px avatar at 3x DPR. If it ever
// goes missing UserAvatar falls back to initials rather than breaking.
const AUTHOR_PHOTO = "/assets/author.jpg";

const LINKEDIN_URL = "https://www.linkedin.com/in/jensbuehl";

const links = {
  github: "https://github.com/jensbuehl/aoe4-guides",
  issues: "https://github.com/jensbuehl/aoe4-guides/issues",
  contributors: "https://github.com/jensbuehl/aoe4-guides/graphs/contributors",
  len: "https://github.com/LENpolygon",
  lenProject: "https://github.com/LENpolygon/Build-Order-Tool-AoE4-",
  discord: "https://discord.gg/Nau9BN5E7J",
  aoe4world: "https://aoe4world.com/players/76561197963612898",
  kofi: "https://ko-fi.com/jensbuehl",
  apiDocs: "https://aoe4guides.com/api/api-docs/",
  linkedin: LINKEDIN_URL,
};

const author = {
  name: "Jens Bühl",
  role: "Solo developer and maintainer",
  photo: AUTHOR_PHOTO,
};

const authorLinks = [
  { label: "GitHub", icon: "mdi-github", href: links.github },
  { label: "LinkedIn", icon: "mdi-linkedin", href: links.linkedin },
  { label: "Discord", icon: "mdi-chat", href: links.discord },
  { label: "aoe4world", icon: "mdi-trophy", href: links.aoe4world },
  { label: "Ko-fi", icon: "mdi-heart", href: links.kofi },
];

const SITE_ORIGIN = "https://aoe4guides.com";
const JSON_LD_ELEMENT_ID = "about-json-ld";

// Structured data for the site and its author. The @id cross-reference is what
// makes the two one statement — "this site is published by this person" —
// rather than two unrelated facts, which is what lets a search engine treat
// the name as an entity instead of a string. sameAs is the evidence for that
// identity claim, so every URL here must be a profile that is genuinely mine.
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: "AoE4 Guides",
      description:
        "A free, community-run library of build orders for Age of Empires IV. Create, share, browse and follow build orders while you play.",
      inLanguage: "en",
      publisher: { "@id": `${SITE_ORIGIN}/#author` },
    },
    {
      "@type": "Person",
      "@id": `${SITE_ORIGIN}/#author`,
      name: "Jens Bühl",
      url: `${SITE_ORIGIN}/about`,
      image: `${SITE_ORIGIN}${AUTHOR_PHOTO}`,
      jobTitle: "Software developer",
      description:
        "Solo developer and maintainer of AoE4 Guides — Vue frontend, Firebase backend and public REST API.",
      sameAs: [links.github, links.linkedin, links.aoe4world, links.kofi],
    },
  ],
};

const features = [
  {
    icon: "mdi-playlist-edit",
    title: "Write build orders",
    text: "A step editor with autocomplete for every unit, building, technology and landmark in the game, plus notes, video links and metadata.",
  },
  {
    icon: "mdi-filter-variant",
    title: "Find the right one",
    text: "Filter by civilization, season, map, strategy and rating, or browse what the community is upvoting right now.",
  },
  {
    icon: "mdi-monitor",
    title: "Follow along in game",
    text: "Focus mode strips a build down to the current step, keeps it in a picture-in-picture window, and can read the steps out loud.",
  },
  {
    icon: "mdi-chart-line",
    title: "Read the economy",
    text: "Villager distribution plotted over time with age-up timings, so you can see what a build is actually doing before you commit to it.",
  },
  {
    icon: "mdi-export-variant",
    title: "Use your overlay tool",
    text: "Import and export the AoE4 overlay format, so builds move between here and the tool you already play with.",
  },
  {
    icon: "mdi-heart-outline",
    title: "Save and discuss",
    text: "Favorite the builds you practice, vote on what works, and leave comments for the author.",
  },
  {
    icon: "mdi-share-variant",
    title: "Share anywhere",
    text: "Every build has a permanent link and a QR code for getting it onto a second screen.",
  },
  {
    icon: "mdi-api",
    title: "Build on the data",
    text: "A documented public REST API, in case you want to pull build orders into your own tool.",
  },
];

// Everyone with commits in the repo besides me, most commits first (Beny shows
// up under two git identities and is counted once). Names only, no per-person
// profile links: the noreply addresses give away only some of the GitHub
// handles, and a guessed handle is a dead link on someone else's credit. The
// contributors page linked below is the always-current version.
const contributors = [
  "Louis",
  "Beny Dishon K",
  "Franco Sarachu",
  "whorrified",
  "Martin Chełminiak",
  "William Bonney",
  "dernerl",
];

const engineering = [
  "Focus mode runs in a picture-in-picture document, so a build order stays on top of a fullscreen game without alt-tabbing.",
  "The economy chart is plain SVG polylines with HTML gridlines — no charting library, so it stretches to any width without distorting text.",
  "Build order steps are parsed into an icon vocabulary of well over a thousand game assets, resolved at edit time with autocomplete.",
  "Icons are tree-shaken individually from @mdi/js with a CI check that fails the build on an unregistered icon, replacing a 2.3 MB webfont.",
  "Read costs drive the data model: aggregate counts, batched writes and pre-generated lists instead of live queries wherever it is possible.",
];

export default {
  name: "About",
  components: { UserAvatar, FundingStatus },
  setup() {
    window.scrollTo(0, 0);

    const buildCount = ref(null);

    // Injected here rather than in index.html because index.html is served for
    // every route — this markup describes the About page specifically, so it
    // has to arrive and leave with the component.
    onMounted(() => {
      if (document.getElementById(JSON_LD_ELEMENT_ID)) return;

      const script = document.createElement("script");
      script.id = JSON_LD_ELEMENT_ID;
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    });

    onUnmounted(() => {
      document.getElementById(JSON_LD_ELEMENT_ID)?.remove();
    });

    onMounted(async () => {
      // A single aggregation query, and purely decorative: on failure the chip
      // stays hidden rather than surfacing an error on a static page.
      try {
        buildCount.value = await getBuildsCount();
      } catch {
        buildCount.value = null;
      }
    });

    const { supporters, earlierSupporters, groupByYear } = useSupporters();
    const { year: fundingYear } = useFunding();

    return {
      author,
      authorLinks,
      links,
      features,
      engineering,
      contributors,
      buildCount,
      supporters,
      earlierSupporters,
      groupByYear,
      fundingYear,
    };
  },
};
</script>
