import { ref } from "vue";

const maps = ref([
  {
    title: "Open",
  },
  {
    title: "Closed",
  },
  {
    title: "Hybrid",
  },
  {
    title: "Water",
  },
]);

const getMaps = () => {
  return {
    maps,
  };
};

export default getMaps;
