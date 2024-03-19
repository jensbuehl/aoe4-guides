<template>
    <v-tooltip location="top">
        <span
            :style="{
                color: $vuetify.theme.current.colors.primary,
            }"
            >I like! This is a good one!</span
        >
        <template v-slot:activator="{ props }">
            <v-btn
                @click="handleAddVoteUp"
                v-bind="props"
                v-show="!upVote"
                color="accent"
                variant="text"
                icon="mdi-thumb-up-outline"
            ></v-btn>
        </template>
    </v-tooltip>
    <v-tooltip location="top">
        <span
            :style="{
                color: $vuetify.theme.current.colors.primary,
            }"
            >Remove your like</span
        >
        <template v-slot:activator="{ props }">
            <v-btn
                class="ml-0"
                @click="handleRemoveVoteUp"
                v-show="upVote"
                v-bind="props"
                color="accent"
                variant="text"
                icon="mdi-thumb-up"
            ></v-btn>
        </template>
    </v-tooltip>
    <v-tooltip location="top">
        <span
            :style="{
                color: $vuetify.theme.current.colors.primary,
            }"
            >Downvote! Villagers need to improve this build!</span
        >
        <template v-slot:activator="{ props }">
            <v-btn
                @click="handleAddVoteDown"
                v-bind="props"
                v-show="!downVote"
                color="accent"
                variant="text"
                icon="mdi-thumb-down-outline"
            ></v-btn>
        </template>
    </v-tooltip>
    <v-tooltip location="top">
        <span
            :style="{
                color: $vuetify.theme.current.colors.primary,
            }"
            >I changed my mind. This build is pretty neat!</span
        >
        <template v-slot:activator="{ props }">
            <v-btn
                @click="handleRemoveVoteDown"
                v-show="downVote"
                v-bind="props"
                color="accent"
                variant="text"
                icon="mdi-thumb-down"
            ></v-btn>
        </template>
    </v-tooltip>
</template>

<script>
//External
import { onMounted, ref } from "vue";

//Composables
import {
    addUpvote,
    removeUpvote,
    addDownvote,
    removeDownvote,
} from "@/composables/data/favoriteService";
import {
    incrementDownvotes,
    decrementDownvotes,
    incrementUpvotes,
    decrementUpvotes,
} from "@/composables/data/buildService";

export default {
    name: "Favorites",
    props: ["buildId", "modelValue"],
    emits: ["voteUpAdded", "voteUpRemoved"],
    setup(props, context) {
        const upVote = ref(false);
        const downVote = ref(false);
        const userId = ref(props.modelValue?.uid);

        onMounted(async () => {
            const user = props.modelValue;
            userId.value = user?.id;
            if (user.upvotes?.includes(props.buildId)) {
                upVote.value = user.upvotes?.includes(props.buildId);
            }

            if (user.downvotes?.includes(props.buildId)) {
                downVote.value = user.downvotes?.includes(props.buildId);
            }
        });
        const handleAddVoteUp = async () => {
            incrementUpvotes(props.buildId);
            addUpvote(userId.value, props.buildId);
            upVote.value = !upVote.value;
            context.emit("voteUpAdded");

            removeDownVote();
        };
        const handleRemoveVoteUp = async () => {
            removeUpVote();
        };
        const handleAddVoteDown = async () => {
            incrementDownvotes(props.buildId);
            addDownvote(userId.value, props.buildId);
            downVote.value = !downVote.value;

            removeUpVote();
        };

        const handleRemoveVoteDown = async () => {
            removeDownVote();
        };

        const removeUpVote = () => {
            if (upVote.value) {
                decrementUpvotes(props.buildId);
                removeUpvote(userId.value, props.buildId);
                upVote.value = !upVote.value;
                context.emit("voteUpRemoved");
            }
        };

        const removeDownVote = () => {
            if (downVote.value) {
                decrementDownvotes(props.buildId);
                removeDownvote(userId.value, props.buildId);
                downVote.value = !downVote.value;
            }
        };

        return {
            props,
            downVote,
            upVote,
            handleAddVoteUp,
            handleRemoveVoteUp,
            handleAddVoteDown,
            handleRemoveVoteDown,
        };
    },
};
</script>
