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

  <!--Mobile UI (XS)-->
  <v-card rounded="lg" class="mt-4 hidden-sm-and-up" flat>
    <v-row no-gutters align="center" justify="center">
      <v-col cols="12">
        <v-card-title v-if="section.age == 1 && section.type == 'ageUp'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
            ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_2.webp"></v-img></v-icon>
            <v-icon color="accent">mdi-arrow-up-bold</v-icon>
            Age up to Feudal Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 2 && section.type == 'age'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
            <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_2.webp"></v-img></v-icon
            >Feudal Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 2 && section.type == 'ageUp'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
            ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_3.webp"></v-img></v-icon>
            <v-icon color="accent">mdi-arrow-up-bold</v-icon>
            Age up to Castle Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 3 && section.type == 'age'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
            <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_3.webp"></v-img></v-icon
            >Castle Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 3 && section.type == 'ageUp'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
            ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_4.webp"></v-img></v-icon>
            <v-icon color="accent">mdi-arrow-up-bold</v-icon>
            Age up to Imperial Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 4 && section.type == 'age'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
            <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_4.webp"></v-img></v-icon
            >Imperial Age</v-row
          ></v-card-title
        >
      </v-col>
      <div v-if="!steps?.length && !readonly" class="text-center">
        <v-btn variant="text" color="primary" class="pt-5 pb-10" @click="addStep(0)">
          <template v-slot:prepend>
            <v-icon color="accent">mdi-plus</v-icon>
          </template>
          Add your first build step</v-btn
        >
      </div>
    </v-row>
    <template v-if="!readonly">
      <!-- Step cards (mobile edit) -->
      <div class="xs-steps-container">
        <!-- Insert point before the very first card (prepend) -->
        <div v-if="steps?.length" class="step-insert-xs" @click.stop="addStep(-1)">
          <div class="step-insert-line-xs"></div>
          <span class="step-insert-circle-xs">+</span>
          <div class="step-insert-line-xs"></div>
        </div>
        <template v-for="(item, index) in steps" :key="item._id ?? ('xs-edit-' + index)">
        <div
          class="step-card-xs"
          v-on:keyup.enter.alt="addStep(index)"
          v-on:keyup.delete.alt="removeStepConfirmationDialog = true; delteRowIndex = index;"
          @focusin="$emit('selectionChanged')"
          @mousedown="selectStep(index)"
        >
          <!-- Top bar: editable timestamp + spacer + villager total + ✕ -->
          <div class="stepc-top-xs">
            <div class="step-time-xs">
              <img src="/assets/resources/time.webp" />
              <span
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'time')"
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
            <div :class="['slot-xs', 'slot-builder', item.builders ? 'slot-has' : 'slot-empty', 'slot-edit']">
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
            <div :class="['slot-xs', 'slot-food', item.food ? 'slot-has' : 'slot-empty', 'slot-edit']">
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
            <div :class="['slot-xs', 'slot-wood', item.wood ? 'slot-has' : 'slot-empty', 'slot-edit']">
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
            <div :class="['slot-xs', 'slot-gold', item.gold ? 'slot-has' : 'slot-empty', 'slot-edit']">
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
            <div :class="['slot-xs', 'slot-stone', item.stone ? 'slot-has' : 'slot-empty', 'slot-edit']">
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
          <!-- Action row: add-icon only (desc focus) — always in DOM, no CLS -->
          <div class="step-action-row-xs">
            <v-menu :close-on-content-click="false" location="bottom">
              <template v-slot:activator="{ props: menu }">
                <v-btn
                  size="x-small"
                  variant="text"
                  color="accent"
                  v-bind="menu"
                  @mousedown.prevent="saveSelection($event)"
                  icon="mdi-image-plus"
                  class="step-icon-btn-xs"
                ></v-btn>
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
        <!-- Insert after each card: addStep(index) = insert immediately after card at this index -->
        <div class="step-insert-xs" @click.stop="addStep(index)">
          <div class="step-insert-line-xs"></div>
          <span class="step-insert-circle-xs">+</span>
          <div class="step-insert-line-xs"></div>
        </div>
        </template><!-- end v-for step -->
        <!-- Notes card inside container — gets the same 8px gap as step cards -->
        <div class="gameplan-card-xs">
          <div class="gameplan-header-xs">
            <v-icon size="13" color="accent">mdi-information-outline</v-icon>
            <span>Notes</span>
          </div>
          <div
            @paste="handlePaste"
            @focusout="updateSectionGameplan($event)"
            @mouseover="handleMouseOver($event)"
            @mouseout="handleMouseOut($event)"
            :contenteditable="true"
            class="step-desc-xs step-desc-edit-xs"
            v-html="gameplan"
          ></div>
        </div>
      </div>
    </template><!-- end edit-mode -->

    <!-- Readonly viewer: 5-slot step cards -->
    <template v-if="readonly">
      <div class="xs-steps-container">
        <div
          v-for="(item, index) in steps"
          :key="'xs-view-' + index"
          class="step-card-xs"
        >
          <!-- Top bar: timestamp + villager total -->
          <div class="stepc-top-xs">
            <div class="step-time-xs">
              <img src="/assets/resources/time.webp" />
              <span>{{ item.time }}</span>
            </div>
            <div style="flex:1"></div>
            <div class="step-pop-xs">
              <img src="/assets/resources/villager.webp" />
              <span>{{ aggregateVillagers(item) || '–' }}</span>
            </div>
          </div>
          <!-- 5-slot resource grid: Builder · Food · Wood · Gold · Stone -->
          <div class="step-grid-xs">
            <div :class="['slot-xs', 'slot-builder', item.builders ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/repair.webp" /></div>
              <span class="slot-val">{{ item.builders || '–' }}</span>
            </div>
            <div :class="['slot-xs', 'slot-food', item.food ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/food.webp" /></div>
              <span class="slot-val">{{ item.food || '–' }}</span>
            </div>
            <div :class="['slot-xs', 'slot-wood', item.wood ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/wood.webp" /></div>
              <span class="slot-val">{{ item.wood || '–' }}</span>
            </div>
            <div :class="['slot-xs', 'slot-gold', item.gold ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/gold.webp" /></div>
              <span class="slot-val">{{ item.gold || '–' }}</span>
            </div>
            <div :class="['slot-xs', 'slot-stone', item.stone ? 'slot-has' : 'slot-empty']">
              <div class="slot-icon"><img src="/assets/resources/stone.webp" /></div>
              <span class="slot-val">{{ item.stone || '–' }}</span>
            </div>
          </div>
          <!-- Description with inline icons -->
          <div
            v-if="item.description"
            class="step-desc-xs"
            v-html="item.description"
            @mouseover="handleMouseOver($event)"
            @mouseout="handleMouseOut($event)"
          ></div>
        </div>
        <!-- Notes card inside container — gets the same 8px gap as step cards -->
        <div v-if="gameplan" class="gameplan-card-xs">
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
  </v-card>

  <!--Desktop UI-->
  <v-card flat rounded="lg" class="mt-4 hidden-xs">
    <v-card flat align="center" class="mt-4"
      ><v-card-title v-if="section.age == 1 && section.type == 'ageUp'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
          ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_2.webp"></v-img></v-icon>
          <v-icon color="accent">mdi-arrow-up-bold</v-icon>
          Age up to Feudal Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 2 && section.type == 'age'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
          <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_2.webp"></v-img></v-icon>Feudal
          Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 2 && section.type == 'ageUp'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
          ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_3.webp"></v-img></v-icon>
          <v-icon color="accent">mdi-arrow-up-bold</v-icon>
          Age up to Castle Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 3 && section.type == 'age'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
          <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_3.webp"></v-img></v-icon>Castle
          Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 3 && section.type == 'ageUp'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
          ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_4.webp"></v-img></v-icon>
          <v-icon color="accent">mdi-arrow-up-bold</v-icon>
          Age up to Imperial Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 4 && section.type == 'age'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
          <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_4.webp"></v-img></v-icon
          >Imperial Age</v-row
        ></v-card-title
      >
      <v-table
        v-if="steps?.length"
        class="mx-4 align-to-widest"
        :style="
          section.age <= 1 && section.type == 'age'
            ? ''
            : 'border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity))'
        "
        style="
          border-radius: 0;
          border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
        "
      >
        <thead :style="section.age <= 1 && section.type == 'age' ? '' : 'visibility: collapse'">
          <tr>
            <th class="text-center ma-0 pa-0" style="width: 50px">
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
                <th v-bind="props" class="text-center ma-0 pa-0" style="width: 50px">
                  <v-img class="mx-auto titleIcon" src="/assets/resources/villager.webp"></v-img>
                </th>
              </template>
            </v-tooltip>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/repair.webp"></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/food.webp"></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/wood.webp"></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/gold.webp"></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/stone.webp"></v-img>
            </th>
            <th class="text-left">Description</th>
            <th v-if="!readonly" style="width: 180px" class="text-right"></th>
          </tr>
        </thead>
        <tbody ref="stepsTable">
          <tr
            v-for="(item, index) in steps"
            :key="index"
            v-on:keyup.enter.alt="addStep(index)"
            v-on:keyup.delete.alt="
              removeStepConfirmationDialog = true;
              delteRowIndex = index;
            "
            @focusin="$emit('selectionChanged')"
            @mousedown="selectStep(index)"
            @mouseover="hoverStep(index)"
            @mouseleave="unhoverStep()"
          >
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStep($event, index, 'time')"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.time"
            ></td>
            <td
              class="text-center aggregatedVillagers py-1"
              disabled
              v-html="aggregateVillagers(item)"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStep($event, index, 'builders')"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.builders ? item.builders : ''"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStep($event, index, 'food')"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.food"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStep($event, index, 'wood')"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.wood"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStep($event, index, 'gold')"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.gold"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStep($event, index, 'stone')"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.stone"
            ></td>
            <td
              @input="showAutoCompleteMenu($event, index)"
              @keyup="handleContentEditableKeyUp($event, index)"
              @click="saveSelection"
              @paste="handlePaste"
              @focusout="updateStepDescription($event, index)"
              @mouseover="handleMouseOver($event)"
              @mouseout="handleMouseOut($event)"
              :contenteditable="!readonly"
              class="contentEditable text-left py-1"
              v-html="item.description"
            ></td>
            <td v-if="!readonly" style="width: 180px" class="text-right">
              <v-row no-gutters>
                <v-col cols="4"
                  ><v-menu
                    v-if="selection && index === selectedRowIndex"
                    :close-on-content-click="false"
                    location="bottom"
                  >
                    <template v-slot:activator="{ props: menu }">
                      <v-tooltip location="top">
                        <span
                          :style="{
                            color: $vuetify.theme.current.colors.primary,
                          }"
                          >Add icon at current selection or cursor position</span
                        >
                        <template v-slot:activator="{ props: tooltip }">
                          <v-btn
                            icon="mdi-image-plus"
                            color="accent"
                            v-bind="mergeProps(menu, tooltip)"
                            variant="text"
                          ></v-btn>
                        </template>
                      </v-tooltip>
                    </template>
                    <v-card flat rounded="lg" class="mt-4" width="700px">
                      <IconSelector
                        @iconSelected="
                          (iconPath, tooltip, iconClass) =>
                            handleIconSelectorIconSelected(iconPath, tooltip, iconClass)
                        "
                        :civ="civ"
                      ></IconSelector>
                    </v-card> </v-menu
                ></v-col>
                <v-col cols="4"
                  ><v-tooltip location="top">
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Remove current step (ALT + DEL)</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        v-if="index === hoverRowIndex"
                        variant="text"
                        color="accent"
                        @click="
                          removeStepConfirmationDialog = true;
                          delteRowIndex = index;
                        "
                        icon="mdi-delete"
                      >
                      </v-btn>
                    </template> </v-tooltip
                ></v-col>
                <v-col cols="4"
                  ><v-tooltip location="top">
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Add new step below (ALT + ENTER)</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        v-show="index === hoverRowIndex"
                        variant="text"
                        color="accent"
                        @click="addStep(index)"
                        icon="mdi-plus"
                      >
                      </v-btn>
                    </template> </v-tooltip></v-col
              ></v-row>
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-table
        v-if="gameplan || !readonly"
        class="mx-4"
        :class="readonly ? 'my-4' : ''"
        style="border-radius: 0"
        :style="
          !readonly
            ? 'border-bottom: thin solid rgba(var(--v-border-color), var(--v-border-opacity)); '
            : ''
        "
      >
        <tbody>
          <tr class="mx-4 py-8" @focusin="$emit('selectionChanged')" @mousedown="selectStep()">
            <td style="width: 150px" class="gameplanHeader">
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Gameplan or notes for this build order section</span
                >
                <template v-slot:activator="{ props }">
                  <span v-bind="props">
                    <v-icon color="accent" class="mx-auto titleIcon"
                      >mdi-information-outline</v-icon
                    ></span
                  >
                </template>
              </v-tooltip>
            </td>
            <td
              ref="gameplanContentEditable"
              @input="showAutoCompleteMenu($event)"
              @keyup="handleContentEditableKeyUp($event)"
              @click="saveSelection($event)"
              @paste="handlePaste"
              @focusout="updateSectionGameplan()"
              @mouseover="handleMouseOver($event)"
              @mouseout="handleMouseOut($event)"
              :contenteditable="!readonly"
              class="contentEditable text-left py-1"
              v-html="gameplan"
            ></td>
            <td v-if="!readonly" style="width: 180px" class="text-right">
              <v-menu
                v-if="selection && gameplanSelected"
                :close-on-content-click="false"
                location="bottom"
              >
                <template v-slot:activator="{ props: menu }">
                  <v-tooltip location="top">
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Add icon at current selection or cursor position</span
                    >
                    <template v-slot:activator="{ props: tooltip }">
                      <v-btn
                        icon="mdi-image-plus"
                        color="accent"
                        v-bind="mergeProps(menu, tooltip)"
                        variant="text"
                      ></v-btn>
                    </template>
                  </v-tooltip>
                </template>
                <v-card flat rounded="lg" class="mt-4" width="700px">
                  <IconSelector
                    @iconSelected="
                      (iconPath, tooltip, iconClass) =>
                        handleIconSelectorIconSelected(iconPath, tooltip, iconClass)
                    "
                    :civ="civ"
                  ></IconSelector>
                </v-card>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
    <div v-if="!steps?.length && !readonly" class="text-center">
      <v-btn variant="text" color="accent" class="pt-5 pb-10" @click="addStep(0)"
        >Add your first build step
        <template v-slot:prepend>
          <v-icon color="accent">mdi-plus</v-icon>
        </template></v-btn
      >
    </div>
  </v-card>
