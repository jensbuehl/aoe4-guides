export const getDefaultConfig = () => ({
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

export const getDraftsConfig = () => ({
    author: null,
    civs: null,
    maps: [],
    strategies: [],
    seasons: [],
    orderBy: "timeCreated",
    drafts: true,
});

export const getPopularBuildsConfig = () => getDefaultConfig();
