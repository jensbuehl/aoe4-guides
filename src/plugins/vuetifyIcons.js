import { h } from "vue";
import { mdi as mdiSvgSet, aliases as mdiSvgAliases } from "vuetify/iconsets/mdi-svg";
import { usedMdiIcons } from "@/plugins/mdiIcons";

// Custom Vuetify icon set. It keeps every existing `mdi-*` string usage working
// (e.g. icon="mdi-play", :prepend-icon="lane.icon") but renders them as SVG
// paths tree-shaken from @mdi/js, instead of shipping the full ~2.3 MB webfont.
//
// - "mdi-xxx" strings → looked up in usedMdiIcons and drawn as SVG.
// - Anything else (Vuetify's internal $-aliases already resolve to SVG paths
//   via mdiSvgAliases) passes straight through to the standard SVG renderer.
const mdiStringSvgSet = {
  component: (props) => {
    const raw = props.icon;
    let icon = raw;
    if (typeof raw === "string" && raw.startsWith("mdi-")) {
      icon = usedMdiIcons[raw];
      if (import.meta.env.DEV && icon === undefined) {
        // eslint-disable-next-line no-console
        console.warn(
          `[icons] "${raw}" is missing from src/plugins/mdiIcons.js — regenerate the used-icon list.`
        );
      }
    }
    return h(mdiSvgSet.component, { ...props, icon });
  },
};

export const iconOptions = {
  defaultSet: "mdi",
  aliases: mdiSvgAliases,
  sets: { mdi: mdiStringSvgSet },
};
