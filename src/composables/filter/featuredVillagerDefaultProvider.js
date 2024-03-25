const sortByNameCompareFunction = (a, b) => {
  var nameA = a.creatorTitle.toUpperCase();
  var nameB = b.creatorTitle.toUpperCase();
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  return 0;
};

export const featuredVillagers = [
  {
    creatorTitle: "FitzBro",
    creatorId: "UCnwcH2ufz2_Tq0gr8IIa5wg",
    userId: "dZhJhRgGKgVjFmilYDP5klKR0UN2",
    creatorImage: "https://yt3.ggpht.com/uVmgC5--qrAz78YhZOQn2GBagxgoqDl6Jg5_vDP6X7LhMPYI2muJtLMCJb5-9fqlmnwuKTCEtQ=s176-c-k-c0x00ffffff-no-rj-mo",
  },
  {
    creatorTitle: "Valdemar",
    creatorId: "UCyzgM7IMV8AXN8suRSyNhiQ",
    userId: "WIn1mNvYXGap5UlRvJXYeHahdYl1",
    creatorImage: "https://yt3.ggpht.com/MqEZhK5w-qIhTFCU3SfCYOzPLMA-OP5f3vxaD8I-XqLyZus9vCEr_ujNUI0RJ9MqB4Q_LLaoERY=s176-c-k-c0x00ffffff-no-rj-mo",
  },
].sort(sortByNameCompareFunction);