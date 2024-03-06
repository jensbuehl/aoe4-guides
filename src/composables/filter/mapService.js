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

const mapService = () => {
  return {
    maps,
  };
};

export default mapService;
