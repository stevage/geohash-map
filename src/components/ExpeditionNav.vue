<template lang="pug">
.nav-options
  span.nav-title {{ nav.title }}
  a(v-if="nav.index > 0" href="#" @click="$emit('navigate', -1)") ◀
  span.nav-disabled(v-else) ◀
  span.nav-count
    span.nav-number {{ (nav.index + 1).toLocaleString()}}
    span &nbsp;of&nbsp;
    span.nav-number {{ nav.count.toLocaleString()}}
  a(v-if="nav.index + 1 < nav.count" href="#" @click="$emit('navigate', +1)") ▶
  span.nav-disabled(v-else) ▶
</template>

<script lang="ts">
export default {
  name: 'ExpeditionNav',
  props: ['nav'],
  data: () => ({}),
  created() {},
}
</script>

<style scoped>
.nav-count {
  font-size: 0.6em;
  margin: 0 0.5em;
}
.nav-title {
  display: inline-block;
  margin: 0 0 0 0.5em;
  font-size: 14px;
  min-width: 120px;
}

.nav-disabled {
  color: #666;
}
.nav-number {
  color: #ccc;
  font-weight: 701;
}
</style>
