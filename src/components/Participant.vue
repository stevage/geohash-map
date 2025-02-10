<script setup lang="ts">
import WikiPage from '@/components/WikiPage.vue'
import HashStats from '@/components/HashStats.vue'
</script>

<template lang="pug">
#Participant
  HashStats(v-show="!participant")
  div(v-if="participant")
    div(style="display: flex; flex-direction:row")
      h3(style="flex-grow:1") {{ participant }}
      .close.pointer(style="flex-grow:0; " @click="participant=''") ×
    WikiPage(:pageId="`user:${participant}`")

</template>

<script lang="ts">
import { setSelectedParticipant } from '@/mapping/mappingParticipants'
export default {
  data: () => ({ participant: null }),
  created() {
    window.app.Participant = this
    // close unicode symbol
  },
  watch: {
    participant() {
      setSelectedParticipant(this.participant || '')
    },
  },
}
</script>

<style scoped>
.close {
  font-size: 28px;
  font-weight: 400;
  transition: font-weight 0.2s;
}
.close:hover {
  /* font-size: 32px; */
  font-weight: 900;
}
</style>
