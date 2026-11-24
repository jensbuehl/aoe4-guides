<template>
    <v-tooltip location="top">
        <span
            :style="{
                color: $vuetify.theme.current.colors.primary,
            }"
            >{{ upVote ? "Remove your upvote" : "I like! This is a good one!" }}</span
        >
        <template v-slot:activator="{ props: tooltipProps }">
            <v-btn
                @click="toggle"
                v-bind="tooltipProps"
                :loading="pending"
                :aria-pressed="upVote"
                :aria-label="upVote ? 'Remove your upvote' : 'Upvote this build'"
                color="accent"
                variant="text"
                :icon="upVote ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
            ></v-btn>
        </template>
    </v-tooltip>
</template>

<script>
//External
import { computed, ref } from "vue";
import { useStore } from "vuex";

//Composables
import { setReaction } from "@/composables/data/reactionService";
import { useVerificationGuard } from "@/composables/auth/useVerificationGuard";
import { reactionErrorMessage } from "@/composables/data/reactionMessages";

// Thumbs-up only. Downvoting was removed in spec 042: 151 downvotes in the
// site's history, shown nowhere, yet each one weighed −10 in the trending
// score — an invisible lever against a new build. The stored values are frozen.
export default {
    name: "Vote",
    // modelValue: the reader's lists document, shared with Favorite and with
    // the other mounted copy of this button. count: the build's `upvotes`.
    props: ["buildId", "modelValue", "count"],
    emits: ["voteUpAdded", "voteUpRemoved"],
    setup(props, context) {
        const store = useStore();
        const { assertVerified } = useVerificationGuard();

        // Shared state, not a private ref: see Favorite.vue.
        const upVote = computed(() => props.modelValue?.upvotes?.includes(props.buildId) ?? false);
        const pending = ref(false);

        const toggle = async () => {
            if (pending.value) return;
            const on = !upVote.value;
            if (on && !assertVerified()) return;

            pending.value = true;
            try {
                await setReaction({
                    uid: props.modelValue.id,
                    buildId: props.buildId,
                    list: "upvotes",
                    on,
                    currentCount: props.count,
                });
                if (!Array.isArray(props.modelValue.upvotes)) props.modelValue.upvotes = [];
                const list = props.modelValue.upvotes;
                if (on) list.push(props.buildId);
                else list.splice(0, list.length, ...list.filter((id) => id !== props.buildId));
                context.emit(on ? "voteUpAdded" : "voteUpRemoved");
            } catch (err) {
                console.error("Vote: upvote not recorded:", err?.code, err?.message);
                store.dispatch("showSnackbar", { text: reactionErrorMessage(err), type: "error" });
            } finally {
                pending.value = false;
            }
        };

        return {
            upVote,
            pending,
            toggle,
        };
    },
};
</script>
