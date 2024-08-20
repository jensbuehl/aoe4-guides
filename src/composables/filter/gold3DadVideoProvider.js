export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
  }
}

export const songs = [
  {
    title: "Riding Dirty [Synthwave Version] - Ayyubids",
    url: "https://www.youtube.com/embed/MukzJnDk31o",
  },
  {
    title: "Mein Scout Hat Fernweh [12 Millionen Version]",
    url: "https://www.youtube.com/embed/p7Z9e64gXCU",
  },
  {
    title: "Road To Platinum [Stadium Hymn Version]",
    url: "https://www.youtube.com/embed/jojzhFHPT8g",
  },
  {
    title: "Road To Platinum [Rock Version]",
    url: "https://www.youtube.com/embed/Pm4TQ2jCR-8",
  },
  {
    title: "Road To Platinum [Synthwave Version]",
    url: "https://www.youtube.com/embed/QP8HAk1KNLA",
  },
  {
    title: "The Englishmen [Macklemore Version] - English",
    url: "https://www.youtube.com/embed/pQAA4qv19Jc",
  },
  {
    title: "The Englishmen - English",
    url: "https://www.youtube.com/embed/9u3eYzxSyE0",
  },
  {
    title: "The Englishmen [Chillwave Version] - English",
    url: "https://www.youtube.com/embed/c1j3fTa_QOQ",
  },
  {
    title: "The Delhi Show [80s Version] - Delhi",
    url: "https://www.youtube.com/embed/pWLRkWGh5ys",
  },
  {
    title: "The Delhi Show [Rock Version] - Delhi",
    url: "https://www.youtube.com/embed/_E0y2kKaC98",
  },
  {
    title: "The Delhi Show - Delhi",
    url: "https://www.youtube.com/embed/d5i5-uvOflA",
  },
];