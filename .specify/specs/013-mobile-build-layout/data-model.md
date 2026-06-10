# Data Model — Mobile Build View & Editor (`013-mobile-build-layout`)

> **No schema changes.** This feature is a mobile layout refactor. All entities below are existing Firestore documents/sub-structures. The mobile view reads and writes exactly the same fields as the desktop. This document exists to map spec requirements to the concrete data fields touched by the mobile UI.

---

## Entity: Build (`builds/{id}`)

| Field | Type | Mobile usage |
|---|---|---|
| `title` | `string` | Displayed in lean hero (`v-card-title`). Wraps; never truncated. |
| `status` | `string` (`draft` / `published`) | Status chip in hero. Edit action bar Draft/Publish writes this. |
| `civ` | `string` | Civilization chip (text-only on mobile; no flag). |
| `season` | `string` | Season chip in hero. |
| `map` | `string` | **Not shown on mobile view/hero** (FR-004). Remains in Classification card on edit. |
| `strategy` | `string` | **Not shown on mobile view/hero** (FR-004). Remains in Classification card on edit. |
| `description` | `string` | Shown in collapsible Description card (view route, FR-016). |
| `video` | `string` (URL) | Shown in Video card — thumbnail+play on view, URL field on edit (FR-017). |
| `userId` | `string` | Owner identity — used by owner-gated overflow guards (FR-019). |
| `buildOrderSections` | `Array<Section>` | The ordered list of age sections. See Section and Step below. |

---

## Entity: Section (embedded in `buildOrderSections[]`)

| Field | Type | Mobile usage |
|---|---|---|
| `age` | `string` | Age-up marker label (e.g. "Feudal Age"). Displayed in age-up row with ✕ remove. |
| `steps` | `Array<Step>` | The steps belonging to this section. |

---

## Entity: Step (embedded in `section.steps[]`)

| Field | Type | Mobile usage | Constraint |
|---|---|---|---|
| `time` | `string` | Displayed as chip on view; `v-text-field` in edit. **Free-text, not derived** (FR-007). | Stored verbatim; no validation. |
| `food` | `number` | Resource slot 2 of 5 (Food). Inline tap-to-type `v-text-field` in edit (FR-005, clarified NC-2). | ≥ 0. |
| `wood` | `number` | Resource slot 3 of 5 (Wood). | ≥ 0. |
| `gold` | `number` | Resource slot 4 of 5 (Gold). | ≥ 0. |
| `stone` | `number` | Resource slot 5 of 5 (Stone). | ≥ 0. |
| `builder` | `number` | Resource slot 1 of 5 (Builder). | ≥ 0. |
| `villagerCount` | `number` (derived) | **Calculated** as `food + wood + gold + stone + builder`. Read-only badge. Never written back as a separate field (FR-006). | Computed on the client; not stored separately. |
| `description` | `string` (shortcode) | WYSIWYG note in edit; icon-rendered in view. Stored as `::id::` shortcode string (FR-008, FR-013). | Round-trips losslessly via `serialize`/`deserialize` (SC-004). |

---

## Derived value: Villager Total

Not a stored field. Computed in the mobile step component:

```js
const villagerTotal = computed(() =>
  (step.food ?? 0) + (step.wood ?? 0) + (step.gold ?? 0) + (step.stone ?? 0) + (step.builder ?? 0)
)
```

Displayed as a read-only badge; never directly editable (FR-006).

---

## Icon token (within Step.description)

| Representation | Context |
|---|---|
| `::id::` (shortcode string) | Stored in Firestore; source of truth |
| `<img class="ic" data-token="id" contenteditable="false">` | DOM representation inside the `contenteditable` host during editing |
| `<IconToolTip :id="id">` (rendered) | View-mode rendering via the existing icon-tile system |

The `serialize` / `deserialize` functions in `useIconRichText` convert between the shortcode string and the DOM form. The `data-token` attribute is the only bridge; `src` is never used for reverse-mapping.

---

## State transitions: Build status

```
draft ──[Publish]──> published
published ──[Draft]──> draft
```

The sticky edit action bar exposes both transitions. Logic is unchanged from desktop; mobile only affects placement (FR-018).

---

## Age-down cascade (Step removal)

When an age-up is removed (FR-011):

```
section[i].age removed  →  section[i] removed  →  all section[i+1..n] removed
```

This is a destructive write to `buildOrderSections`. Requires confirmation dialog (SC-007). The "edge case: removing the last/only element" (spec Edge Cases) must leave `buildOrderSections` as an empty array (or a single sectionless list), not `null` / `undefined`.

---

## No new entities, no new fields, no Firestore rules changes.
