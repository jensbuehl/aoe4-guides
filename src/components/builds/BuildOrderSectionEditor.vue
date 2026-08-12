<template>
  <!--Common delete confirmation dialog-->
  <v-dialog v-model="removeStepConfirmationDialog" width="auto" @keydown.enter="removeStep(delteRowIndex)">
    <v-card rounded="lg" class="text-center primary" flat>
      <v-card-title>Delete Step</v-card-title>
      <v-card-text>
        Do you really want to delete this build step?<br />
        The action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" block @click="removeStep(delteRowIndex)">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!--Removing an alternative, or the whole block, asks first — the same courtesy
      a step and an age-up already get, and these two destroy more than either.-->
  <v-dialog v-model="altConfirm.open" width="auto" @keydown.enter="runAltConfirm()">
    <v-card rounded="lg" class="text-center primary" flat>
      <v-card-title>{{ altConfirmTitle }}</v-card-title>
      <v-card-text>
        {{ altConfirmText }}<br />
        The action cannot be undone.
      </v-card-text>
      <v-card-actions class="justify-center ga-2">
        <v-btn variant="text" @click="altConfirm.open = false">Cancel</v-btn>
        <v-btn color="error" variant="tonal" @click="runAltConfirm()">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-tooltip
    v-model="showToolTip"
    :attach="'body'"
    :target="toolTipPos || null"
    :style="{ left: `${toolTipPos[0]}px`, top: `${toolTipPos[1]}px` }"
    absolute
    :location-strategy="absoluteLocationStrategy"
  >
    <span ref="toolTipElement">
      <IconToolTip ref="toolTipElement" :icon="toolTipModel" />
    </span>
  </v-tooltip>

  <IconAutoCompleteMenu
    @iconSelected="
      (iconPath, tooltip, iconClass) => {
        handleAutoCompleteMenuIconSelected(iconPath, tooltip, iconClass);
      }
    "
    :civ="civ"
    :searchText="searchText"
    :pos="autocompletePos"
  ></IconAutoCompleteMenu>

  <!--Mobile UI (XS) — bracketed age lane design -->
  <!--A bare age-up is only the arrival plate, and the plate carries its own
      margins: the section spacing on top of those would sit it off-centre-->
  <div
    class="hidden-sm-and-up"
    :class="section.type === 'ageUp' ? (isBareAgeUp ? '' : 'age-bracket-xs mt-2') : 'pt-1'"
  >
    <!-- ageUp section: age-up row (same pill style as arrival plate) -->
    <div v-if="section.type === 'ageUp' && !isBareAgeUp" class="age-ageup-row-xs">
      <v-icon color="accent" size="16">mdi-arrow-up-bold</v-icon>
      <span class="annot-lbl-xs age-annot-lbl">Advancing to {{ targetAgeShortName }}</span>
      <div style="flex:1"></div>
      <v-btn
        v-if="!readonly && isLastAgeUp"
        icon
        size="x-small"
        variant="text"
        class="step-remove-xs"
        @click.stop="$emit('ageDownRequested')"
      ><v-icon size="14">mdi-close</v-icon></v-btn>
    </div>
    <!-- empty section prompt -->
    <div v-if="!steps?.length && !readonly" class="text-center py-4">
      <!--Label and icon share one colour. They were split across primary and
          accent, which is invisible in dark mode (both gold) and reads as a
          two-tone button in light mode, where primary is navy.-->
      <StepInsertMenu :options="insertOptions(-1)" @select="handleInsert($event, -1)">
        <template v-slot:activator="{ props: menu }">
          <v-btn variant="text" color="accent" v-bind="menu">
            <template v-slot:prepend><v-icon color="accent">mdi-plus</v-icon></template>
            Add to build
          </v-btn>
        </template>
      </StepInsertMenu>
    </div>
    <template v-if="!readonly">
      <!-- Step cards (mobile edit) -->
      <div class="xs-steps-container" ref="stepsList">
        <!-- Insert point before the very first card (prepend) -->
        <StepInsertMenu v-if="steps?.length" :options="insertOptions(-1)" @select="handleInsert($event, -1)">
          <template v-slot:activator="{ props: menu }">
            <div class="step-insert-xs" v-bind="menu">
              <div class="step-insert-line-xs"></div>
              <span class="step-insert-circle-xs"><v-icon size="11">mdi-plus</v-icon></span>
              <div class="step-insert-line-xs"></div>
            </div>
          </template>
        </StepInsertMenu>
        <!--One wrapper per group, so a block's cards share a parent and the rail
            is drawn once on it — the age lane's own arrangement.-->
        <template v-for="(group, groupIndex) in xsGroups" :key="'xs-edit-g' + groupIndex">
        <div :class="group.block ? 'alt-bracket-xs' : 'xs-group-plain'">
        <template v-for="{ item, index } in group.entries" :key="item._id ?? ('xs-edit-' + index)">
        <!--The block opens with its paths, exactly as it does on desktop: the
            same tabs component, laid out as a card because that is what this
            breakpoint uses instead of rows.-->
        <div v-if="isBlockStart(item)" class="alt-card-xs alt-card-xs--start">
          <div class="alt-card-head-xs">
            <v-icon size="15" class="alt-mark">mdi-call-split</v-icon>
            <div style="flex:1"></div>
            <v-btn
              v-if="!readonly"
              icon
              size="x-small"
              variant="text"
              class="step-remove-xs"
              @click.stop="confirmRemoveBlock(index)"
            ><v-icon size="14">mdi-close</v-icon></v-btn>
          </div>
          <AlternativePathTabs
            :paths="item.paths"
            :active="item.active"
            :readonly="readonly"
            :renaming="renamingBlock === index"
            @select="switchPath(index, $event)"
            @add="addAlternative(index)"
            @rename="renamePath(index, $event)"
            @remove="removePathAt(index, $event)"
            @title="updatePath(index, 'title', $event)"
            @done="finishRename(index)"
          />
        </div>
        <!--The merge line, named as on desktop. This card is already the same
            42px row an age annotation is, so it carries a label the same way
            they do — at this list's own type scale, not the table's.-->
        <div v-else-if="isBlockEnd(item)" class="alt-card-xs alt-card-xs--end">
          <v-icon size="15" class="alt-mark">mdi-call-merge</v-icon>
          <span class="annot-lbl-xs alt-annot-lbl">Paths rejoin</span>
        </div>
        <!-- A note in the card flow, in the same dress the section note wears -->
        <div
          v-else-if="isNote(item)"
          class="gameplan-card-xs"
          :data-card-index="index"
          @keydown="handleRowShortcut($event, index)"
        >
          <div class="gameplan-header-xs">
            <v-icon size="13" color="accent">mdi-information-outline</v-icon>
            <span>Note</span>
            <!--Top right, where a step card keeps its own ✕. Same size, same
                corner: a note is deleted the way a step is.-->
            <div style="flex:1"></div>
            <v-btn
              icon
              size="x-small"
              variant="text"
              class="step-remove-xs"
              @click.stop="removeStepConfirmationDialog = true; delteRowIndex = index;"
            ><v-icon size="14">mdi-close</v-icon></v-btn>
          </div>
          <div class="step-desc-col-xs">
            <div
              :ref="el => registerNoteRef(el, index)"
              @keyup="saveSelection($event)"
              @click="saveSelection($event)"
              @paste="handlePaste"
              @focusout="updateStepNote($event, index)"
              @mouseover="handleMouseOver($event)"
              @mouseout="handleMouseOut($event)"
              :contenteditable="true"
              class="step-desc-xs step-desc-edit-xs"
              v-html="item.gameplan"
            ></div>
          </div>
          <div class="step-action-row-xs">
            <!--Picker first, move controls last, and the order is load-bearing.
                The picker keeps its slot while invisible so the row never shifts
                as it fades in — put it last and that reserved slot sits against
                the card's right edge as a gap the move buttons are held off by.
                Inside the row, the same reserved space is invisible.-->
            <v-menu :close-on-content-click="false" location="bottom">
              <template v-slot:activator="{ props: menu }">
                <v-btn
                  size="x-small"
                  variant="text"
                  color="accent"
                  v-bind="menu"
                  @mousedown.prevent="saveSelection($event)"
                  icon
                  class="step-icon-btn-xs"
                ><v-icon>mdi-image-plus</v-icon><v-tooltip activator="parent" location="top"><span :style="{ color: $vuetify.theme.current.colors.primary }">Add an icon, or type :: in the text</span></v-tooltip></v-btn>
              </template>
              <v-card flat rounded="lg" class="mt-4" width="350px">
                <IconSelector
                  @iconSelected="(iconPath, tooltip, iconClass) => handleIconSelectorIconSelected(iconPath, tooltip, iconClass)"
                  :civ="civ"
                ></IconSelector>
              </v-card>
            </v-menu>
            <StepMoveControls
              :up="canMoveEntry(index, -1)"
              :down="canMoveEntry(index, 1)"
              kind="note"
              @move="moveCard(index, $event)"
            />
          </div>
        </div>
        <div
          v-else
          class="step-card-xs"
          :data-card-index="index"
          @keydown="handleRowShortcut($event, index)"
          @focusin="$emit('selectionChanged')"
          @mousedown="selectStep(index)"
        >
          <!-- Top bar: editable timestamp + spacer + villager total + ✕ -->
          <div class="stepc-top-xs">
            <div class="step-time-xs">
              <img src="/assets/resources/time.webp" />
              <span
                @paste="handlePaste"
                @focusout="handleTimeBlur($event, index)"
                @input="handleResourceInput"
                :contenteditable="true"
                class="step-time-input"
                v-html="item.time"
              ></span>
            </div>
            <div style="flex:1"></div>
            <div class="step-pop-xs">
              <img src="/assets/resources/villager.webp" />
              <span>{{ aggregateVillagers(item) || '–' }}</span>
            </div>
            <v-btn
              icon
              size="x-small"
              variant="text"
              class="step-remove-xs"
              @click.stop="removeStepConfirmationDialog = true; delteRowIndex = index;"
            ><v-icon size="14">mdi-close</v-icon></v-btn>
          </div>
          <!-- 5-slot grid (editable) -->
          <div class="step-grid-xs">
            <div :class="['slot-xs', 'slot-builder', hasResourceValue(item.builders) ? 'slot-has' : 'slot-empty', 'slot-edit']">
              <div class="slot-icon"><img src="/assets/resources/repair.webp" /></div>
              <span
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'builders')"
                @input="handleResourceInput"
                :contenteditable="true"
                class="slot-val slot-val-edit"
                v-html="item.builders ? item.builders : ''"
              ></span>
            </div>
            <div :class="['slot-xs', 'slot-food', hasResourceValue(item.food) ? 'slot-has' : 'slot-empty', 'slot-edit']">
              <div class="slot-icon"><img src="/assets/resources/food.webp" /></div>
              <span
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'food')"
                @input="handleResourceInput"
                :contenteditable="true"
                class="slot-val slot-val-edit"
                v-html="item.food ? item.food : ''"
              ></span>
            </div>
            <div :class="['slot-xs', 'slot-wood', hasResourceValue(item.wood) ? 'slot-has' : 'slot-empty', 'slot-edit']">
              <div class="slot-icon"><img src="/assets/resources/wood.webp" /></div>
              <span
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'wood')"
                @input="handleResourceInput"
                :contenteditable="true"
                class="slot-val slot-val-edit"
                v-html="item.wood ? item.wood : ''"
              ></span>
            </div>
            <div :class="['slot-xs', 'slot-gold', hasResourceValue(item.gold) ? 'slot-has' : 'slot-empty', 'slot-edit']">
              <div class="slot-icon"><img src="/assets/resources/gold.webp" /></div>
              <span
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'gold')"
                @input="handleResourceInput"
                :contenteditable="true"
                class="slot-val slot-val-edit"
                v-html="item.gold ? item.gold : ''"
              ></span>
            </div>
            <div :class="['slot-xs', 'slot-stone', hasResourceValue(item.stone) ? 'slot-has' : 'slot-empty', 'slot-edit']">
              <div class="slot-icon"><img src="/assets/resources/stone.webp" /></div>
              <span
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'stone')"
                @input="handleResourceInput"
                :contenteditable="true"
                class="slot-val slot-val-edit"
                v-html="item.stone ? item.stone : ''"
              ></span>
            </div>
          </div>
          <!-- Description field -->
          <div class="step-desc-col-xs">
            <div
              @keyup="saveSelection($event)"
              @click="saveSelection($event)"
              @paste="handlePaste"
              @focusout="updateStepDescription($event, index)"
              @mouseover="handleMouseOver($event)"
              @mouseout="handleMouseOut($event)"
              :contenteditable="true"
              class="step-desc-xs step-desc-edit-xs"
              v-html="item.description"
            ></div>
          </div>
          <!-- Action row: add-icon (desc focus) then move controls — always in
               DOM, no CLS. The picker comes first because it holds its slot
               while invisible; last, that reserved slot would sit against the
               card's right edge and hold the move buttons off it. -->
          <div class="step-action-row-xs">
            <v-menu :close-on-content-click="false" location="bottom">
              <template v-slot:activator="{ props: menu }">
                <v-btn
                  size="x-small"
                  variant="text"
                  color="accent"
                  v-bind="menu"
                  @mousedown.prevent="saveSelection($event)"
                  icon
                  class="step-icon-btn-xs"
                ><v-icon>mdi-image-plus</v-icon><v-tooltip activator="parent" location="top"><span :style="{ color: $vuetify.theme.current.colors.primary }">Add an icon, or type :: in the text</span></v-tooltip></v-btn>
              </template>
              <v-card flat rounded="lg" class="mt-4" width="350px">
                <IconSelector
                  @iconSelected="(iconPath, tooltip, iconClass) => handleIconSelectorIconSelected(iconPath, tooltip, iconClass)"
                  :civ="civ"
                ></IconSelector>
              </v-card>
            </v-menu>
            <StepMoveControls
              :up="canMoveEntry(index, -1)"
              :down="canMoveEntry(index, 1)"
              kind="step"
              @move="moveCard(index, $event)"
            />
          </div>
        </div>
        <!-- Insert after each card: index = insert immediately after card at this index -->
        <!--Skipped after the merge marker: that divider belongs outside the
            bracket, and is rendered below the wrapper instead. Inside one, the
            wrapper's own rail runs behind it.-->
        <StepInsertMenu
          v-if="!isBlockEnd(item)"
          :options="insertOptions(index)"
          @select="handleInsert($event, index)"
        >
          <template v-slot:activator="{ props: menu }">
            <div class="step-insert-xs" v-bind="menu">
              <div class="step-insert-line-xs"></div>
              <span class="step-insert-circle-xs"><v-icon size="11">mdi-plus</v-icon></span>
              <div class="step-insert-line-xs"></div>
            </div>
          </template>
        </StepInsertMenu>
        </template><!-- end v-for step -->
        </div><!-- end group -->
        <!--The insert line that follows a block sits after the bracket, so the
            rail stops at the merge marker where the block does.-->
        <StepInsertMenu
          v-if="group.block"
          :options="insertOptions(group.entries[group.entries.length - 1].index)"
          @select="handleInsert($event, group.entries[group.entries.length - 1].index)"
        >
          <template v-slot:activator="{ props: menu }">
            <div class="step-insert-xs" v-bind="menu">
              <div class="step-insert-line-xs"></div>
              <span class="step-insert-circle-xs"><v-icon size="11">mdi-plus</v-icon></span>
              <div class="step-insert-line-xs"></div>
            </div>
          </template>
        </StepInsertMenu>
        </template><!-- end group -->
        <!-- The section's own note, from before notes could be placed. Drawn
             only when it says something — an empty card at the foot of every
             section was the editor deciding a note belonged there. -->
        <div v-if="hasVisibleContent(gameplan)" class="gameplan-card-xs">
          <div class="gameplan-header-xs">
            <v-icon size="13" color="accent">mdi-information-outline</v-icon>
            <span>Notes</span>
          </div>
          <div class="step-desc-col-xs">
            <div
              @keyup="saveSelection($event)"
              @click="saveSelection($event)"
              @paste="handlePaste"
              @focusout="updateSectionGameplan($event)"
              @mouseover="handleMouseOver($event)"
              @mouseout="handleMouseOut($event)"
              :contenteditable="true"
              class="step-desc-xs step-desc-edit-xs"
              v-html="gameplan"
            ></div>
          </div>
          <div class="step-action-row-xs">
            <v-menu :close-on-content-click="false" location="bottom">
              <template v-slot:activator="{ props: menu }">
                <v-btn
                  size="x-small"
                  variant="text"
                  color="accent"
                  v-bind="menu"
                  @mousedown.prevent="saveSelection($event)"
                  icon
                  class="step-icon-btn-xs"
                ><v-icon>mdi-image-plus</v-icon><v-tooltip activator="parent" location="top"><span :style="{ color: $vuetify.theme.current.colors.primary }">Add an icon, or type :: in the text</span></v-tooltip></v-btn>
              </template>
              <v-card flat rounded="lg" class="mt-4" width="350px">
                <IconSelector
                  @iconSelected="(iconPath, tooltip, iconClass) => handleIconSelectorIconSelected(iconPath, tooltip, iconClass)"
                  :civ="civ"
                ></IconSelector>
              </v-card>
            </v-menu>
          </div>
        </div>
      </div>
    </template><!-- end edit-mode -->

    <!-- Readonly viewer: 5-slot step cards -->
    <template v-if="readonly">
      <div class="xs-steps-container">
        <!--A step that restates the previous distribution and says nothing else
            is not a step that happened; a reader counting rows would count it.
            Hidden here and never in the editor, where the author still owns it.-->
        <template v-for="(group, groupIndex) in xsGroups" :key="'xs-view-g' + groupIndex">
        <div :class="group.block ? 'alt-bracket-xs' : 'xs-group-plain'">
        <template v-for="{ item, index } in group.entries" :key="'xs-view-' + index">
        <!--Reading a block: the paths are shown as they are authored, and the
            tabs are the reader's own control — clicking one switches path.-->
        <!--One line, not two. Reading has no ✕ to make room for, so the mark and
            the paths it introduces sit together — the same arrangement the
            desktop row uses, and one row less to scroll past on a phone.-->
        <div class="alt-card-xs alt-card-xs--start alt-card-xs--read" v-if="isBlockStart(item)">
          <v-icon size="15" class="alt-mark">mdi-call-split</v-icon>
          <AlternativePathTabs
            :paths="item.paths"
            :active="item.active"
            readonly
            stacked
            @select="switchPath(index, $event)"
          />
        </div>
        <div v-else-if="isBlockEnd(item)" class="alt-card-xs alt-card-xs--end">
          <v-icon size="15" class="alt-mark">mdi-call-merge</v-icon>
          <span class="annot-lbl-xs alt-annot-lbl">Paths rejoin</span>
        </div>
        <div v-else-if="isNote(item) && hasVisibleContent(item.gameplan)" class="gameplan-card-xs">
          <div class="gameplan-header-xs">
            <v-icon size="13" color="accent">mdi-information-outline</v-icon>
            <span>Note</span>
          </div>
          <div
            class="step-desc-xs"
            v-html="item.gameplan"
            @mouseover="handleMouseOver($event)"
            @mouseout="handleMouseOut($event)"
          ></div>
        </div>
        <div
          v-else-if="!saysNothing(index)"
          class="step-card-xs"
        >
          <!-- Top bar: timestamp + villager total -->
          <div class="stepc-top-xs">
            <!--Same fallback as the desktop table's time column: a cell the
                author left blank shows the worked-out time, marked as one. The
                modifier sits on the pill rather than the text, so a derived
                moment does not keep an accent-tinted badge around it.-->
            <div
              class="step-time-xs"
              :class="{ 'step-time-xs--derived': !item.time && isEstimate(index) }"
            >
              <img src="/assets/resources/time.webp" />
              <span>{{ item.time || resolvedTime(index) }}</span>
            </div>
            <div style="flex:1"></div>
            <div class="step-pop-xs">
              <img src="/assets/resources/villager.webp" />
              <span>{{ aggregateVillagers(item) || '–' }}</span>
            </div>
          </div>
          <!-- 5-slot resource grid: Builder · Food · Wood · Gold · Stone -->
          <div class="step-grid-xs">
            <div :class="['slot-xs', 'slot-builder', hasResourceValue(item.builders) ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/repair.webp" /></div>
              <span class="slot-val">{{ hasResourceValue(item.builders) ? item.builders : '–' }}</span>
            </div>
            <div :class="['slot-xs', 'slot-food', hasResourceValue(item.food) ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/food.webp" /></div>
              <span class="slot-val">{{ hasResourceValue(item.food) ? item.food : '–' }}</span>
            </div>
            <div :class="['slot-xs', 'slot-wood', hasResourceValue(item.wood) ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/wood.webp" /></div>
              <span class="slot-val">{{ hasResourceValue(item.wood) ? item.wood : '–' }}</span>
            </div>
            <div :class="['slot-xs', 'slot-gold', hasResourceValue(item.gold) ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/gold.webp" /></div>
              <span class="slot-val">{{ hasResourceValue(item.gold) ? item.gold : '–' }}</span>
            </div>
            <div :class="['slot-xs', 'slot-stone', hasResourceValue(item.stone) ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/stone.webp" /></div>
              <span class="slot-val">{{ hasResourceValue(item.stone) ? item.stone : '–' }}</span>
            </div>
          </div>
          <!-- Description with inline icons -->
          <div
            v-if="hasVisibleContent(item.description)"
            class="step-desc-xs"
            v-html="item.description"
            @mouseover="handleMouseOver($event)"
            @mouseout="handleMouseOut($event)"
          ></div>
        </div>
        </template>
        </div>
        </template><!-- end group -->
        <!-- Notes card inside container — gets the same 8px gap as step cards.
             Guarded on visible content rather than on the string: an author who
             typed a note and deleted it leaves "<br>" behind, which is truthy
             and would draw a Notes card with nothing in it. -->
        <div v-if="hasVisibleContent(gameplan)" class="gameplan-card-xs">
          <div class="gameplan-header-xs">
            <v-icon size="13" color="accent">mdi-information-outline</v-icon>
            <span>Notes</span>
          </div>
          <div
            class="step-desc-xs"
            v-html="gameplan"
            @mouseover="handleMouseOver($event)"
            @mouseout="handleMouseOut($event)"
          ></div>
        </div>
      </div>
    </template><!-- end readonly viewer -->
  <!-- arrival plate closes the ageUp bracket -->
  <div v-if="section.type === 'ageUp'" class="age-arrival-plate-xs">
    <img :src="targetAgeImg" class="age-arrival-icon-xs" />
    <span class="annot-lbl-xs age-annot-lbl">{{ targetAgeName }}</span>
  </div>
