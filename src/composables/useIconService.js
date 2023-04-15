export default function useIconService() {
  
  const getIcons = (civ, category) => {
    //TODO: Filter
    return[
        {
          category: "age",
          title: "Dark Age",
          age: "1",
          imgSrc: "/assets/pictures/age/age_1.png",
          civ: ["all"],
        },
        {
          category: "age",
          title: "Feudal Age",
          age: "2",
          imgSrc: "/assets/pictures/age/age_2.png",
          civ: ["all"],
        },
        {
          category: "age",
          title: "Castle Age",
          age: "3",
          imgSrc: "/assets/pictures/age/age_3.png",
          civ: ["all"],
        },
        {
          category: "age",
          title: "Imperial Age",
          age: "4",
          imgSrc: "/assets/pictures/age/age_4.png",
          civ: ["all"],
        },
        {
          category: "age",
          title: "Unknown Age",
          age: "1",
          imgSrc: "/assets/pictures/age/age_unknown.png",
          civ: ["all"],
        },
      ]
  };
  
  return { getIcons };
}