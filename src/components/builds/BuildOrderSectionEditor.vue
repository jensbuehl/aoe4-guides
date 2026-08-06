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
      <span class="age-ageup-lbl-xs">Aging up to {{ targetAgeName }}</span>
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
      <v-btn variant="text" color="accent" @click="addStep(0)">
        <template v-slot:prepend><v-icon color="accent">mdi-plus</v-icon></template>
        Add build step
      </v-btn>
    </div>
    <template v-if="!readonly">
      <!-- Step cards (mobile edit) -->
      <div class="xs-steps-container">
        <!-- Insert point before the very first card (prepend) -->
        <div v-if="steps?.length" class="step-insert-xs" @click.stop="addStep(-1)">
          <div class="step-insert-line-xs"></div>
          <span class="step-insert-circle-xs"><v-icon size="11">mdi-plus</v-icon></span>
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
          <span class="step-insert-circle-xs"><v-icon size="11">mdi-plus</v-icon></span>
          <div class="step-insert-line-xs"></div>
        </div>
        </template><!-- end v-for step -->
        <!-- Notes card inside container — gets the same 8px gap as step cards -->
        <div class="gameplan-card-xs">
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
      </div>
    </template><!-- end edit-mode -->

    <!-- Readonly viewer: 5-slot step cards -->
    <template v-if="readonly">
      <div class="xs-steps-container">
        <!--A step that restates the previous distribution and says nothing else
            is not a step that happened; a reader counting rows would count it.
            Hidden here and never in the editor, where the author still owns it.-->
        <template v-for="(item, index) in steps" :key="'xs-view-' + index">
        <div
          v-if="!saysNothing(index)"
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
            v-if="item.description"
            class="step-desc-xs"
            v-html="item.description"
            @mouseover="handleMouseOver($event)"
            @mouseout="handleMouseOut($event)"
          ></div>
        </div>
        </template>
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
  <!-- arrival plate closes the ageUp bracket -->
  <div v-if="section.type === 'ageUp'" class="age-arrival-plate-xs">
    <img :src="targetAgeImg" class="age-arrival-icon-xs" />
    <span class="age-arrival-text-xs">{{ targetAgeName }} reached</span>
  </div>