</div>

  <!--Desktop UI-->
  <!--The transition is announced as a group, because the rail that says which
      rows are inside it is decorative and a reader who is not seeing it would
      otherwise get the two markers and no sense that anything joined them. The
      group is the section, which already contains exactly the railed run, so the
      boundary is real rather than invented. Rows say nothing extra: an age-up is
      a handful of rows and repeating "still ageing up" on each one is noise.
      The label is built from the internal age-name map, never author content.-->
  <v-card
    flat
    rounded="lg"
    :role="section.type === 'ageUp' ? 'group' : null"
    :aria-label="section.type === 'ageUp' && targetAgeName ? `Advancing to ${targetAgeName}` : null"
    :class="['hidden-xs', (section.type === 'ageUp' || (section.type === 'age' && section.age > 1)) ? 'mt-0' : 'mt-4']"
  >
    <!--The advance banner used to sit here, a full-width gold bar identical to
        the arrival plate below. It is a row in the table now: the advance is an
        action the player performs at a moment, exactly like "build a house",
        while the arrival is a boundary the build crosses. Drawing them alike
        told the reader which was which. -->
    <v-table
      v-if="hasTableRows"
      class="mx-4"
      style="border-radius: 0"
    >
        <colgroup>
          <col style="width:64px">
          <col style="width:44px">
          <col style="width:54px">
          <col style="width:54px">
          <col style="width:54px">
          <col style="width:54px">
          <col style="width:54px">
          <col>
          <col v-if="!readonly" style="width:90px">
        </colgroup>
        <thead v-if="section.age <= 1 && section.type == 'age'">
          <tr>
            <th class="text-center ma-0 pa-0">
              <v-img class="mx-auto titleIcon" src="/assets/resources/time.webp"></v-img>
            </th>
            <v-tooltip location="top">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Villager Count</span
              >
              <template v-slot:activator="{ props }">
                <th v-bind="props" class="text-center ma-0 pa-0">
                  <v-img class="mx-auto titleIcon" src="/assets/resources/villager.webp"></v-img>
                </th>
              </template>
            </v-tooltip>
            <th class="text-center ma-0 pa-0">
              <v-img class="mx-auto titleIcon" src="/assets/resources/repair.webp"></v-img>
            </th>
            <th class="text-center ma-0 pa-0">
              <v-img class="mx-auto titleIcon" src="/assets/resources/food.webp"></v-img>
            </th>
            <th class="text-center ma-0 pa-0">
              <v-img class="mx-auto titleIcon" src="/assets/resources/wood.webp"></v-img>
            </th>
            <th class="text-center ma-0 pa-0">
              <v-img class="mx-auto titleIcon" src="/assets/resources/gold.webp"></v-img>
            </th>
            <th class="text-center ma-0 pa-0">
              <v-img class="mx-auto titleIcon" src="/assets/resources/stone.webp"></v-img>
            </th>
            <th class="text-left">Description</th>
            <th v-if="!readonly" class="text-right"></th>
          </tr>
        </thead>
        <tbody ref="stepsTable" :class="isDragging && 'steps-table--dragging'">
          <!--The advance. A plain row, at the height and on the rules of every
              other row, carrying the action and nothing else — no time of any
              kind. The timeline above the build already states the transition's
              span, and the arrival is on the bar that closes this section, so a
              time here would state a known number twice.

              It is the row the player clicks the landmark on, so its place in
              the sequence is the information it carries. Deliberately no
              data-step-index and no hover handlers: it is a marker, not a step,
              and giving it an index would shift every index after it.-->
          <tr
            v-if="section.type === 'ageUp' && !isBareAgeUp"
            :class="['age-advance-row', hasTransitionBody && 'age-lane-md']"
          >
            <td class="py-1 text-center">
              <v-icon size="16" class="age-advance-mark">mdi-arrow-up-bold</v-icon>
            </td>
            <td :colspan="7" class="py-1 px-2">
              <span class="annot-lbl age-annot-lbl">Advancing to {{ targetAgeShortName }}</span>
            </td>
            <!--The ✕ lands in the column every step row's ✕ lands in, which is
                what the banner's height cap used to be fighting the column grid
                to achieve.-->
            <td v-if="!readonly" class="step-actions" style="width:90px">
              <div class="step-actions-inner">
                <v-btn
                  v-if="isLastAgeUp"
                  icon
                  size="small"
                  variant="text"
                  class="row-x"
                  @click.stop="$emit('ageDownRequested')"
                ><v-icon size="16">mdi-close</v-icon></v-btn>
              </div>
            </td>
          </tr>
          <tr v-if="!readonly && !steps.length" :class="['ins-row', dropGapIndex === 0 && 'ins-row--drop']">
            <td :colspan="9" class="ins-row-cell" data-gap-index="0">
              <StepInsertMenu :options="insertOptions(-1)" @select="handleInsert($event, -1)">
                <template v-slot:activator="{ props: menu, isOpen }">
                  <div :class="['ins-zone', isOpen && 'ins-zone--open']" v-bind="menu"><div class="ins-line"></div><button class="ins-btn" tabindex="-1">+ Add</button></div>
                </template>
              </StepInsertMenu>
            </td>
          </tr>
          <template v-for="(item, index) in steps" :key="item._id ?? index">
          <tr v-if="!readonly" :class="['ins-row', dropGapIndex === index && 'ins-row--drop']">
            <td :colspan="9" class="ins-row-cell" :data-gap-index="index">
              <StepInsertMenu :options="insertOptions(index - 1)" @select="handleInsert($event, index - 1)">
                <template v-slot:activator="{ props: menu, isOpen }">
                  <div :class="['ins-zone', isOpen && 'ins-zone--open']" v-bind="menu"><div class="ins-line"></div><button class="ins-btn" tabindex="-1">+ Add</button></div>
                </template>
              </StepInsertMenu>
            </td>
          </tr>
          <!--Opening marker, path bar and the condition, as one banner. The
              paths are siblings inside one bracket, so the tabs switch which
              path's steps the table below is showing — the same control the
              reader gets, doing the same thing.-->
          <template v-if="isBlockStart(item)">
            <tr class="alt-row alt-row--start">
              <td class="py-1 text-center">
                <v-icon size="16" class="alt-mark">mdi-call-split</v-icon>
              </td>
              <!--The paths themselves are the block's opening line. They name
                  what a label would only have described, so the words went and
                  the tabs took the row — the mark, the rail and the tint already
                  say a block starts here.-->
              <td :colspan="7" class="py-1 alt-bar-cell">
                <AlternativePathTabs
                  :paths="item.paths"
                  :active="item.active"
                  :readonly="readonly"
                  :renaming="renamingBlock === index"
                  @select="switchPath(index, $event)"
                  @add="addAlternative(index)"
                  @rename="renamePath(index, $event)"
                  @remove="removePathAt(index, $event)"
                  @title="updatePath(index, 'title', $event)"
                  @done="finishRename(index)"
                />
              </td>
              <td v-if="!readonly" class="step-actions" style="width:90px">
                <div class="step-actions-inner">
                  <v-btn icon size="small" variant="text" class="row-x" @click="confirmRemoveBlock(index)"
                    ><v-icon size="16">mdi-close</v-icon></v-btn
                  >
                </div>
              </td>
            </tr>
          </template>
          <!--The merge line. Always present, never added: the paths rejoin here
              and the next step is common to all of them.-->
          <tr v-else-if="isBlockEnd(item)" class="alt-row alt-row--end">
            <td class="py-1 text-center">
              <v-icon size="16" class="alt-mark">mdi-call-merge</v-icon>
            </td>
            <!--This row was the mark alone, on the grounds that the rail ending
                and the merge icon already said it, and a label would have been
                the only text in the block naming itself. That held while the age
                markers were boxed bars floating beside the list. They are
                labelled rows in this very column now, so the merge line became
                the one annotation row with nothing in it — the odd one out
                rather than the quiet one.

                "Rejoin" rather than "both paths continue": a block can hold
                three or more alternatives, so any wording that counts them is
                wrong as soon as an author adds a third.-->
            <td :colspan="7" class="py-1 px-2">
              <span class="annot-lbl alt-annot-lbl">Paths rejoin</span>
            </td>
            <!--No ✕ here. The merge line is not a thing an author added, so it
                is not a thing they remove; the block is removed from where it
                begins. Two controls doing one job would also read as "close
                this" versus "delete this", which are not the same act.-->
            <td v-if="!readonly" class="step-actions" style="width:90px"></td>
          </tr>
          <!--A note: one wide cell where a step has nine narrow ones. Same
              treatment the section note has always had, so a note reads as a
              note wherever it sits.-->
          <tr
            v-else-if="isNote(item) && (!readonly || hasVisibleContent(item.gameplan))"
            :data-step-index="index"
            :class="[
              'step-row',
              'bo-noterow',
              insideBlock(index) && 'alt-inside',
              section.type === 'ageUp' && 'age-lane-md',
              { 'step-row--linked': linkedRow === index || flashedRow === index },
              { 'step-row--dragging': draggingIndex === index },
            ]"
            @keydown="handleRowShortcut($event, index)"
            @focusin="$emit('selectionChanged')"
            @mousedown="selectStep(index)"
          >
            <td class="py-1 text-center note-icon-cell">
              <!--Boxed to the height of one line of note text, so the icon
                  centres against the first line rather than against the whole
                  note. A one-line note reads as centred; a long one keeps its
                  icon in the corner beside where the text starts.-->
              <span class="note-icon-line">
                <v-icon size="16" color="accent">mdi-information-outline</v-icon>
              </span>
            </td>
            <td
              v-if="readonly"
              :colspan="7"
              class="py-1 px-2 contentEditable"
              v-html="item.gameplan"
              @mouseover="handleMouseOver($event)"
              @mouseout="handleMouseOut($event)"
            ></td>
            <td
              v-else
              :ref="el => registerNoteRef(el, index)"
              :data-edit-index="index"
              data-edit-field="gameplan"
              @input="showAutoCompleteMenu($event, index)"
              @keyup="handleContentEditableKeyUp($event, index)"
              @click="saveSelection($event)"
              @paste="handlePaste"
              @keydown.esc.prevent="releaseEditing($event)"
              @focusin="focusedDescIndex = index"
              @focusout="updateStepNote($event, index); focusedDescIndex = null"
              @mouseover="handleMouseOver($event)"
              @mouseout="handleMouseOut($event)"
              contenteditable="true"
              :colspan="7"
              class="contentEditable text-left py-1 px-2"
              v-html="item.gameplan"
            ></td>
            <td v-if="!readonly" class="step-actions" style="width:90px">
              <div class="step-actions-inner">
                <!--Grip and icon picker share one slot, stacked. Three controls
                    do not begin to fit: a `size="small"` icon button is a 40px
                    circle, the cell is 90px with 8px of padding, so two plus
                    their gap come to 82px in an 82px box and a third would need
                    124px. Sharing is not a workaround for that, though — the two
                    are never both wanted. The picker matters while the
                    description has focus; the grip matters when it does not.
                    Stacked rather than swapped with v-if so the picker's menu is
                    never unmounted from under itself.

                    The grip is also the keyboard control: a fourth button for
                    the arrow keys would need space that does not exist, and a
                    focusable grip answering to them is the same affordance
                    reached two ways.-->
                <div class="step-action-slot">
                  <v-btn
                    :ref="el => registerDragHandleRef(el, index)"
                    icon
                    size="small"
                    variant="text"
                    :class="['row-grip', focusedDescIndex === index && 'row-grip--hidden']"
                    :aria-label="moveLabel(item)"
                    @pointerdown="startDrag($event, index)"
                    @keydown.up.exact.prevent="moveEntry(index, -1)"
                    @keydown.down.exact.prevent="moveEntry(index, 1)"
                  ><v-icon size="16">mdi-drag-horizontal-variant</v-icon
                    ><!--Suppressed mid-drag: the grip keeps pointer capture for
                        the whole gesture, so the tooltip would sit open under
                        the cursor the entire time a row is being carried.-->
                    <v-tooltip activator="parent" location="top" :disabled="isDragging"
                      ><span :style="{ color: $vuetify.theme.current.colors.primary }"
                        >Drag to move, or Alt + ↑ / ↓</span
                      ></v-tooltip
                    ></v-btn
                  >
                <v-menu :close-on-content-click="false" max-width="700" location="bottom end">
                  <template v-slot:activator="{ props: menu }">
                    <v-btn
                      v-bind="menu"
                      icon
                      color="accent"
                      variant="text"
                      size="small"
                      :class="['step-action-icon', focusedDescIndex !== index && 'step-action-icon--hidden']"
                      @mousedown.prevent="saveSelection($event)"
                    ><v-icon>mdi-image-plus</v-icon><v-tooltip activator="parent" location="top"><span :style="{ color: $vuetify.theme.current.colors.primary }">Add an icon, or type :: in the text</span></v-tooltip></v-btn>
                  </template>
                  <v-card flat rounded="lg">
                    <IconSelector
                      @iconSelected="(iconPath, tooltip, iconClass) => handleIconSelectorIconSelected(iconPath, tooltip, iconClass)"
                      :civ="civ"
                    ></IconSelector>
                  </v-card>
                </v-menu>
                </div>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  class="row-x"
                  @click="confirmRemoveStep(index)"
                ><v-icon size="16">mdi-close</v-icon
                  ><v-tooltip activator="parent" location="top"
                    ><span :style="{ color: $vuetify.theme.current.colors.primary }"
                      >Remove, or Alt + Backspace</span
                    ></v-tooltip
                  ></v-btn
                >
              </div>
            </td>
          </tr>
          <!--Hidden only for readers. The editor keeps every row: an author has
              to be able to see and reach a step to fix or remove it.-->
          <tr
            v-else-if="!readonly || !saysNothing(index)"
            :data-step-index="index"
            :class="[
              'step-row',
              insideBlock(index) && 'alt-inside',
              section.type === 'ageUp' && 'age-lane-md',
              { 'step-row--linked': linkedRow === index || flashedRow === index },
              { 'step-row--dragging': draggingIndex === index },
            ]"
            @keydown="handleRowShortcut($event, index)"
            @focusin="$emit('selectionChanged')"
            @mousedown="selectStep(index)"
            @mouseover="hoverStep(index)"
            @pointermove="reportStep($event, index)"
            @mouseleave="unhoverStep()"
          >
            <td class="text-center py-1">
              <!--A blank cell used to mean the reader got nothing, even though
                  the site had worked the moment out for the timeline above. The
                  estimate is shown in the same column, muted and marked, so a
                  worked-out time can never be mistaken for one the author typed.-->
              <span
                v-if="readonly"
                :class="['ts-text', !item.time && isEstimate(index) && 'ts-text--derived']"
                >{{ item.time || resolvedTime(index) }}</span
              >
              <input
                v-else
                :ref="el => registerTimestampRef(el, index)"
                type="text"
                :value="item.time"
                @input="updateStep($event, index, 'time')"
                @blur="handleTimeBlur($event, index)"
                @paste="handlePaste"
                :class="['ts-pill', !item.time && 'ts-ghost']"
              />
            </td>
            <td class="text-center aggregatedVillagers py-1" v-html="aggregateVillagers(item)"></td>
            <td class="text-center py-1">
              <template v-if="readonly">
                <span v-if="hasResourceValue(item.builders)" :class="['rc-pill rc-builders', deltaClass('builders', index)]">{{ item.builders }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else type="text" maxlength="7" :value="item.builders"
                @input="updateStep($event, index, 'builders')" @paste="handlePaste"
                :class="hasResourceValue(item.builders) ? ['rc-pill','rc-builders','rc-input', deltaClass('builders',index)] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td class="text-center py-1">
              <template v-if="readonly">
                <span v-if="hasResourceValue(item.food)" :class="['rc-pill rc-food', deltaClass('food', index)]">{{ item.food }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else type="text" maxlength="7" :value="item.food"
                @input="updateStep($event, index, 'food')" @paste="handlePaste"
                :class="hasResourceValue(item.food) ? ['rc-pill','rc-food','rc-input', deltaClass('food',index)] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td class="text-center py-1">
              <template v-if="readonly">
                <span v-if="hasResourceValue(item.wood)" :class="['rc-pill rc-wood', deltaClass('wood', index)]">{{ item.wood }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else type="text" maxlength="7" :value="item.wood"
                @input="updateStep($event, index, 'wood')" @paste="handlePaste"
                :class="hasResourceValue(item.wood) ? ['rc-pill','rc-wood','rc-input', deltaClass('wood',index)] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td class="text-center py-1">
              <template v-if="readonly">
                <span v-if="hasResourceValue(item.gold)" :class="['rc-pill rc-gold', deltaClass('gold', index)]">{{ item.gold }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else type="text" maxlength="7" :value="item.gold"
                @input="updateStep($event, index, 'gold')" @paste="handlePaste"
                :class="hasResourceValue(item.gold) ? ['rc-pill','rc-gold','rc-input', deltaClass('gold',index)] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td class="text-center py-1">
              <template v-if="readonly">
                <span v-if="hasResourceValue(item.stone)" :class="['rc-pill rc-stone', deltaClass('stone', index)]">{{ item.stone }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else :ref="el => registerStoneInputRef(el, index)" type="text" maxlength="7" :value="item.stone"
                @input="updateStep($event, index, 'stone')" @paste="handlePaste"
                :class="hasResourceValue(item.stone) ? ['rc-pill','rc-stone','rc-input', deltaClass('stone',index)] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td
              :data-edit-index="!readonly ? index : null"
              :data-edit-field="!readonly ? 'description' : null"
              @input="showAutoCompleteMenu($event, index)"
              @keyup="handleContentEditableKeyUp($event, index)"
              @keydown.tab.exact.prevent="timestampRefs[index + 1]?.focus()"
              @keydown.shift.tab.prevent="stoneInputRefs[index]?.focus()"
              @click="saveSelection"
              @paste="handlePaste"
              @keydown.esc.prevent="releaseEditing($event)"
              @focusin="focusedDescIndex = index"
              @focusout="updateStepDescription($event, index); focusedDescIndex = null"
              @mouseover="handleMouseOver($event)"
              @mouseout="handleMouseOut($event)"
              :contenteditable="!readonly"
              class="contentEditable text-left py-1"
              v-html="item.description"
            ></td>
            <td v-if="!readonly" class="step-actions" style="width:90px">
              <div class="step-actions-inner">
                <!--Grip and icon picker share one slot, stacked. Three controls
                    do not begin to fit: a `size="small"` icon button is a 40px
                    circle, the cell is 90px with 8px of padding, so two plus
                    their gap come to 82px in an 82px box and a third would need
                    124px. Sharing is not a workaround for that, though — the two
                    are never both wanted. The picker matters while the
                    description has focus; the grip matters when it does not.
                    Stacked rather than swapped with v-if so the picker's menu is
                    never unmounted from under itself.

                    The grip is also the keyboard control: a fourth button for
                    the arrow keys would need space that does not exist, and a
                    focusable grip answering to them is the same affordance
                    reached two ways.-->
                <div class="step-action-slot">
                  <v-btn
                    :ref="el => registerDragHandleRef(el, index)"
                    icon
                    size="small"
                    variant="text"
                    :class="['row-grip', focusedDescIndex === index && 'row-grip--hidden']"
                    :aria-label="moveLabel(item)"
                    @pointerdown="startDrag($event, index)"
                    @keydown.up.exact.prevent="moveEntry(index, -1)"
                    @keydown.down.exact.prevent="moveEntry(index, 1)"
                  ><v-icon size="16">mdi-drag-horizontal-variant</v-icon
                    ><!--Suppressed mid-drag: the grip keeps pointer capture for
                        the whole gesture, so the tooltip would sit open under
                        the cursor the entire time a row is being carried.-->
                    <v-tooltip activator="parent" location="top" :disabled="isDragging"
                      ><span :style="{ color: $vuetify.theme.current.colors.primary }"
                        >Drag to move, or Alt + ↑ / ↓</span
                      ></v-tooltip
                    ></v-btn
                  >
                <v-menu :close-on-content-click="false" max-width="700" location="bottom end">
                  <template v-slot:activator="{ props: menu }">
                    <v-btn
                      v-bind="menu"
                      icon
                      color="accent"
                      variant="text"
                      size="small"
                      :class="['step-action-icon', focusedDescIndex !== index && 'step-action-icon--hidden']"
                      @mousedown.prevent="saveSelection($event)"
                    ><v-icon>mdi-image-plus</v-icon><v-tooltip activator="parent" location="top"><span :style="{ color: $vuetify.theme.current.colors.primary }">Add an icon, or type :: in the text</span></v-tooltip></v-btn>
                  </template>
                  <v-card flat rounded="lg">
                    <IconSelector
                      @iconSelected="(iconPath, tooltip, iconClass) => handleIconSelectorIconSelected(iconPath, tooltip, iconClass)"
                      :civ="civ"
                    ></IconSelector>
                  </v-card>
                </v-menu>
                </div>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  class="row-x"
                  @click="confirmRemoveStep(index)"
                ><v-icon size="16">mdi-close</v-icon
                  ><v-tooltip activator="parent" location="top"
                    ><span :style="{ color: $vuetify.theme.current.colors.primary }"
                      >Remove, or Alt + Backspace</span
                    ></v-tooltip
                  ></v-btn
                >
              </div>
            </td>
          </tr>
          </template>
          <!-- Trailing insert row after last step -->
          <tr
            v-if="!readonly && steps.length"
            :class="['ins-row', 'ins-row--trailing', dropGapIndex === steps.length && 'ins-row--drop']"
          >
            <td :colspan="9" class="ins-row-cell" :data-gap-index="steps.length">
              <StepInsertMenu
                :options="insertOptions(steps.length - 1)"
                @select="handleInsert($event, steps.length - 1)"
              >
                <template v-slot:activator="{ props: menu, isOpen }">
                  <div :class="['ins-zone', isOpen && 'ins-zone--open']" v-bind="menu"><div class="ins-line"></div><button class="ins-btn" tabindex="-1">+ Add</button></div>
                </template>
              </StepInsertMenu>
            </td>
          </tr>
          <!-- The section's own note, from before notes could be placed. Shown
               only when it says something, in the editor as well as the viewer:
               an empty row at the bottom of every section was the editor
               deciding for the author that a note belonged there. New notes are
               inserted where they are wanted, and this stays editable in place
               for the builds that already have one.

               "Has content" is not "is a non-empty string": see the mobile card
               above. -->
          <tr v-if="hasVisibleContent(gameplan)" :class="['bo-noterow', section.type === 'ageUp' && 'age-lane-md']">
            <td class="py-1 text-center">
              <v-icon size="16" color="accent">mdi-information-outline</v-icon>
            </td>
            <td v-if="readonly" :colspan="7" class="py-1 px-2" v-html="gameplan"></td>
            <td
              v-else
              ref="gameplanContentEditable"
              @input="showAutoCompleteMenu($event)"
              @keyup="handleContentEditableKeyUp($event)"
              @click="saveSelection($event)"
              @paste="handlePaste"
              @keydown.esc.prevent="releaseEditing($event)"
              @focusin="focusedDescIndex = 'gameplan'"
              @focusout="updateSectionGameplan(); focusedDescIndex = null"
              @mouseover="handleMouseOver($event)"
              @mouseout="handleMouseOut($event)"
              contenteditable="true"
              colspan="7"
              class="contentEditable text-left py-1 px-2"
              v-html="gameplan"
            ></td>
            <td v-if="!readonly" class="text-right step-actions">
              <v-menu :close-on-content-click="false" max-width="700" location="bottom end">
                <template v-slot:activator="{ props: menu }">
                  <v-btn
                    v-bind="menu"
                    icon
                    color="accent"
                    variant="text"
                    size="small"
                    :class="['step-action-icon', focusedDescIndex !== 'gameplan' && 'step-action-icon--hidden']"
                    @mousedown.prevent="saveSelection($event)"
                  ><v-icon>mdi-image-plus</v-icon><v-tooltip activator="parent" location="top"><span :style="{ color: $vuetify.theme.current.colors.primary }">Add an icon, or type :: in the text</span></v-tooltip></v-btn>
                </template>
                <v-card flat rounded="lg">
                  <IconSelector
                    @iconSelected="(iconPath, tooltip, iconClass) => handleIconSelectorIconSelected(iconPath, tooltip, iconClass)"
                    :civ="civ"
                  ></IconSelector>
                </v-card>
              </v-menu>
            </td>
          </tr>
          <!--The arrival. A row, matching the advance row it closes: same grid,
              same height, same icon column, same label size, weight and case, so
              the pair reads as one bracket opening and closing.

              It stands out on **fill alone** — no border, no box, no larger type.
              A bordered bar floating above the list looked like a widget dropped
              onto the build rather than a row of it, and the age asset is a
              circled numeral that at this size reads as a pause glyph, so
              neither the icon nor a box can be what says "boundary".

              It carries **no time**. The row after it already states one, and the
              timeline above the build states the span; a time here was both a
              restatement and stranded away from the time column.

              It is the rail's last row, so the transition visibly terminates on
              it rather than beside a floating box.-->
          <tr
            v-if="section.type === 'ageUp' && targetAgeName"
            :class="['age-reached-row', hasTransitionBody && 'age-lane-md']"
          >
            <td class="py-1 text-center">
              <img :src="targetAgeImg" class="age-reached-icon" alt="" />
            </td>
            <td :colspan="7" class="py-1 px-2">
              <span class="annot-lbl age-annot-lbl">{{ targetAgeName }}</span>
            </td>
            <td v-if="!readonly" class="step-actions" style="width:90px"></td>
          </tr>
        </tbody>
      </v-table>
    <!-- Empty section — sits inside the ageUp bracket, above the arrival row -->
    <div
      v-if="!steps?.length && readonly && section.type !== 'ageUp'"
      class="text-center py-6 text-medium-emphasis text-body-2"
    >
      No steps yet
    </div>
    <div v-if="!steps?.length && !readonly" class="text-center py-4">
      <StepInsertMenu :options="insertOptions(-1)" @select="handleInsert($event, -1)">
        <template v-slot:activator="{ props: menu }">
          <v-btn variant="text" color="accent" v-bind="menu"
            >Add to build
            <template v-slot:prepend>
              <v-icon color="accent">mdi-plus</v-icon>
            </template></v-btn
          >
        </template>
      </StepInsertMenu>
    </div>
  </v-card>
</template>

<script>
//External
import {
  watch,
  ref,
  reactive,
  computed,
  inject,
  mergeProps,
  onBeforeUnmount,
  onMounted,
  nextTick,
} from "vue";
import scrollIntoView from "scroll-into-view-if-needed";

//Components
import IconSelector from "@/components/builds/IconSelector.vue";
import IconAutoCompleteMenu from "@/components/builds/IconAutoCompleteMenu.vue";
import IconToolTip from "@/components/builds/IconToolTip.vue";
import StepInsertMenu from "@/components/builds/StepInsertMenu.vue";
import StepMoveControls from "@/components/builds/StepMoveControls.vue";
import AlternativePathTabs from "@/components/builds/AlternativePathTabs.vue";

//Composables
import iconService from "@/composables/builds/icons/iconService.js";
import { sanitizeStepDescription } from "@/composables/builds/buildOrderValidator.js";
import {
  aggregateVillagers,
  hasResourceValue,
  parseVillagerCountString,
} from "@/composables/builds/villagerAggregator.js";
import { formatAgeTime } from "@/composables/builds/useAgeTimings.js";
import {
  saysNothing as isRedundantStep,
  hasVisibleContent,
} from "@/composables/builds/stepVisibility.js";
import { STEP_HIGHLIGHT } from "@/composables/builds/useStepHighlight.js";
import { ACTIVE_PATH } from "@/composables/builds/useActivePath.js";
import { STEP_REORDER } from "@/composables/builds/useStepReorder.js";
import {
  expandBlocks,
  collapseBlocks,
  blockRanges,
  isInsideBlock,
  emptyPath,
  ALT_START,
  ALT_END,
} from "@/composables/builds/alternativesDraft.js";
import { blockId } from "@/composables/builds/useAgeTimings.js";
import {
  addAutocompleteIcon,
  updateSearchText,
  placeCaretAtEnd,
} from "@/composables/builds/contentEditableHelper.js";

/**
 * How long a row stays marked after the chart sends the reader to it.
 *
 * Long enough to survive a smooth scroll and still be there when the eye
 * arrives, short enough that it reads as an answer rather than as selection.
 */
const FLASH_MS = 2000;

/**
 * Monotonic counter for stable `v-for` keys. Never persisted, client-side only.
 *
 * **Module scope, not per component, and that is the whole point.** Seeded from the
 * clock and held inside `setup()`, every section mounted in the same millisecond —
 * which is all of them, they mount together — started from the same value and handed
 * out the same sequence. Their `_id` sets were identical, not merely overlapping.
 *
 * That was harmless while a key only had to be unique within one section's list. It
 * stopped being harmless when a step gained the ability to move to another section:
 * the arriving step carries its id, and Vue is handed two rows claiming one key. The
 * symptom is a row that renders stale content or refuses to update, which looks like
 * a bug in the move rather than in the key.
 *
 * One counter for the page removes the collision rather than the one path through the
 * code that would have hit it first.
 */
let _nextStepId = Date.now();

/**
 * How far outside a section's table a pointer can be and still be dragging
 * *over* it.
 *
 * Sections are stacked cards with real space between them, so a pointer in that
 * space is genuinely between two of them and both should offer their nearest
 * line — the closer one wins. Without any reach at all the drop position would
 * blink out every time the pointer crossed a card boundary; without a limit,
 * a release over the page header would land on whichever line happened to be
 * least far away.
 */
const DROP_REACH_PX = 160;

/** How close to the window edge a drag has to get before the page follows it. */
const AUTOSCROLL_EDGE_PX = 72;

/** The most one pointer movement may scroll, so a fast drag cannot bolt. */
const AUTOSCROLL_MAX_PX = 14;

/**
 * Follows a drag that has reached the edge of the window.
 *
 * Proportional to how far past the threshold the pointer is, so easing toward
 * the edge scrolls gently and pinning against it scrolls at full speed. Driven
 * by pointer movement rather than by a timer: a drag that has stopped moving is
 * a drag the author is thinking about, not one asking to travel.
 *
 * @param {number} y - Pointer position in client coordinates.
 * @return {void}
 */
function autoScrollDuringDrag(y) {
  const aboveTop = y - AUTOSCROLL_EDGE_PX;
  const belowBottom = y - (window.innerHeight - AUTOSCROLL_EDGE_PX);

  if (aboveTop < 0) window.scrollBy(0, Math.max(-AUTOSCROLL_MAX_PX, aboveTop / 4));
  else if (belowBottom > 0) window.scrollBy(0, Math.min(AUTOSCROLL_MAX_PX, belowBottom / 4));
}

export default {
  name: "BuildOrderSectioncontentEditable",
  // previousStep is the last step of the section before this one, so the delta
  // marker on a section's first row compares against the real preceding step
  // rather than having nothing to compare against.
  props: [
    "section",
    "readonly",
    "civ",
    "focus",
    "isLastAgeUp",
    "previousStep",
    //Age-up is offered from the insert menu but appends to the end of the
    //build, so only the last section's trailing insert point can honour it.
    //Both arrive as props because the section knows neither where it sits nor
    //which age the build has reached.
    "isLastSection",
    "ageUpAvailable",
    "nextAgeName",
    //resolveStepTimes() output for this section's steps, same order. Read-only
    //views only — the editor must never offer an author a time they did not type.
    "resolvedTimes",
    //Flat index of this section's first step. Sections render in slices while
    //everything drawn from a build works on the flattened list, so this is what
    //lets a row say which step it is in the only index space both halves share.
    "stepOffset",
    //Position of this section in the build, so a block inside it can be named
    //the way the flattener names it.
    "sectionIndex",
  ],
  emits: [
    "stepsChanged",
    "selectionChanged",
    "gameplanChanged",
    "ageDownRequested",
    "ageUpRequested",
    "stepHovered",
  ],
  components: {
    IconSelector,
    IconAutoCompleteMenu,
    IconToolTip,
    StepInsertMenu,
    StepMoveControls,
    AlternativePathTabs,
  },
  setup(props, context) {
    //Absent on the editor route, where there is no timeline card to link to.
    //Every use is optional-chained rather than guarded once, so the table
    //behaves exactly as before wherever nothing provides it.
    const highlight = inject(STEP_HIGHLIGHT, null);

    //The reader's chosen path, when a build page provides one. Absent in the
    //editor, where the author is switching to edit rather than to read.
    const activePath = inject(ACTIVE_PATH, null);

    /**
     * The worked-out time for a step whose author left the cell blank.
     *
     * Marked with "~" when it is an estimate, which means the same thing here as
     * on the age timeline and in Focus mode: nobody wrote this down. The opening
     * step is the exception — a build order starts when the game does, so its
     * 0:00 is a fact and is shown plainly, even though no author typed it.
     *
     * Returns "" when the step could not be placed, so the cell stays empty
     * rather than showing a marker with no time behind it.
     *
     * @param {number} index - Position of the step within this section.
     * @return {string} "m:ss", "~m:ss", or "" when the step could not be placed.
     */
    const resolvedTime = (index) => {
      const resolved = props.resolvedTimes?.[documentIndex(index)];
      if (!resolved || resolved.seconds == null) return "";

      const formatted = formatAgeTime(resolved.seconds);
      return resolved.provenance === "stated" ? formatted : `~${formatted}`;
    };

    /** Whether a filled-in cell should read as an estimate rather than a fact */
    const isEstimate = (index) =>
      props.resolvedTimes?.[documentIndex(index)]?.provenance !== "stated";

    const AGE_NAMES = { 1: "Feudal Age", 2: "Castle Age", 3: "Imperial Age" };
    const targetAgeName = computed(() => AGE_NAMES[props.section.age] ?? "");
    //"Advancing to Feudal", not "Advancing to Feudal Age". The bar that closes
    //this section already says "Feudal Age", and before this the word appeared
    //four times in eight rows — twice per age-up — before the other two ages had
    //had their turn. The arrival keeps the full name because it is the element
    //that identifies the age; the advance only has to say which way it is going.
    //Desktop only: the mobile marker is deliberately untouched.
    const targetAgeShortName = computed(() => targetAgeName.value.replace(/ Age$/, ""));
    const targetAgeImg = computed(() => `/assets/pictures/age/age_${props.section.age + 1}.webp`);
    const currentAgeName = computed(() => AGE_NAMES[props.section.age - 1] ?? "");
    const currentAgeImg = computed(() => `/assets/pictures/age/age_${props.section.age}.webp`);

    //Hacky deep copy of object since working on the reference broke the current selection
    //Copy needs to be kept in sync and is used only for the description field :(
    //
    //Expanded on the way in: the document nests an alternatives block, the
    //editor works on a flat run with markers, because that is what makes "above
    //the merge line" mean something. Collapsed again in emitSteps().
    const steps = reactive(expandBlocks(JSON.parse(JSON.stringify(props.section.steps))));
    const stepsCopy = reactive(expandBlocks(JSON.parse(JSON.stringify(props.section.steps))));
    const readonly = props.readonly;
    const hoverRowIndex = ref(null);
    const selectedRowIndex = ref(null);
    const delteRowIndex = ref(null);
    const selection = ref(null);
    const stepsTable = ref(null);
    //The phone's card list, so a card that has just moved can be followed.
    const stepsList = ref(null);
    const timestampRefs = ref([]);
    const stoneInputRefs = ref([]);
    //So a note can be focused the moment it is inserted, the way a new step
    //focuses its timestamp. An author who asks for a note wants to type one.
    const noteRefs = ref([]);
    //The grip on each row, kept so focus can follow an entry that has just been
    //moved — otherwise a second arrow press moves whatever inherited the row.
    const dragHandleRefs = ref([]);
    const removeStepConfirmationDialog = ref(false);
    const activeStepIndex = ref(null);
    const focusedDescIndex = ref(null);
    var civIconService = iconService(props.civ);

    //Autocomplete
    const searchText = ref("");
    const autocompletePos = ref(0);

    //Gameplan
    const gameplan = ref(`${props.section.gameplan ? props.section.gameplan : ""}`);
    const gameplanCopy = ref(`${props.section.gameplan ? props.section.gameplan : ""}`);
    const gameplanSelected = ref(false);
    const gameplanContentEditable = ref(null);

    //An "ageUp" section that holds nothing tells the reader nothing the arrival
    //plate below it does not already say — imported builds have these, since the
    //overlay format does not record the steps taken while aging up. In the viewer
    //only the plate is drawn for them; the editor keeps the banner so the section
    //can still be filled in.
    const isBareAgeUp = computed(
      () =>
        props.readonly &&
        props.section.type === "ageUp" &&
        !steps.length &&
        !gameplan.value
    );

    //Whether the desktop table has anything to draw — which is not the same
    //question as "does this section have steps", and was written as if it were.
    //
    //There are two kinds of note. A note *item* lives in `steps` and is a step
    //of a different kind, so counting steps finds it. The **section** note is
    //`section.gameplan`: a section field, with no position and no index, that is
    //not among the items being counted at all. Its row nevertheless lives inside
    //this table, so a section carrying a note and no steps dropped the note
    //silently, and only on desktop — the mobile list draws the same note as a
    //plain sibling guarded on its own content and never had the bug.
    //
    //A note is shown when it says something and hidden when it does not. Nothing
    //else decides it. Do not put the step count back.
    const hasTableRows = computed(
      () =>
        !!steps.length ||
        hasVisibleContent(gameplan.value) ||
        //Both age markers are rows now, so an ageUp section always has at least
        //the arrival to draw — even the bare ones an import leaves behind, where
        //the advance is suppressed and the arrival is the whole section.
        props.section.type === "ageUp"
    );

    //Whether the transition has anything inside it to bracket.
    //
    //A rail with nothing between its ends marks nothing — it would just be a
    //gold gutter beside a single row, which is common on a fast castle with no
    //intermediate steps. The rail opens on the advance row, so it is the advance
    //row that has to know whether there is a body to open onto.
    const hasTransitionBody = computed(
      () => !!steps.length || hasVisibleContent(gameplan.value)
    );

    //Custom Tooltips
    const showToolTip = ref(false);
    const toolTipPos = ref(0);
    const toolTipModel = ref({});
    const toolTipElement = ref(null);

    async function handleMouseOver($event) {
      if ($event.target.className.includes("icon-")) {
        //set model
        //No origin stripping here: getIconFromImgPath does it, for any host
        //rather than the one that used to be named at this call site.
        const imageSource = $event.target.getAttribute("src");
        const iconMetaData = civIconService.getIconFromImgPath(imageSource);

        //Nothing in the vocabulary matches — a legacy path, or an image pasted
        //from elsewhere. There is nothing to describe, and IconToolTip reads
        //.description straight off its model, so showing it would throw.
        if (!iconMetaData) return;

        toolTipModel.value = iconMetaData;

        //show tooltip
        showToolTip.value = true;

        //prevent default tooltip from image title
        $event.target.removeAttribute("title");

        //calculate tooltip position
        var rect = $event.target.getBoundingClientRect();
        const body = document.getElementsByTagName("body")[0];
        const bodyRect = body.getBoundingClientRect();
        //wait for render to adjust tooltip position accordingly based on dynamic contents
        await nextTick();
        toolTipPos.value = [
          rect.x - bodyRect.x - 0.5 * toolTipElement.value.offsetWidth + 8,
          rect.y - bodyRect.y - toolTipElement.value.offsetHeight - 32,
        ];
      }
    }

    function handleMouseOut($event) {
      if ($event.target.className.includes("icon-")) {
        //hide tooltip
        showToolTip.value = false;
      }
    }

    function absoluteLocationStrategy(data, props, contentStyles) {
      Object.assign(contentStyles.value, {
        position: "absolute",
      });

      function updateLocation() {}

      return { updateLocation };
    }

    onMounted(async () => {
      // Assign stable IDs to all existing steps so the v-for key is never index-based.
      steps.forEach((s, i) => {
        const id = ++_nextStepId;
        s._id = id;
        stepsCopy[i]._id = id;
      });

      //Sanitize since inline icon replacement only works with <br>, NOT with \n.
      //Legacy .png paths are *not* rewritten here any more: this loop reads
      //`description` only, so it never reached a note (whose text is `gameplan`)
      //or a path that is not the active one. BuildOrderEditor converts the whole
      //tree by field before this component mounts.
      steps.forEach((element) => {
        element.description = element.description?.replace(/\n/gm, "<br>");
      });

      stepsCopy.forEach((element) => {
        element.description = element.description?.replace(/\n/gm, "<br>");
      });


      //Force firefox to use BR instead of adding DIVs
      document.execCommand("defaultParagraphSeparator", false, "br");

      //Announce this section to the reordering channel. Registered by index
      //rather than in mount order, because an age-up added later mounts last
      //and still belongs in the middle of the build.
      reorder?.registerSection(props.sectionIndex, reorderHandlers);
    });

    onBeforeUnmount(() => {
      //A section can be removed while something is being dragged over it — an
      //age-down during a drag — and window listeners outlive the component that
      //added them.
      endDragListening();
      reorder?.unregisterSection(props.sectionIndex);
    });

    watch(
      () => props.focus,
      (value, previousValue) => {
        if (!value) {
          selection.value = null;
        }
      }
    );

    watch(
      () => props.civ,
      (value, previousValue) => {
        civIconService = iconService(props.civ);
      }
    );

    function registerTimestampRef(el, index) {
      if (el) timestampRefs.value[index] = el;
    }

    function registerDragHandleRef(el, index) {
      if (el) dragHandleRefs.value[index] = el;
    }

    function registerStoneInputRef(el, index) {
      if (el) stoneInputRefs.value[index] = el;
    }

    /**
     * Whether this step restates the one before it and says nothing else.
     *
     * Crosses the section boundary the same way hasDeltaUp does: the first row
     * of an age section still follows on from the age-up before it, so it is
     * redundant against that rather than against nothing.
     *
     * @param {number} index - Position within this section.
     * @return {boolean} True when the row can be hidden from a reader.
     */
    function saysNothing(index) {
      //Same reason deltaClass skips markers: judged against one, a row that
      //restates the distribution unchanged would look like it had stated it for
      //the first time, and would be kept as content it is not.
      return isRedundantStep(steps[index], previousStepBefore(index));
    }

    /**
     * How one resource cell stands against the step before it.
     *
     * A build order restates the whole distribution on every row, so most cells
     * on screen carry no news. The three answers are drawn rather than written:
     * a cell that gained villagers is barred along its top edge, one that lost
     * them along its bottom, and one that only repeats what was already true
     * keeps its number at full contrast but gives up its tint. Colour in a row
     * then means "this moved", which is the question a reader is asking.
     *
     * Up and down share one colour deliberately. Moving four villagers off wood
     * onto gold is the build working, not a gain and a loss, and every decrease
     * here is somebody else's increase on the same row; a green/red pair would
     * claim a verdict the data does not make. It would also be unreadable — the
     * food pill is already red and the wood pill already green. Direction is
     * carried by which edge the bar sits on, which is a channel the resource
     * tints do not use and colour blindness does not take away.
     *
     * Crosses the section boundary the same way saysNothing does: the first row
     * of an age section follows on from the age-up before it, so a reassignment
     * made across the boundary is marked like any other. The first step of the
     * build has nothing to be a change from and is left unmarked.
     *
     * Counts come from parseVillagerCountString, the same reader saysNothing and
     * the economy plot use — so "carried over", "hidden as redundant" and "did
     * not move" cannot disagree about what a moved villager is. It replaces a
     * bare parseInt, which read "4+3" as 4 and would now report a *decrease*
     * from "6" where the row in fact gained one.
     *
     * @param {string} field - Resource key: builders, food, wood, gold or stone.
     * @param {number} index - Position within this section.
     * @return {string} The modifier class, or "" when there is nothing to say.
     */
    function deltaClass(field, index) {
      const previous = previousStepBefore(index);
      if (!previous) return "";

      const curr = parseVillagerCountString(steps[index][field]);
      const prev = parseVillagerCountString(previous[field]);
      if (curr > prev) return "d-up";
      if (curr < prev) return "d-down";
      return "d-same";
    }

    /**
     * The step a row's numbers are a change from.
     *
     * Markers are skipped rather than treated as a step with nothing on it. A
     * marker has no resource cells at all, so comparing against one read every
     * value as a move from zero — the first row of an alternative, and the first
     * common row after the merge, lit up every pill as if the whole distribution
     * had just been reassigned.
     *
     * Skipping them also gives the right answer rather than merely a harmless
     * one: a path carries on from wherever the build had got to, and the first
     * step after the merge carries on from the last step of the path the reader
     * took.
     *
     * @param {number} index - Position within this section.
     * @return {Object|null} The preceding step, or the section's predecessor.
     */
    function previousStepBefore(index) {
      for (let cursor = index - 1; cursor >= 0; cursor--) {
        //Notes are skipped along with markers. A note states no economy — it has
        //no resource cells at all — so it is not a distribution anything can be
        //a change from; comparing against one read every value as a move from
        //zero and lit the whole row. Focus mode reaches past a note the same way
        //when it fills its resource dock.
        if (!isMarker(steps[cursor]) && !isNote(steps[cursor])) return steps[cursor];
      }
      return props.previousStep;
    }

    const saveSelection = (event) => {
      //navigate to aoe4world if clicked on an image
      if (event?.target.className.includes("icon-") && toolTipModel.value?.exploreUrl) {
        window.open(toolTipModel.value.exploreUrl);
      }

      //store selection
      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
          selection.value = sel.getRangeAt(0);
        }
      } else if (document.selection && document.selection.createRange) {
        selection.value = document.selection.createRange();
      }
    };

    const restoreSelection = () => {
      if (selection.value) {
        if (window.getSelection) {
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(selection.value);
        } else if (document.selection && selection.value.select) {
          selection.value.select();
        }
      }
    };

    /**
     * The editable cell a row's rich text lives in.
     *
     * Found by the row's own index rather than by counting rows and taking
     * column seven: a note is one wide cell where a step is nine narrow ones, so
     * both halves of that assumption break on the first note in a section.
     *
     * @param {number} index - Position of the step within this section.
     * @return {Element|null} The contenteditable, or null on mobile.
     */
    const editableCell = (index) =>
      stepsTable.value?.querySelector(`[data-edit-index="${index}"][data-edit-field]`) ?? null;

    const showAutoCompleteMenu = (event, index) => {
      var contentEditable = null;
      if (index != null) {
        contentEditable = editableCell(index);
      } else {
        contentEditable = gameplanContentEditable.value;
      }
      if (!contentEditable) return;

      if (event.data === ":") {
        //Show autocomplete menu
        if (contentEditable.innerHTML.match(/\w*(?<![a-zA-Z0-9])::(([a-zA-Z0-9])+)?/g)) {
          searchText.value = "::";
        } else {
        }
        var cursorPosition = window.getSelection();
        var range = cursorPosition.getRangeAt(0);
        var rect = range.getBoundingClientRect();

        const body = document.getElementsByTagName("body")[0];
        const bodyRect = body.getBoundingClientRect();

        autocompletePos.value = [rect.x - bodyRect.x, rect.y - bodyRect.y + rect.height];
      }
    };

    function handleAutoCompleteMenuIconSelected(iconPath, tooltip, iconClass) {
      var contentEditable = null;
      if (!gameplanSelected.value) {
        contentEditable = editableCell(activeStepIndex.value);
      } else {
        contentEditable = gameplanContentEditable.value;
      }

      addAutocompleteIcon(contentEditable, iconPath, tooltip, iconClass);
      searchText.value = null;
    }

    const handleContentEditableKeyUp = (event, index) => {
      var contentEditable = null;
      if (index != null) {
        contentEditable = editableCell(index);
      } else {
        contentEditable = gameplanContentEditable.value;
      }
      if (!contentEditable) return;

      const keyCode = event.which;
      const allIcons = civIconService.getIcons();

      updateSearchText(contentEditable, searchText, keyCode, allIcons);

      activeStepIndex.value = index;
      saveSelection(event);
    };

    const handleIconSelectorIconSelected = (iconPath, tooltipText, iconClass) => {
      if (!selection.value) return;
      iconClass = iconClass ? "icon-" + iconClass : "icon";

      const img = document.createElement('img');
      img.src = iconPath;
      img.className = iconClass;
      img.title = tooltipText;

      // Insert at the saved cursor position without requiring focus in the contenteditable
      const range = selection.value.cloneRange();
      range.deleteContents();
      range.insertNode(img);
      range.setStartAfter(img);
      range.collapse(true);
      selection.value = range;
    };

    /**
     * A bare number is a minute count: "13" means 13:00 and "0" means 0:00.
     * Anything else is left exactly as typed — "1:5" is not normalised, because
     * it could as easily mean 1:05 as 1:50 and guessing would silently rewrite
     * the author's timing.
     *
     * @param {string} value - The raw field contents.
     * @return {string} The normalised timestamp.
     */
    const normalizeTimeString = (value) => {
      const text = (value ?? "").replace(/<[^>]*>/g, "").trim();
      return /^\d{1,2}$/.test(text) ? `${parseInt(text, 10)}:00` : text;
    };

    /**
     * Normalises on blur rather than on input: rewriting mid-keystroke would
     * turn "1" into "1:00" before the author had finished typing "13".
     */
    const handleTimeBlur = (event, index) => {
      const isInput = event.target.tagName === "INPUT";
      const normalized = normalizeTimeString(
        isInput ? event.target.value : event.target.innerHTML
      );

      if (isInput) {
        event.target.value = normalized;
      } else {
        event.target.innerHTML = normalized;
      }

      updateStep(event, index, "time");
    };

    const updateStep = (event, index, propertyName) => {
      let val = event.target.tagName === 'INPUT' ? event.target.value : event.target.innerHTML;
      // These are plain-text/numeric fields (time, builders, food, wood, gold,
      // stone). When edited via a contenteditable div, Chrome leaves a stray
      // "<br>" (and sometimes a wrapping block) once the cell is cleared, which
      // would otherwise be saved verbatim (e.g. stone: "<br>"). Strip any markup
      // so an emptied cell saves "" instead.
      val = val.replace(/<[^>]*>/g, "").trim();
      steps[index][propertyName] = val;
      stepsCopy[index][propertyName] = val;

      steps[index].description = stepsCopy[index].description;
      gameplan.value = gameplanCopy.value;

      aggregateVillagers(steps[index]);

      emitSteps();
    };

    /**
     * What a contenteditable is worth saving, which is nothing at all when it
     * holds only the editor's leavings.
     *
     * Clearing a rich-text field does not leave it empty: Chrome puts back a
     * `<br>`, and a wrapping block besides. Saved verbatim that is a truthy
     * string, so every guard downstream reads it as a note the author wrote and
     * draws an empty Notes block for it. updateStep() already strips markup for
     * the same reason, but it can strip *everything* — these fields carry the
     * icons that are half the site's vocabulary, so the emptiness has to be
     * judged rather than assumed.
     *
     * @param {string} html - The field's innerHTML.
     * @return {string} The HTML, or "" when nothing in it would be read.
     */
    const keptOrEmptied = (html) => (hasVisibleContent(html) ? html : "");

    const updateSectionGameplan = (event) => {
      gameplanCopy.value = keptOrEmptied(
        event ? event.target.innerHTML : (gameplanContentEditable.value?.innerHTML ?? '')
      );
      context.emit("gameplanChanged", gameplanCopy.value);
    };

    const updateStepDescription = (event, index) => {
      stepsCopy[index].description = keptOrEmptied(event.target.innerHTML);
      emitSteps(stepsCopy);
    };

    /**
     * Saves a note's text.
     *
     * Emptied the same way a description is: a note the author cleared leaves
     * "<br>" behind, which is truthy and would keep drawing a note row with
     * nothing in it. Kept as an empty string rather than deleted, because the
     * row itself is still there until the author removes it.
     *
     * @param {Event} event - The focusout event from the note's field.
     * @param {number} index - Position of the note within this section.
     * @return {void}
     */
    const updateStepNote = (event, index) => {
      stepsCopy[index].gameplan = keptOrEmptied(event.target.innerHTML);
      steps[index].gameplan = stepsCopy[index].gameplan;
      emitSteps();
    };

    const registerNoteRef = (el, index) => {
      if (el) noteRefs.value[index] = el;
    };

    /**
     * Hands the section's items back to the parent in the shape the document
     * stores them in.
     *
     * The single place the editor's flat working list becomes nested again, so
     * a marker can never reach Firestore and a block can never be emitted
     * half-open. Every change goes through here.
     *
     * @param {Array} [source] - The list to emit; defaults to the live steps.
     * @return {void}
     */
    const emitSteps = (source = steps) => {
      context.emit("stepsChanged", collapseBlocks(source));
    };

    /** The opening marker of an alternatives block. */
    const isBlockStart = (item) => item?.kind === ALT_START;

    /** The closing merge line. */
    const isBlockEnd = (item) => item?.kind === ALT_END;

    /** Neither a step nor a note — a marker the reader never sees. */
    const isMarker = (item) => isBlockStart(item) || isBlockEnd(item);

    /**
     * Whether a row sits between two markers, and so belongs to the path being
     * edited rather than to the build. This is the whole of "membership is
     * positional" — nothing is stored to say so.
     *
     * @param {number} index - Position in the editor's working list.
     * @return {boolean} True when the row is inside a block.
     */
    const insideBlock = (index) => isInsideBlock(steps, index);

    /**
     * The mobile card flow, grouped so a block's cards share one parent.
     *
     * The age lane draws its rail once, on the section wrapper, spanning top to
     * bottom — which is why it is one unbroken line of one colour. Per-card
     * rails cannot be: each one is positioned against its own card's padding
     * box, so a bordered card's rail sits a pixel right of an unbordered one's,
     * and the insert divider is drawn at `opacity: 0.35`, which its rail
     * inherited. Same wrapper, same result.
     *
     * Groups that are not blocks are still wrapped, with `display: contents`, so
     * the template has one shape rather than two copies of every card.
     *
     * @return {Array<{block: boolean, entries: Array<{item: Object, index: number}>}>}
     */
    const xsGroups = computed(() => {
      const groups = [];
      let open = null;

      steps.forEach((item, index) => {
        const entry = { item, index };

        if (isBlockStart(item)) {
          open = { block: true, entries: [entry] };
          groups.push(open);
          return;
        }

        if (isBlockEnd(item)) {
          if (open) open.entries.push(entry);
          else groups.push({ block: false, entries: [entry] });
          open = null;
          return;
        }

        if (open) open.entries.push(entry);
        else groups.push({ block: false, entries: [entry] });
      });

      return groups;
    });

    /**
     * Where a row sits in the section as the document counts it.
     *
     * The editor's list has markers in it and the document's does not, so a row
     * at local position 7 may be step 5 as far as the resolved times handed down
     * from the parent are concerned. Everything index-aligned to the flattened
     * build — resolved times, estimates — has to come through here.
     *
     * @param {number} index - Position in the editor's working list.
     * @return {number} Position among the section's real steps.
     */
    const documentIndex = (index) => {
      let count = 0;
      for (let cursor = 0; cursor < index && cursor < steps.length; cursor++) {
        if (!isMarker(steps[cursor])) count++;
      }
      return count;
    };

    /**
     * Whether an item in this section is a note rather than a step.
     *
     * A note is a step whose content *is* its note — no time, no resource
     * cells. The field is one the document format has always had, and three
     * readers already understand it: it is kept out of the economy series, kept
     * out of the redundancy filter, and exempted from the timing gate that
     * decides whether a build can autoplay. Only the writer was missing.
     *
     * @param {Object} item - The step to judge.
     * @return {boolean} True when it should render as a note.
     */
    const isNote = (item) => item?.gameplan !== undefined && item?.gameplan !== null;

    /**
     * The reordering channel, or null where there is nothing to reorder.
     *
     * Absent in the read-only view — nothing provides it there — so every use is
     * optional. That is what keeps handles and move controls out of a reader's
     * build rather than rendering them disabled.
     */
    const reorder = inject(STEP_REORDER, null);

    /**
     * What this section lets the coordinator do to it.
     *
     * Deliberately small, and deliberately silent: `detach` and `attach` do not
     * emit. A section that emitted from inside `detach` would publish a build
     * with the entry gone from here and not yet anywhere else — briefly, but
     * that brief moment is a whole build order missing a step.
     *
     * Both working lists are spliced by every one of these, at the same index,
     * because both carry real content: `stepsCopy` holds what the author typed
     * into a description (a focusout writes it there, and `emitSteps(stepsCopy)`
     * reads it back out), while `steps` holds everything else. Splice one and
     * the pair drift apart, which is a step wearing another step's text.
     */
    const reorderHandlers = {
      /** Entries in the working list, markers included — the coordinator counts gaps itself. */
      entryCount: () => steps.length,

      /**
       * The entry at a position, or null for a marker.
       *
       * The null is load-bearing: it is the whole of "a bracket cannot be
       * dragged apart", expressed as an entry that is not there to be moved
       * rather than as a rule somewhere that has to remember to check.
       */
      entryAt: (index) => (isMarker(steps[index]) ? null : (steps[index] ?? null)),

      /**
       * Whether a gap falls between two alternatives markers.
       *
       * Gap `g` sits between entry `g - 1` and entry `g`, so it is inside a
       * bracket when the opening marker is strictly before it and the closing
       * one is at or after it. The gap immediately above the merge marker is
       * inside; the one immediately below it is not. That single boundary is
       * what path membership *is*.
       */
      gapInsideBlock: (gap) =>
        blockRanges(steps).some((range) => range.start < gap && gap <= range.end),

      /**
       * Takes an entry out and hands it over.
       *
       * The pair travels together. On desktop `syncEditedFields()` writes the
       * DOM back into `steps` only, so the copy's text can be a focusout behind;
       * it is squared up here, while the two are still side by side and it is
       * obvious which is which.
       */
      detach: (index) => {
        const step = steps[index];
        const copy = stepsCopy[index];
        if (!step || isMarker(step)) return null;

        if (copy) {
          if (isNote(step)) copy.gameplan = step.gameplan;
          else copy.description = step.description;
        }

        steps.splice(index, 1);
        stepsCopy.splice(index, 1);

        return { step, copy: copy ?? { ...step } };
      },

      /** Puts an entry back, into both lists, at the same gap. */
      attach: (gap, parcel) => {
        if (!parcel?.step) return;

        steps.splice(gap, 0, parcel.step);
        stepsCopy.splice(gap, 0, parcel.copy);
      },

      syncEdits: () => syncEditedFields(),

      emit: () => emitSteps(),

      /**
       * Returns focus to the entry that just moved, so a second press moves it
       * again rather than moving whatever inherited its position.
       */
      focusEntry: (gap) => {
        const handle = dragHandleRefs.value[gap];
        (handle?.$el ?? handle)?.focus?.();
      },

      /**
       * The insert line nearest the pointer, and how far away it is.
       *
       * Measured on the `.ins-row-cell`, which is a zero-height cell sitting
       * exactly on the boundary between two rows — so its own position *is* the
       * line, with no arithmetic to get wrong. The visible `+ Add` zone is
       * absolutely positioned around it and would answer about itself, not
       * about where a step would land.
       *
       * A pointer nowhere near this section answers null rather than "my
       * closest, which is miles away". Without that, a release over the page
       * header would find a nearest line somewhere and treat the drop as
       * deliberate.
       */
      gapNear: (x, y) => {
        const table = stepsTable.value;
        if (!table) return null;

        const bounds = table.getBoundingClientRect();
        if (y < bounds.top - DROP_REACH_PX || y > bounds.bottom + DROP_REACH_PX) return null;

        let best = null;

        for (const cell of table.querySelectorAll("td.ins-row-cell[data-gap-index]")) {
          const rect = cell.getBoundingClientRect();
          const distance = Math.abs(y - (rect.top + rect.height / 2));
          if (best && distance >= best.distance) continue;

          best = { gapIndex: Number(cell.dataset.gapIndex), distance };
        }

        return best;
      },
    };

    /**
     * Which row this section is currently lifting, or null.
     *
     * Read from the session rather than held locally, so a drag that started in
     * another section leaves every row here alone.
     */
    const draggingIndex = computed(() => {
      const session = reorder?.session.value;
      return session && session.sectionIndex === props.sectionIndex ? session.draftIndex : null;
    });

    /** Which of this section's insert lines is the one a release would take. */
    const dropGapIndex = computed(() => {
      const target = reorder?.session.value?.target;
      return target && target.sectionIndex === props.sectionIndex ? target.gapIndex : null;
    });

    /** True while any drag is in flight, anywhere in the build. */
    const isDragging = computed(() => !!reorder?.session.value);

    /**
     * Everything a live drag has attached to the window, so it can all be taken
     * off again from one place — including from `onBeforeUnmount`, because a
     * section can be removed while something is being dragged over it.
     */
    let releaseDrag = null;

    const endDragListening = () => {
      releaseDrag?.();
      releaseDrag = null;
    };

    /**
     * Starts a drag from a row's grip.
     *
     * `preventDefault` matters more here than it looks: the row's description is
     * a contenteditable cell, which the browser already treats as draggable, and
     * a text drag starting inside a row move is not something the two can be
     * told apart from afterwards. The grip is the only thing that starts a move,
     * which is why the row body keeps its ordinary text selection.
     *
     * @param {PointerEvent} event - The pointerdown on the grip.
     * @param {number} index - Position of the row in the working list.
     * @return {void}
     */
    const startDrag = (event, index) => {
      if (!reorder || readonly) return;
      //A secondary button or a context-menu press is not a move.
      if (event.button != null && event.button !== 0) return;

      //A drag that never received its pointerup — a pointer lost to a context
      //menu, say — would otherwise leave its listeners on the window.
      endDragListening();

      reorder.begin(props.sectionIndex, index);
      //A marker refuses to open a session, so there is nothing to listen for.
      if (!reorder.session.value) return;

      event.preventDefault();

      const grip = event.currentTarget;
      grip.setPointerCapture?.(event.pointerId);

      const move = (moveEvent) => {
        reorder.setTargetFromPoint(moveEvent.clientX, moveEvent.clientY);
        autoScrollDuringDrag(moveEvent.clientY);
      };
      const finish = () => {
        endDragListening();
        reorder.commit();
      };
      const abandon = () => {
        endDragListening();
        reorder.cancel();
      };
      const key = (keyEvent) => {
        if (keyEvent.key !== "Escape") return;
        keyEvent.preventDefault();
        abandon();
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", finish);
      window.addEventListener("pointercancel", abandon);
      window.addEventListener("keydown", key);

      releaseDrag = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", abandon);
        window.removeEventListener("keydown", key);
        grip.releasePointerCapture?.(event.pointerId);
      };
    };

    /**
     * Moves a row one position, from a button press or an arrow key.
     *
     * One **gap**, not one neighbour — which is what makes crossing into an
     * alternative, or into the next age, cost its own press instead of happening
     * as a side effect of passing an entry.
     *
     * @param {number} index - Position of the row in the working list.
     * @param {number} delta - -1 for up, 1 for down.
     * @return {void}
     */
    const moveEntry = (index, delta) => {
      if (!reorder || readonly) return;
      reorder.moveBy(props.sectionIndex, index, delta);
    };

    /** Whether a press in that direction would do anything. */
    const canMoveEntry = (index, delta) =>
      !!reorder && !readonly && reorder.canMove(props.sectionIndex, index, delta);

    /**
     * What a move control announces.
     *
     * Names the thing it moves rather than the gesture, because a screen reader
     * meeting three identical "move" buttons in a row learns nothing from the
     * third one.
     *
     * @param {Object} item - The entry the control belongs to.
     * @return {string} The accessible name.
     */
    const moveLabel = (item) =>
      `Move this ${isNote(item) ? "note" : "step"}. Use the arrow keys to move it one position.`;

    /** Opens the delete confirmation for a row. */
    const confirmRemoveStep = (index) => {
      delteRowIndex.value = index;
      removeStepConfirmationDialog.value = true;
    };

    /**
     * Every Alt shortcut a row answers to, in one place.
     *
     * Bound on the row itself, so it acts on the row the caret is in — which is
     * what lets these work while writing a description rather than only when the
     * grip has focus.
     *
     * **Dispatched on `event.code`, not `event.key`, and that is not a style
     * choice.** On macOS, Alt is Option, and Option+N does not produce "n" — it
     * produces a dead key for the tilde. A `.n` key modifier would therefore
     * work on Windows and silently not exist on a Mac. `event.code` is the
     * physical key and says `KeyN` either way.
     *
     * **On keydown rather than keyup**, which is where the two older bindings
     * differed. Keyup is too late to stop the browser inserting that dead-key
     * character, and too late to stop Option+arrow walking the caret through the
     * text. Auto-repeat is then handled per action rather than avoided wholesale:
     * holding Alt+Down to walk a step several rows is useful, holding Alt+Enter
     * to insert forty steps is not.
     *
     * @param {KeyboardEvent} event - The keydown from anywhere in the row.
     * @param {number} index - The row's position in the working list.
     * @return {void}
     */
    const handleRowShortcut = (event, index) => {
      if (!event.altKey || readonly) return;

      //Repeats wanted: hold to walk an entry several positions.
      if (event.code === "ArrowUp") {
        event.preventDefault();
        moveEntry(index, -1);
        return;
      }
      if (event.code === "ArrowDown") {
        event.preventDefault();
        moveEntry(index, 1);
        return;
      }

      //Everything past here inserts or removes, where a held key runs away.
      if (event.repeat) return;

      if (event.code === "Enter" || event.code === "NumpadEnter") {
        event.preventDefault();
        addStep(index);
        return;
      }
      if (event.code === "KeyN") {
        event.preventDefault();
        addNote(index);
        return;
      }
      if (event.code === "Delete" || event.code === "Backspace") {
        event.preventDefault();
        confirmRemoveStep(index);
      }
    };

    /**
     * Escape steps back out of a field, one layer at a time.
     *
     * The icon autocomplete first, when it is open — it is the most recently
     * opened thing and the thing Escape is expected to dismiss. Otherwise the
     * field gives up focus, and that is what hands the row's shared slot back to
     * the drag grip. Without this, freeing the grip meant clicking into empty
     * space somewhere to blur the cell, which is a strange thing to have to
     * know.
     *
     * Blurring **commits** what was typed, because the field's own focusout
     * does. Escape reverting instead would be the only undo anywhere in this
     * editor, and a lone undo is worse than none: it is the one place an author
     * would lose work by pressing the key that everywhere else means "stop".
     *
     * @param {KeyboardEvent} event - The keydown from the field.
     * @return {void}
     */
    const releaseEditing = (event) => {
      if (searchText.value) {
        searchText.value = null;
        return;
      }

      event.target?.blur?.();
    };

    /**
     * Keeps a card that has just moved where the author can still see it.
     *
     * Reuses the scroller `scrollToStep` already uses rather than a second one
     * with its own opinion: "if-needed" leaves an already-visible card alone,
     * and the reduced-motion check is the one this component already makes.
     *
     * @param {number} gap - Where the entry landed in the working list.
     * @return {void}
     */
    const keepMovedEntryVisible = async (gap) => {
      await nextTick();
      await nextTick();

      const card = stepsList.value?.querySelector(`[data-card-index="${gap}"]`);
      if (!card) return;

      scrollIntoView(card, {
        scrollMode: "if-needed",
        block: "nearest",
        inline: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
    };

    /**
     * A move from one of the phone's card controls.
     *
     * Same one-gap move the arrow keys make; only the surface differs. The card
     * is followed afterwards because on a phone the entry can easily land past
     * the fold, and a move whose result you cannot see reads as a move that did
     * not happen.
     *
     * @param {number} index - Position of the card in the working list.
     * @param {number} delta - -1 for up, 1 for down.
     * @return {void}
     */
    const moveCard = async (index, delta) => {
      if (!reorder || readonly) return;

      const landed = await reorder.moveBy(props.sectionIndex, index, delta);
      if (landed?.sectionIndex === props.sectionIndex) keepMovedEntryVisible(landed.gapIndex);
    };

    /**
     * Pulls what the author has typed into contenteditable cells back into the
     * model, before anything reorders the rows underneath them.
     *
     * Reads each row's own index and its own field rather than counting rows and
     * assuming column seven. Notes are laid out differently from steps — one wide
     * cell instead of seven narrow ones — so a positional read finds the wrong
     * cell on the first note in a section and every row after it.
     *
     * @return {void}
     */
    const syncEditedFields = () => {
      const table = stepsTable.value;

      if (table) {
        //Desktop
        for (const cell of table.querySelectorAll("[data-edit-field]")) {
          const index = Number(cell.dataset.editIndex);
          const field = cell.dataset.editField;
          if (!Number.isInteger(index) || !steps[index]) continue;

          steps[index][field] = cell.innerHTML;
        }
        return;
      }

      // Mobile: stepsCopy holds the user-typed descriptions; sync them into steps
      // so Vue can diff cards correctly after the splice and update DOM positions.
      for (let i = 0; i < steps.length; i++) {
        if (isNote(steps[i])) {
          steps[i].gameplan = stepsCopy[i].gameplan;
        } else {
          steps[i].description = stepsCopy[i].description;
        }
      }
    };

    /** A blank step, in the shape the rest of the editor expects. */
    const blankStep = (id) => ({
      time: "",
      villagers: "",
      builders: "",
      food: "",
      wood: "",
      gold: "",
      stone: "",
      description: "",
      _id: id,
    });

    const addStep = async (index) => {
      syncEditedFields();

      //Add row
      const addIndex = index + 1;
      const newId = ++_nextStepId;
      stepsCopy.splice(addIndex, 0, blankStep(newId));
      steps.splice(addIndex, 0, blankStep(newId));

      emitSteps();
      await nextTick();
      await nextTick();
      timestampRefs.value[addIndex]?.focus();
    };

    /**
     * Inserts a note where the author asked for one.
     *
     * Notes used to be one per section, rendered automatically at the bottom of
     * every section whether or not anybody wanted one. This puts them where the
     * author put them, and only where the author put them.
     *
     * @param {number} index - Insert after this position; -1 prepends.
     * @return {void}
     */
    const addNote = async (index) => {
      syncEditedFields();

      const addIndex = index + 1;
      const newId = ++_nextStepId;
      //Only `gameplan` — a note states no time and no resources, which is what
      //keeps it out of the economy series and out of the autoplay timing gate.
      stepsCopy.splice(addIndex, 0, { gameplan: "", _id: newId });
      steps.splice(addIndex, 0, { gameplan: "", _id: newId });

      emitSteps();
      await nextTick();
      await nextTick();
      noteRefs.value[addIndex]?.focus();
    };

    /**
     * Inserts a whole alternatives bracket in one action.
     *
     * The opening marker, one path with one empty step, and the closing merge
     * line all arrive together. There is deliberately no "close" command
     * anywhere: the merge line is not something an author adds, it is something
     * the block has, which is why a block can never be left hanging open.
     *
     * @param {number} index - Insert after this position; -1 prepends.
     * @return {void}
     */
    const addAlternatives = async (index) => {
      //The menu already refuses this, greyed out with the reason. Refused here
      //too, so nesting is impossible rather than merely unoffered — a block
      //inside a block is two builds, and the flattener would drop the inner one
      //without telling anybody.
      if (isInsideBlock(steps, index + 1) || isInsideBlock(steps, index)) return;

      syncEditedFields();

      const addIndex = index + 1;
      const stepId = ++_nextStepId;
      //Two paths, always. A block is a fork — "A or B" — and one alternative is
      //not a fork, it is a run of steps with a label on it. Seeding a second
      //keeps the author from having to discover that the thing they just made
      //means nothing until they add another.
      const marker = {
        kind: ALT_START,
        paths: [
          { ...emptyPath(), title: pathName(1) },
          {
            ...emptyPath(),
            title: pathName(2),
            steps: [{ gameplan: "", _id: ++_nextStepId }, blankStep(++_nextStepId)],
          },
        ],
        active: 0,
        _id: ++_nextStepId,
      };
      //A note first: it is where the condition goes, and seeding it is what makes
      //"a path's condition is its first note" true by construction rather than by
      //an author remembering to write one.
      const condition = { gameplan: "", _id: ++_nextStepId };
      const first = blankStep(stepId);
      const end = { kind: ALT_END, _id: ++_nextStepId };

      steps.splice(addIndex, 0, marker, condition, first, end);
      stepsCopy.splice(addIndex, 0, { ...marker }, { ...condition }, blankStep(stepId), { ...end });

      emitSteps();
    };

    /**
     * Shows a different path's steps in the table.
     *
     * The steps standing between the markers belong to the path that was on
     * screen, so they are folded back onto it before the new path's are spliced
     * in. Switching is a splice rather than a redraw because only one path's
     * steps are ever inline — the rest wait on the marker.
     *
     * @param {number} markerIndex - Position of the opening marker.
     * @param {number} pathIndex - Which path to show.
     * @return {void}
     */
    /**
     * The name the flattener knows this block by.
     *
     * The editor works on a flat draft with markers; the document nests. The Nth
     * opening marker in the draft is the Nth alternatives item in the section, so
     * the two are matched by counting rather than by tracking an id neither shape
     * carries.
     *
     * @param {number} markerIndex - Position of the opening marker in the draft.
     * @return {string|null} The block's key, or null if it cannot be placed.
     */
    const blockKey = (markerIndex) => {
      if (props.sectionIndex == null) return null;

      const ordinal = steps.slice(0, markerIndex).filter(isBlockStart).length;
      const items = props.section?.steps ?? [];
      let seen = 0;

      for (let i = 0; i < items.length; i++) {
        if (items[i]?.kind !== "alternatives") continue;
        if (seen === ordinal) return blockId(props.sectionIndex, i);
        seen++;
      }

      return null;
    };

    const switchPath = (markerIndex, pathIndex) => {
      //Tell the page first. The table shows the new path because the draft below
      //is respliced, but the age timeline and the economy chart read the
      //document — they follow only because the choice is shared.
      const key = blockKey(markerIndex);
      if (key) activePath?.select(key, pathIndex);

      syncEditedFields();

      const marker = steps[markerIndex];
      const range = blockRanges(steps).find((entry) => entry.start === markerIndex);
      if (!marker || !range || !marker.paths?.[pathIndex] || pathIndex === marker.active) return;

      const inline = steps.slice(range.start + 1, range.end);
      marker.paths[marker.active] = { ...marker.paths[marker.active], steps: inline };
      marker.active = pathIndex;

      const incoming = (marker.paths[pathIndex].steps ?? []).map((step) => ({
        ...step,
        _id: step._id ?? ++_nextStepId,
      }));

      const count = range.end - range.start - 1;
      steps.splice(range.start + 1, count, ...incoming);
      stepsCopy.splice(range.start + 1, count, ...incoming.map((step) => ({ ...step })));
      stepsCopy[markerIndex] = { ...marker };

      emitSteps();
    };

    /**
     * Adds another path to a block and switches to it, so the author can start
     * writing it immediately.
     *
     * @param {number} markerIndex - Position of the opening marker.
     * @return {void}
     */
    const addAlternative = async (markerIndex) => {
      const marker = steps[markerIndex];
      if (!marker?.paths) return;

      marker.paths.push({
        ...emptyPath(),
        title: pathName(marker.paths.length + 1),
        steps: [{ gameplan: "", _id: ++_nextStepId }, blankStep(++_nextStepId)],
      });
      switchPath(markerIndex, marker.paths.length - 1);
    };

    /**
     * Saves a path's title or its condition.
     *
     * @param {number} markerIndex - Position of the opening marker.
     * @param {string} field - "title" or "description".
     * @param {string} value - The new value.
     * @return {void}
     */
    const updatePath = (markerIndex, field, value) => {
      const marker = steps[markerIndex];
      if (!marker?.paths?.[marker.active]) return;

      //A title is plain text. It is rendered into a chart legend and a focus-mode
      //bar, neither of which renders HTML, so the markup is stripped here rather
      //than left for them to deal with — the same treatment the timestamp and
      //resource cells get.
      //
      //Not trimmed here, though. The field binds one way, so trimming on every
      //keystroke wrote the trimmed string straight back into the input and ate
      //the space the author had just typed. Trimming happens on the way out
      //instead, in trimPathTitle().
      const clean = value.replace(/<[^>]*>/g, "");

      marker.paths[marker.active] = { ...marker.paths[marker.active], [field]: clean };
      stepsCopy[markerIndex] = { ...marker };
      emitSteps();
    };

    /**
     * The name a path is born with.
     *
     * Named on creation rather than left blank with a placeholder: a tab has to
     * carry a word to be a tab at all, the legend and the focus-mode bar need
     * something to print, and "Alternative 2" is a truthful name until the
     * author has a better one.
     *
     * @param {number} position - 1-based, in the order the paths sit.
     * @return {string} The default name.
     */
    const pathName = (position) => `Alternative ${position}`;

    /**
     * Which block's active path is being renamed, by marker position. One at a
     * time: the pencil belongs to the tab that is open, and there is only ever
     * one of those.
     */
    const renamingBlock = ref(null);

    //Only the flag. AlternativePathTabs focuses its own field when this turns
    //on, which keeps the template ref inside the component that owns it.
    const startRename = (markerIndex) => {
      renamingBlock.value = markerIndex;
    };

    /**
     * Renames the path whose pencil was clicked — not whichever path happens to
     * be open.
     *
     * The tab says which one it means, and this switches to it first. Only the
     * open tab's controls are reachable today, so the switch is a no-op in
     * practice; it is here because "the control acts on the thing it sits on" is
     * the property that was broken, and asserting it costs one line.
     *
     * @param {number} markerIndex - Position of the opening marker.
     * @param {number} pathIndex - The path the control belongs to.
     * @return {void}
     */
    const renamePath = (markerIndex, pathIndex) => {
      if (Number.isInteger(pathIndex)) switchPath(markerIndex, pathIndex);
      startRename(markerIndex);
    };

    /**
     * Removes the path whose ✕ was clicked, for the same reason.
     *
     * @param {number} markerIndex - Position of the opening marker.
     * @param {number} pathIndex - The path the control belongs to.
     * @return {void}
     */
    const removePathAt = (markerIndex, pathIndex) => {
      if (Number.isInteger(pathIndex)) switchPath(markerIndex, pathIndex);
      confirmRemovePath(markerIndex);
    };

    const finishRename = (markerIndex) => {
      trimPathTitle(markerIndex);

      //An emptied name is given its default back rather than left blank. A tab
      //with nothing in it is not clickable in any meaningful sense, and the
      //legend and the focus-mode bar would have nothing to print.
      const marker = steps[markerIndex];
      const path = marker?.paths?.[marker.active];
      if (path && !path.title) updatePath(markerIndex, "title", pathName(marker.active + 1));

      renamingBlock.value = null;
    };

    /**
     * Tidies a path title once the author has finished typing it.
     *
     * On the way out rather than on every keystroke, so that typing a space
     * inside a name is possible at all.
     *
     * @param {number} markerIndex - Position of the opening marker.
     * @return {void}
     */
    const trimPathTitle = (markerIndex) => {
      const marker = steps[markerIndex];
      const path = marker?.paths?.[marker.active];
      if (!path || path.title === path.title?.trim()) return;

      updatePath(markerIndex, "title", path.title.trim());
    };

    /**
     * What the confirmation dialog is currently asking about.
     *
     * One dialog for both, because the two acts differ only in what survives —
     * and that difference is exactly what the wording has to make clear before
     * the author says yes.
     */
    const altConfirm = ref({ open: false, mode: null, index: null });

    /** Whether removing this path takes the block with it — it does at two. */
    const lastPathOfBlock = (index) => (steps[index]?.paths?.length ?? 0) <= 2;

    const altConfirmTitle = computed(() => {
      const { mode, index } = altConfirm.value;
      if (mode === "path" && !lastPathOfBlock(index)) return "Delete alternative";
      return "Remove alternatives";
    });

    const altConfirmText = computed(() => {
      const { mode, index } = altConfirm.value;
      if (mode === "path" && !lastPathOfBlock(index)) {
        return "This alternative and the steps inside it are deleted. The other alternatives stay.";
      }
      if (mode === "path") {
        return "This alternative and its steps are deleted, and with one path left there is no choice to offer — the other alternative becomes part of the build.";
      }
      //Both the block's own ✕ and deleting the last remaining path land here, and
      //they do the same thing: the bracket goes, the steps stay.
      return "The alternatives are removed and every step inside them is kept, back on the main line.";
    });

    const confirmRemovePath = (index) => {
      altConfirm.value = { open: true, mode: "path", index };
    };

    const confirmRemoveBlock = (index) => {
      altConfirm.value = { open: true, mode: "block", index };
    };

    const runAltConfirm = () => {
      const { mode, index } = altConfirm.value;
      altConfirm.value = { open: false, mode: null, index: null };

      if (mode === "path") removePath(index);
      else if (mode === "block") removeBlock(index);
    };

    /**
     * Removes the path on screen, and its steps with it.
     *
     * The steps go because they are that path's answer to the condition — they
     * are not common steps that happen to be sitting there, and lifting them
     * into the build would put one path's plan on everybody's main line.
     *
     * Removing the last remaining path removes the block with it — a block with
     * nothing to choose between is not a block. Its steps are **kept** in that
     * case, lifted onto the main line: when other paths remain, a removed path's
     * steps belong to a branch that no longer exists and go with it, but when the
     * block itself is going there is nothing else to claim them and losing them
     * would be a surprise. Same outcome as the marker's own ✕.
     *
     * @param {number} markerIndex - Position of the opening marker.
     * @return {void}
     */
    const removePath = (markerIndex) => {
      const marker = steps[markerIndex];
      if (!marker?.paths) return;

      //Down to one path there is no longer a choice to offer, so the block goes
      //and the survivor becomes ordinary steps on the main line. Deleting one of
      //two is how an author says "actually, just do this" — the fork was the
      //thing they changed their mind about, not the steps.
      if (marker.paths.length <= 2) return dissolveBlock(markerIndex);

      const range = blockRanges(steps).find((entry) => entry.start === markerIndex);
      if (!range) return;

      const dropped = marker.active;
      marker.paths.splice(dropped, 1);
      marker.active = Math.max(0, dropped - 1);

      const incoming = (marker.paths[marker.active].steps ?? []).map((step) => ({
        ...step,
        _id: step._id ?? ++_nextStepId,
      }));
      const count = range.end - range.start - 1;

      steps.splice(range.start + 1, count, ...incoming);
      stepsCopy.splice(range.start + 1, count, ...incoming.map((step) => ({ ...step })));
      stepsCopy[markerIndex] = { ...marker };

      emitSteps();
    };

    /**
     * Drops the path on screen and, with only one left, the block around it.
     *
     * The survivor's steps take the block's place on the main line; the removed
     * path's go with it, as they do whenever a path is removed. A block that
     * offers no choice is not a block.
     *
     * @param {number} markerIndex - Position of the opening marker.
     * @return {void}
     */
    const dissolveBlock = (markerIndex) => {
      syncEditedFields();

      const marker = steps[markerIndex];
      const range = blockRanges(steps).find((entry) => entry.start === markerIndex);
      if (!marker || !range) return;

      const survivor = (marker.paths ?? []).find((path, index) => index !== marker.active);
      const lifted = (survivor?.steps ?? []).map((step) => ({
        ...step,
        _id: step._id ?? ++_nextStepId,
      }));
      const count = range.end - range.start + 1;

      steps.splice(range.start, count, ...lifted);
      stepsCopy.splice(range.start, count, ...lifted.map((step) => ({ ...step })));

      emitSteps();
      removeStepConfirmationDialog.value = false;
    };

    /**
     * Removes the bracket and keeps everything that was inside it.
     *
     * Every path's steps are lifted back into the section — the ones on screen
     * where they already are, the ones waiting on the marker after them. Deleting
     * a block is a decision about structure, never about an author's steps.
     *
     * @param {number} markerIndex - Position of either marker.
     * @return {void}
     */
    const removeBlock = (markerIndex) => {
      syncEditedFields();

      const range = blockRanges(steps).find(
        (entry) => entry.start === markerIndex || entry.end === markerIndex
      );
      if (!range) return;

      const marker = steps[range.start];
      const inline = steps.slice(range.start + 1, range.end);
      const others = (marker.paths ?? [])
        .filter((path, index) => index !== marker.active)
        .flatMap((path) => (path.steps ?? []).map((step) => ({ ...step, _id: ++_nextStepId })));

      const lifted = [...inline, ...others];
      const count = range.end - range.start + 1;

      steps.splice(range.start, count, ...lifted);
      stepsCopy.splice(range.start, count, ...lifted.map((step) => ({ ...step })));

      emitSteps();
      removeStepConfirmationDialog.value = false;
    };

    /**
     * What can be inserted at one position, and why anything offered is refused.
     *
     * Age-up appends two sections to the end of the build, so it can only be
     * honoured from the last section's trailing insert point. Everywhere else it
     * is shown disabled with that reason rather than hidden, so the rule is
     * learnable instead of mysterious.
     *
     * @param {number} index - The insert position, as addStep() takes it.
     * @return {Array} Options for StepInsertMenu.
     */
    const insertOptions = (index) => {
      const trailing = index === steps.length - 1;
      //The insert point sits *after* `index`, so what matters is whether the
      //position it lands in is inside the bracket.
      const inside = isInsideBlock(steps, index + 1) || isInsideBlock(steps, index);
      const ageUpHere = props.isLastSection && trailing;

      let ageUpReason = null;
      if (inside) {
        ageUpReason = "An alternative cannot span an advance — that is two builds, not one";
      } else if (!props.ageUpAvailable) {
        ageUpReason = "The build already reaches the Imperial Age";
      } else if (!ageUpHere) {
        ageUpReason = "You can only advance at the end of the build";
      }

      //The hints are the only place these shortcuts are taught. They sit on the
      //two entries that have one, at the moment somebody is inserting by mouse —
      //which is exactly when learning there is a faster way is worth anything.
      //Alternatives and Advance deliberately have none: both are refused in
      //context with a reason, and a shortcut can only fail silently.
      return [
        { value: "step", title: "Step", icon: "mdi-plus", hint: "Alt ↵" },
        { value: "note", title: "Note", icon: "mdi-information-outline", hint: "Alt N" },
        {
          value: "alternatives",
          title: "Alternatives",
          icon: "mdi-call-split",
          disabled: inside,
          reason: "Alternatives cannot be nested inside one another",
        },
        {
          //Just "Advance", per the design frame. The age it leads to belongs in
          //the arrival plate the action produces, not in a menu entry that has
          //to stay as short as the three beside it.
          value: "ageUp",
          title: "Advance",
          icon: "mdi-arrow-up-bold",
          disabled: !!ageUpReason,
          reason: ageUpReason,
        },
      ];
    };

    /**
     * Acts on a choice from the insert menu.
     *
     * @param {string} choice - The option's value.
     * @param {number} index - The insert position.
     * @return {void}
     */
    const handleInsert = (choice, index) => {
      if (choice === "step") return addStep(index);
      if (choice === "note") return addNote(index);
      if (choice === "alternatives") return addAlternatives(index);
      if (choice === "ageUp") return context.emit("ageUpRequested");
    };

    const removeStep = (currentIndex) => {
      syncEditedFields();

      //remove row
      stepsCopy.splice(currentIndex, 1);
      steps.splice(currentIndex, 1);

      emitSteps();
      removeStepConfirmationDialog.value = false;
    };

    const selectStep = (index) => {
      if (index != null) {
        selectedRowIndex.value = index;
        gameplanSelected.value = false;
      } else {
        selectedRowIndex.value = null;
        gameplanSelected.value = true;
      }
    };
    const hoverStep = (index) => {
      hoverRowIndex.value = index;
    };
    const unhoverStep = () => {
      hoverRowIndex.value = null;
      context.emit("stepHovered", { step: null });
    };

    /**
     * Tell the timeline card which moment the reader is looking at.
     *
     * Driven by pointer movement rather than by mouseover, which is not a
     * refinement but the whole mechanism. A row sliding under a resting pointer
     * during a scroll fires mouseover — so a mouseover-driven link lights up
     * every row on the way past, and needed a delay and a scroll latch to
     * suppress what it should never have reported. Pointer movement is the
     * question being asked: no movement, no event, nothing to suppress.
     *
     * Reported in flat terms, the only index space this table and that card can
     * both speak, and with the pointer's position so the parent can recognise
     * the phantom move some browsers fire after a scroll.
     */
    const reportStep = (event, index) => {
      context.emit("stepHovered", {
        step: flatIndexOf(index),
        x: event.clientX,
        y: event.clientY,
      });
    };

    /**
     * This section's local row index in the flattened build.
     *
     * Null rather than a guess when no offset was passed — the editor route
     * renders these sections with no timeline to talk to, and a wrong index is
     * worse than none.
     *
     * @param {number} index - Row index within this section.
     * @return {number|null} The flat index.
     */
    const flatIndexOf = (index) =>
      props.stepOffset == null ? null : props.stepOffset + documentIndex(index);

    /**
     * The row that holds a given step, going the other way.
     *
     * The inverse of documentIndex: everything outside this component counts
     * steps, and the rows here also include the markers of any alternatives
     * block. Hovering row 7 of a section that contains a block is not step 7,
     * and mixing the two lit up a row further down the build.
     *
     * @param {number} docIndex - Position among the section's real steps.
     * @return {number|null} The row's index, or null when there is no such step.
     */
    const draftIndexOf = (docIndex) => {
      if (docIndex == null || docIndex < 0) return null;

      let count = 0;
      for (let cursor = 0; cursor < steps.length; cursor++) {
        if (isMarker(steps[cursor])) continue;
        if (count === docIndex) return cursor;
        count++;
      }

      return null;
    };

    /**
     * The row the timeline is currently pointing at, in local terms.
     *
     * Null unless the highlighted step falls inside this section, so the four
     * sections of a build cannot each light up their own row number.
     */
    const linkedRow = computed(() => {
      const flat = highlight?.stepIndex.value;
      if (flat == null || props.stepOffset == null) return null;

      //Through the same conversion the report used, so a row lights up only when
      //it is the one that was pointed at. draftIndexOf answers null outside this
      //section, which is what stops four sections each lighting a row.
      return draftIndexOf(flat - props.stepOffset);
    });

    /**
     * A row keeps its mark for a moment after being scrolled to.
     *
     * Without this the mark belongs to the pointer: the reader clicks the
     * chart, the page scrolls, the pointer is no longer over the plot, and the
     * row they were sent to looks like every other row by the time they get
     * there.
     */
    const flashedRow = ref(null);
    let flashTimer = null;

    /**
     * Brings one of this section's rows into view.
     *
     * Addressed by data attribute rather than by position among the rendered
     * rows, because a read-only view drops the rows that say nothing — so the
     * nth `tr.step-row` is not the nth step.
     *
     * @param {number} index - Row index within this section.
     * @return {void}
     */
    const scrollToStep = (index) => {
      //The parent hands over a step index; the rows are numbered by draft
      //position, which counts markers too.
      const draftIndex = draftIndexOf(index);
      if (draftIndex == null) return;

      const row = stepsTable.value?.querySelector(`tr.step-row[data-step-index="${draftIndex}"]`);
      if (!row) return;

      scrollIntoView(row, {
        //Already comfortably in view means the reader asked about a row they can
        //see; jumping the page under them would be an odd way to answer
        scrollMode: "if-needed",
        //Mid-viewport clears any sticky chrome without measuring it
        block: "center",
        inline: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });

      clearTimeout(flashTimer);
      flashedRow.value = index;
      flashTimer = setTimeout(() => (flashedRow.value = null), FLASH_MS);
    };

    onBeforeUnmount(() => clearTimeout(flashTimer));

    const handleResourceInput = async (e) => {
      if (e.data == "-") {
        var contentEditable = e.target;
        //prevent break on hyphen
        contentEditable.innerHTML = contentEditable.innerHTML.replace("-", "&#8209;");

        //updating innerHTML sets cursor to start, this is a workaround to set caret to end
        placeCaretAtEnd(contentEditable);
      }

    };

    const handlePaste = async (e) => {
      //Check html content first
      const dirty = e.clipboardData.getData("text/html");
      const clean = sanitizeStepDescription(dirty);

      document.execCommand("insertHTML", false, clean);
      e.stopPropagation();
      e.preventDefault();
    };

    return {
      steps,
      readonly,
      stepsTable,
      timestampRefs,
      registerTimestampRef,
      stoneInputRefs,
      registerStoneInputRef,
      deltaClass,
      hoverRowIndex,
      selectedRowIndex,
      handleResourceInput,
      selection,
      delteRowIndex,
      removeStepConfirmationDialog,
      mergeProps,
      handlePaste,
      handleContentEditableKeyUp,
      showAutoCompleteMenu,
      aggregateVillagers,
      hasResourceValue,
      resolvedTime,
      isEstimate,
      saysNothing,
      updateStep,
      handleTimeBlur,
      updateStepDescription,
      updateStepNote,
      isNote,
      noteRefs,
      registerNoteRef,
      insertOptions,
      handleInsert,
      isBlockStart,
      isBlockEnd,
      insideBlock,
      xsGroups,
      switchPath,
      addAlternative,
      updatePath,
      trimPathTitle,
      renamingBlock,
      startRename,
      renamePath,
      removePathAt,
      finishRename,
      removePath,
      removeBlock,
      altConfirm,
      altConfirmTitle,
      altConfirmText,
      confirmRemovePath,
      confirmRemoveBlock,
      runAltConfirm,
      removeStep,
      addStep,
      addNote,
      selectStep,
      hoverStep,
      unhoverStep,
      reportStep,
      linkedRow,
      flashedRow,
      //Called by the parent through its section refs, so a flat step index can
      //reach the one section that owns that row
      scrollToStep,
      //Reordering: the grip and its keyboard, the phone's move controls, and the
      //two pieces of drag state the rows are drawn against
      registerDragHandleRef,
      startDrag,
      moveEntry,
      moveCard,
      canMoveEntry,
      moveLabel,
      draggingIndex,
      dropGapIndex,
      isDragging,
      stepsList,
      //Escape leaves a field, which is what frees the grip's shared slot
      releaseEditing,
      //Every Alt shortcut a row answers to, and the ✕ they share a target with
      handleRowShortcut,
      confirmRemoveStep,
      saveSelection,
      restoreSelection,
      handleIconSelectorIconSelected,
      activeStepIndex,
      focusedDescIndex,
      handleAutoCompleteMenuIconSelected,
      //Autocomplete
      searchText,
      autocompletePos,
      //Guards the note and description blocks in the read-only views
      hasVisibleContent,
      //Custom Tooltips
      handleMouseOver,
      handleMouseOut,
      showToolTip,
      toolTipPos,
      toolTipModel,
      toolTipElement,
      absoluteLocationStrategy,
      //Gameplan
      gameplan,
      gameplanSelected,
      updateSectionGameplan,
      gameplanContentEditable,
      // Age bracket
      targetAgeName,
      targetAgeShortName,
      currentAgeName,
      currentAgeImg,
      targetAgeImg,
      isBareAgeUp,
      hasTableRows,
      hasTransitionBody,
    };
  },
};
</script>

<style scoped>
.gameplanHeader {
  text-align: center;
  vertical-align: middle;
}

.aggregatedVillagers {
  color: #828282;
  font-weight: 700;
}

/* Allow ins-zone to overflow both the table wrapper and the section card, so it
   can reach across a card boundary — the insert line between the last row of one
   section and the first of the next. (It used to have to clear a floating age
   plate here; both age markers are rows in the table now.) */
:deep(.v-table__wrapper) {
  overflow: visible;
}
/* The colgroup means what it says.
   By default a table sizes its columns from their content, so the declared
   widths are only a suggestion — and a run of rows that are all `colspan`
   (an alternatives block whose steps are hidden, or whose path is empty) leaves
   nothing to size columns 1–8 from. The browser then spread them differently,
   and the block's marks sat 40px right of where the same marks sat one path
   over. Fixed layout takes the widths from the colgroup and gives the remainder
   to the description column, which is the one that should flex. */
:deep(.v-table__wrapper > table) {
  table-layout: fixed;
}
.hidden-xs {
  overflow: visible !important;
}

/* Timestamp */
.ts-text {
  display: block;
  height: 30px;
  line-height: 30px;
  margin-top: 12px;
  margin-bottom: 12px;
  font-size: 13.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-accent));
  font-variant-numeric: tabular-nums;
}

/* A time the site worked out rather than one the author wrote. Muted and
   un-bolded so it reads as secondary to the real stamps in the same column,
   without introducing a colour that would compete with the accent. */
.ts-text--derived {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-disabled-opacity));
}

.ts-pill {
  display: block;
  width: 100%;
  height: 28px;
  line-height: 28px;
  margin-top: 12px;
  border-radius: 6px;
  background: transparent;
  text-align: center;
  font: inherit;
  font-size: 13.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-accent));
  border: 1px solid transparent;
  outline: none;
  cursor: text;
  box-sizing: border-box;
  transition: background 0.12s, border-color 0.12s;
}
.ts-ghost {
  border-color: rgba(var(--v-theme-on-surface), 0.15) !important;
}
.ts-pill:focus {
  background: rgba(var(--v-theme-accent), 0.15);
  outline: 1px solid rgba(var(--v-theme-accent), 0.45);
  border-color: transparent !important;
}

