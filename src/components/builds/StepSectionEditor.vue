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
        <v-btn color="error" block @click="removeStep(delteRowIndex)"
          >Delete</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!--Do not copy images from age4builder dialog-->
  <v-dialog v-model="pasteImagesInfoDialog" width="auto">
    <v-card rounded="lg" class="text-center primary" flat>
      <v-card-title>Unsupported Icon</v-card-title>
      <v-card-text>
        Unsupported icon format from age4builder detected.<br />
        Please consider using the export/import feature to transfer build
        orders.
      </v-card-text>
      <v-card-actions>
        <v-btn color="error" block @click="pasteImagesInfoDialog = false"
          >Close</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!--Mobile UI (XS)-->
  <v-card rounded="lg" class="mt-4 hidden-sm-and-up" flat>
    <div v-if="!steps?.length && !readonly" class="text-center">
      <v-btn
        variant="text"
        color="primary"
        class="pt-5 pb-10"
        @click="addStep(0)"
      >
        <template v-slot:prepend>
          <v-icon color="accent">mdi-plus</v-icon>
        </template>
        Add your first build step</v-btn
      >
    </div>
    <v-row v-if="steps?.length" no-gutters align="center" justify="center">
      <v-col cols="12">
        <v-row
          v-if="section.age <= 1 && section.type == 'age'"
          no-gutters
          align="center"
          justify="center"
        >
          <v-col cols="3">
            <v-img
              class="titleIconXs ma-2"
              src="/assets/resources/time.png"
            ></v-img>
          </v-col>
          <v-col>
            <v-img
              class="titleIconXs ma-2"
              src="/assets/resources/villager.png"
            ></v-img>
          </v-col>
          <v-col>
            <v-img
              class="titleIconXs ma-2"
              src="/assets/resources/repair.png"
            ></v-img>
          </v-col>
          <v-col>
            <v-img
              class="titleIconXs ma-2"
              src="/assets/resources/food.png"
            ></v-img>
          </v-col>
          <v-col>
            <v-img
              class="titleIconXs ma-2"
              src="/assets/resources/wood.png"
            ></v-img>
          </v-col>
          <v-col>
            <v-img
              class="titleIconXs ma-2"
              src="/assets/resources/gold.png"
            ></v-img>
          </v-col>
          <v-col>
            <v-img
              class="titleIconXs ma-2"
              src="/assets/resources/stone.png"
            ></v-img>
          </v-col>
        </v-row>
        <v-card-title v-if="section.age == 1 && section.type == 'ageUp'">
          <v-row
            style="font-weight: inherit"
            no-gutters
            align="center"
            justify="start"
            ><v-icon class="mr-2"
              ><v-img src="/assets/pictures/age/age_2.png"></v-img
            ></v-icon>
            <v-icon color="accent">mdi-arrow-up-bold</v-icon>
            Advance to Feudal Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 2 && section.type == 'age'">
          <v-row
            style="font-weight: inherit"
            no-gutters
            align="center"
            justify="start"
          >
            <v-icon class="mr-2"
              ><v-img src="/assets/pictures/age/age_2.png"></v-img></v-icon
            >Feudal Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 2 && section.type == 'ageUp'">
          <v-row
            style="font-weight: inherit"
            no-gutters
            align="center"
            justify="start"
            ><v-icon class="mr-2"
              ><v-img src="/assets/pictures/age/age_3.png"></v-img
            ></v-icon>
            <v-icon color="accent">mdi-arrow-up-bold</v-icon>
            Advance to Castle Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 3 && section.type == 'age'">
          <v-row
            style="font-weight: inherit"
            no-gutters
            align="center"
            justify="start"
          >
            <v-icon class="mr-2"
              ><v-img src="/assets/pictures/age/age_3.png"></v-img></v-icon
            >Castle Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 3 && section.type == 'ageUp'">
          <v-row
            style="font-weight: inherit"
            no-gutters
            align="center"
            justify="start"
            ><v-icon class="mr-2"
              ><v-img src="/assets/pictures/age/age_4.png"></v-img
            ></v-icon>
            <v-icon color="accent">mdi-arrow-up-bold</v-icon>
            Advance to Imperial Age</v-row
          ></v-card-title
        ><v-card-title v-if="section.age == 4 && section.type == 'age'">
          <v-row
            style="font-weight: inherit"
            no-gutters
            align="center"
            justify="start"
          >
            <v-icon class="mr-2"
              ><v-img src="/assets/pictures/age/age_4.png"></v-img></v-icon
            >Imperial Age</v-row
          ></v-card-title
        >
      </v-col>
    </v-row>
    <v-row
      no-gutters
      justify="center"
      v-for="(item, index) in steps"
      :key="index"
      v-on:keyup.enter.alt="addStep(index)"
      v-on:keyup.delete.alt="
        dialog = true;
        delteRowIndex = index;
        delteRowIndex = index;
      "
      @focusin="$emit('selectionChanged')"
      @mousedown="selectRow(index)"
      @mouseover="hoverItem(index)"
      @mouseleave="unhoverItem()"
    >
      <v-divider></v-divider>
      <v-col cols="12">
        <v-row no-gutters justify="center">
          <v-col cols="3">
            <v-card flat rounded="0"
              ><v-card-text
                style="white-space: break-spaces"
                @paste="handlePaste"
                @focusout="updateStepTime($event, index)"
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
                @focusout="updateStepBuilders($event, index)"
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
                @focusout="updateStepFood($event, index)"
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
                @focusout="updateStepWood($event, index)"
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
                @focusout="updateStepGold($event, index)"
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
                @focusout="updateStepStone($event, index)"
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
                          handleIconSelected(iconPath, tooltip, iconClass)
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
  </v-card>

  <!--Desktop UI-->
  <v-card flat rounded="lg" class="mt-4 hidden-xs">
    <div v-if="!steps?.length && !readonly" class="text-center">
      <v-btn
        variant="text"
        color="accent"
        class="pt-5 pb-10"
        @click="addStep(0)"
        >Add your first build step
        <template v-slot:prepend>
          <v-icon color="accent">mdi-plus</v-icon>
        </template></v-btn
      >
    </div>

    <v-card flat align="center" class="mt-4"
      ><v-card-title v-if="section.age == 1 && section.type == 'ageUp'">
        <v-row
          style="font-weight: inherit"
          no-gutters
          align="center"
          justify="start"
          ><v-icon class="mr-2"
            ><v-img src="/assets/pictures/age/age_2.png"></v-img
          ></v-icon>
          <v-icon color="accent">mdi-arrow-up-bold</v-icon>
          Advance to Feudal Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 2 && section.type == 'age'">
        <v-row
          style="font-weight: inherit"
          no-gutters
          align="center"
          justify="start"
        >
          <v-icon class="mr-2"
            ><v-img src="/assets/pictures/age/age_2.png"></v-img></v-icon
          >Feudal Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 2 && section.type == 'ageUp'">
        <v-row
          style="font-weight: inherit"
          no-gutters
          align="center"
          justify="start"
          ><v-icon class="mr-2"
            ><v-img src="/assets/pictures/age/age_3.png"></v-img
          ></v-icon>
          <v-icon color="accent">mdi-arrow-up-bold</v-icon>
          Advance to Castle Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 3 && section.type == 'age'">
        <v-row
          style="font-weight: inherit"
          no-gutters
          align="center"
          justify="start"
        >
          <v-icon class="mr-2"
            ><v-img src="/assets/pictures/age/age_3.png"></v-img></v-icon
          >Castle Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 3 && section.type == 'ageUp'">
        <v-row
          style="font-weight: inherit"
          no-gutters
          align="center"
          justify="start"
          ><v-icon class="mr-2"
            ><v-img src="/assets/pictures/age/age_4.png"></v-img
          ></v-icon>
          <v-icon color="accent">mdi-arrow-up-bold</v-icon>
          Advance to Imperial Age</v-row
        ></v-card-title
      ><v-card-title v-if="section.age == 4 && section.type == 'age'">
        <v-row
          style="font-weight: inherit"
          no-gutters
          align="center"
          justify="start"
        >
          <v-icon class="mr-2"
            ><v-img
              src="http://localhost:5173/assets/pictures/age/age_4.png"
            ></v-img></v-icon
          >Imperial Age</v-row
        ></v-card-title
      >
      <v-table
        v-if="steps?.length"
        class="mx-4 mb-4 align-to-widest"
        :style="
          section.age <= 1 && section.type == 'age'
            ? ''
            : 'border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity))'
        "
        style="
          border-radius: 0;
          border-bottom: thin solid
            rgba(var(--v-border-color), var(--v-border-opacity));
        "
      >
        <thead
          :style="
            section.age <= 1 && section.type == 'age'
              ? ''
              : 'visibility: collapse'
          "
        >
          <tr>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img
                class="mx-auto titleIcon"
                src="/assets/resources/time.png"
              ></v-img>
            </th>
            <v-tooltip location="top">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Villager Count</span
              >
              <template v-slot:activator="{ props }">
                <th
                  v-bind="props"
                  class="text-center ma-0 pa-0"
                  style="width: 50px"
                >
                  <v-img
                    class="mx-auto titleIcon"
                    src="/assets/resources/villager.png"
                  ></v-img>
                </th>
              </template>
            </v-tooltip>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img
                class="mx-auto titleIcon"
                src="/assets/resources/repair.png"
              ></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img
                class="mx-auto titleIcon"
                src="/assets/resources/food.png"
              ></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img
                class="mx-auto titleIcon"
                src="/assets/resources/wood.png"
              ></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img
                class="mx-auto titleIcon"
                src="/assets/resources/gold.png"
              ></v-img>
            </th>
            <th class="text-center ma-0 pa-0" style="width: 50px">
              <v-img
                class="mx-auto titleIcon"
                src="/assets/resources/stone.png"
              ></v-img>
            </th>
            <th class="text-left">Description</th>
            <th v-if="!readonly" class="text-right"></th>
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
            @mousedown="selectRow(index)"
            @mouseover="hoverItem(index)"
            @mouseleave="unhoverItem()"
          >
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStepTime($event, index)"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.time"
            ></td>
            <td
              class="text-center py-1"
              disabled
              v-html="aggregateVillagers(index)"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStepBuilders($event, index)"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.builders ? item.builders : ''"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStepFood($event, index)"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.food"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStepWood($event, index)"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.wood"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStepGold($event, index)"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.gold"
            ></td>
            <td
              style="white-space: break-spaces"
              @focusin="selection = null"
              @input="handleResourceInput"
              @paste="handlePaste"
              @focusout="updateStepStone($event, index)"
              :contenteditable="!readonly"
              class="text-center py-1"
              v-html="item.stone"
            ></td>
            <td
              @keyup="handleKeyUp($event, index)"
              @click="saveSelection"
              @paste="handlePaste"
              @focusout="updateStepDescription($event, index)"
              :contenteditable="!readonly"
              class="editor text-left py-1"
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
                          >Add icon at current selection or cursor
                          position</span
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
                    <v-card flat rounded="lg" class="mt-4" width="600px">
                      <IconSelector
                        @iconSelected="
                          (iconPath, tooltip, iconClass) =>
                            handleIconSelected(iconPath, tooltip, iconClass)
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
        </tbody> </v-table
    ></v-card>
  </v-card>