</div>

  <!--Desktop UI-->
  <v-card flat rounded="lg" :class="['hidden-xs', (section.type === 'ageUp' || (section.type === 'age' && section.age > 1)) ? 'mt-0' : 'mt-4']">
    <!-- ageUp marker — arrow icon only, gold banner, no age image -->
    <div v-if="section.type === 'ageUp' && !isBareAgeUp" class="age-marker-md mx-4 mt-0 mb-0">
      <v-icon size="24" class="age-marker-icon-md">mdi-arrow-up-bold</v-icon>
      <span class="age-marker-lbl-md">Age up to {{ targetAgeName }}</span>
      <span style="flex:1"></span>
      <v-btn v-if="!readonly && isLastAgeUp" icon size="x-small" variant="text" class="row-x" @click.stop="$emit('ageDownRequested')"><v-icon size="14">mdi-close</v-icon></v-btn>
    </div>
    <v-table
      v-if="steps?.length"
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
        <tbody ref="stepsTable">
          <tr v-if="!readonly && !steps.length" class="ins-row">
            <td :colspan="9" class="ins-row-cell"><div class="ins-zone" @click="addStep(-1)"><div class="ins-line"></div><button class="ins-btn" tabindex="-1">+ Step</button></div></td>
          </tr>
          <template v-for="(item, index) in steps" :key="item._id ?? index">
          <tr v-if="!readonly" class="ins-row">
            <td :colspan="9" class="ins-row-cell"><div class="ins-zone" @click="addStep(index - 1)"><div class="ins-line"></div><button class="ins-btn" tabindex="-1">+ Step</button></div></td>
          </tr>
          <!--Hidden only for readers. The editor keeps every row: an author has
              to be able to see and reach a step to fix or remove it.-->
          <tr
            v-if="!readonly || !saysNothing(index)"
            :class="['step-row', section.type === 'ageUp' && 'age-lane-md']"
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
                <span v-if="hasResourceValue(item.builders)" :class="['rc-pill rc-builders', hasDeltaUp('builders', index) && 'd-up']">{{ item.builders }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else type="text" maxlength="7" :value="item.builders"
                @input="updateStep($event, index, 'builders')" @paste="handlePaste"
                :class="hasResourceValue(item.builders) ? ['rc-pill','rc-builders','rc-input', hasDeltaUp('builders',index) && 'd-up'] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td class="text-center py-1">
              <template v-if="readonly">
                <span v-if="hasResourceValue(item.food)" :class="['rc-pill rc-food', hasDeltaUp('food', index) && 'd-up']">{{ item.food }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else type="text" maxlength="7" :value="item.food"
                @input="updateStep($event, index, 'food')" @paste="handlePaste"
                :class="hasResourceValue(item.food) ? ['rc-pill','rc-food','rc-input', hasDeltaUp('food',index) && 'd-up'] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td class="text-center py-1">
              <template v-if="readonly">
                <span v-if="hasResourceValue(item.wood)" :class="['rc-pill rc-wood', hasDeltaUp('wood', index) && 'd-up']">{{ item.wood }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else type="text" maxlength="7" :value="item.wood"
                @input="updateStep($event, index, 'wood')" @paste="handlePaste"
                :class="hasResourceValue(item.wood) ? ['rc-pill','rc-wood','rc-input', hasDeltaUp('wood',index) && 'd-up'] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td class="text-center py-1">
              <template v-if="readonly">
                <span v-if="hasResourceValue(item.gold)" :class="['rc-pill rc-gold', hasDeltaUp('gold', index) && 'd-up']">{{ item.gold }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else type="text" maxlength="7" :value="item.gold"
                @input="updateStep($event, index, 'gold')" @paste="handlePaste"
                :class="hasResourceValue(item.gold) ? ['rc-pill','rc-gold','rc-input', hasDeltaUp('gold',index) && 'd-up'] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td class="text-center py-1">
              <template v-if="readonly">
                <span v-if="hasResourceValue(item.stone)" :class="['rc-pill rc-stone', hasDeltaUp('stone', index) && 'd-up']">{{ item.stone }}</span>
                <span v-else class="rc-empty">–</span>
              </template>
              <input v-else :ref="el => registerStoneInputRef(el, index)" type="text" maxlength="7" :value="item.stone"
                @input="updateStep($event, index, 'stone')" @paste="handlePaste"
                :class="hasResourceValue(item.stone) ? ['rc-pill','rc-stone','rc-input', hasDeltaUp('stone',index) && 'd-up'] : ['rc-pill','rc-ghost','rc-input']" />
            </td>
            <td
              @input="showAutoCompleteMenu($event, index)"
              @keyup="handleContentEditableKeyUp($event, index)"
              @keydown.tab.exact.prevent="timestampRefs[index + 1]?.focus()"
              @keydown.shift.tab.prevent="stoneInputRefs[index]?.focus()"
              @click="saveSelection"
              @paste="handlePaste"
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
                <v-menu :close-on-content-click="false" max-width="700" location="bottom end">
                  <template v-slot:activator="{ props: menu }">
                    <v-btn
                      v-bind="menu"
                      icon="mdi-image-plus"
                      color="accent"
                      variant="text"
                      size="small"
                      :class="['step-action-icon', focusedDescIndex !== index && 'step-action-icon--hidden']"
                      @mousedown.prevent="saveSelection($event)"
                    ></v-btn>
                  </template>
                  <v-card flat rounded="lg">
                    <IconSelector
                      @iconSelected="(iconPath, tooltip, iconClass) => handleIconSelectorIconSelected(iconPath, tooltip, iconClass)"
                      :civ="civ"
                    ></IconSelector>
                  </v-card>
                </v-menu>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  class="row-x"
                  @click="removeStepConfirmationDialog = true; delteRowIndex = index;"
                ><v-icon size="16">mdi-close</v-icon></v-btn>
              </div>
            </td>
          </tr>
          </template>
          <!-- Trailing insert row after last step -->
          <tr v-if="!readonly && steps.length" class="ins-row">
            <td :colspan="9" class="ins-row-cell"><div class="ins-zone" @click="addStep(steps.length - 1)"><div class="ins-line"></div><button class="ins-btn" tabindex="-1">+ Step</button></div></td>
          </tr>
          <!-- Section note row — read: only if has content; edit: always shown -->
          <tr v-if="(gameplan && readonly) || !readonly" :class="['bo-noterow', section.type === 'ageUp' && 'age-lane-md']">
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
                    icon="mdi-image-plus"
                    color="accent"
                    variant="text"
                    size="small"
                    :class="['step-action-icon', focusedDescIndex !== 'gameplan' && 'step-action-icon--hidden']"
                    @mousedown.prevent="saveSelection($event)"
                  ></v-btn>
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
        </tbody>
      </v-table>
    <!-- Empty section — sits inside the ageUp bracket, above the arrival plate -->
    <div
      v-if="!steps?.length && readonly && section.type !== 'ageUp'"
      class="text-center py-6 text-medium-emphasis text-body-2"
    >
      No steps yet
    </div>
    <div v-if="!steps?.length && !readonly" class="text-center py-4">
      <v-btn variant="text" color="accent" @click="addStep(0)"
        >Add build step
        <template v-slot:prepend>
          <v-icon color="accent">mdi-plus</v-icon>
        </template></v-btn
      >
    </div>
    <!-- ageUp arrival plate — desktop -->
    <div v-if="section.type === 'ageUp' && targetAgeName" class="age-plate-md mx-4 mt-0 mb-0">
      <img :src="targetAgeImg" style="width:24px;height:24px;object-fit:contain;flex-shrink:0;" alt="" />
      <span class="age-plate-lbl-md">{{ targetAgeName }} reached</span>
    </div>
  </v-card>
</template>

<script>
//External
import { watch, ref, reactive, computed, mergeProps, onMounted, nextTick } from "vue";

//Components
import IconSelector from "@/components/builds/IconSelector.vue";
import IconAutoCompleteMenu from "@/components/builds/IconAutoCompleteMenu.vue";
import IconToolTip from "@/components/builds/IconToolTip.vue";

//Composables
import iconService from "@/composables/builds/icons/iconService.js";
import { sanitizeStepDescription } from "@/composables/builds/buildOrderValidator.js";
import { aggregateVillagers, hasResourceValue } from "@/composables/builds/villagerAggregator.js";
import { formatAgeTime } from "@/composables/builds/useAgeTimings.js";
import { saysNothing as isRedundantStep } from "@/composables/builds/stepVisibility.js";
import {
  addAutocompleteIcon,
  updateSearchText,
  placeCaretAtEnd,
} from "@/composables/builds/contentEditableHelper.js";

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
    //resolveStepTimes() output for this section's steps, same order. Read-only
    //views only — the editor must never offer an author a time they did not type.
    "resolvedTimes",
  ],
  emits: ["stepsChanged", "selectionChanged", "gameplanChanged", "ageDownRequested"],
  components: { IconSelector, IconAutoCompleteMenu, IconToolTip },
  setup(props, context) {
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
      const resolved = props.resolvedTimes?.[index];
      if (!resolved || resolved.seconds == null) return "";

      const formatted = formatAgeTime(resolved.seconds);
      return resolved.provenance === "stated" ? formatted : `~${formatted}`;
    };

    /** Whether a filled-in cell should read as an estimate rather than a fact */
    const isEstimate = (index) => props.resolvedTimes?.[index]?.provenance !== "stated";

    const AGE_NAMES = { 1: "Feudal Age", 2: "Castle Age", 3: "Imperial Age" };
    const targetAgeName = computed(() => AGE_NAMES[props.section.age] ?? "");
    const targetAgeImg = computed(() => `/assets/pictures/age/age_${props.section.age + 1}.webp`);
    const currentAgeName = computed(() => AGE_NAMES[props.section.age - 1] ?? "");
    const currentAgeImg = computed(() => `/assets/pictures/age/age_${props.section.age}.webp`);

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
    const timestampRefs = ref([]);
    const stoneInputRefs = ref([]);
    const removeStepConfirmationDialog = ref(false);
    const activeStepIndex = ref(null);
    const focusedDescIndex = ref(null);
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

    function registerTimestampRef(el, index) {
      if (el) timestampRefs.value[index] = el;
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
      return isRedundantStep(steps[index], index === 0 ? props.previousStep : steps[index - 1]);
    }

    function hasDeltaUp(field, index) {
      //The step before this one, crossing the section boundary when needed —
      //the first row of an age section still follows on from the age-up before
      //it, so an increase there deserves the same marker as any other.
      const previous = index === 0 ? props.previousStep : steps[index - 1];
      if (!previous) return false;

      const curr = parseInt(steps[index][field]) || 0;
      const prev = parseInt(previous[field]) || 0;
      return curr > prev;
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

    const showAutoCompleteMenu = (event, index) => {
      var contentEditable = null;
      if (index != null) {
        contentEditable = stepsTable.value.querySelectorAll('tr.step-row')[index].cells[descriptionColumnIndex];
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
          stepsTable.value.querySelectorAll('tr.step-row')[activeStepIndex.value].cells[descriptionColumnIndex];
      } else {
        contentEditable = gameplanContentEditable.value;
      }

      addAutocompleteIcon(contentEditable, iconPath, tooltip, iconClass);
      searchText.value = null;
    }

    const handleContentEditableKeyUp = (event, index) => {
      var contentEditable = null;
      if (index != null) {
        contentEditable = stepsTable.value.querySelectorAll('tr.step-row')[index].cells[descriptionColumnIndex];
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
    const addStep = async (index) => {
      var table = stepsTable.value;
      if (table) {
        //Pull display text into model (desktop)
        const stepRows = Array.from(table.querySelectorAll('tr.step-row'));
        for (var i = 0; i < stepRows.length; i++) {
          steps[i].description = stepRows[i].cells[descriptionColumnIndex].innerHTML;
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

      context.emit("stepsChanged", steps);
      await nextTick();
      await nextTick();
      timestampRefs.value[addIndex]?.focus();
    };

    const removeStep = (currentIndex) => {
      var table = stepsTable.value;
      if (table) {
        //Pull display text into model (desktop)
        const stepRows = Array.from(table.querySelectorAll('tr.step-row'));
        for (var i = 0; i < stepRows.length; i++) {
          steps[i].description = stepRows[i].cells[descriptionColumnIndex].innerHTML;
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
      hasDeltaUp,
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
      removeStep,
      addStep,
      selectStep,
      hoverStep,
      unhoverStep,
      saveSelection,
      restoreSelection,
      handleIconSelectorIconSelected,
      activeStepIndex,
      focusedDescIndex,
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
      // Age bracket
      targetAgeName,
      currentAgeName,
      currentAgeImg,
      targetAgeImg,
      isBareAgeUp,
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

/* Allow ins-zone to overflow both the table wrapper and the section card so it can
   reach age badges in adjacent cards (e.g. age-plate in the preceding ageUp card) */
:deep(.v-table__wrapper) {
  overflow: visible;
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
.step-row td {
  vertical-align: top !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
}
/* Description cell — middle-aligned so single-line text centers in the 52px row */
.step-row td.contentEditable {
  vertical-align: middle !important;
  padding-top: 7px !important;
  padding-bottom: 7px !important;
  padding-left: 16px !important;
  padding-right: 8px !important;
  line-height: 1.55;
}
/* Edit mode: focus-only gold highlight fills entire cell */
.step-row td.contentEditable[contenteditable="true"]:focus {
  outline: none;
  background: rgba(var(--v-theme-accent), 0.08);
  box-shadow: inset 0 0 0 1px rgba(var(--v-theme-accent), 0.4);
  border-radius: 6px;
}
/* Action column */
.step-row td.step-actions {
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
  display: block;
  width: 100%;
  height: 30px;
  line-height: 26px;  /* 28px - 1px border-top - 1px border-bottom */
  margin-top: 12px;
  margin-bottom: 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  text-align: center;
  font-weight: 800;
  font-size: 13.5px;
  font-variant-numeric: tabular-nums;
  box-sizing: border-box;
}
.rc-builders { background: rgba(94,  83,  64,  0.45); border-color: rgba(94,  83,  64,  0.65); }
.rc-food     { background: rgba(136, 64,  64,  0.45); border-color: rgba(136, 64,  64,  0.65); }
.rc-wood     { background: rgba(79,  107, 58,  0.45); border-color: rgba(79,  107, 58,  0.65); }
.rc-gold     { background: rgba(138, 109, 46,  0.45); border-color: rgba(138, 109, 46,  0.65); }
.rc-stone    { background: rgba(89,  102, 122, 0.45); border-color: rgba(89,  102, 122, 0.65); }

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

.rc-pill.d-up {
  border-top: 2px solid rgb(var(--v-theme-primary));
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


/* Age-up marker — desktop (arrow only, gold card) */
.age-marker-md {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  min-height: 40px;
  box-sizing: border-box;
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(var(--v-theme-accent), 0.15), rgba(var(--v-theme-accent), 0.03));
  border: 1px solid rgba(var(--v-theme-accent), 0.25);
}
.age-marker-icon-md {
  color: rgb(var(--v-theme-accent));
  flex-shrink: 0;
}
.age-marker-lbl-md {
  font-size: 13px;
  font-weight: 800;
  color: rgb(var(--v-theme-accent));
  letter-spacing: 0.2px;
}

/* Age reached plate — desktop (age icon + text, gold card) */
.age-plate-md {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 12px;
  min-height: 40px;
  box-sizing: border-box;
  border-radius: 8px;
  background: linear-gradient(90deg, rgba(var(--v-theme-accent), 0.15), rgba(var(--v-theme-accent), 0.03));
  border: 1px solid rgba(var(--v-theme-accent), 0.25);
}
.age-plate-lbl-md {
  font-size: 13px;
  font-weight: 800;
  color: rgb(var(--v-theme-accent));
  letter-spacing: 0.2px;
}

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

/* Add-icon button — always in DOM for correct menu positioning; hidden via opacity when not focused */
.step-action-icon--hidden {
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Row delete button — always in DOM, revealed on row hover */
.row-x {
  opacity: 0;
  transition: opacity 0.12s;
  flex-shrink: 0;
}
.step-row:hover .row-x { opacity: 1; }
.age-marker-md:hover .row-x { opacity: 1; }
.row-x:hover :deep(.v-icon) { color: rgb(var(--v-theme-error)); }

.bo-noterow td {
  border-top: none;
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

/* Step description placeholder — hints :: shortcut */
.step-row td.contentEditable[contenteditable="true"]:empty::before {
  content: 'Describe this step... (type :: to add icons inline)';
  color: rgba(var(--v-theme-on-surface), 0.25);
  pointer-events: none;
}

/* Remove bottom border from the last row (step-row or bo-noterow) to avoid doubling with card edge */
tbody tr:last-child td {
  border-bottom: none !important;
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
.age-bracket-xs {
  position: relative;
}
.age-bracket-xs::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: rgba(var(--v-theme-accent), 0.55);
  border-radius: 2px;
}
.age-ageup-row-xs {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 6px 16px 8px;
  padding: 0 10px 0 14px;
  height: 42px;
  background: linear-gradient(90deg, rgba(var(--v-theme-accent), 0.14) 0%, rgba(var(--v-theme-accent), 0.04) 100%);
  border-radius: 10px;
}
.age-ageup-lbl-xs {
  font-size: 13px;
  font-weight: 700;
  color: rgb(var(--v-theme-accent));
}
.age-arrival-plate-xs {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 16px 4px;
  padding: 0 14px;
  height: 42px;
  background: linear-gradient(90deg, rgba(var(--v-theme-accent), 0.14) 0%, rgba(var(--v-theme-accent), 0.04) 100%);
  border-radius: 10px;
}
.age-arrival-icon-xs {
  width: 22px;
  height: 22px;
  object-fit: contain;
  flex-shrink: 0;
}
.age-arrival-text-xs {
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgb(var(--v-theme-accent));
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