/* Step row cells — all cells top-aligned; margin-top on pills creates visual centering in the
   stable 52px row height. Pills center at margin-top(12) + height/2(14) = 26 = 52/2. */
.step-row {
  height: 52px;
}

/* The row the timeline card is pointing at, and the row it just sent the reader
   to — one treatment for both, because to a reader they are the same statement:
   "this row is the one".

   A left edge rather than a wash: the row is 52px of mostly-empty cells, and a
   background tint across it reads as selection, which this is not. Deliberately
   not tied to the table's own :hover — pointing at a row with the mouse is not
   a claim about it, and lighting every row a pointer crosses would make the
   answer from the chart indistinguishable from noise. */
.step-row--linked td {
  background: rgba(var(--v-theme-accent), 0.07);
}

/* No gold edge here. Gold is the age vocabulary — the age rail, the age plates,
   the timings — and a gold bar down a row said "this is an age boundary" about a
   row that was merely being pointed at. The tint alone is the answer; it is what
   the chart and the table have in common, and it says "this one" without
   claiming anything else. */

.step-row td {
  transition: background-color 140ms ease;
}
.step-row td {
  vertical-align: top !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
}
/* Description cell — middle-aligned so single-line text centers in the 52px row.
   The alternatives condition is the same kind of field and shares the rule
   rather than copying its numbers: that is what keeps an icon from changing the
   row's height in one place and not the other. */
