<template>
  <v-container>
    <div
      v-if="
        authIsReady &&
        user &&
        (user.uid === 'beJM1k8sm8TVm5fHQZfKUniL8Hp1' ||
          user.uid === '6mzuhMzRCySxaFcaSrXamwHjVm02')
      "
      class="d-flex justify-center"
    >
      <v-row no-gutters class="fill-height" align="center" justify="center">
        <v-col cols="12" sm="6" lg="4">
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row
              no-gutters
              class="fill-height"
              align="center"
              justify="center"
            >
              <v-col cols="12">
                <v-card-title class="mb-4">Admin Console</v-card-title>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  class="text-grey"
                  name="displayname"
                  label="Display name"
                  type="text"
                  v-model="user.displayName"
                  placeholder="Your display name"
                  readonly
                ></v-text-field>
                <v-text-field
                  class="text-grey"
                  name="email"
                  label="Email"
                  type="email"
                  v-model="user.email"
                  placeholder="Your email"
                  readonly
                ></v-text-field>
                <v-text-field
                  class="text-grey"
                  name="user id"
                  label="User ID"
                  type="text"
                  v-model="user.uid"
                  placeholder="Your user id"
                  readonly
                ></v-text-field>
                <v-card flat v-if="error" rounded="lg" color="error">
                  <v-card-text>{{ error }}</v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
          <v-card flat rounded="lg" class="d-flex align-center mb-4">
            <v-row
              no-gutters
              class="fill-height"
              align="center"
              justify="center"
            >
              <v-col cols="12">
                <v-card-title>Actions</v-card-title>
                <v-btn
                  color="primary"
                  variant="text"
                  @click="addIsDraftProperty()"
                  >Add isDraft property</v-btn
                >
                <div class="ml-4 mb-3">
                  Create isDraft field in all build orders. Defaults to false.
                </div>
                <v-divider></v-divider>
                <v-btn
                  disabled
                  color="primary"
                  variant="text"
                  @click="createCreatorsCollection()"
                  >Create creators collection</v-btn
                >
                <div class="ml-4 mb-3">
                  Create creators collection based on creatorIds in build orders.
                </div>
                <v-divider></v-divider>
                <v-btn
                  disabled
                  color="primary"
                  variant="text"
                  @click="rewriteImages()"
                  >Re-write images in build step</v-btn
                >
                <div class="ml-4 mb-3">
                  Re-writes all images that are included in the build step
                  description. E.g. add tooltips to all existing images or
                  update icons to color-coded variants.
                </div>
                <v-divider></v-divider>
                <v-btn
                  disabled
                  color="primary"
                  variant="text"
                  @click="sanitizeVideoPaths()"
                  >Sanitize video and Extract Creator</v-btn
                >
                <div class="ml-4 mb-3">
                  Validate video URLs, extract video id and re-write embed URL.
                  Extract video creator ID and update build accordingly.
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script>
import getDefaultConfig from "../composables/getDefaultConfig";
import useCollection from "../composables/useCollection";
import queryService from "../composables/queryService";
import useOverlayConversion from "../composables/useOverlayConversion";
import { useStore } from "vuex";
import { ref, computed, onMounted } from "vue";
import useYoutube from "../composables/useYoutube";

export default {
  name: "Admin",
  setup() {
    window.scrollTo(0, 0);

    var builds = null;

    const { getAll, getQuery, getSize, update } = useCollection("builds");
    const { get:getCreator, add:addCreator } = useCollection("creators");
    const {
      convertOverlayNotesToDescription,
      convertDescriptionToOverlayNotes,
    } = useOverlayConversion();
    const error = ref(null);
    const buildsCount = ref(null);
    const store = useStore();
    const filterAndOrderConfig = computed(() => store.state.filterConfig);
    const user = computed(() => store.state.user);
    const {
      extractVideoId,
      buildEmbedUrl,
      getVideoCreatorId,
      getVideoMetaData,
    } = useYoutube();

    onMounted(() => {
      if (!filterAndOrderConfig.value) {
        store.commit("setFilterConfig", getDefaultConfig());
      }
      initData();
    });

    const updateDescription = (description) => {
      //roundtrip export/re-import to update entire description
      const notes = convertDescriptionToOverlayNotes(description);
      const migrated = convertOverlayNotesToDescription(notes);
      return migrated;
    };

    const rewriteImagesUpdateBuild = async (build) => {
      if (build.steps.getSize > 0) console.log("Steps: \n" + build.steps);

      //Update step descriptions
      build.steps?.forEach((element) => {
        console.log("Description (before): \n" + element.description);
        element.description = updateDescription(element.description);
        console.log("Description (after): \n" + element.description);
      });

      //Save to database
      if (!error.value) {
        await update(build.id, build);
      }
    };

    const createCreatorsCollection = async () => {
      const buildsWithVideo = builds.filter((element) => element.video);

      for (const element of buildsWithVideo) {
        console.log("Build id:", element.id);

        //Get creator document
        const creatorDoc = await getVideoMetaData(extractVideoId(element.video))
        console.log("Creator document:", creatorDoc);

        //Add content creator document
        const res = await getCreator(creatorDoc.creatorId);
        console.log(creatorDoc)
        if(!res){
          await addCreator(creatorDoc, creatorDoc.creatorId)
        }
      }
    };

    const addIsDraftProperty = () => {
      console.log("Builds count:", buildsCount.value);

      for (const build of builds){
        console.log("Build:", build.id);

        //Add field
        build.isDraft = false;

        //Save to database
        update(build.id, build);
      };
    };

    const rewriteImages = () => {
      console.log("Builds count:", buildsCount.value);

      builds.forEach((element) => {
        console.log("Build:", element.id);
        rewriteImagesUpdateBuild(element);
      });
    };

    const sanitizeVideoPaths = async () => {
      const buildsWithVideo = builds.filter((element) => element.video);

      for (const element of buildsWithVideo) {
        console.log("Build id:", element.id);

        //update video url
        element.video = buildEmbedUrl(extractVideoId(element.video));
        console.log("clean url:", element.video);

        if (!element.creatorId) {
          element.creatorId = await getVideoCreatorId(
            extractVideoId(element.video)
          );
          console.log(element.creatorId);

          //Save to database
          update(element.id, element);
        }
      }
    };

    const initData = async () => {
      //get builds
      const allDocuments = getQuery(
        queryService.getQueryParametersFromConfig(filterAndOrderConfig.value)
      );

      buildsCount.value = await getSize(allDocuments);

      const res = await getAll(allDocuments);
      builds = res;
    };

    return {
      builds,
      user,
      authIsReady: computed(() => store.state.authIsReady),
      error,
      rewriteImages,
      addIsDraftProperty,
      sanitizeVideoPaths,
      createCreatorsCollection,
      
    };
  },
};
</script>
