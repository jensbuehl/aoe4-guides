<template>
  <v-card rounded="0">
    <v-row no-gutters class="justify-end align-center">
      <v-btn flat>Close</v-btn>
    </v-row>

    <v-row
      no-gutters
      style="background-color: aqua"
      class="justify-center align-center"
      ><v-card-title>{{ build.title }}</v-card-title></v-row
    >

    <v-row
      no-gutters
      style="background-color: aliceblue"
      class="h-75 align-center justify-center"
      ><v-col class="d-flex justify-center align-center">
        <span v-html="build.steps[2].description" /> </v-col
    ></v-row>

    <v-row
      no-gutters
      style="background-color: rgb(225, 220, 245)"
      class="justify-center align-center"
      ><span>Resources Grid</span></v-row
    >

    <v-row no-gutters class="justify-center align-center">
      <v-btn flat width="150px">Previous Step</v-btn>
      <v-btn flat width="150px">Next Step</v-btn>
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
