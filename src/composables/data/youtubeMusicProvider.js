export function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}

export const songs = [
  {
    title: "Auf die guten alten Zeiten (feat. Finn Fox)",
    url: "https://www.youtube.com/embed/6F9u0A6iSxM",
  },
  {
    title: "Wololo (feat. Finn Fox)",
    url: "https://www.youtube.com/embed/qoTwbEOSCQU",
  },
  {
    title: "Auf in den Kampf",
    url: "https://www.youtube.com/embed/9tcPxQhAnug",
  },
  {
    title: "HRE - We are the Empire",
    url: "https://www.youtube.com/embed/SbuwR7xcQjE",
  },
  {
    title: "Ayyubids - Riding Dirty",
    url: "https://www.youtube.com/embed/o3WoS-LssNo",
  },
  {
    title: "Mein Scout hat Fernweh (feat. Finn Fox)",
    url: "https://www.youtube.com/embed/yCVoyrJVo6g",
  },
  {
    title: "Road to Platinum (Epic Version)",
    url: "https://www.youtube.com/embed/KtXVY1GCHhQ",
  },
  {
    title: "English - The Englishmen",
    url: "https://www.youtube.com/embed/PK3WyBFqJxM",
  },
  {
    title: "Delhi - The Delhi Show",
    url: "https://www.youtube.com/embed/J-YxHmV2tgs",
  },
  {
    title: "Auf in den Kampf rE An!mat3D",
    url: "https://www.youtube.com/embed/EkMbpTM86X0",
  },
];
