<template>
  <v-card rounded="0">
    <v-row no-gutters class="justify-end">
      <v-btn flat color="accent" class="ma-4" icon="mdi-close"></v-btn>
    </v-row>

    <v-row no-gutters class="justify-center align-center"
      ><v-card-title>{{ build.title }}</v-card-title></v-row
    >

    <v-row no-gutters class="h-75 align-center justify-center"
      ><v-col class="d-flex justify-center align-center">
        <span style="text-align:center" v-html="build.steps[1].description" /> </v-col
    ></v-row>

    <v-row no-gutters class="align-center justify-center"
      ><v-col cols="auto"
        ><v-table class="mx-4 my-8">
          <thead>
            <tr>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/time.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/villager.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/repair.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/food.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/wood.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/gold.png"
                ></v-img>
              </th>
              <th class="text-center ma-0 pa-0" width="70px">
                <v-img
                  class="mx-auto titleIcon"
                  src="/assets/resources/stone.png"
                ></v-img>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-center py-1" v-html="build.steps[2].time"></td>
              <td class="text-center py-1">todo</td>
              <td
                class="text-center py-1"
                v-html="build.steps[2].builders ? build.steps[2].builders : ''"
              ></td>
              <td class="text-center py-1" v-html="build.steps[2].food"></td>
              <td class="text-center py-1" v-html="build.steps[2].wood"></td>
              <td class="text-center py-1" v-html="build.steps[2].gold"></td>
              <td class="text-center py-1" v-html="build.steps[2].stone"></td>
            </tr>
          </tbody> </v-table></v-col
    ></v-row>

    <v-row no-gutters class="justify-center align-center">
      <v-btn color="accent" flat width="150px" class="ma-4"
        >Previous Step</v-btn
      >
      <v-btn color="accent" flat width="150px" class="ma-4">Next Step</v-btn>
    </v-row>
  </v-card>
</template>

<script>
export default {
  name: "Focus",
  props: ["build"],
  setup() {
    return {};
  },
};
</script>
<style scoped>
:deep(.icon) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
}

:deep(.icon-tech) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #469586, #266d5b);
}

:deep(.icon-military) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #8b5d44, #683a22);
}

:deep(.icon-none) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(
    circle at top center,
    rgb(var(--v-theme-icon-background-highlight)),
    rgb(var(--v-theme-icon-background))
  );
}

:deep(.icon-default) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #4b6382, #1d2432);
}

:deep(.icon-landmark) {
  vertical-align: middle;
  height: auto;
  width: 60px;
  margin: 2px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #232e3e, #0c0f17);
}

:deep(.titleIcon) {
  vertical-align: middle;
  width: auto;
  height: 60px;
}
</style>
