<template>
  <v-alert rounded="lg" outlined color="accent" class="pa-1 mt-6 mb-2">
    <v-card flat rounded="lg">
      <v-card-title>New Year | New DLC</v-card-title>
      <v-card-text>
        <p class="mb-4">Dear AoE4 community,</p>

        <p class="mb-2">
        I want to thank you all for your continued support of Aoe4Guides. This platform has always been a labor of love, created to help players like you explore and master the rich strategies of <em>Age of Empires IV</em>.
        </p>

        <p class="mb-2">
        This year brings exciting challenges and opportunities, especially with the upcoming big DLC release. I’m committed to updating the site with fresh content. 
        However, running Aoe4Guides comes with operational costs – hosting, traffic, and the effort it takes to keep things up to date.
       </p>
        
       <p class="mb-2">
        If you’ve found value in the guides, tips, or resources on this site, I’d greatly appreciate your support. Your contributions help cover operational costs and enable me to dedicate the time needed to keep Aoe4Guides the best resource for AoE4 build orders. Together, we can continue to grow and celebrate this incredible game.
       </p>

        <p class="mb-2">Thank you for being part of this journey. Here’s to a fantastic year ahead, full of epic battles, new civilizations, and a new DLC!</p>

        <p class="mb-4">/3,<br />exe</p>

        <p>
          P.S. '<strong>::</strong>' is <strong>the shortcut</strong> to get your builds done
          quicker!
        </p>
      </v-card-text>

      <v-row class="mx-2 mb-2" no-gutters>
        <v-col align="center" justify="center"
          ><a href="https://ko-fi.com/jensbuehl"
            ><v-btn
              class="ma-2"
              size="small"
              variant="text"
              color="primary"
              style="background-color: transparent"
            >
              <template v-slot:prepend>
                <v-icon color="red">mdi-heart</v-icon>
              </template>
              Donate
            </v-btn></a
          ><a href="https://discord.gg/Nau9BN5E7J"
            ><v-btn
              class="ma-2"
              size="small"
              variant="text"
              color="primary"
              style="background-color: transparent"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-chat</v-icon>
              </template>
              Discord
            </v-btn></a
          ><v-btn
            size="small"
            class="ma-2"
            prepend-icon="mdi-github"
            variant="text"
            color="primary"
            to="/github"
            >Contribute
          </v-btn></v-col
        >
      </v-row>
    </v-card>
  </v-alert>
</template>

<script>
export default {
  name: "News",
  setup() {},
};
</script>
