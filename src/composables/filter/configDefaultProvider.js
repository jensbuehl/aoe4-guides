// The site-wide default: newest first. A visitor arriving at a list wants to
// see what is new since they last looked, not the same all-time leaders they
// saw last time — the leaderboard orderings stay one click away in the sort
// select, and Home still surfaces them explicitly via the configs below.
export const getDefaultConfig = () => ({
    author: null,
    civs: null,
    maps: [],
    strategies: [],
    seasons: [],
    orderBy: "timeCreated",
    drafts: false,
});

export const getPopularBuildsConfig = () => ({
    author: null,
    civs: null,
    maps: [],
    strategies: [],
    seasons: [],
    orderBy: "score",
    drafts: false,
});

export const getMostRecentBuildsConfig = () => ({
    author: null,
    civs: null,
    maps: [],
    strategies: [],
    seasons: [],
    orderBy: "timeCreated",
    drafts: false,
});

export const getAllTimeClassicsConfig = () => ({
    author: null,
    civs: null,
    maps: [],
    strategies: [],
    seasons: [],
    orderBy: "scoreAllTime",
    drafts: false,
});

export const getDraftsConfig = () => ({
    author: null,
    civs: null,
    maps: [],
    strategies: [],
    seasons: [],
    orderBy: "timeCreated",
    drafts: true,
});