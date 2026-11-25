<template>
  <!--Every key the editor answers to, in one place. FR-022 of spec 029 asks for
      each shortcut to be stated where a mouse user will meet it; tooltips and
      the insert menu cover single controls, and this covers the keys no
      control has, such as Tab, Enter and the icon search.-->
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" width="560" scrollable>
    <v-card rounded="lg" flat>
      <v-card-title class="d-flex align-center">
        <v-icon size="20" color="accent" class="mr-2">mdi-keyboard-outline</v-icon>
        Keyboard shortcuts
      </v-card-title>
      <v-card-text class="pt-0">
        <section v-for="group in groups" :key="group.title" class="ks-group">
          <h3 class="ks-heading text-caption text-uppercase font-weight-bold">{{ group.title }}</h3>
          <div v-for="row in group.rows" :key="row.what" class="ks-row">
            <span class="ks-keys">
              <template v-for="(combo, c) in row.keys" :key="c">
                <span v-if="c" class="ks-or">{{ row.joiner ?? "or" }}</span>
                <span class="ks-combo">
                  <kbd v-for="key in combo" :key="key">{{ key }}</kbd>
                </span>
              </template>
            </span>
            <span class="ks-what">{{ row.what }}</span>
          </div>
        </section>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
/**
 * Whether to print the Mac names of the modifier keys.
 *
 * The editor dispatches on `event.code` and `altKey`/`ctrlKey`/`metaKey`, so the
 * same physical keys work everywhere; only what the list calls them differs.
 */
const isMac = () => {
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad/i.test(platform);
};

export default {
  name: "EditorShortcuts",
  props: { modelValue: Boolean },
  emits: ["update:modelValue"],
  setup() {
    const mac = isMac();
    const alt = mac ? "⌥" : "Alt";
    const ctrl = mac ? "⌘" : "Ctrl";

    const groups = [
      {
        title: "Moving around",
        rows: [
          { keys: [["Enter"]], what: "Next field, from the time through the resources to the description" },
          { keys: [["Tab"], ["Shift", "Tab"]], joiner: "/", what: "Next / previous step or note" },
          { keys: [["Esc"]], what: "Leave the field" },
        ],
      },
      {
        title: "Steps and notes",
        rows: [
          { keys: [[alt, "Enter"]], what: "Add a step below" },
          { keys: [[alt, "Shift", "Enter"]], what: "Add a step below with the same resources" },
          { keys: [[alt, "N"]], what: "Add a note below" },
          { keys: [[alt, "↑"], [alt, "↓"]], joiner: "/", what: "Move it up / down" },
          { keys: [[alt, "Shift", "Backspace"]], what: "Remove it" },
          { keys: [[ctrl, "Z"]], what: "Undo a removal (outside a text field)" },
        ],
      },
      {
        title: "Icons in a description",
        rows: [
          { keys: [["::"]], what: "Search icons by name or shorthand, e.g. ::rax" },
          { keys: [["↑"], ["↓"]], joiner: "/", what: "Choose in the list" },
          { keys: [["Space"], ["Enter"]], what: "Insert the highlighted icon" },
        ],
      },
      {
        title: "Help",
        rows: [{ keys: [["?"]], what: "Show this list (outside a text field)" }],
      },
    ];

    return { groups };
  },
};
</script>

<style scoped>
.ks-group + .ks-group {
  margin-top: 16px;
}
.ks-heading {
  letter-spacing: 0.05em;
  color: rgb(var(--v-theme-accent));
  margin-bottom: 4px;
}
.ks-row {
  display: grid;
  grid-template-columns: 168px 1fr;
  gap: 12px;
  align-items: baseline;
  padding: 4px 0;
}
.ks-keys {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px;
}
.ks-combo {
  display: inline-flex;
  gap: 3px;
}
.ks-or {
  opacity: 0.6;
  font-size: 12px;
}
kbd {
  font-family: inherit;
  font-size: 12px;
  line-height: 20px;
  min-width: 22px;
  padding: 0 6px;
  text-align: center;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.25);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  white-space: nowrap;
}
@media (max-width: 599px) {
  .ks-row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