.step-row td.contentEditable,
.alt-row--cond td.contentEditable {
  vertical-align: middle !important;
  padding-top: 7px !important;
  padding-bottom: 7px !important;
  padding-left: 16px !important;
  padding-right: 8px !important;
  line-height: 1.55;
}
/* Edit mode: focus-only gold highlight fills entire cell */
.step-row td.contentEditable[contenteditable="true"]:focus,
.alt-row--cond td.contentEditable[contenteditable="true"]:focus {
  outline: none;
  background: rgba(var(--v-theme-accent), 0.08);
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-accent), 0.4);
  border-radius: 6px;
}
/* Action column. Shared with the alternatives rows, which are not .step-row and
   so were getting none of this — their buttons fell back to the cell's default
   middle alignment and sat a few pixels below the ones above and below them. */
.step-row td.step-actions,
.alt-row td.step-actions {
  padding-top: 7px !important;
  padding-bottom: 4px !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
  vertical-align: top !important;
}
.step-actions-inner {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 2px;
}
/* Villager count — plain text via v-html, needs its own vertical padding */
.step-row td.aggregatedVillagers {
  padding-top: 16px !important;
}

/* Resource pills — fill full cell width, matching CSS-grid design.
   Vertical margin (not td padding) creates spacing so single-line rows
   look balanced while multiline rows keep pills pinned to the top. */
