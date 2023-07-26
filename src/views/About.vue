<template>
  <v-container>
    <div class="d-flex justify-center">
      <v-card class="py-6 px-10" rounded="lg" width="1024px" fluid>
        <h1>About</h1><br>
        <p>
          AoE4 Guides is a fan-made project and not affiliated with Relic or Microsoft.
          It was started as a hobby project to learn web development basics and turned into a public page 
          for the Age of Empires 4 community in April 2023.
        </p><br>

        <h2>Who made AoE4 Guides?</h2>
        <p>
          AoE4 Guides is made by Jens Bühl. It's a purely for fun project made
            out of love for the game. The goal is to be the most useful place
            for AoE4 guides and build orders. You may find me on AoE 4 world under this "forever golden" profile as <a
            :style="{
                    color: $vuetify.theme.current.colors.primary,
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
                    color: $vuetify.theme.current.colors.primary,
            }"
            href="https://discord.gg/ysDrdHKs9w"
            >Join our AoE4 Guides discord server </a
          ></li>
          <li><a
            :style="{
                    color: $vuetify.theme.current.colors.primary,
            }"
            href="https://github.com/jensbuehl/aoe4-guides/issues"
            >Report issue on Github</a
          ></li>
          <li>Via mail: info (at) aoe4guides (dot) com</li>
          </ul>
         
        </p><br>
        <h2>Why Build Orders?</h2>
        <p>Build orders are relevant in real-time strategy (RTS) games for several reasons:</p><br>
    <ol class="pl-6">
        <li class="mb-2"><strong>Efficiency</strong> <br>A well-executed build order allows players to maximize their resource gathering and unit production efficiency. By following a specific sequence of actions, players can optimize their economy and ensure a steady flow of resources, which is crucial for maintaining a strong military presence.</li>
        <li class="mb-2"><strong>Timing</strong> <br> Build orders help players synchronize their actions and coordinate their strategies. They provide a blueprint for when and how to construct buildings, train units, and execute specific tactics. This synchronization is essential for executing powerful attacks, defending against enemy assaults, or timing strategic maneuvers.</li>
        <li class="mb-2"><strong>Counterplay</strong> <br> Build orders can be used to counter specific strategies employed by opponents. By understanding the strengths and weaknesses of different units or strategies, players can choose a build order that exploits their opponent's vulnerabilities or mitigates the impact of their strengths. This adaptability and strategic flexibility can provide a significant advantage in RTS games.</li>
        <li class="mb-2"><strong>Economy Management</strong> <br> A build order guides players on how to balance their economy, including resource gathering, unit production, and technology research. It ensures a smooth transition from the early game, where resource gathering is crucial, to the mid and late game, where a player's army composition and technological advancements become more critical. A well-planned build order helps players avoid inefficiencies and manage their resources effectively.</li>
        <li class="mb-2"><strong>Practice and Reproducibility</strong> <br> Build orders provide a structured approach to gameplay, allowing players to practice and refine their strategies. By following a specific sequence of actions, players can analyze their performance, identify areas for improvement, and replicate successful strategies in future matches. This iterative process of practice and refinement helps players develop their skills and adapt to different opponents and game scenarios.</li>
    </ol><br>
    <p>In summary, build orders are relevant in RTS games because they enhance efficiency, timing, adaptability, economy management, and strategic decision-making. By providing a structured approach to gameplay, they offer players a framework to optimize their resource management, synchronize their actions, and counter their opponents effectively.</p>

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
