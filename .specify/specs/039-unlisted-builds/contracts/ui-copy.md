# Contract: user-facing copy

Every string the spec's FR-009 and FR-010 cover, as it reads today and after the change. Nothing
outside this table changes wording (research R6 lists what deliberately keeps "draft").

| Where | Today | After |
|---|---|---|
| `BuildEditor.vue` menu item | Save as draft | **Save as unlisted** |
| `BuildEditor.vue` its tooltip | Save your progress without publishing it | **Save without listing it. It won't show up in lists or search, but anyone with the link can open it.** |
| `BuildEditor.vue` limit, below the cap | Oh, no! Villagers can only work on up to 10 drafts at a time. Please, don't forget to publish or delete your unfinished builds. | **Oh, no! Your villagers can keep {n} unlisted builds. Every 2 builds you publish make room for 1 more, up to 50.** |
| `BuildEditor.vue` limit, at the cap | — | **Oh, no! 50 unlisted builds is the most your villagers can keep. Publish or delete one to make room.** |
| `BuildDetails.vue` Publish tooltip | Make this draft public so other players can find it | **List this build so other players can find it** |
| `BuildDetails.vue` publish snackbar | Draft published successfully! | **Build published! Other players can find it now.** |
| `BuildHeader.vue` badge ×2 (mobile, md+) | `mdi-pencil-circle` Draft | **`mdi-link-variant` Unlisted** |
| `BuildListCard.vue` badge ×2 (mobile, md+) | `mdi-pencil-circle` Draft | **`mdi-link-variant` Unlisted** |

Notes:
- `{n}` and 50 come from `unlistedAllowance.js`, never from literals.
- The badges keep their colour (`error`), size and placement (spec assumption). "Unlisted" is longer
  than "Draft". The x-small chip on the mobile card sits inline in `.blc-meta` beside NEW and the date,
  so check it at 360px for wrapping (quickstart step 5).
- The Publish menu item keeps its label "Publish".
