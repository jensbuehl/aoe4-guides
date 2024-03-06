<template>
  <v-dialog
    v-model="focusDialog"
    fullscreen
    transition="dialog-bottom-transition"
  >
    <FocusMode
      v-on:closeDialog="focusDialog = false"
      :build="build"
    ></FocusMode>
  </v-dialog>
  <v-container align="center" v-if="!loading &&!build"
    ><BuildNotFound></BuildNotFound
  ></v-container>

  <v-container v-if="build">
    <v-dialog v-model="deleteDialog" width="auto">
      <v-card rounded="lg" flat class="text-center primary">
        <v-card-title>Delete Build</v-card-title>
        <v-card-text>
          Do you really want to delete this build?<br />
          The action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-btn color="error" block @click="handleDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card flat rounded="lg" elevation="0">
      <v-card-title class="hidden-md-and-up">
        {{ build.title }}
      </v-card-title>
      <!--sm and down-->
      <v-row
        no-gutters
        align="center"
        justify="start"
        class="fill-height d-flex flex-nowrap pl-4 hidden-sm-and-up"
      >
        <v-col cols="12">
          <!--xs-->
          <v-item-group class="pt-2 hidden-sm-and-up">
            <v-chip
              class="mr-2 mb-2"
              v-if="build.isDraft"
              label
              color="error"
              size="x-small"
              ><v-icon start icon="mdi-pencil-circle"></v-icon>Draft</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="isNew(build.timeCreated.toDate())"
              label
              color="accent"
              size="x-small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.civ"
              label
              color="accent"
              size="x-small"
              ><v-icon start icon="mdi-earth"></v-icon
              >{{ getCivById(build.civ)?.shortName }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.creatorId && creatorName"
              label
              color="accent"
              size="x-small"
              ><v-icon start icon="mdi-youtube"></v-icon
              >{{ creatorName }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.season"
              label
              size="x-small"
              ><v-icon start icon="mdi-trophy"></v-icon
              >{{ build.season }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-sm-and-up">
            <v-chip
              class="mr-2 mb-2"
              color="accent"
              v-if="build.map"
              label
              size="x-small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.strategy"
              label
              size="x-small"
              ><v-icon start icon="mdi-strategy"></v-icon
              >{{ build.strategy }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-sm-and-up">
            <v-chip class="mr-2 mb-2" label size="x-small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ build.author }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="x-small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip
              v-show="build.upvotes"
              class="mr-2 mb-2"
              label
              size="x-small"
            >
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.timeCreated"
              label
              size="x-small"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.timeCreated"
              label
              size="x-small"
              ><v-icon start icon="mdi-update"></v-icon
              >{{ timeSince(build.timeUpdated.toDate()) }}</v-chip
            >
          </v-item-group>
          <!--sm and up-->
          <v-item-group class="pt-2 hidden-xs hidden-md-and-up">
            <v-chip
              class="mr-2 mb-2"
              v-if="build.isDraft"
              label
              color="error"
              size="small"
              ><v-icon start icon="mdi-pencil-circle"></v-icon>Draft</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="isNew(build.timeCreated.toDate())"
              label
              color="accent"
              size="small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.civ"
              label
              color="accent"
              size="small"
              ><v-icon start icon="mdi-earth"></v-icon
              >{{ getCivById(build.civ)?.title }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.creatorId && creatorName"
              label
              color="accent"
              size="small"
              ><v-icon start icon="mdi-youtube"></v-icon
              >{{ creatorName }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.season"
              label
              size="small"
              ><v-icon start icon="mdi-trophy"></v-icon
              >{{ build.season }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-xs hidden-md-and-up">
            <v-chip
              class="mr-2 mb-2"
              color="accent"
              v-if="build.map"
              label
              size="small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.strategy"
              label
              size="small"
              ><v-icon start icon="mdi-strategy"></v-icon
              >{{ build.strategy }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-xs hidden-md-and-up">
            <v-chip class="mr-2 mb-2" label size="small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ build.author }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip v-show="build.upvotes" class="mr-2 mb-2" label size="small">
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.timeCreated"
              label
              size="small"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.timeCreated"
              label
              size="small"
              ><v-icon start icon="mdi-update"></v-icon
              >{{ timeSince(build.timeUpdated.toDate()) }}</v-chip
            >
          </v-item-group>
        </v-col>
      </v-row>
      <v-card-actions class="hidden-md-and-up">
        <Vote
          v-if="user"
          :buildId="build.id"
          :userId="user?.uid"
          @voteUpAdded="
            () => {
              build.upvotes++;
            }
          "
          @voteUpRemoved="
            () => {
              build.upvotes--;
            }
          "
        ></Vote>
        <Favorite
          v-if="user"
          :buildId="build.id"
          :userId="user?.uid"
        ></Favorite>
        <v-spacer></v-spacer>
        <v-tooltip location="top">
          <span
            :style="{
              color: $vuetify.theme.current.colors.primary,
            }"
            >Edit Build Order</span
          >
          <template :props="props" v-slot:activator="{ props }">
            <v-btn
              replace
              v-bind="props"
              color="accent"
              variant="text"
              v-show="user?.uid === build.authorUid"
              icon="mdi-pencil"
              :to="{ name: 'BuildEdit', params: { id: id } }"
            ></v-btn>
          </template>
        </v-tooltip>
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-horizontal"
              color="accent"
              variant="text"
              v-bind="props"
            ></v-btn>
          </template>
          <v-list>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Publish Build Order</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  v-show="user && build.isDraft"
                  @click="handlePublish"
                  v-bind="props"
                >
                  <v-icon color="accent" class="mr-4">mdi-publish</v-icon>
                  Publish
                </v-list-item>
              </template>
            </v-tooltip>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Duplicate and Edit Build Order</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  v-show="user"
                  @click="handleDuplicate"
                  v-bind="props"
                >
                  <v-icon color="accent" class="mr-4"
                    >mdi-content-duplicate</v-icon
                  >
                  Duplicate Build
                </v-list-item>
              </template>
            </v-tooltip>
            <v-list-item @click="handleCopyOverlayFormat">
              <v-tooltip>
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Copy RTS_Overlay / AoE4_Overlay Format to Clipboard</span
                >
                <template v-slot:activator="{ props }">
                  <v-icon color="accent" class="mr-5" v-bind="props"
                    >mdi-content-copy
                  </v-icon>
                  <v-list-item-content
                    :style="'color: ' + $vuetify.theme.current.colors.primary"
                    v-bind="props"
                    >Overlay Tool</v-list-item-content
                  >
                </template>
              </v-tooltip>
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Visit AoE4_Overlay Project Page</span
                >
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    size="small"
                    @click="
                      (e) => {
                        e.stopPropagation();
                        window
                          .open(
                            'https://github.com/FluffyMaguro/AoE4_Overlay',
                            '_blank'
                          )
                          .focus();
                      }
                    "
                    color="accent"
                    class="ml-2"
                    >mdi-information-outline</v-icon
                  >
                </template>
              </v-tooltip>
            </v-list-item>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Download RTS_Overlay / AoE4_Overlay File</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  v-bind="props"
                  @click="handleDownloadOverlayFormat"
                >
                  <v-icon color="accent" class="mr-4">mdi-download</v-icon>
                  Download
                </v-list-item>
              </template>
            </v-tooltip>
            <v-divider v-show="user?.uid === build.authorUid"></v-divider>
            <v-tooltip>
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Delete Build Order</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  v-bind="props"
                  v-show="user?.uid === build.authorUid"
                  @click="deleteDialog = true"
                >
                  <v-icon color="accent" class="mr-4">mdi-delete</v-icon>
                  Delete
                </v-list-item>
              </template>
            </v-tooltip>
          </v-list>
        </v-menu>
      </v-card-actions>
      <!--md and up-->
      <v-row
        no-gutters
        class="fill-height d-flex flex-nowrap hidden-sm-and-down"
      >
        <v-col
          v-if="build.civ"
          cols="2"
          md="4"
          lg="3"
          class="pa-0 ma-0 d-flex flex-column"
        >
          <v-img
            class="hidden-sm-and-down"
            :src="
              '/' +
              civs.find((item) => {
                return item.shortName === build.civ;
              }).flagLarge
            "
            :lazy-src="
              '/' +
              civs.find((item) => {
                return item.shortName === build.civ;
              }).flagSmall
            "
            :gradient="
              'to right, transparent, ' + $vuetify.theme.current.colors.surface
            "
            alt="{{build.civ}}"
            cover
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular
                  indeterminate
                  color="grey lighten-5"
                ></v-progress-circular>
              </v-row>
            </template>
          </v-img>
        </v-col>
        <v-col
          v-if="!build.civ"
          cols="2"
          md="4"
          lg="3"
          class="pa-0 ma-0 hidden-sm-and-down"
        >
          <v-img
            class="hidden-sm-and-down"
            src="/assets/flags/any-large.png"
            lazy-src="/assets/flags/any-small.png"
            :gradient="
              'to right, transparent, ' + $vuetify.theme.current.colors.surface
            "
            alt="{{build.civ}}"
            cover
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular
                  indeterminate
                  color="grey lighten-5"
                ></v-progress-circular>
              </v-row>
            </template>
          </v-img>
        </v-col>
        <v-col cols="9" md="6" lg="7" xl="8" class="d-flex flex-column">
          <v-card-title class="py-0 mt-2 hidden-sm-and-down">
            {{ build.title }}
          </v-card-title>
          <v-spacer></v-spacer>
          <v-item-group class="ml-4 pt-2 hidden-sm-and-down">
            <v-chip
              class="mr-2 mb-2"
              v-if="build.isDraft"
              label
              color="error"
              size="small"
              ><v-icon start icon="mdi-pencil-circle"></v-icon>Draft</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="isNew(build.timeCreated.toDate())"
              label
              color="accent"
              size="small"
              ><v-icon start icon="mdi-alert-decagram"></v-icon>NEW</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.civ"
              label
              color="accent"
              size="small"
              ><v-icon start icon="mdi-earth"></v-icon
              >{{ getCivById(build.civ)?.title }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.creatorId && creatorName"
              label
              color="accent"
              size="small"
              ><v-icon start icon="mdi-youtube"></v-icon
              >{{ creatorName }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.season"
              label
              size="small"
              ><v-icon start icon="mdi-trophy"></v-icon
              >{{ build.season }}</v-chip
            >
          </v-item-group>
          <v-item-group class="ml-4 hidden-sm-and-down">
            <v-chip
              class="mr-2 mb-2"
              color="accent"
              v-if="build.map"
              label
              size="small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip
              color="accent"
              class="mr-2 mb-2"
              v-if="build.strategy"
              label
              size="small"
              ><v-icon start icon="mdi-strategy"></v-icon
              >{{ build.strategy }}</v-chip
            >
          </v-item-group>
          <v-item-group class="ml-4 hidden-sm-and-down">
            <v-chip class="mr-2 mb-2" label size="small"
              ><v-icon start icon="mdi-account-edit"></v-icon
              >{{ build.author }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip v-show="build.upvotes" class="mr-2 mb-2" label size="small">
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.timeCreated"
              label
              size="small"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.timeCreated"
              label
              size="small"
              ><v-icon start icon="mdi-update"></v-icon
              >{{ timeSince(build.timeUpdated.toDate()) }}</v-chip
            >
          </v-item-group>
        </v-col>
        <v-row
          no-gutters
          justify="end"
          align="center"
          class="my-2 mr-4 flex-nowrap hidden-sm-and-down"
        >
          <v-col cols="auto" class="mr-2">
            <Vote
              v-if="user"
              :buildId="build.id"
              :userId="user?.uid"
              @voteUpAdded="
                () => {
                  build.upvotes++;
                }
              "
              @voteUpRemoved="
                () => {
                  build.upvotes--;
                }
              "
            ></Vote>
          </v-col>
          <v-col cols="auto">
            <div>
              <Favorite
                v-if="user"
                :buildId="build.id"
                :userId="user?.uid"
              ></Favorite>
            </div>
            <v-tooltip location="top">
              <span
                :style="{
                  color: $vuetify.theme.current.colors.primary,
                }"
                >Edit Build Order</span
              >
              <template :props="props" v-slot:activator="{ props }">
                <v-btn
                  replace
                  v-bind="props"
                  color="accent"
                  variant="text"
                  block
                  v-show="user?.uid === build.authorUid"
                  icon="mdi-pencil"
                  :to="{ name: 'BuildEdit', params: { id: id } }"
                ></v-btn>
              </template>
            </v-tooltip>

            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-dots-horizontal"
                  color="accent"
                  variant="text"
                  v-bind="props"
                ></v-btn>
              </template>
              <v-list>
                <v-tooltip>
                  <span
                    :style="{
                      color: $vuetify.theme.current.colors.primary,
                    }"
                    >Publish Build Order</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      :style="'color: ' + $vuetify.theme.current.colors.primary"
                      v-show="user && build.isDraft"
                      @click="handlePublish"
                      v-bind="props"
                    >
                      <v-icon color="accent" class="mr-4">mdi-publish</v-icon>
                      Publish
                    </v-list-item>
                  </template>
                </v-tooltip>
                <v-tooltip>
                  <span
                    :style="{
                      color: $vuetify.theme.current.colors.primary,
                    }"
                    >Duplicate and Edit Build Order</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      :style="'color: ' + $vuetify.theme.current.colors.primary"
                      v-show="user"
                      @click="handleDuplicate"
                      v-bind="props"
                    >
                      <v-icon color="accent" class="mr-4"
                        >mdi-content-duplicate</v-icon
                      >
                      Duplicate Build
                    </v-list-item>
                  </template>
                </v-tooltip>
                <v-list-item @click="handleCopyOverlayFormat">
                  <v-tooltip>
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Copy to Clipboard (RTS_Overlay / AoE4_Overlay)</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-icon color="accent" class="mr-5" v-bind="props"
                        >mdi-content-copy
                      </v-icon>
                      <v-list-item-content
                        :style="
                          'color: ' + $vuetify.theme.current.colors.primary
                        "
                        v-bind="props"
                        >Overlay Tool</v-list-item-content
                      >
                    </template>
                  </v-tooltip>
                  <v-tooltip location="top">
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Visit AoE4_Overlay Project Page</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-icon
                        v-bind="props"
                        size="small"
                        @click="
                          (e) => {
                            e.stopPropagation();
                            window
                              .open(
                                'https://github.com/FluffyMaguro/AoE4_Overlay',
                                '_blank'
                              )
                              .focus();
                          }
                        "
                        color="accent"
                        class="ml-2"
                        >mdi-information-outline</v-icon
                      >
                    </template>
                  </v-tooltip>
                </v-list-item>
                <v-tooltip>
                  <span
                    :style="{
                      color: $vuetify.theme.current.colors.primary,
                    }"
                    >Download RTS_Overlay / AoE4_Overlay File</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      :style="'color: ' + $vuetify.theme.current.colors.primary"
                      v-bind="props"
                      @click="handleDownloadOverlayFormat"
                    >
                      <v-icon color="accent" class="mr-4">mdi-download</v-icon>
                      Download
                    </v-list-item>
                  </template>
                </v-tooltip>
                <v-divider v-show="user?.uid === build.authorUid"></v-divider>
                <v-tooltip>
                  <span
                    :style="{
                      color: $vuetify.theme.current.colors.primary,
                    }"
                    >Delete Build Order</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      :style="'color: ' + $vuetify.theme.current.colors.primary"
                      v-bind="props"
                      v-show="user?.uid === build.authorUid"
                      @click="deleteDialog = true"
                    >
                      <v-icon color="accent" class="mr-4">mdi-delete</v-icon>
                      Delete
                    </v-list-item>
                  </template>
                </v-tooltip>
              </v-list>
            </v-menu>
          </v-col>
        </v-row>
      </v-row>
    </v-card>

    <v-card flat v-if="build.description" rounded="lg" class="mt-4">
      <v-card-title>Description</v-card-title>
      <v-card-text style="white-space: pre-line">{{
        build.description
      }}</v-card-text>
    </v-card>

    <StepsEditor
      :steps="build.steps"
      :readonly="true"
      :civ="build.civ"
      @activateFocusMode="focusDialog = true"
    ></StepsEditor>

    <v-card flat v-if="build.video" rounded="lg" class="mt-4">
      <v-card-title>Video</v-card-title>
      <div align="center">
        <iframe
          width="100%"
          height="250px"
          :src="build.video"
          frameborder="0"
          class="mb-3"
          allowfullscreen
        ></iframe>
      </div>
    </v-card>

    <div class="mt-4">
      <Discussion :buildId="build.id"></Discussion>
    </div>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";

//components
import Favorite from "../../components/Favorite.vue";
import FocusMode from "../../components/builds/FocusMode.vue";
import Vote from "../../components/Vote.vue";
import StepsEditor from "../../components/builds/StepsEditor.vue";
import Discussion from "../../components/Discussion.vue";
import BuildNotFound from "../../components/notifications/BuildNotFound.vue";

//composables
import useCollection from "../../composables/useCollection";
import { civs as allCivs, getCivById } from "../../composables/filter/civService";
import useTimeSince from "../../composables/useTimeSince";
import useExportOverlayFormat from "../../composables/converter/useExportOverlayFormat";
import useCopyToClipboard from "../../composables/converter/useCopyToClipboard";
import useDownload from "../../composables/converter/useDownload";

export default {
  name: "BuildDetails",
  components: {
    Favorite,
    Vote,
    Discussion,
    StepsEditor,
    FocusMode,
    BuildNotFound,
  },
  props: ["id"],
  setup(props) {
    window.scrollTo(0, 0);

    const store = useStore();
    const router = useRouter();
    const user = computed(() => store.state.user);
    const civs = allCivs.value;
    const build = ref(null);
    const deleteDialog = ref(false);
    const focusDialog = ref(false);
    const creatorName = ref("");
    const { convert } = useExportOverlayFormat();
    const { copyToClipboard } = useCopyToClipboard();
    const { download } = useDownload();
    const { timeSince, isNew } = useTimeSince();
    const {
      get,
      del,
      incrementViews,
      error,
      update: updateBuild,
    } = useCollection("builds");
    const { get: getCreator } = useCollection("creators");
    const loading = true;

    onMounted(async () => {
      const resBuild = await get(props.id);
      if (resBuild) {
        if (resBuild.creatorId) {
          const resCreator = await getCreator(resBuild.creatorId);
          creatorName.value = resCreator.creatorDisplayTitle
            ? resCreator.creatorDisplayTitle
            : resCreator.creatorTitle;
        }

        build.value = resBuild;
        document.title = build.value.title + " - " + document.title;
        incrementViews(props.id);
        const loading = false;
      }
    });

    const handleDuplicate = async () => {
      var template = {
        author: "",
        authorUid: "",
        description: build.value.description,
        title: build.value.title + " - copy",
        sortTitle: "", //firestore does not support case-insensitive sorting
        steps: build.value.steps,
        video: build.value.video,
        civ: build.value.civ,
        map: build.value.map || "",
        season: build.value.season,
        strategy: build.value.strategy,
        isDraft: false,
        views: 0,
        likes: 0,
        score: 0,
        timeCreated: null,
        timeUpdated: null,
      };

      store.commit("setTemplate", template);
      router.push({ name: "BuildNew" });
    };

    const handleDelete = async () => {
      deleteDialog.value = false;
      await del(props.id);
      if (!error.value) {
        router.go(-1);
      }
    };

    const handlePublish = async () => {
      //Update build order document
      build.value.isDraft = false;
      await updateBuild(props.id, build.value, true);

      //Navigate to new build order
      if (!error.value) {
        router.replace("/builds/" + props.id);
      }
    };

    const handleCopyOverlayFormat = () => {
      const overlayBuild = convert(build.value);
      const overlayBuildString = JSON.stringify(overlayBuild, null, 3);
      copyToClipboard(overlayBuildString);
    };

    const handleDownloadOverlayFormat = () => {
      const overlayBuild = convert(build.value);
      const overlayBuildString = JSON.stringify(overlayBuild, null, 3);
      download(overlayBuildString, build.value.title);
    };

    return {
      build,
      props,
      user,
      loading,
      civs,
      getCivById,
      error,
      deleteDialog,
      focusDialog,
      window,
      handlePublish,
      handleDelete,
      handleDuplicate,
      handleCopyOverlayFormat,
      handleDownloadOverlayFormat,
      timeSince,
      isNew,
      creatorName,
    };
  },
};
</script>