.rc-pill {
  /* Each tint is held as channel triplet + alpha rather than as a finished
     rgba(), so a pill that repeats the step before it can step its fill back
     in one rule instead of five. The neutral default keeps the shorthands
     below valid on a pill wearing no tint class — an undefined var would make
     the whole `border` declaration invalid and drop the outline entirely. */
  --rc-tint: 127, 127, 127;
  --rc-fill: 0.45;
  --rc-edge: 0.65;

  display: block;
  width: 100%;
  height: 30px;
  line-height: 26px;  /* 28px - 1px border-top - 1px border-bottom */
  margin-top: 12px;
  margin-bottom: 12px;
  border-radius: 6px;
  background: rgba(var(--rc-tint), var(--rc-fill));
  border: 1px solid rgba(var(--rc-tint), var(--rc-edge));
  text-align: center;
  font-weight: 800;
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
  box-sizing: border-box;
}
.rc-builders { --rc-tint: 94,  83,  64; }
.rc-food     { --rc-tint: 136, 64,  64; }
.rc-wood     { --rc-tint: 79,  107, 58; }
.rc-gold     { --rc-tint: 138, 109, 46; }
.rc-stone    { --rc-tint: 89,  102, 122; }

/* Edit-mode pill input — appearance reset only; sizing/color come from rc-pill + tint classes */
.rc-input {
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  font: inherit;
  color: inherit;
  cursor: text;
  padding: 0;
  transition: background 0.12s, border-color 0.12s;
}
.rc-input:focus {
  background: rgba(var(--v-theme-accent), 0.15) !important;
  border-color: rgba(var(--v-theme-accent), 0.65) !important;
}
/* Edit-mode empty resource cell — ghost pill: same shape as filled pill, no fill */
.rc-ghost {
  background: transparent !important;
  border-color: rgba(var(--v-theme-on-surface), 0.15) !important;
}

