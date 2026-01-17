<template>
  <v-dialog v-model="focusDialog" fullscreen transition="dialog-bottom-transition">
    <FocusMode v-on:closeDialog="focusDialog = false" :build="build"></FocusMode>
  </v-dialog>
  <v-container align="center" v-if="!loading && !build"
    ><BuildNotFound></BuildNotFound
  ></v-container>

  <v-container
    v-if="build"
    v-touch="{
      up: () => swipe('Up'),
      down: () => swipe('Down'),
    }"
  >
    <v-dialog v-model="deleteDialog" width="auto">
      <v-card rounded="lg" flat class="text-center primary">
        <v-card-title>Delete Build</v-card-title>
        <v-card-text>
          Do you really want to delete this build?<br />
          The action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-btn type="button" color="error" block @click="handleDelete">Delete</v-btn>
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
            <v-chip class="mr-2 mb-2" v-if="build.isDraft" label color="error" size="x-small"
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
              :to="{ name: 'Builds', query: { civ: build.civ } }"
              clickable
            >
              <v-icon start icon="mdi-earth"></v-icon>
              {{ getCivById(build.civ)?.shortName }}
            </v-chip>
            <v-chip color="accent" class="mr-2 mb-2" v-if="build.season" label size="x-small"
              ><v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.creatorId"
              variant="plain"
              size="x-small"
              :href="'https://www.youtube.com/channel/' + build.creatorId"
              target="_blank"
              rel="noopener noreferrer"
              clickable
            >
              <v-icon color="accent" start icon="mdi-youtube"></v-icon>
              {{ build.creatorName }}
            </v-chip>
          </v-item-group>
          <v-item-group class="hidden-sm-and-up">
            <v-chip class="mr-2 mb-2" color="accent" v-if="build.map" label size="x-small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip color="accent" class="mr-2 mb-2" v-if="build.strategy" label size="x-small"
              ><v-icon start icon="mdi-strategy"></v-icon>{{ build.strategy }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-sm-and-up">
            <v-chip
              class="mr-2 mb-2"
              label
              size="x-small"
              color="accent"
              :to="{
                name: 'Builds',
                query: { author: build.authorUid },
              }"
              ><v-icon start icon="mdi-account-edit"></v-icon>{{ build.author }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="x-small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip v-if="build.comments > 0" class="mr-2 mb-2" label size="x-small"
              ><v-icon start icon="mdi-message"></v-icon>{{ build.comments }}</v-chip
            >
            <v-chip v-show="build.upvotes" class="mr-2 mb-2" label size="x-small">
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
            >
            <v-chip class="mr-2 mb-2" v-if="build.timeCreated" label size="x-small"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
            >
            <v-chip class="mr-2 mb-2" v-if="build.timeCreated" label size="x-small"
              ><v-icon start icon="mdi-update"></v-icon
              >{{ timeSince(build.timeUpdated.toDate()) }}</v-chip
            >
          </v-item-group>
          <!--sm and up-->
          <v-item-group class="pt-2 hidden-xs hidden-md-and-up">
            <v-chip class="mr-2 mb-2" v-if="build.isDraft" label color="error" size="small"
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
              :to="{ name: 'Builds', query: { civ: build.civ } }"
              clickable
            >
              <v-icon start icon="mdi-earth"></v-icon>{{ getCivById(build.civ)?.title }}
            </v-chip>
            <v-chip color="accent" class="mr-2 mb-2" v-if="build.season" label size="small"
              ><v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.creatorId"
              variant="plain"
              size="small"
              :href="'https://www.youtube.com/channel/' + build.creatorId"
              target="_blank"
              rel="noopener noreferrer"
              clickable
            >
              <v-icon color="accent" start icon="mdi-youtube"></v-icon>
              {{ build.creatorName }}
            </v-chip>
          </v-item-group>
          <v-item-group class="hidden-xs hidden-md-and-up">
            <v-chip class="mr-2 mb-2" color="accent" v-if="build.map" label size="small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip color="accent" class="mr-2 mb-2" v-if="build.strategy" label size="small"
              ><v-icon start icon="mdi-strategy"></v-icon>{{ build.strategy }}</v-chip
            >
          </v-item-group>
          <v-item-group class="hidden-xs hidden-md-and-up">
            <v-chip
              class="mr-2 mb-2"
              label
              size="small"
              :to="{
                name: 'Builds',
                query: { author: build.authorUid },
              }"
              ><v-icon start icon="mdi-account-edit"></v-icon>{{ build.author }}</v-chip
            >
            <v-chip class="mr-2 mb-2" label size="small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip v-if="build.comments > 0" class="mr-2 mb-2" label size="small"
              ><v-icon start icon="mdi-message"></v-icon>{{ build.comments }}</v-chip
            >
            <v-chip v-show="build.upvotes" class="mr-2 mb-2" label size="small">
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
            >
            <v-chip class="mr-2 mb-2" v-if="build.timeCreated" label size="small"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
            >
            <v-chip class="mr-2 mb-2" v-if="build.timeCreated" label size="small"
              ><v-icon start icon="mdi-update"></v-icon
              >{{ timeSince(build.timeUpdated.toDate()) }}</v-chip
            >
          </v-item-group>
        </v-col>
      </v-row>
      <v-card-actions class="hidden-md-and-up">
        <Vote
          v-if="userData"
          v-model="userData"
          :buildId="build.id"
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
        <Favorite v-if="userData" v-model="userData" :buildId="build.id"></Favorite>
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
            <v-btn icon="mdi-dots-horizontal" color="accent" variant="text" v-bind="props"></v-btn>
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
                  <v-icon color="accent" class="mr-4">mdi-content-duplicate</v-icon>
                  Duplicate Build
                </v-list-item>
              </template>
            </v-tooltip>
            <v-list-item v-if="clipboardIsSupported" click="handleCopyOverlayFormat">
              <v-tooltip>
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Copy RTS Overlay / AoE4 Overlay Format to Clipboard</span
                >
                <template v-slot:activator="{ props }">
                  <v-icon color="accent" class="mr-5" v-bind="props">mdi-content-copy </v-icon>
                  <v-list-item-content
                    :style="'color: ' + $vuetify.theme.current.colors.primary"
                    v-bind="props"
                    >Copy to Clipboard</v-list-item-content
                  >
                </template>
              </v-tooltip>
              <v-tooltip location="top">
                <span
                  :style="{
                    color: $vuetify.theme.current.colors.primary,
                  }"
                  >Visit AoE4 Overlay Project Page</span
                >
                <template v-slot:activator="{ props }">
                  <v-icon
                    v-bind="props"
                    size="small"
                    @click="
                      (e) => {
                        e.stopPropagation();
                        window
                          .open('https://github.com/FluffyMaguro/AoE4_Overlay', '_blank')
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
                >Download RTS Overlay / AoE4 Overlay File</span
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
                >Open build order as overlay on RTS Overlay website</span
              >
              <template v-slot:activator="{ props }">
                <v-list-item
                  :style="'color: ' + $vuetify.theme.current.colors.primary"
                  v-bind="props"
                  @click="handleOpenInOverlayTool"
                >
                  <v-icon color="accent" class="mr-4">mdi-button-cursor</v-icon>
                  Open in RTS Overlay
                </v-list-item>
              </template>
            </v-tooltip>
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
      <v-row no-gutters class="fill-height d-flex flex-nowrap hidden-sm-and-down">
        <v-col v-if="build.civ" cols="2" md="4" lg="3" class="pa-0 ma-0 d-flex flex-column">
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
            :gradient="'to right, transparent, ' + $vuetify.theme.current.colors.surface"
            alt="{{build.civ}}"
            cover
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
              </v-row>
            </template>
          </v-img>
        </v-col>
        <v-col v-if="!build.civ" cols="2" md="4" lg="3" class="pa-0 ma-0 hidden-sm-and-down">
          <v-img
            class="hidden-sm-and-down"
            src="/assets/flags/any-large.webp"
            lazy-src="/assets/flags/any-small.webp"
            :gradient="'to right, transparent, ' + $vuetify.theme.current.colors.surface"
            alt="{{build.civ}}"
            cover
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="grey lighten-5"></v-progress-circular>
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
            <v-chip class="mr-2 mb-2" v-if="build.isDraft" label color="error" size="small"
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
              label
              size="small"
              color="accent"
              :to="{
                name: 'Builds',
                query: { author: build.authorUid },
              }"
              ><v-icon start icon="mdi-account-edit"></v-icon>{{ build.author }}</v-chip
            >
            <v-chip
              class="mr-2 mb-2"
              v-if="build.civ"
              label
              color="accent"
              size="small"
              :to="{ name: 'Builds', query: { civ: build.civ } }"
              clickable
            >
              <v-icon start icon="mdi-earth"></v-icon>{{ getCivById(build.civ)?.title }}
            </v-chip>
            <v-chip color="accent" class="mr-2 mb-2" v-if="build.season" label size="small"
              ><v-icon start icon="mdi-trophy"></v-icon>{{ build.season }}</v-chip
            >
            <v-chip class="mr-2 mb-2" v-if="build.creatorId" variant="plain" size="small"
              ><v-icon color="accent" start icon="mdi-youtube"></v-icon
              >{{ build.creatorName }}</v-chip
            >
          </v-item-group>
          <v-item-group class="ml-4 hidden-sm-and-down">
            <v-chip class="mr-2 mb-2" color="accent" v-if="build.map" label size="small"
              ><v-icon start icon="mdi-map"></v-icon>{{ build.map }}</v-chip
            >
            <v-chip color="accent" class="mr-2 mb-2" v-if="build.strategy" label size="small"
              ><v-icon start icon="mdi-strategy"></v-icon>{{ build.strategy }}</v-chip
            >
          </v-item-group>
          <v-item-group class="ml-4 hidden-sm-and-down">
            <v-chip class="mr-2 mb-2" label size="small" v-show="build.views">
              <v-icon start icon="mdi-eye"></v-icon>{{ build.views }}</v-chip
            >
            <v-chip v-if="build.comments > 0" class="mr-2 mb-2" label size="small"
              ><v-icon start icon="mdi-message"></v-icon>{{ build.comments }}</v-chip
            >
            <v-chip v-show="build.upvotes" class="mr-2 mb-2" label size="small">
              <v-icon start icon="mdi-thumb-up"></v-icon>
              {{ build.upvotes }}</v-chip
            >
            <v-chip class="mr-2 mb-2" v-if="build.timeCreated" label size="small"
              ><v-icon start icon="mdi-clock-edit-outline"></v-icon
              >{{ timeSince(build.timeCreated.toDate()) }}</v-chip
            >
            <v-chip class="mr-2 mb-2" v-if="build.timeCreated" label size="small"
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
              v-if="userData"
              v-model="userData"
              :buildId="build.id"
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
              <Favorite v-if="userData" v-model="userData" :buildId="build.id"></Favorite>
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
                      <v-icon color="accent" class="mr-4">mdi-content-duplicate</v-icon>
                      Duplicate Build
                    </v-list-item>
                  </template>
                </v-tooltip>
                <v-list-item v-if="clipboardIsSupported" @click="handleCopyOverlayFormat">
                  <v-tooltip>
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Copy RTS Overlay / AoE4 Overlay Format to Clipboard</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-icon color="accent" class="mr-5" v-bind="props">mdi-content-copy </v-icon>
                      <v-list-item-content
                        :style="'color: ' + $vuetify.theme.current.colors.primary"
                        v-bind="props"
                        >Copy to Clipboard</v-list-item-content
                      >
                    </template>
                  </v-tooltip>
                  <v-tooltip location="top">
                    <span
                      :style="{
                        color: $vuetify.theme.current.colors.primary,
                      }"
                      >Visit AoE4 Overlay Project Page</span
                    >
                    <template v-slot:activator="{ props }">
                      <v-icon
                        v-bind="props"
                        size="small"
                        @click="
                          (e) => {
                            e.stopPropagation();
                            window
                              .open('https://github.com/FluffyMaguro/AoE4_Overlay', '_blank')
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
                    >Download RTS Overlay / AoE4 Overlay File</span
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
                    >Open build order as overlay on RTS Overlay website</span
                  >
                  <template v-slot:activator="{ props }">
                    <v-list-item
                      :style="'color: ' + $vuetify.theme.current.colors.primary"
                      v-bind="props"
                      @click="handleOpenInOverlayTool"
                    >
                      <v-icon color="accent" class="mr-4">mdi-button-cursor</v-icon>
                      Open in RTS Overlay
                    </v-list-item>
                  </template>
                </v-tooltip>
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
      <v-card-text style="white-space: pre-line">{{ build.description }}</v-card-text>
    </v-card>

    <BuildOrderEditor
      :steps="build.steps"
      :readonly="true"
      :civ="build.civ"
      :focus="focusMode"
      @activateFocusMode="focusDialog = true"
    ></BuildOrderEditor>

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
//External
import { ref, onMounted, computed } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";

//components
import Favorite from "@/components/Favorite.vue";
import FocusMode from "@/components/builds/FocusMode.vue";
import Vote from "@/components/Vote.vue";
import BuildOrderEditor from "@/components/builds/BuildOrderEditor.vue";
import Discussion from "@/components/Discussion.vue";
import BuildNotFound from "@/components/notifications/BuildNotFound.vue";

//composables
import { getUserFavorites } from "@/composables/data/favoriteService";
import {
  incrementViews as incrementContributorViews,
  decrementBuilds,
  decrementViews,
} from "@/composables/data/contributorService";
import {
  getBuild,
  deleteBuild,
  incrementViews,
  updateBuild,
  error,
} from "@/composables/data/buildService";
import { civs as allCivs, getCivById } from "@/composables/filter/civDefaultProvider";
import useTimeSince from "@/composables/useTimeSince";
import useExportOverlayFormat from "@/composables/converter/useExportOverlayFormat";
import useCopyToClipboard from "@/composables/converter/useCopyToClipboard";
import useDownload from "@/composables/converter/useDownload";

export default {
  name: "BuildDetails",
  components: {
    Favorite,
    Vote,
    Discussion,
    BuildOrderEditor,
    FocusMode,
    BuildNotFound,
  },
  props: ["id"],
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const user = computed(() => store.state.user);
    const civs = allCivs.value;
    const build = ref(null);
    const deleteDialog = ref(false);
    const focusDialog = ref(false);
    const { convert } = useExportOverlayFormat();
    const { copyToClipboard, copyToClipboardSupported } = useCopyToClipboard();
    const { download } = useDownload();
    const { timeSince, isNew } = useTimeSince();
    const userData = ref(null);
    const loading = ref(true);
    const focusMode = ref(false);
    const clipboardIsSupported = ref(false);

    onMounted(async () => {
      var resBuild = null;
      if (props.id in store.state.cache.builds) {
        //Build found in store
        resBuild = store.state.cache.builds[props.id];
      } else {
        //"Build not found in store, fetching from firestore"
        resBuild = await getBuild(props.id);
      }
      if (resBuild) {
        //Get user data (favorites and likes)
        if (user.value) {
          userData.value = await getUserFavorites(user.value.uid);
        }

        build.value = resBuild;
        document.title = build.value.title + " - " + document.title;
        incrementViews(props.id);

        //icrement contributor views
        incrementContributorViews(build.value.authorUid);
      }
      if (route.query) {
        focusMode.value = route.query.focus;
      }

      clipboardIsSupported.value = await copyToClipboardSupported();
      loading.value = false;
    });

    const swipe = async (dir) => {
      switch (dir) {
        case "Up":
          store.commit("setShowBottomNavigation", false);
          break;
        case "Down":
          store.commit("setShowBottomNavigation", true);
          break;
      }
    };

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
        comments: 0,
        scoreAllTime: 0,
        timeCreated: null,
        timeUpdated: null,
      };

      store.commit("setTemplate", template);
      router.push({ name: "BuildNew" });
    };

    const handleDelete = async () => {
      await deleteBuild(props.id);
      console.log("error", error.value);

      if (!error.value) {
        store.dispatch("showSnackbar", {
          text: `Build order deleted!`,
          type: "success",
        });

        //decrement build count of contributor object
        decrementBuilds(build.value.authorUid);

        //icrement contributor views
        decrementViews(build.value.authorUid, build.value.views + 1);

        //Reset cache
        store.commit("setRecentBuildsList", null);
        store.commit("removeBuild", props.id);

        //workaround, since router.go(-1) does not work
        const previousRoute = window.history.state.back;
        router.push(previousRoute ? previousRoute : "/");
      }
      deleteDialog.value = false;
    };

    const handlePublish = async () => {
      build.value.isDraft = false;
      await updateBuild(props.id, build.value, true);

      //Navigate to new build order
      if (!error.value) {
        store.dispatch("showSnackbar", {
          text: `Draft published successfully!`,
          type: "success",
        });
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

    const handleOpenInOverlayTool = (e) => {
      e.stopPropagation();
                      const buildOrderId = build.value.id;
                      const url = `https://rts-overlay.github.io/?gameId=aoe4&buildOrderId=aoe4guides|${buildOrderId}`;
                      window
                        .open(url, '_blank')
                        .focus();
    };

    return {
      build,
      props,
      user,
      userData,
      loading,
      civs,
      swipe,
      focusMode,
      getCivById,
      deleteDialog,
      focusDialog,
      window,
      handlePublish,
      handleDelete,
      handleDuplicate,
      handleCopyOverlayFormat,
      handleDownloadOverlayFormat,
      handleOpenInOverlayTool,
      timeSince,
      isNew,
      clipboardIsSupported,
    };
  },
};
</script>
