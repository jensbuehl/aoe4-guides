import { useTheme, useDisplay } from "vuetify";

export function useVuetify() {
  const theme = useTheme();
  const display = useDisplay();
  return {
    theme,
    display,
  };
}
