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

export const featuredCreators = [
  {
    creatorTitle: "Aussie Drongo",
    creatorId: "UC0IMY7nkVsUimZDMAWWcDsg",
    creatorImage: "https://yt3.googleusercontent.com/ytc/APkrFKaGJQ_tztoR2MtjOGScVHZAGkordENYSqL7C1Y4=s176-c-k-c0x00ffffff-no-rj-mo",
  },
  {
    creatorTitle: "LaSh",
    creatorId: "UC6XKO9DF_fZFm9lO0IIv0bg",
    creatorImage: "https://yt3.ggpht.com/GxBvqo8sCMhAYrLCuVko7Eo7poPKX2iTS84SMtc8E2Ghgc4Y2rIA-_TYLaGbpqlt5cMCS6rA=s176-c-k-c0x00ffffff-no-rj-mo",
  },
  {
    creatorTitle: "Farm Man Official",
    creatorId: "UCK-Nza0xGWLcU3ryXrpk5_A",
    creatorImage: "https://yt3.ggpht.com/ku1-3NuMydEKWfY6U0wvHgkbLJN9oS59BA0_qdRWwfCXs5ucQ2p5Jkk1jAN-145P4KlQBtbewg=s176-c-k-c0x00ffffff-no-rj-mo",
  },
  {
    creatorTitle: "VortiX",
    creatorId: "UCYk9AH19xF7dtzM9OY7obmA",
    creatorImage: "https://yt3.googleusercontent.com/afGgL81rJrgLFG2E9nHG3Y0K8YLncTcUtUDP37_OsyJtV4crCw2uD4IgEyJ9ZmUAK22MR7kY_XA=s176-c-k-c0x00ffffff-no-rj",
  },
  {
    creatorTitle: "DeMu",
    creatorId: "UCkQOO6_iQkPxqK2j4MBUznw",
    creatorImage: "https://yt3.ggpht.com/KDz1ZJ9SEfxurwIAPOf6CnIniIv4h4PfRRo5CDvl6Sd8kve99jYSI5AFTRsyvX_aziQJnTmnjQ=s176-c-k-c0x00ffffff-no-rj-mo",
  },
  {
    creatorTitle: "FitzBro",
    creatorId: "UCnwcH2ufz2_Tq0gr8IIa5wg",
    creatorImage: "https://yt3.ggpht.com/uVmgC5--qrAz78YhZOQn2GBagxgoqDl6Jg5_vDP6X7LhMPYI2muJtLMCJb5-9fqlmnwuKTCEtQ=s176-c-k-c0x00ffffff-no-rj-mo",
  },
  {
    creatorTitle: "Beastyqt",
    creatorId: "UCo4EukJcKyZL6oXoLfsWxfA",
    creatorImage: "https://yt3.googleusercontent.com/ytc/APkrFKZaNEo7TdBB1Zt8qlsfEyZmHbgyL5El8XUv4w0wxQ=s176-c-k-c0x00ffffff-no-rj-mo",
  },
  {
    creatorTitle: "Valdemar",
    creatorId: "UCyzgM7IMV8AXN8suRSyNhiQ",
    creatorImage: "https://yt3.ggpht.com/MqEZhK5w-qIhTFCU3SfCYOzPLMA-OP5f3vxaD8I-XqLyZus9vCEr_ujNUI0RJ9MqB4Q_LLaoERY=s176-c-k-c0x00ffffff-no-rj-mo",
  },
  {
    creatorTitle: "Marinelord",
    creatorId: "UCHheEmSTX_NaAHSq2uwmlMg",
    creatorImage: "https://yt3.googleusercontent.com/ytc/AIdro_n5NzV0KnkaFIRQD1C-EaqzRPm_AVyYG4AzUMoLoutSTA=s160-c-k-c0x00ffffff-no-rj",
  },
].sort(sortByNameCompareFunction);