</template>

<script>
import { watch, ref, computed, reactive, mergeProps, onMounted } from "vue";
import sanitizeHtml from "sanitize-html";
import IconSelector from "../../components/builds/IconSelector.vue";
import useIconService from "../../composables/builds/useIconService.js";

export default {
  name: "StepSectionEditor",
  props: ["section", "readonly", "civ", "focus"],
  emits: ["stepsChanged", "selectionChanged", "textChanged"],
  components: { IconSelector },
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
    const pasteImagesInfoDialog = ref(false);
    var iconService = useIconService(props.civ);

    onMounted(async () => {
      //Sanitize since inline icon replacement only works with <br>, NOT with \n
      steps.forEach((element) => {
        element.description = element.description.replace(/\n/gm, "<br>");
      });
      stepsCopy.forEach((element) => {
        element.description = element.description.replace(/\n/gm, "<br>");
      });
      //Force firefox to use BR instead of adding DIVs
      document.execCommand("defaultParagraphSeparator", false, "br");
    });

    const civ = computed(() => {
      return props.civ;
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
        iconService = useIconService(props.civ);
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

    function getCursorPositionAfterIcon(parent, node, offset, stat) {
      if (stat.done) return stat;

      let currentNode = null;

      for (let i = 0; i < parent.childNodes.length && !stat.done; i++) {
        currentNode = parent.childNodes[i];
        stat.pos++;
        if (currentNode.wholeText?.indexOf(":") > 0) {
          stat.pos++;
        }
        if (currentNode === node) {
          stat.done = true;
          return stat;
        } else getCursorPositionAfterIcon(currentNode, node, offset, stat);
      }

      return stat;
    }

    function getLineBreakPosition(parent) {
      let currentNode = null;

      for (let i = 0; i < parent.childNodes.length; i++) {
        currentNode = parent.childNodes[i];
        if (currentNode.data === "\n") {
          return i;
        }
      }
    }

    const handleKeyUp = (event, index) => {
      const editor = stepsTable.value.rows[index].cells[7];
      const sel = window.getSelection();

      //handle enter and fix line-break
      if (event.which === 13) {
        //Skip e.g. on firefox
        if (editor.innerHTML.includes("\n")) {
          //get linebreak position
          const pos = getLineBreakPosition(editor);
          editor.innerHTML = editor.innerHTML.replace(/\n/gm, "<br>");

          // restore the position
          sel.removeAllRanges();
          var range = document.createRange();
          range.setStart(editor, pos + 1);
          range.collapse(true);
          sel.addRange(range);
        }
      }
      if (event.which === 32 || event.which === 0) {
        addInlineIcon(index);
      }

      saveSelection();
    };

    const addInlineIcon = (index) => {
      var editor = stepsTable.value.rows[index].cells[7];

      //if DIV wrapper, then use this element as root instead of the editor (Needed for firefox compatibility)
      if (editor.childNodes[0].tagName === "DIV") {
        editor = editor.childNodes[0];
      }

      //get target cursor position
      const sel = window.getSelection();
      const node = sel.focusNode;
      const offset = sel.focusOffset;
      const pos = getCursorPositionAfterIcon(editor, node, offset, {
        pos: 0,
        done: false,
      });

      //parse and replace
      const match = editor.innerHTML.match(/:([a-z])\w+ /g);

      if (match) {
        const shortHand = match[0].toLowerCase().trim().replace(":", "");
        const allCivIcons = iconService.getIcons();
        const filter = (unfiltered) => {
          return unfiltered.filter((item) => {
            var elementFound = false;
            //Search by shorthand first
            if (Array.isArray(item.shorthand)) {
              elementFound =
                -1 !=
                item.shorthand.findIndex((element) =>
                  element.startsWith(shortHand)
                );
            } else {
              elementFound = item.shorthand?.startsWith(shortHand);
            }
            //Search by title second
            if (!elementFound) {
              var title = item.title.replace(/ +/g, "").toLowerCase();
              elementFound = title.includes(shortHand);
            }
            return elementFound;
          });
        };
        const filteredCivIcons = filter(allCivIcons).sort(function (a, b) {
          return a.title.length - b.title.length;
        });
        const imageMetaData = filteredCivIcons[0];

        if (imageMetaData) {
          const iconClass = imageMetaData.class
            ? "icon-" + imageMetaData.class
            : "icon";
          const iconPath = imageMetaData.imgSrc;
          const iconTooltipText = imageMetaData.title;

          const img =
            '<img src="' +
            iconPath +
            '" class=' +
            iconClass +
            ' title="' +
            iconTooltipText +
            '"><\/img>';

          //Replace element
          editor.innerHTML = editor.innerHTML.replace(match[0], img);

          // restore the position
          sel.removeAllRanges();
          var range = document.createRange();
          range.setStart(editor, pos.pos);
          range.collapse(true);
          sel.addRange(range);
        }
      }
    };

    function placeCaretAtEnd(el) {
      el.focus();
      if (
        typeof window.getSelection != "undefined" &&
        typeof document.createRange != "undefined"
      ) {
        var range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (typeof document.body.createTextRange != "undefined") {
        var textRange = document.body.createTextRange();
        textRange.moveToElementText(el);
        textRange.collapse(false);
        textRange.select();
      }
    }

    const handleIconSelected = (iconPath, tooltipText, iconClass) => {
      restoreSelection();
      iconClass = iconClass ? "icon-" + iconClass : "icon";

      const img =
        '<img src="' +
        iconPath +
        '" class=' +
        iconClass +
        ' title="' +
        tooltipText +
        '"><\/img>';

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

      return builders + food + wood + gold + stone || "-";
    };
    const updateStepTime = (event, index) => {
      steps[index].time = event.target.innerHTML;
      stepsCopy[index].time = event.target.innerHTML;
      steps[index].description = stepsCopy[index].description;

      context.emit("stepsChanged", steps);
    };
    const updateStepBuilders = (event, index) => {
      steps[index].builders = event.target.innerHTML;
      stepsCopy[index].builders = event.target.innerHTML;
      steps[index].description = stepsCopy[index].description;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
    };
    const updateStepFood = (event, index) => {
      steps[index].food = event.target.innerHTML;
      stepsCopy[index].food = event.target.innerHTML;
      steps[index].description = stepsCopy[index].description;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
    };
    const updateStepWood = (event, index) => {
      const content = event.target.innerHTML;

      steps[index].wood = content;
      stepsCopy[index].wood = content;
      steps[index].description = stepsCopy[index].description;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
    };
    const updateStepGold = (event, index) => {
      steps[index].gold = event.target.innerHTML;
      stepsCopy[index].gold = event.target.innerHTML;
      steps[index].description = stepsCopy[index].description;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
    };
    const updateStepStone = (event, index) => {
      steps[index].stone = event.target.innerHTML;
      stepsCopy[index].stone = event.target.innerHTML;
      steps[index].description = stepsCopy[index].description;

      aggregateVillagers(index);
      context.emit("stepsChanged", steps);
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
          steps[i].description = row.cells[7].innerHTML;
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
          row.cells[7].innerHTML = steps[i].description;
        }
      }
      context.emit("stepsChanged", steps);
    };

    const removeStep = (currentIndex) => {
      var table = stepsTable.value;
      if (table) {
        //Pull display text into model
        for (var i = 0, row; (row = table.rows[i]); i++) {
          steps[i].description = row.cells[7].innerHTML;
        }
      }

      //remove row
      stepsCopy.splice(currentIndex, 1);
      steps.splice(currentIndex, 1);

      context.emit("stepsChanged", steps);
      removeStepConfirmationDialog.value = false;
    };

    const selectRow = (index) => {
      selectedRowIndex.value = index;
    };
    const hoverItem = (index) => {
      hoverRowIndex.value = index;
    };
    const unhoverItem = () => {
      hoverRowIndex.value = null;
    };

    const handleResourceInput = async (e) => {
      if (e.data == "-") {
        //prevent break on hyphen
        e.target.innerHTML = e.target.innerHTML.replace("-", "&#8209;");

        //updating innerHTML sets cursor to start, this is a workaround to set caret to end
        placeCaretAtEnd(e.target);
      }

      context.emit("textChanged");
    };

    const handlePaste = async (e) => {
      //Check html content first
      const dirty = e.clipboardData.getData("text/html");
      const ageBuilderSource = dirty.match("age4builder");
      if (ageBuilderSource) {
        pasteImagesInfoDialog.value = true;
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      var clean = "";
      if (dirty) {
        clean = sanitizeHtml(dirty, {
          allowedTags: ["img", "br"], //no longer use sanitizeHtml.defaults.allowedTags, since it contains e.g. tables
          allowedClasses: {
            img: [
              "icon",
              "icon-none",
              "icon-military",
              "icon-tech",
              "icon-default",
              "icon-landmark",
              "icon-ability",
            ],
          },
          allowedAttributes: {
            img: ["style", "class", "src", "title"],
          },
          allowedStyles: {
            "*": {
              "vertical-align": [/^middle$/],
            },
          },
        });
      } else {
        //Fallback to plain text otherwise
        clean = e.clipboardData.getData("text/plain");
      }

      document.execCommand(
        "insertHTML",
        false,
        clean.trim().replace(/\n/gm, "<br>")
      );
      e.stopPropagation();
      e.preventDefault();
    };

    return {
      stepsCopy,
      steps,
      stepsTable,
      civ,
      readonly,
      hoverRowIndex,
      selectedRowIndex,
      handleResourceInput,
      sanitizeHtml,
      selection,
      delteRowIndex,
      removeStepConfirmationDialog,
      pasteImagesInfoDialog,
      mergeProps,
      handlePaste,
      handleKeyUp,
      aggregateVillagers,
      updateStepDescription,
      addInlineIcon,
      updateStepStone,
      updateStepGold,
      updateStepWood,
      updateStepFood,
      updateStepBuilders,
      updateStepTime,
      removeStep,
      addStep,
      selectRow,
      hoverItem,
      unhoverItem,
      saveSelection,
      restoreSelection,
      handleIconSelected,
    };
  },
};
</script>

<style scoped>
table tbody tr td:nth-child(2) {
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
.editor {
  white-space: pre-wrap;
}
</style>