/* Villagers moved onto this resource, or off it. One colour and one weight for
   both, differing only in which edge the bar sits on — the side the value moved
   toward. Reassignments come in pairs, so a row usually shows both at once and
   teaches its own notation. See deltaClass() for why the pair is not red/green. */
.rc-pill.d-up {
  border-top: 2px solid rgb(var(--v-theme-primary));
}
.rc-pill.d-down {
  border-bottom: 2px solid rgb(var(--v-theme-primary));
}

/* Carried over unchanged from the step before. The tint steps back so that
   colour across a row means "this moved"; the number keeps full contrast,
   because a reader tracing where the villagers are right now still has to read
   it — and because dimmed type is where the light theme's contrast goes. */
.rc-pill.d-same {
  --rc-fill: 0.12;
  --rc-edge: 0.22;
}

/* Empty cell — faint dash, fills column like a filled pill */
.rc-empty {
  display: block;
  width: 100%;
  height: 28px;
  line-height: 28px;
  margin-top: 12px;
  text-align: center;
  color: rgba(127, 127, 127, 0.28);
  font-size: 13.5px;
  font-weight: 500;
  user-select: none;
}


/* The advance — desktop.

   A row, not a bar. The gold banner this replaces was drawn identically to the
   arrival plate below, which told the reader nothing about which of the two they
   perform and which simply happens. No box, no fill, no tint: it takes the rules
   and the height of the rows around it, and its rail says which phase it opens.

   The banner's ✕ height cap went with it. That cap existed because a 40px icon
   button did not fit inside a 40px flex banner's padding, and the banner was
   fighting the column grid to land its ✕ in the same column as every step row's.
   In a real row the ✕ is in that column because it is in that cell. */
