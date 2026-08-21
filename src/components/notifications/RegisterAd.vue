<template>
  <!-- A button, not a card, and deliberately so.

       The header's only auth affordance is an unlabelled avatar icon whose menu
       reads "Log in" — signing up is a text link inside the dialog behind it —
       so this is the only visible mention of an account on the pages that carry
       it. That job is done by the label alone; the pitch paragraph this used to
       carry was 14px medium-emphasis body text in a sidebar, competing with
       News and FundingStatus, which are actual content.

       It stays a lone element because a pitch line plus a button cannot both
       fit one row at md sidebar width (~318px usable), and the wrapped form
       reads as broken layout rather than as two lines. Shortening the text
       until it fits would be tuning against estimated glyph widths — true at
       one font and one theme. Nothing here can wrap: the label is short enough
       to clear even a 320px viewport, and v-btn will not break it anyway.

       Accent border and accent label are load-bearing: FundingStatus.vue
       deliberately uses a plain title so as not to compete with this. -->
  <v-btn
    block
    variant="outlined"
    color="accent"
    rounded="lg"
    prepend-icon="mdi-sword-cross"
    to="/register"
    class="mb-4"
  >
    Create free account
  </v-btn>
</template>

<script>
export default {
  name: "RegisterAd",
};
</script>
