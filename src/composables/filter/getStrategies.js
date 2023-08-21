import { ref } from "vue";

const strategies = ref([
  {
    title: "Rush",
  },
  {
    title: "Boom",
  },
  {
    title: "Fast Castle",
  },
  {
    title: "Cheese",
  },
]);

const getStrategies = () => {
  return {
    strategies,
  };
};

export default getStrategies;