.age-advance-row .age-advance-mark {
  color: rgb(var(--v-theme-accent));
}
/* Its own top rule, which no other row needs.
   The row above is the last row of the *previous* section's table, and that
   row's bottom border is deliberately stripped so it does not double with its
   card's edge — so between the last step of an age and the advance that follows
   it there was nothing at all. The banner this replaces never showed the gap
   because it was a bordered box sitting in its own margin. A plain row has to
   draw the separator itself. Same declaration as every other row separator. */
.age-advance-row > td {
  border-top: thin solid rgba(var(--v-theme-on-surface), 0.12) !important;
}
/* One label treatment for both age rows, deliberately shared rather than paired.
   Same size, weight, case and letter-spacing means the advance and the arrival
   read as one bracket opening and closing; two similar-but-not-identical
   treatments would read as two unrelated announcements. It is also the treatment
   the alternatives merge marker uses, because "advancing to…", "…reached" and
   "the paths rejoin here" are three statements of the same kind — annotations
   about the shape of the build rather than instructions to carry out. */
.annot-lbl {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
/* Colour is the only thing that varies, and it varies by what the annotation is
   about: gold for where you are in the build, the alternatives colour for which
   way you went. Typography is shared rather than re-declared, so the three
   markers cannot drift into three near-identical treatments. */
.age-annot-lbl {
  color: rgb(var(--v-theme-accent));
}
.alt-annot-lbl {
  color: rgb(var(--v-theme-alternative));
}

/* The arrival — desktop.

   A row, not a bar. The bordered, inset, rounded plate this replaces floated
   above the list and read as a widget dropped onto the build rather than a row
   of it; worse, it sat outside the table, so the rail marking the transition
   stopped short of the thing the transition ends on.

   It stands out on FILL ALONE. No border, no box, no larger type — the fill is
   the only difference between this row and the ones inside the rail, which is
   enough because nothing else in the list is filled. Adding a border back would
   restore exactly the problem this removed.

   Both selectors, because the fill has to beat the lane's own gradient on a
   railed arrival and still apply on an unrailed one (an age-up with no steps
   draws no rail at all).

   The fill carries across the whole row rather than fading to nothing at 60%
   like the lane's. The lane fades because it runs behind the resource pills,
   which are colour-coded and carry meaning, and a flat tint dulls them. This row
   has no pills — one icon and a label — so there is nothing to protect and it can
   hold its colour the whole way across. That is what makes it read as "you are in
   the new age now" rather than as one more annotation. */
.age-reached-row,
.age-reached-row.age-lane-md:not(.alt-row):not(.alt-inside) {
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-age), 0.3),
    rgba(var(--v-theme-age), 0.12) 60%,
    rgba(var(--v-theme-age), 0.08)
  );
}
/* The age asset, in the same column and at the same optical size as the advance
   row's arrow. It identifies *which* age and nothing more: at this size the
   circled numeral reads as a pause glyph — a near-twin of the transport control
   below the list — and Ⅱ/Ⅲ/Ⅳ differ from each other by one stroke. The fill and
   the age name carry the meaning. */
.age-reached-icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
  vertical-align: middle;
}
/* Its bottom separator is restored further down, next to the two rules that
   strip the last row's rule — not here. Same specificity and both `!important`
   means the later rule in the sheet wins, so a declaration up here would simply
   have been discarded. */

/* Insert row — visibility:collapse removes the row from layout entirely (0px height,
   no border contribution). The cell keeps visibility:visible so the absolutely-
   positioned ins-zone can still overlay the row boundary. */
.ins-row {
  visibility: collapse;
}
.ins-row-cell {
  visibility: visible;
  height: 0;
  padding: 0 !important;
  border: none !important;
  position: relative;
  overflow: visible;
}
.ins-zone {
  position: absolute;
  left: 0; right: 0;
  top: -10px; height: 20px;
  cursor: pointer;
  z-index: 2;
}
/* The trailing insert line hangs half its button below the last row, where the
   next section's card paints over it. The line belongs on that boundary and a
   strip of space to hold it would put a gap at the foot of every section, so it
   is lifted over what follows instead.

   The lift has to happen on the card, not on the zone: every section is a
   v-card, and Vuetify gives those `z-index: 0`, which makes each one a stacking
   context. A z-index inside the card therefore cannot reach past it, however
   large — the whole card has to come forward.

   Only while the line is actually being pointed at. The button is invisible
   otherwise, and a card that permanently outranked its neighbour would be one
   more piece of stacking for the next person to unpick. */
.hidden-xs:has(.ins-row--trailing .ins-zone:hover) {
  z-index: 5;
  /* Lifted at once on the way in */
  transition: z-index 0s;
}
/* …and dropped only after the button has finished fading out. Without the delay
   the card falls back the instant the pointer leaves, so the next section paints
   over the button's lower half while it is still visible — the fade appeared to
   break in two. z-index cannot tween, but it can be made to wait. */
.hidden-xs {
  transition: z-index 0s 0.28s;
}
.ins-line {
  position: absolute;
  left: 0; right: 0; top: 50%;
  height: 2px;
  transform: translateY(-50%);
  background: rgb(var(--v-theme-accent));
  opacity: 0; transition: opacity 0.18s;
  pointer-events: none;
}
.ins-btn {
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0; transition: opacity 0.18s;
  background: rgb(var(--v-theme-accent));
  color: rgb(var(--v-theme-surface));
  border: none; cursor: pointer;
  border-radius: 999px;
  padding: 3px 16px;
  font-size: 12px; font-weight: 700;
  white-space: nowrap;
  z-index: 1;
  line-height: 1.5;
}
/* fade IN: delay on enter to avoid flicker; fade OUT: no delay (base transition) */
.ins-zone:hover .ins-line { opacity: 1; transition: opacity 0.2s 0.15s; }
.ins-zone:hover .ins-btn  { opacity: 1; transition: opacity 0.2s 0.15s; }

/* Held open while its menu is: the pointer is on the menu by then, not on the
   line, so hover alone would hide the control the reader is in the middle of
   using — and leave no clue which of the insert lines the menu belongs to.
   Closing it (a second click, a click outside, Escape) hands it back to hover. */
.ins-zone--open .ins-line,
.ins-zone--open .ins-btn { opacity: 1; }

/* Add-icon button — always in DOM for correct menu positioning; hidden via opacity when not focused */
.step-action-icon--hidden {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* One box holding both the grip and the icon picker, since only one of them is
   ever wanted (see the markup for why).

   Grid rather than absolute positioning, and with no width of its own: both
   children occupy the same grid cell, so the box takes their natural size and
   they keep it. Pinning a size here is the trap — `size="small"` + `icon` is a
   40px circle (28px of button height plus Vuetify's 12px at default density),
   so a hand-written 28px would have quietly shrunk both controls next to a
   40px ✕. */
.step-action-slot {
  display: grid;
  flex-shrink: 0;
}
.step-action-slot > * {
  grid-area: 1 / 1;
}

/* Row grip — same reveal-on-hover as the delete button beside it, and the same
   neutral colour: these are both controls that act on the row. The icon picker
   is accent-coloured because it puts something into the row, which is a
   different kind of act. Focus keeps the grip visible — it is the keyboard's
   move control, and a control you have tabbed to must be there.

   `touch-action: none` is not decoration. Without it a drag begun with a finger
   or a pen is claimed by the browser as a scroll, and the pointermove events
   stop arriving halfway through the gesture. */
.row-grip {
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
}
.step-row:hover .row-grip,
.row-grip:focus-visible { opacity: 0.6; }
.step-row--dragging .row-grip { opacity: 1; cursor: grabbing; }
/* Out of the way while the description is being written: the picker has the
   slot then, and two controls stacked in one box must never both be visible. */
.row-grip--hidden {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* The row being carried. Held at reduced opacity rather than transformed: a
   `transform` on a <tr> makes it a containing block, which detaches the age and
   alternatives rails drawn as ::before on the row's first cell — the lane would
   break exactly where the drag is. Opacity says "this is in flight" without
   touching layout, and being a state rather than an animation it has nothing
   for reduced-motion to suppress. */
.step-row--dragging > td {
  opacity: 0.4;
}

/* The line a release would take. The insert line is already drawn here for
   adding a step; this is the same line, told apart by weight and colour rather
   than by being a second kind of line that means almost the same thing. */
.ins-row--drop .ins-line {
  height: 2px;
  background: rgb(var(--v-theme-accent));
  opacity: 1;
}
.ins-row--drop .ins-zone {
  z-index: 3;
}

/* Nothing under the pointer should behave like a button while a row is in
   flight — the "+ Add" zones sit exactly where the drop lines are, and lighting
   one up mid-drag suggests a click is what is about to happen. */
.steps-table--dragging .ins-zone {
  pointer-events: none;
}
.steps-table--dragging .contentEditable {
  cursor: grabbing;
}

/* Row delete button — always in DOM, revealed on row hover */
.row-x {
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
}
.step-row:hover .row-x { opacity: 1; }
.age-advance-row:hover .row-x { opacity: 1; }
.row-x:hover :deep(.v-icon) { color: rgb(var(--v-theme-error)); }

.bo-noterow td {
  border-top: none;
}
/* ── Alternatives block ──────────────────────────────────────────────────────
   Secondary throughout, never gold. Gold means where you are in the build —
   ages, timings, the primary action. Blue means which way you went. A gold
   control here would claim the two are the same kind of thing. */
/* A lane, not a wash: a rail down the left edge and a tint that fades away from
   it. The age lane below is the same construction in gold, so a block reads as
   the same kind of annotation an age-up is — only the colour differs, which is
   the whole point of the rule that gold means where you are and blue means which
   way you went.

   The rail earns its place over the start/end borders alone: those say where the
   block begins and ends, but only the rail says *you are inside it* — which is
   the question a reader has halfway down a long alternative, with neither marker
   on screen.

   The fade is not decoration either. A flat tint across the row dulls the
   resource pills, which are colour-coded and carry meaning; strongest at the
   rail and gone by the description keeps the annotation where the annotation is
   and leaves the content alone.

   Painted on the row rather than the cells, because a per-cell gradient would
   restart nine times across the row. */
.alt-row,
.alt-inside {
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-alternative), 0.12),
    rgba(var(--v-theme-alternative), 0.02) 60%,
    rgba(var(--v-theme-alternative), 0)
  );
}
/* Every row keeps its separator, first column included. */
/* Drawn *outside* the cell, which is what lets the first column keep its
   separator like every other column: an inset rail paints within the padding box
   and every row's bottom border cut through it.

   A pseudo-element rather than an outset shadow, and deliberately 2px taller
   than its cell at each end. A shadow stops exactly at the border box, so any
   seam between two rows — a collapsed border, the zero-height insert row that
   sits between every pair of items — shows as a nick in the rail, and one of
   those was the gap at the top of the block. Overlapping its neighbours means
   there is no seam left to show through.

   It costs no layout: the rail lands in the table's own mx-4 margin, and the
   cell is only made a positioning context. */
.alt-row > td:first-child,
.alt-inside > td:first-child {
  position: relative;
}
.alt-row > td:first-child::before,
.alt-inside > td:first-child::before {
  content: "";
  position: absolute;
  left: -3px;
  top: -2px;
  bottom: -2px;
  width: 3px;
  background: rgb(var(--v-theme-alternative));
  pointer-events: none;
}
/* The 2px overlap is for seams *between* rows, so at the block's own ends it is
   just the rail sticking out past the thing it marks. Not squared off flush
   either, though: 1px, which is exactly the row separator each end sits against.
   Flush at 0 stops short of that hairline and reads as a nick; 1px meets it and
   the rail ends where the block does. */
.alt-row--start > td:first-child::before {
  top: -1px;
}
.alt-row--end > td:first-child::before {
  bottom: -1px;
}
/* No horizontal rules bounding the block. The rail already says where it starts
   and stops — it simply begins and ends — and both marker rows say so in words
   as well. A third statement of the same fact bought nothing and cost the
   crossings. */
.alt-row td {
  border-top: none !important;
}
/* The merge line keeps a separator like any other row — but only when a row
   actually follows it. Ending a section, it needs none: the next thing on screen
   is the age-up banner or the card edge, and a rule there separates a section
   from itself. Same reasoning as the two rules further down that strip the last
   row's border; this one had been overriding them. */
tbody tr.alt-row--end:not(:last-child):not(:has(+ tr.ins-row--trailing)) td:not(:first-child) {
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.12) !important;
}
.alt-mark {
  color: rgb(var(--v-theme-alternative));
}
.alt-bar-cell {
  padding-left: 2px !important;
  padding-right: 8px !important;
}
/* Revealed on hover, like every other row's ✕. The marker rows are not
   .step-row, so the shared rule below never reached them and the control was
   there but permanently invisible. */
.alt-row:hover .row-x {
  opacity: 1;
}

/* ── Age-up lane ─────────────────────────────────────────────────────────────
   The transition drawn as a phase: the rows between clicking the landmark and
   arriving in the new age are bracketed by a rail, so it reads as a stretch of
   the build with its own rules rather than as two bars with strangers between
   them. Same construction as the alternatives lane above, one colour apart —
   gold is where you are in the build, blue is which way you went.

   `age-lane-md` was applied to every row of an ageUp section long before it had
   any rules. These are the rules.

   ONE RAIL, INNERMOST WINS. There is exactly one gutter, at one x, for the whole
   list, and it paints the innermost open context: gold for a transition, blue
   for an alternatives block inside one, gold again after the merge. Hence the
   :not() — a row inside a block inside a transition carries both classes, and
   the block is the inner one. Stated here rather than left to stylesheet order,
   because a reorder would otherwise flip it silently.

   Depth cannot exceed two: an alternatives block lives inside one section and an
   age-up cannot open inside a path, so a third rail is unreachable.

   Nesting the two rails was built and rejected. It reads correctly but costs
   ~14px of the description column, and the indented rows stop lining up with the
   rows above them — which is the one thing the table format is good at. The rail
   answers the local question ("which of the two am I on"); whether the age-up is
   still open is already answered by the advance above and the bar below. */
.age-lane-md:not(.alt-row):not(.alt-inside) {
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-age), 0.12),
    rgba(var(--v-theme-age), 0.02) 60%,
    rgba(var(--v-theme-age), 0)
  );
}
.age-lane-md:not(.alt-row):not(.alt-inside) > td:first-child {
  position: relative;
}
/* The 2px overhang is load-bearing — see the alternatives rail above. Flush ends
   nick at every row seam and at the zero-height insert row between each pair.
   No border-radius: the design's rounded run belongs to a wrapper construction
   that is not what ships here, and rounding would reintroduce the nick the
   overhang exists to remove. */
.age-lane-md:not(.alt-row):not(.alt-inside) > td:first-child::before {
  content: "";
  position: absolute;
  left: -3px;
  top: -2px;
  bottom: -2px;
  width: 3px;
  /* `age`, not `accent`: accent is navy in the light theme — changed there for
     text contrast — and so is `alternative`, which made the two lanes identical
     in light mode. This token is gold in both. */
  background: rgb(var(--v-theme-age));
  pointer-events: none;
}
/* The run's own ends, which are not symmetric — each one stops where the thing
   it meets actually is.

   The 2px overhang is for seams *between* rows — a collapsed border, the
   zero-height insert row sitting between every pair of items — and there is no
   seam at either end of a run, so carrying it through to the ends just leaves
   the rail sticking out past the thing it marks.

   **Top: -1px, so the rail includes the separator it starts under.** The advance
   row draws its own 1px top rule, and the run begins at that line rather than
   below it. Flush at 0 stops under the hairline and reads as the rail starting
   late.

   **Bottom: -1px, symmetrically.** The run closes on the arrival row, which
   keeps its own bottom rule, so the rail takes that line in the same way it
   takes the one above the advance row. Both ends now sit *on* their separator
   rather than between them, and the bracket is the same shape at top and bottom.

   The trailing-insert selector is qualified on that line actually being last.
   The arrival row sits below it, so unqualified it matched a row in the middle
   of the run and trimmed an interior end — a nick where there is no end.

   The run opens on the advance row and closes on the arrival row, inclusive:
   the transition visibly terminates on the thing it was heading for, instead of
   stopping beside it.

   Both selectors repeat the `:not()` guard, and must. Without it
   `.age-advance-row > td:first-child::before` carries two class-level selectors
   against the base rule's three, so it lost outright and the top end kept
   overhanging while the bottom — which happened to be specific enough — did not.
   Two ends of one run, behaving differently, for no reason visible at the
   declaration. */
.age-advance-row.age-lane-md:not(.alt-row):not(.alt-inside) > td:first-child::before {
  top: -1px;
}
tbody tr.age-lane-md:not(.alt-row):not(.alt-inside):last-child > td:first-child::before,
tbody tr.age-lane-md:not(.alt-row):not(.alt-inside):has(+ tr.ins-row--trailing:last-child) > td:first-child::before {
  bottom: -1px;
}

/* A note placed in the step flow is as tall as its text, and everything in the
   row lines up with that text's FIRST line — the icon on the left, the picker
   and the ✕ on the right. A one-line note therefore reads as centred, and a note
   that runs to five lines keeps its icon and its controls in the corners instead
   of drifting to the middle of a tall row.

   This is the treatment a step's own description already has; the buttons need
   nothing beyond not being overridden, since `.step-row td.step-actions` is
   top-aligned and `.step-actions-inner` starts its flex items at the top. */
/* Both the icon and the text hang from the top of the row at the same offset,
   and that offset is what centres a single line in it: 15px + half a line lands
   on 26px, the middle of the 52px row every table row here is.

   Top-anchored rather than middle-anchored, because middle has two answers. A
   one-line note wants the middle of the row; a five-line note wants the middle
   of its first line; and `vertical-align: middle` gives the middle of whatever
   the note grew to, which is neither once it wraps. Anchored to the top, one
   number satisfies both — the first line never moves, and when the note is a
   single line that position *is* the centre.

   52px is Vuetify's own row height, set on the cell rather than the row, which
   is why overriding the row's height changed nothing. */
