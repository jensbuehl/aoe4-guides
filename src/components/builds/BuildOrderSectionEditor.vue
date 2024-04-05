<template>
  <!--Common delete confirmation dialog-->
  <v-dialog v-model="removeStepConfirmationDialog" width="auto">
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
    <span
      ref="toolTipElement"
      :style="{
        color: $vuetify.theme.current.colors.primary,
      }"
      >My Custom Tooltip!</span
    >
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
        <v-row
          v-if="section.age <= 1 && section.type == 'age'"
          no-gutters
          align="center"
          justify="center"
        >
          <v-col cols="3">
            <v-img class="titleIconXs ma-2" src="/assets/resources/time.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs ma-2" src="/assets/resources/villager.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs ma-2" src="/assets/resources/repair.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs ma-2" src="/assets/resources/food.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs ma-2" src="/assets/resources/wood.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs ma-2" src="/assets/resources/gold.png"></v-img>
          </v-col>
          <v-col>
            <v-img class="titleIconXs ma-2" src="/assets/resources/stone.png"></v-img>
          </v-col>
        </v-row>
        <v-card-title v-if="section.age == 1 && section.type == 'ageUp'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
            ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_2.png"></v-img></v-icon>
            <v-icon color="accent">mdi-arrow-up-bold</v-icon>
            Age up to Feudal Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 2 && section.type == 'age'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
            <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_2.png"></v-img></v-icon>Feudal
            Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 2 && section.type == 'ageUp'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
            ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_3.png"></v-img></v-icon>
            <v-icon color="accent">mdi-arrow-up-bold</v-icon>
            Age up to Castle Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 3 && section.type == 'age'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
            <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_3.png"></v-img></v-icon>Castle
            Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 3 && section.type == 'ageUp'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
            ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_4.png"></v-img></v-icon>
            <v-icon color="accent">mdi-arrow-up-bold</v-icon>
            Age up to Imperial Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 4 && section.type == 'age'">
          <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
            <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_4.png"></v-img></v-icon
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
    <v-row
      no-gutters
      justify="center"
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
      <v-divider></v-divider>
      <v-col cols="12">
        <v-row no-gutters justify="center">
          <v-col cols="3">
            <v-card flat rounded="0"
              ><v-card-text
                style="white-space: break-spaces"
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'time')"
                @input="handleResourceInput"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.time"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card flat align="center" rounded="0"
              ><v-card-text
                class="text-center"
                disabled
                v-html="aggregateVillagers(index)"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card flat rounded="0" class="fill-height"
              ><v-card-text
                style="white-space: break-spaces"
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'builders')"
                @input="handleResourceInput"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.builders ? item.builders : ''"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card
              variant="flat"
              rounded="0"
              class="fill-height"
              style="background-color: #ff000034"
              ><v-card-text
                style="white-space: break-spaces"
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'food')"
                @input="handleResourceInput"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.food"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card
              variant="flat"
              rounded="0"
              class="fill-height"
              style="background-color: #75400c5b"
              ><v-card-text
                style="white-space: break-spaces"
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'wood')"
                @input="handleResourceInput"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.wood"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card
              variant="flat"
              rounded="0"
              class="fill-height"
              style="background-color: #edbe003e"
              ><v-card-text
                style="white-space: break-spaces"
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'gold')"
                @input="handleResourceInput"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.gold"
              ></v-card-text
            ></v-card>
          </v-col>
          <v-col>
            <v-card
              variant="flat"
              rounded="0"
              class="fill-height"
              style="background-color: #7a7a7b69"
              ><v-card-text
                style="white-space: break-spaces"
                @paste="handlePaste"
                @focusout="updateStep($event, index, 'stone')"
                @input="handleResourceInput"
                :contenteditable="!readonly"
                class="text-center"
                v-html="item.stone"
              ></v-card-text
            ></v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-divider></v-divider>
      <v-col cols="12" class="px-2 my-2 justify-center align-center">
        <v-card flat rounded="0">
          <v-table width="100%">
            <tbody>
              <tr>
                <td
                  style="white-space: break-spaces"
                  @keyup="saveSelection"
                  @click="saveSelection"
                  @paste="handlePaste"
                  @focusout="updateStepDescription($event, index)"
                  :contenteditable="!readonly"
                  class="text-center"
                  v-html="item.description"
                ></td>
              </tr>
            </tbody> </v-table
        ></v-card>
      </v-col>
      <v-col
        v-if="!readonly && selection && index === selectedRowIndex"
        cols="auto"
        class="justify-center align-center"
      >
        <v-card flat>
          <div class="text-right">
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
                  <v-card flat rounded="lg" class="mt-4" width="350px">
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
            ></v-row></div
        ></v-card>
      </v-col>
    </v-row>
    <v-row no-gutters v-if="gameplan">
      <v-col cols="12" class="px-2 my-2 justify-center align-center">
        <v-card flat rounded="0">
          <v-table width="100%" style="border: none">
            <tbody>
              <tr style="border: none">
                <td class="text-center gameplanHeader" style="border: none">
                  <v-tooltip location="top">
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Gameplan or notes for this build order section</span
                    >
                    <template v-slot:activator="{ props }">
                      <span v-bind="props"
                        >Notes
                        <v-icon color="accent" class="mx-auto titleIcon"
                          >mdi-information-outline</v-icon
                        ></span
                      >
                    </template>
                  </v-tooltip>
                </td>
              </tr>
              <tr style="border: none">
                <td
                  style="white-space: break-spaces; border: none"
                  class="text-center"
                  v-html="gameplan"
                ></td>
              </tr>
            </tbody> </v-table
        ></v-card>
      </v-col>
    </v-row>
  </v-card>

  <!--Desktop UI-->
  <v-card flat rounded="lg" class="mt-4 hidden-xs">
    <v-card flat align="center" class="mt-4"
      ><v-card-title v-if="section.age == 1 && section.type == 'ageUp'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
          ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_2.png"></v-img></v-icon>
          <v-icon color="accent">mdi-arrow-up-bold</v-icon>
          Age up to Feudal Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 2 && section.type == 'age'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
          <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_2.png"></v-img></v-icon>Feudal
          Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 2 && section.type == 'ageUp'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
          ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_3.png"></v-img></v-icon>
          <v-icon color="accent">mdi-arrow-up-bold</v-icon>
          Age up to Castle Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 3 && section.type == 'age'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
          <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_3.png"></v-img></v-icon>Castle
          Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 3 && section.type == 'ageUp'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start"
          ><v-icon class="mr-2"><v-img src="/assets/pictures/age/age_4.png"></v-img></v-icon>
          <v-icon color="accent">mdi-arrow-up-bold</v-icon>
          Age up to Imperial Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 4 && section.type == 'age'">
        <v-row style="font-weight: inherit" no-gutters align="center" justify="start">
          <v-icon class="mr-2"><v-img src="/assets/pictures/age/age_4.png"></v-img></v-icon>Imperial
          Age</v-row
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
              <v-img class="mx-auto titleIcon" src="/assets/resources/time.png"></v-img>
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
                  <v-img class="mx-auto titleIcon" src="/assets/resources/villager.png"></v-img>
                </th>
              </template>
            </v-tooltip>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/repair.png"></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/food.png"></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/wood.png"></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/gold.png"></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img class="mx-auto titleIcon" src="/assets/resources/stone.png"></v-img>
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
              v-html="aggregateVillagers(index)"
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
                  <span v-bind="props"
                    >Notes
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
              @click="saveSelection"
              @paste="handlePaste"
              @focusout="updateSectionGameplan()"
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

