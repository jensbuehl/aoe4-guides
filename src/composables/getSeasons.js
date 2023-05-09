import { ref } from "vue";

const seasons = ref([
  {
    //TODO: Add tagline and date once info is available
    title: "Season 5",
    tagline: "",
    startDate: new Date()
  },
  {
    title: "Season 4",
    tagline: "Enchanted Grove",
    startDate: new Date(2023, 1, 16)
  },
  {
    title: "Season 3",
    tagline: "Anniversary Update",
    startDate: new Date(2022, 9, 25)
  },
  {
    title: "Season 2",
    tagline: "Map Monsters",
    startDate: new Date(2022, 6, 12)
  },
  {
    title: "Season 1",
    tagline: "Festival of Ages",
    startDate: new Date(2022, 3, 7)
  },
]);

const getSeasons = () => {
  return {
    seasons,
  };
};

export default getSeasons;
