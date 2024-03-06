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
    title: "Fast Imperial",
  },
  {
    title: "Timing Attack",
  },
  {
    title: "Cheese",
  },
]);

const strategyService = () => {
  return {
    strategies,
  };
};

export default strategyService;