//Composables
import iconService from "@/composables/builds/iconService.js";
import { sanitizeStepDescription } from "@/composables/builds/buildOrderValidator.js";
import {
  addAutocompleteIcon,
  updateSearchText,
  placeCaretAtEnd,
} from "@/composables/builds/contentEditableHelper.js";

export default {
  name: "BuildOrderSectioncontentEditable",
  props: ["section", "readonly", "civ", "focus"],
  emits: ["stepsChanged", "selectionChanged", "textChanged", "gameplanChanged"],
  components: { IconSelector, IconAutoCompleteMenu },
  setup(props, context) {
    //Hacky deep copy of object since working on the reference broke the current selection
    //Copy needs to be kept in sync and is used only for the description field :(
    const steps = reactive(JSON.parse(JSON.stringify(props.section.steps)));
    const stepsCopy = reactive(JSON.parse(JSON.stringify(props.section.steps)));
    const readonly = props.readonly;
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
    const showToolTip = ref(true);
    const toolTipPos = ref(0);
    const toolTipElement = ref(null);

    async function handleMouseOver($event) {
      if ($event.target.className.includes("icon-")) {
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
          rect.y - bodyRect.y - toolTipElement.value.offsetHeight - 40,
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
      //Sanitize since inline icon replacement only works with <br>, NOT with \n
      steps.forEach((element) => {
        element.description = element.description?.replace(/\n/gm, "<br>");
      });
      stepsCopy.forEach((element) => {
        element.description = element.description?.replace(/\n/gm, "<br>");
      });
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

    const saveSelection = () => {
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
      saveSelection();
    };

    const handleIconSelectorIconSelected = (iconPath, tooltipText, iconClass) => {
      restoreSelection();
      iconClass = iconClass ? "icon-" + iconClass : "icon";

      const img =
        '<img src="' + iconPath + '" class=' + iconClass + ' title="' + tooltipText + '"><\/img>';

      document.execCommand("insertHTML", false, img);
      saveSelection();
    };

    const aggregateVillagers = (index) => {
      const step = steps[index];
      const builders = parseInt(step.builders) || 0;
      const food = parseInt(step.food) || 0;
      const wood = parseInt(step.wood) || 0;
      const gold = parseInt(step.gold) || 0;
      const stone = parseInt(step.stone) || 0;

      return builders + food + wood + gold + stone || "";
    };

    const updateStep = (event, index, propertyName) => {
      steps[index][propertyName] = event.target.innerHTML;
      stepsCopy[index][propertyName] = event.target.innerHTML;

      steps[index].description = stepsCopy[index].description;
      gameplan.value = gameplanCopy.value;

      aggregateVillagers(index);

      context.emit("stepsChanged", steps);
    };

    const updateSectionGameplan = () => {
      gameplanCopy.value = gameplanContentEditable.value.innerHTML;
      context.emit("gameplanChanged", gameplanCopy.value);
    };

    const updateStepDescription = (event, index) => {
      stepsCopy[index].description = event.target.innerHTML;
      context.emit("stepsChanged", stepsCopy);
    };
    const addStep = (index) => {
      var table = stepsTable.value;
      if (table) {
        //Pull display text into model
        for (var i = 0, row; (row = table.rows[i]); i++) {
          steps[i].description = row.cells[descriptionColumnIndex].innerHTML;
        }
      }

      //Add row
      const addIndex = index + 1;
      stepsCopy.splice(addIndex, 0, {
        time: "",
        villagers: "",
        builders: "",
        food: "",
        wood: "",
        gold: "",
        stone: "",
        description: "",
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
        //Pull display text into model
        for (var i = 0, row; (row = table.rows[i]); i++) {
          steps[i].description = row.cells[descriptionColumnIndex].innerHTML;
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
}

:deep(.icon-ability) {
  vertical-align: middle;
  height: auto;
  width: 48px;
  margin: 2px 2px 2px 0px;
  border-radius: 4px;
  background: radial-gradient(circle at top center, #5c457b, #4d366e);
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
</style>
