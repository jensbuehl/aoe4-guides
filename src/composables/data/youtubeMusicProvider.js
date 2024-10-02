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
    title: "Auf in den Kampf",
    url: "https://www.youtube.com/embed/9tcPxQhAnug",
  },
  {
    title: "HRE - We are the Empire - Visualizer & Lyrics - Age of Empires IV Music",
    url: "https://www.youtube.com/embed/SbuwR7xcQjE",
  },
  {
    title: "Ayyubids - Riding Dirty - Visualizer & Lyrics - Age of Empires IV Music",
    url: "https://www.youtube.com/embed/o3WoS-LssNo",
  },
  {
    title: "Mein Scout hat Fernweh - Visualizer & Lyrics - Age of Empires IV Music",
    url: "https://www.youtube.com/embed/yCVoyrJVo6g",
  },
  {
    title: "Road to Platinum (Epic Version) - Visualizer & Lyrics - Age of Empires IV Music",
    url: "https://www.youtube.com/embed/KtXVY1GCHhQ",
  },
  {
    title: "English - The Englishmen - Visualizer & Lyrics - Age of Empires IV Music",
    url: "https://www.youtube.com/embed/PK3WyBFqJxM",
  },
  {
    title: "Delhi - The Delhi Show - Visualizer & Lyrics - Age of Empires IV Music",
    url: "https://www.youtube.com/embed/J-YxHmV2tgs",
  },
];