</template>

<script>
//External
import { watch, ref, reactive, mergeProps, onMounted, nextTick } from "vue";

//Components
import IconSelector from "@/components/builds/IconSelector.vue";
import IconAutoCompleteMenu from "@/components/builds/IconAutoCompleteMenu.vue";
import IconToolTip from "@/components/builds/IconToolTip.vue";

//Composables
import iconService from "@/composables/builds/icons/iconService.js";
import { sanitizeStepDescription } from "@/composables/builds/buildOrderValidator.js";
import { aggregateVillagers } from "@/composables/builds/villagerAggregator.js";
import {
  addAutocompleteIcon,
  updateSearchText,
  placeCaretAtEnd,
} from "@/composables/builds/contentEditableHelper.js";

export default {
  name: "BuildOrderSectioncontentEditable",
  props: ["section", "readonly", "civ", "focus"],
  emits: ["stepsChanged", "selectionChanged", "textChanged", "gameplanChanged"],
  components: { IconSelector, IconAutoCompleteMenu, IconToolTip },
  setup(props, context) {
    //Hacky deep copy of object since working on the reference broke the current selection
    //Copy needs to be kept in sync and is used only for the description field :(
    const steps = reactive(JSON.parse(JSON.stringify(props.section.steps)));
    const stepsCopy = reactive(JSON.parse(JSON.stringify(props.section.steps)));
    const readonly = props.readonly;
    // Monotonic counter for stable v-for keys — never persisted, client-side only.
    let _nextStepId = Date.now();
    const hoverRowIndex = ref(null);
    const selectedRowIndex = ref(null);
    const delteRowIndex = ref(null);
    const selection = ref(null);
    const stepsTable = ref(null);
    const removeStepConfirmationDialog = ref(false);
    const activeStepIndex = ref(null);
    const descriptionColumnIndex = 7;
    var civIconService = iconService(props.civ);

    //Autocomplete
    const searchText = ref("");
    const autocompletePos = ref(0);

    //Gameplan
    const gameplan = ref(`${props.section.gameplan ? props.section.gameplan : ""}`);
    const gameplanCopy = ref(`${props.section.gameplan ? props.section.gameplan : ""}`);
    const gameplanSelected = ref(false);
    const gameplanContentEditable = ref(null);

    //Custom Tooltips
    const showToolTip = ref(false);
    const toolTipPos = ref(0);
    const toolTipModel = ref({});
    const toolTipElement = ref(null);

    async function handleMouseOver($event) {
      if ($event.target.className.includes("icon-")) {
        //set model
        var imageSource = $event.target.getAttribute("src");
        imageSource = imageSource.replace("https://aoe4guides.com", "");
        const iconMetaData = civIconService.getIconFromImgPath(imageSource);
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

      //Sanitize since inline icon replacement only works with <br>, NOT with \n, replace PNG by WEBP
      steps.forEach((element) => {
        element.description = element.description
          ?.replace(/\n/gm, "<br>")
          .replace(/\.png\b/gi, ".webp");
      });

      stepsCopy.forEach((element) => {
        element.description = element.description
          ?.replace(/\n/gm, "<br>")
          .replace(/\.png\b/gi, ".webp");
      });

      //Replace PNG by WEBP
      gameplan.value = gameplan.value
          ?.replace(/\.png\b/gi, ".webp");
      

      //Force firefox to use BR instead of adding DIVs
      document.execCommand("defaultParagraphSeparator", false, "br");
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

    const showAutoCompleteMenu = (event, index) => {
      var contentEditable = null;
      if (index != null) {
        contentEditable = stepsTable.value.rows[index].cells[descriptionColumnIndex];
      } else {
        contentEditable = gameplanContentEditable.value;
      }

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
        contentEditable =
          stepsTable.value.rows[activeStepIndex.value].cells[descriptionColumnIndex];
      } else {
        contentEditable = gameplanContentEditable.value;
      }

      addAutocompleteIcon(contentEditable, iconPath, tooltip, iconClass);
      searchText.value = null;
    }

    const handleContentEditableKeyUp = (event, index) => {
      var contentEditable = null;
      if (index != null) {
        contentEditable = stepsTable.value.rows[index].cells[descriptionColumnIndex];
      } else {
        contentEditable = gameplanContentEditable.value;
      }
      const keyCode = event.which;
      const allIcons = civIconService.getIcons();

      updateSearchText(contentEditable, searchText, keyCode, allIcons);

      activeStepIndex.value = index;
      saveSelection(event);
    };

    const handleIconSelectorIconSelected = (iconPath, tooltipText, iconClass) => {
      restoreSelection();
      iconClass = iconClass ? "icon-" + iconClass : "icon";

      const img =
        '<img src="' + iconPath + '" class=' + iconClass + ' title="' + tooltipText + '"><\/img>';

      document.execCommand("insertHTML", false, img);
      saveSelection();
    };

    const updateStep = (event, index, propertyName) => {
      steps[index][propertyName] = event.target.innerHTML;
      stepsCopy[index][propertyName] = event.target.innerHTML;

      steps[index].description = stepsCopy[index].description;
      gameplan.value = gameplanCopy.value;

      aggregateVillagers(steps[index]);

      context.emit("stepsChanged", steps);
    };

    const updateSectionGameplan = (event) => {
      gameplanCopy.value = event
        ? event.target.innerHTML
        : (gameplanContentEditable.value?.innerHTML ?? '');
      context.emit("gameplanChanged", gameplanCopy.value);
    };

    const updateStepDescription = (event, index) => {
      stepsCopy[index].description = event.target.innerHTML;
      context.emit("stepsChanged", stepsCopy);
    };
    const addStep = (index) => {
      var table = stepsTable.value;
      if (table) {
        //Pull display text into model (desktop)
        for (var i = 0, row; (row = table.rows[i]); i++) {
          steps[i].description = row.cells[descriptionColumnIndex].innerHTML;
        }
      } else {
        // Mobile: stepsCopy holds the user-typed descriptions; sync them into steps
        // so Vue can diff cards correctly after the splice and update DOM positions.
        for (var i = 0; i < steps.length; i++) {
          steps[i].description = stepsCopy[i].description;
        }
      }

      //Add row
      const addIndex = index + 1;
      const newId = ++_nextStepId;
      stepsCopy.splice(addIndex, 0, {
        time: "",
        villagers: "",
        builders: "",
        food: "",
        wood: "",
        gold: "",
        stone: "",
        description: "",
        _id: newId,
      });
      steps.splice(addIndex, 0, {
        time: "",
        villagers: "",
        builders: "",
        food: "",
        wood: "",
        gold: "",
        stone: "",
        description: "",
        _id: newId,
      });

      if (table) {
        //Sync display text again with model
        for (var i = 0, row; (row = table.rows[i]); i++) {
          row.cells[descriptionColumnIndex].innerHTML = steps[i].description;
        }
      }
      context.emit("stepsChanged", steps);
    };

    const removeStep = (currentIndex) => {
      var table = stepsTable.value;
      if (table) {
        //Pull display text into model (desktop)
        for (var i = 0, row; (row = table.rows[i]); i++) {
          steps[i].description = row.cells[descriptionColumnIndex].innerHTML;
        }
      } else {
        // Mobile: sync descriptions from stepsCopy so Vue can diff after splice
        for (var i = 0; i < steps.length; i++) {
          steps[i].description = stepsCopy[i].description;
        }
      }

      //remove row
      stepsCopy.splice(currentIndex, 1);
      steps.splice(currentIndex, 1);

      context.emit("stepsChanged", steps);
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
    };

    const handleResourceInput = async (e) => {
      if (e.data == "-") {
        var contentEditable = e.target;
        //prevent break on hyphen
        contentEditable.innerHTML = contentEditable.innerHTML.replace("-", "&#8209;");

        //updating innerHTML sets cursor to start, this is a workaround to set caret to end
        placeCaretAtEnd(contentEditable);
      }

      context.emit("textChanged");
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
      updateStep,
      updateStepDescription,
      removeStep,
      addStep,
      selectStep,
      hoverStep,
      unhoverStep,
      saveSelection,
      restoreSelection,
      handleIconSelectorIconSelected,
      activeStepIndex,
      handleAutoCompleteMenuIconSelected,
      //Autocomplete
      searchText,
      autocompletePos,
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
}

table tbody tr td:nth-child(4) {
  background: #ff000034;
}

table tbody tr td:nth-child(5) {
  background: #75400c5b;
}

table tbody tr td:nth-child(6) {
  background: #edbe003e;
}

table tbody tr td:nth-child(7) {
  background: #7a7a7b69;
}

td:empty {
  line-height: 52px;
}

:deep(.icon) {
  vertical-align: middle;
  height: auto;
  width: 48px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  cursor: pointer;
}

:deep(.icon-ability) {
  vertical-align: middle;
  height: auto;
  width: 48px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #5c457b, #4d366e);
  cursor: pointer;
}

:deep(.icon-ability + img) {
  margin: 2px;
}

:deep(.icon-tech) {
  vertical-align: middle;
  height: auto;
  width: 48px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #469586, #266d5b);
  cursor: pointer;
}
:deep(.icon-tech + img) {
  margin: 2px;
}

:deep(.icon-military) {
  vertical-align: middle;
  height: auto;
  width: 48px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #8b5d44, #683a22);
  cursor: pointer;
}
:deep(.icon-military + img) {
  margin: 2px;
}

:deep(.icon-none) {
  vertical-align: middle;
  width: auto;
  height: 48px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(
    circle at top center,
    rgb(var(--v-theme-icon-background-highlight)),
    rgb(var(--v-theme-icon-background))
  );
  cursor: pointer;
}
:deep(.icon-none + img) {
  margin: 2px;
}

:deep(.icon-default) {
  vertical-align: middle;
  height: auto;
  width: 48px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #4b6382, #1d2432);
  cursor: pointer;
}
:deep(.icon-default + img) {
  margin: 2px;
}

:deep(.icon-landmark) {
  vertical-align: middle;
  height: auto;
  width: 48px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #232e3e, #0c0f17);
  cursor: pointer;
}
:deep(.icon-landmark + img) {
  margin: 2px;
}

:deep(.titleIcon) {
  vertical-align: middle;
  width: auto;
  height: 40px;
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

/* Time pill — gold highlight with clock icon */
.step-time-xs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-accent));
  background: rgba(var(--v-theme-accent), 0.12);
  border-radius: 6px;
  padding: 3px 9px 3px 6px;
  line-height: 1;
}
.step-time-xs img {
  display: block;
  width: 15px;
  height: 15px;
  object-fit: contain;
  flex-shrink: 0;
}

/* Villager total badge */
.step-pop-xs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-accent));
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
  height: 44px;
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
  border-top: 1.5px dashed rgba(var(--v-theme-accent), 0.8);
}
.step-insert-circle-xs {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(var(--v-theme-accent), 0.18);
  color: rgb(var(--v-theme-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1;
  user-select: none;
}


/* Gameplan/notes card — same surface and padding as step cards */
.gameplan-card-xs {
  background: rgb(var(--v-theme-surface-container));
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
</style>