/* Both of these rows are as tall as a step row *actually* is, which is 55px, not
   the 52px `.step-row` declares: a resource pill is 30px inside 12px margins, so
   the pills set the real floor at 54px of content — and the row separator is a
   1px border *inside* the cell's border box, because everything here is
   border-box and the table has `border-spacing: 0`. 54 + 1 = 55.

   That is also the number stated on the row rather than on the cell, and the two
   mean different things: Vuetify's 52px sits on the td and is a border-box
   height, while `height` on a tr is a minimum for the whole row box. A step row
   overshoots both from its content; these rows have no pills, so the minimum is
   the only thing holding them up. Set to 54 they came out one pixel short of
   every step around them — the pixel went to the border.

   The remaining 54px of content is exactly what an inline icon needs: the icon
   box is 36px plus 2px margins, and 40px + the description's 7px padding top and
   bottom comes to 54. So a note, like a step, never changes height when an icon
   goes into it — and it needs no padding of its own, sharing the step
   description's 7px unchanged. */
.step-row.bo-noterow,
.alt-row--cond {
  height: 55px;
}

/* The note's text is left to the step description rules entirely — middle
   aligned, 7px, one row tall. Top-anchoring it at 15px looked identical while
   the note was one plain line and came apart the moment an icon went in: the
   taller line box grew downward from a fixed top, so the text appeared to gain
   padding above it. A step re-centres instead, and so does this now.

   The icon keeps its 15px, which is where a single line's centre falls. That is
   the same relationship a step's timestamp pill has to its description: pinned
   near the top, centred while the row is at its standard height. */
.step-row.bo-noterow td.note-icon-cell {
  vertical-align: top !important;
  padding-top: 15px !important;
}
.note-icon-line {
  display: flex;
  align-items: center;
  justify-content: center;
  /* One line of note text — matches the 1.55 line-height beside it, so the icon
     centres against a line rather than against its own 16px. */
  min-height: 1.55em;
}
/* Match notes editor padding/spacing to step description */
.bo-noterow td.contentEditable {
  padding-top: 7px !important;
  padding-bottom: 7px !important;
  padding-left: 16px !important;
  padding-right: 8px !important;
  line-height: 1.55;
  vertical-align: middle !important;
}
.bo-noterow td[contenteditable="true"]:focus {
  outline: none;
  background: rgba(var(--v-theme-accent), 0.08);
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-accent), 0.4);
  border-radius: 6px;
}
.bo-noterow td[contenteditable="true"]:empty::before {
  content: 'Add a note for this section...';
  color: rgba(var(--v-theme-on-surface), 0.3);
  pointer-events: none;
}

/* Step description placeholder — hints :: shortcut. Excludes notes, which are
   step rows too: a note was being offered "Describe this step..." because this
   rule outranks the note's own placeholder on both specificity and order. */
.step-row:not(.bo-noterow) td.contentEditable[contenteditable="true"]:empty::before {
  content: 'Step description';
  color: rgba(var(--v-theme-on-surface), 0.25);
  pointer-events: none;
}

/* A note the author placed, as opposed to the section's own note below */
.step-row.bo-noterow td[contenteditable="true"]:empty::before {
  content: 'Note text';
}

/* Remove bottom border from the last row (step-row or bo-noterow) to avoid doubling with card edge.
   The arrival row is the exception: it ends a *section*, and the next age's card
   begins immediately below carrying no rule of its own, so stripping it left the
   build's biggest division unmarked. It keeps its separator. */
tbody tr:last-child:not(.age-reached-row) td {
  border-bottom: none !important;
}
/* The trailing insert line is a collapsed row, so in the editor it — not the
   last step — is what `:last-child` finds, and the last step kept a separator
   with nothing under it to separate from.
   Qualified on the insert line actually being last: in an ageUp section the
   arrival row follows it, so there *is* something under the last step to
   separate from and the rule was eating that separator. */
tbody tr:has(+ tr.ins-row--trailing:last-child) td {
  border-bottom: none !important;
}
/* …and the arrival row's rule is put back, because Vuetify strips it too.
   Excluding it from the two rules above only stops *ours* removing it; the
   table's own `tr:last-child td { border-bottom: none }` still applies, so the
   rule has to be restored rather than merely left alone. Last in the sheet on
   purpose: the two rules above have the same specificity and `!important`, so
   whichever comes last wins, and this one has to.

   It earns the exception by ending a *section*. Every other last row abuts its
   card's edge; this one abuts the next age's card, which begins immediately
   below carrying no rule of its own — so without this the build's biggest
   division was the one boundary in the list with nothing drawn on it. */
tbody tr.age-reached-row td {
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.12) !important;
}


/* Inline content icons — shared square box; variants override background only */
:deep(.icon),
:deep(.icon-ability),
:deep(.icon-tech),
:deep(.icon-military),
:deep(.icon-none),
:deep(.icon-default),
:deep(.icon-landmark) {
  display: inline-block;
  width: 36px;
  height: 36px;
  box-sizing: border-box;
  padding: 2px;
  margin: 2px 3px 2px 0;
  border-radius: 4px;
  object-fit: contain;
  vertical-align: middle;
  cursor: pointer;
}
:deep(.icon-ability)  { background: radial-gradient(circle at top center, #5c457b, #4d366e); }
:deep(.icon-tech)     { background: radial-gradient(circle at top center, #469586, #266d5b); }
:deep(.icon-military) { background: radial-gradient(circle at top center, #8b5d44, #683a22); }
:deep(.icon-none)     { background: radial-gradient(circle at top center, rgb(var(--v-theme-icon-background-highlight)), rgb(var(--v-theme-icon-background))); }
:deep(.icon-default)  { background: radial-gradient(circle at top center, #4b6382, #1d2432); }
:deep(.icon-landmark) { background: radial-gradient(circle at top center, #232e3e, #0c0f17); }

:deep(.titleIcon) {
  vertical-align: middle;
  width: auto;
  height: 28px;
}
:deep(.titleIconXs) {
  vertical-align: middle;
  width: auto;
  height: 30px;
}
.contentEditable {
  white-space: pre-wrap;
}

/* ── Mobile xs viewer (readonly) ── */
.xs-steps-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0px 16px;
}

/* Step card — surface-container token: dark=#324156, light=#E8EEF4 */
.step-card-xs {
  background: rgb(var(--v-theme-surface-container));
  border: 1px solid rgb(var(--v-theme-accent), 0.24);
  border-radius: 10px;
  padding: 10px;
  box-shadow: none;
}

/* Top bar */
.stepc-top-xs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
}

/* Time pill — gold tint with clock icon. The accent is the background, never
   the text: at #CCAA55 on this surface gold type lands near 1.85:1 against a
   4.5:1 AA floor, and the tint says "the author measured this" just as well
   while the number stays legible. Primary carries the number, because it is the
   one theme colour that flips with the theme instead of staying gold in both.
   Matches the measured age chip above. */
.step-time-xs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-accent), 0.12);
  border-radius: 6px;
  padding: 3px 9px 3px 6px;
  line-height: 1;
}
/* A moment the site worked out rather than one the author wrote. Drops the
   accent tint entirely — on a phone the pill is the loudest thing in the row,
   and a worked-out time should not carry the same weight as a measured one.

   The fill comes from --derived-fill-opacity in base.css, shared with the age
   chips directly above. It is lighter than Vuetify's tonal default on purpose;
   see the token's own note. */
.step-time-xs--derived {
  font-weight: 500;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  background: rgba(var(--v-theme-on-surface), var(--derived-fill-opacity));
}
.step-time-xs--derived img {
  opacity: 0.55;
}

.step-time-xs img {
  display: block;
  width: 15px;
  height: 15px;
  object-fit: contain;
  flex-shrink: 0;
}

/* Villager total badge */
/* Villager badge — same treatment as the time pill it sits beside: accent as
   the tint, primary for the number. Gold type on the light surface is around
   1.85:1, and these two badges share a row, so a difference between them would
   read as meaning something it does not. */
.step-pop-xs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-accent), 0.12);
  border-radius: 6px;
  padding: 3px 9px 3px 6px;
  line-height: 1;
}
.step-pop-xs img {
  display: block;
  width: 15px;
  height: 15px;
  object-fit: contain;
  flex-shrink: 0;
}

/* Resource grid */
.step-grid-xs {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
}

/* Base slot */
.slot-xs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 2px 5px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.02);
  min-height: 48px;
  text-align: center;
}
/* Square icon wrapper — isolates the img from flex sizing so object-fit fires correctly */
.slot-icon {
  width: 21px;
  height: 21px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.slot-icon img {
  display: block;
  width: 21px;
  height: 21px;
  object-fit: cover;
}

/* Slot resource tints — empty (dim) */
.slot-builder { background: rgba(94, 83, 64, 0.14); }
.slot-food    { background: rgba(136, 64, 64, 0.16); }
.slot-wood    { background: rgba(79, 107, 58, 0.16); }
.slot-gold    { background: rgba(138, 109, 46, 0.16); }
.slot-stone   { background: rgba(89, 102, 122, 0.16); }

/* Slot resource tints — has value (vivid + colored border) */
.slot-xs.slot-has.slot-builder { background: rgba(94, 83, 64, 0.42);   border-color: rgba(94, 83, 64, 0.6); }
.slot-xs.slot-has.slot-food    { background: rgba(136, 64, 64, 0.42);  border-color: rgba(136, 64, 64, 0.6); }
.slot-xs.slot-has.slot-wood    { background: rgba(79, 107, 58, 0.42);  border-color: rgba(79, 107, 58, 0.6); }
.slot-xs.slot-has.slot-gold    { background: rgba(138, 109, 46, 0.42); border-color: rgba(138, 109, 46, 0.6); }
.slot-xs.slot-has.slot-stone   { background: rgba(89, 102, 122, 0.42); border-color: rgba(89, 102, 122, 0.6); }

/* Empty slot: whole cell dimmed */
.slot-xs.slot-empty { opacity: 0.35; }

/* Slot value text */
.slot-val {
  font-size: 14px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}

/* Step description */
.step-desc-xs {
  margin-top: 8px;
  line-height: 1.5;
}
/* Chrome contenteditable appends a trailing <br> as last child of the last block —
   hide it whether it's the only child or alongside other content */
.step-desc-xs :deep(div:last-child > br:last-child),
.step-desc-xs :deep(p:last-child > br:last-child) {
  display: none;
}
/* Reset block-element margins from browser defaults and contenteditable output */
.step-desc-xs :deep(p),
.step-desc-xs :deep(div) {
  margin: 0;
}
.step-desc-xs :deep(p + p),
.step-desc-xs :deep(div + div) {
  margin-top: 2px;
}
.step-desc-xs :deep(.icon),
.step-desc-xs :deep(.icon-ability),
.step-desc-xs :deep(.icon-tech),
.step-desc-xs :deep(.icon-military),
.step-desc-xs :deep(.icon-none),
.step-desc-xs :deep(.icon-default),
.step-desc-xs :deep(.icon-landmark) {
  width: 28px !important;
  height: 28px !important;
  object-fit: cover;
}

/* ── Mobile xs edit-mode additions ── */

/* Editable timestamp span inside the time pill */
.step-time-input {
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
  min-width: 44px;
  cursor: text;
  border-radius: 3px;
  padding: 1px 2px;
  transition: background 0.12s;
}
.step-time-input:focus {
  background: rgba(var(--v-theme-accent), 0.15);
  outline: 1px solid rgba(var(--v-theme-accent), 0.45);
}

/* Editable slot value — fills the slot cell like the readonly span */
.slot-val-edit {
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  cursor: text;
  min-height: 1em;
  display: block;
  min-width: 20px;
  border-radius: 3px;
  padding: 1px 2px;
  transition: background 0.12s;
}
.slot-val-edit:focus {
  background: rgba(var(--v-theme-accent), 0.15);
  outline: 1px solid rgba(var(--v-theme-accent), 0.45);
}

/* Empty edit-mode slots: less opacity reduction so they remain easy to tap */
.slot-xs.slot-edit.slot-empty {
  opacity: 0.6;
}

/* ✕ remove button */
.step-remove-xs {
  margin-left: 2px;
  opacity: 0.6;
  flex-shrink: 0;
}

/* Description column */
.step-desc-col-xs {
  margin-top: 8px;
}

/* Edit-mode description field */
.step-desc-edit-xs {
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  outline: none;
  cursor: text;
  min-height: 24px;
  border-radius: 6px;
  padding: 4px 6px;
  transition: background 0.12s;
}
.step-desc-edit-xs:focus {
  background: rgba(var(--v-theme-accent), 0.06);
  outline: 1px solid rgba(var(--v-theme-accent), 0.35);
}

/* Action row: add-icon only, right-aligned, always in DOM (no CLS) */
.step-action-row-xs {
  display: flex;
  justify-content: flex-end;
  height: 28px;
  margin-top: 2px;
}

/* The move controls next to it are always visible, unlike this picker: the
   picker is a tool you reach for while writing a card, placement is how the card
   gets where it goes, and a placement control you have to discover is one nobody
   uses. Their sizing lives with them, in StepMoveControls.vue. */

/* Add-icon button: fades in only when description field has focus */
.step-icon-btn-xs {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s;
}
.step-desc-col-xs:focus-within ~ .step-action-row-xs .step-icon-btn-xs {
  opacity: 0.75;
  pointer-events: auto;
}

/* Between-card insert divider — 44px tall for reliable mobile tap target */
.step-insert-xs {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 16px;
  cursor: pointer;
  opacity: 0.35;
  transition: opacity 0.15s;
}
.step-insert-xs:hover,
.step-insert-xs:active {
  opacity: 1;
}
.step-insert-line-xs {
  flex: 1;
  border-top: 1px dashed rgba(var(--v-theme-accent), 0.70);
}
.step-insert-circle-xs {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(var(--v-theme-accent), 0.50);
  color: rgb(var(--v-theme-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
}

/* ── Age bracket lane (mobile xs only) ────────────────────────────────────── */
/* ── Alternatives, mobile ────────────────────────────────────────────────────
   The block's own cards. Slimmer than a step card and tinted, so the two
   markers read as annotation rather than as steps you skipped. */
.alt-card-xs {
  position: relative;
  /* Graded from the left like every other marker, rather than a flat wash: the
     desktop rows fade this way, and these badges were the last thing on either
     surface still filled evenly.

     The stops are the age badges' on this list (.14 → .04), not desktop's
     (.12 → .02 → fully transparent). Desktop can fade to nothing because its
     rows are full-bleed and have no right edge to speak of; a bordered, rounded
     card would visibly dissolve inside its own outline. Same direction, same
     idea, at the values this surface already uses — so the age badge and the
     alternatives badge are the same object in two colours. */
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-alternative), 0.14) 0%,
    rgba(var(--v-theme-alternative), 0.04) 100%
  );
  border: 1px solid rgba(var(--v-theme-alternative), 0.35);
  border-radius: 10px;
  padding: 8px 10px;
}
/* The same row an age annotation is: 42px tall, icon left at the same inset.
   "Advancing to…", "…reached" and "the paths rejoin here" are three statements
   of the same kind, and were three different shapes. */
.alt-card-xs--end {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 14px;
}
/* The reading variant puts the mark and the tabs on one line, at the age
   plate's own metrics: 42px tall, 14px inset, 10px between the icon and what it
   introduces. A block marker and an age marker are the same kind of row. */
.alt-card-xs--read {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-height: 42px;
  padding: 10px 14px;
  /* Not sticky, deliberately. The rail already says a path is being read, the
     card is one swipe away, and a bar held on screen for the length of a block
     spends real estate on a question that has been answered. Once it is chosen
     it is chosen, and this goes back to being a build. */
}
.alt-card-xs--read .alt-mark {
  /* Lines up with the first tab's text rather than the middle of the stack. */
  margin-top: 12px;
}
.alt-card-head-xs {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

/* The lane, drawn the way the age lane draws its own: one rail on one wrapper,
   spanning it top to bottom. Per-card rails could not be continuous — each is
   positioned against its own card's padding box, so a bordered card's rail sat a
   pixel right of an unbordered one's, and the insert divider is drawn at
   `opacity: 0.35`, which its rail inherited. One line, one colour, no jogs.

   Groups that are not blocks use `display: contents` so the wrapper adds nothing
   to the layout and the template keeps one shape. */
.xs-group-plain {
  display: contents;
}
.alt-bracket-xs {
  position: relative;
  display: flex;
  flex-direction: column;
  /* The same 8px the container puts between cards, since this box now sits
     between the container and them. */
  gap: 8px;
}
.alt-bracket-xs::before {
  content: '';
  position: absolute;
  /* The wrapper sits inside the container's 16px padding, so -10px puts the rail
     on x=6 — the age rail's own line, which is measured from the section edge
     instead. At the top level an alternative and an age are the same kind of
     annotation and draw the same way; only the colour says which it is. */
  left: -10px;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 2px;
  background: rgb(var(--v-theme-alternative));
}
/* Nested inside an age-up, the block steps aside so the gold rail keeps x=6 and
   the blue one reads as within it rather than as a second rail on the same line. */
.age-bracket-xs .alt-bracket-xs {
  padding-left: 8px;
}
.age-bracket-xs .alt-bracket-xs::before {
  left: -2px;
}

.age-bracket-xs {
  position: relative;
}
/* `age`, not `accent`, for the same reason the desktop lane uses it: `accent` is
   navy in the light theme — changed there because gold text on that surface is
   2.1:1 — and `alternative` is the same navy, so an age rail read off `accent`
   was indistinguishable from the alternatives rail nested inside it. This token
   is gold in both themes and is for fills and rails only; the labels below stay
   on `accent`, which is what makes them readable. */
.age-bracket-xs::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 3px;
  /* Full strength, as on desktop. This was `rgba(…, 0.55)`, which made the age
     rail the one annotation that differed from its neighbours by more than
     colour — against the rule stated on `.alt-bracket-xs::before` a few lines
     up, and against the desktop lane it is supposed to be the same mark as. */
  background: rgb(var(--v-theme-age));
  border-radius: 2px;
}
.age-ageup-row-xs {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 16px 8px;
  padding: 0 10px 0 14px;
  height: 42px;
  box-sizing: border-box;
  background: linear-gradient(90deg, rgba(var(--v-theme-age), 0.14) 0%, rgba(var(--v-theme-age), 0.04) 100%);
  /* Mobile had the gradient without an edge, so the two breakpoints drew the
     same thing differently. (Desktop's markers are plain rows now and carry no
     edge at all; this list keeps its cards, so it keeps the border.) */
  border: 1px solid rgba(var(--v-theme-age), 0.25);
  border-radius: 10px;
}
/* Every annotation on this list, in one treatment — the mobile counterpart of
   `.annot-lbl`, differing from it only in size, because this list has its own
   type scale and the table's 11px is not it. Case, weight and tracking match
   desktop, so "advancing to…", the age name and "paths rejoin" read as the same
   kind of statement on whichever surface you meet them.

   Colour still comes from `.age-annot-lbl` / `.alt-annot-lbl`, which are shared
   across both breakpoints: colour says what the annotation is about, and that
   does not change with screen width. */
.annot-lbl-xs {
  font-size: 12.5px;
  font-weight: 800;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.age-arrival-plate-xs {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 16px 4px;
  padding: 0 14px;
  height: 42px;
  box-sizing: border-box;
  background: linear-gradient(90deg, rgba(var(--v-theme-age), 0.14) 0%, rgba(var(--v-theme-age), 0.04) 100%);
  border: 1px solid rgba(var(--v-theme-age), 0.25);
  border-radius: 10px;
}
.age-arrival-icon-xs {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}


/* Gameplan/notes card — same surface and padding as step cards */
.gameplan-card-xs {
  background: rgb(var(--v-theme-surface-container));
  /* The step card's own edge. A note sits in the same column of cards, so it
     should be bounded like one — it had the fill without the outline. */
  border: 1px solid rgb(var(--v-theme-accent), 0.24);
  border-radius: 10px;
  padding: 10px;
  box-shadow: none;
}

/* Notes card label row */
.gameplan-header-xs {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-accent));
  margin-bottom: 6px;
}
/* The header paints its label accent, and the ✕ sitting in it was inheriting
   that. It is a control, not part of the label — same colour as the one on a
   step card, which inherits the card's own text colour. */
.gameplan-header-xs .step-remove-xs {
  color: rgb(var(--v-theme-on-surface));
}
</style>
