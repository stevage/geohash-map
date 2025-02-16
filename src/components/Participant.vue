<script setup lang="ts">
import WikiPage from '@/components/WikiPage.vue'
import HashStats from '@/components/HashStats.vue'
</script>

<template lang="pug">
#Participant
  HashStats(v-show="!participant && active" :active="active")
  div(v-if="participant")
    div(style="display: flex; flex-direction:row")
      h3(style="flex-grow:1") {{ participant }}
      .close.pointer(style="flex-grow:0; " @click="participant=''") ×
    div(v-if="expeditions" style="max-height:200px; overflow-y:auto")
      p.mt1 {{ expeditions.length }} expeditions {{ expeditions.slice(-1)?.[0]?.properties?.id?.slice(0,4) }} — {{ expeditions[0]?.properties?.id?.slice(0,4) }}
        span.pointer(v-if="!showList" @click="showList=true") (Show list...)

      table.expeditions(v-if="showList")
        thead
          tr
            th Date
            th.pr4 Graticule
            th Reached
        tbody
          tr.pointer(v-for="expedition in expeditions" @click="clickExpedition(expedition)")
            //- td {{ expedition.expedition }}
            //- td {{ expedition.date }}
            td.pr4 {{ expedition.properties.id.slice(0, 10) }}
            td {{ expedition.properties.graticule }}
            td.green {{ expedition.properties.success ? /* green check mark */ '✓' : /* red cross mark */ '' }}
    WikiPage.mt3(:pageId="`user:${participant}`")

</template>

<script lang="ts">
import { setSelectedParticipant } from '@/mapping/mappingParticipants'
import { getExpeditionsByParticipant } from '@/mapping/mappingParticipants'
import { EventBus } from '@/EventBus'
import { getUrlParam } from '@/util'
export default {
  data: () => ({ participant: getUrlParam('participants'), expeditions: [], showList: true }),
  props: ['active'],
  created() {
    window.app.Participant = this
    // close unicode symbol
    EventBus.$on('map-loaded', () => {
      this.updateParticipant()
    })
  },
  methods: {
    clickExpedition(expedition) {
      EventBus.$emit('select-feature', expedition)
      window.map.flyTo({ center: expedition.geometry.coordinates, zoom: 8 })
    },
    async updateParticipant() {
      setSelectedParticipant(this.participant || '')
      if (this.participant) {
        const eByP = await getExpeditionsByParticipant(this.participant)
        this.expeditions = [...eByP[this.participant].expeditions].reverse()
      } else {
        this.expeditions = []
      }
    },
  },
  watch: {
    participant: {
      // immediate: true,
      async handler() {
        this.updateParticipant()
      },
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

.expeditions td {
  font-size: 11px;
}
.expeditions th {
  text-align: left;
}
</style>
