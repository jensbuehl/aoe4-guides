<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-card class="py-6 px-10" rounded="lg" width="1024px" fluid>
        <h1>About AoE4 Guides</h1><br>
        <h2>Your Home for Age of Empires IV Guides and Build Orders</h2>
        <p>
          AoE4 Guides is a fan-made project and not affiliated with Relic or Microsoft.
          It was started as a hobby project to learn web development basics and turned into a public page 
          for the Age of Empires 4 community in April 2023.
        </p><br>

        <h2>Who made AoE4 Guides?</h2>
        <p>
          AoE4 Guides is made by Jens Bühl. It's a purely for fun project made
            out of love for the game. The goal is to be the most useful place
            for AoE4 guides and build orders.<br> You may find me on AoE 4 world under this "forever golden" profile as <a
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            href="https://aoe4world.com/players/76561197963612898"
            >"exe"</a
          >.
        </p><br>

        <h2>How can I support AoE4 Guides?</h2>
        <p>
          The easiest way is spreading your enthusiasm for the site, create and manage your build orders and share it with the community. 
            The second way is to donate so we can pay the server and other operational costs. 
            If you are a developer with some skill in Vue, Javascript, or Firebase you can contribute to the development of AoE4 Guides.
        </p><br>

        <h2>How can I contact you?</h2>
        <p>For feedback, questions, or just build order discussions:
          <ul class="pl-6">
            <li><a
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            href="https://discord.gg/ysDrdHKs9w"
            >Join our AoE4 Guides discord server </a
          ></li>
          <li><a
            :style="{
              color: $vuetify.theme.themes.customDarkTheme.colors.primary,
            }"
            href="https://github.com/jensbuehl/aoe4-guides/issues"
            >Report issue on Github</a
          ></li>
          <li>Via mail: info (at) aoe4guides (dot) com</li>
          </ul>
         
        </p>

      </v-card>
    </div>
  </v-container>
</template>

<script>
export default {
  name: "About",
  setup() {
    window.scrollTo(0,0);
  },
};
</script>
