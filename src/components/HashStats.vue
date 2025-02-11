<template lang="pug">
#HashStats
  //-   h3.mb1 Stats
  .group
    //- label
    //-     input.mr2(type="checkbox" v-model="showStats")
    //-     | Show stats
    div(v-show="showStats")
        //- div (Based on visible area)
        h3.mb1 In this area
        //- ol
        //-   li(v-for="hasher in topHashers.slice(0,5)") {{ hasher.name }} ({{ hasher.success }} + {{ hasher.fail }} = {{ hasher.success + hasher.fail }})
        div(style="max-height:300px; overflow-y:scroll")
          table.mt3
            tbody
                tr
                    th.tl.pv2 Name
                    th Success
                    th Fail
                    th Total
                tr(v-for="hasher in topHashers.slice(0, listSize)")
                    td
                      a.prevent(href="#" @click="clickHasher(hasher.name)") {{ hasher.name }}
                      //- a(:href="`https://geohashing.site/geohashing/User:${hasher.name}`") {{ hasher.name }}
                    td {{ hasher.success }}
                    td {{ hasher.fail }}
                    td {{ hasher.success + hasher.fail }}

</template>

<script>
import { EventBus } from '@/EventBus'
import { getDB } from '@/mapping/expeditions/expeditionIndex'
import { report } from '@/util'
export default {
  name: 'HashStats',
  data: () => ({ expeditions: [], showStats: true, topHashers: [], listSize: 1000 }),
  created() {
    window.HashStats = this
    EventBus.$on('map-loaded', (map) => {
      this.update(map)
      map.on('moveend', () => this.update(map))
    })
  },
  mounted() {},
  methods: {
    clickHasher(participant) {
      window.app.Participant.participant = participant
    },
    async update(map) {
      console.log('update')
      if (this.showStats) {
        //TODO filter for unique features
        report('update hash stats', async () => {
          const db = await getDB()
          console.log(db)
          // this.expeditions = db.getExpeditionsInViewport(map)
          this.expeditions.splice(0, this.expeditions.length, ...db.getExpeditionsInViewport(map))
          console.log(this.expeditions)
          this.updateTopHashers()
        })
        // this.expeditions = map.queryRenderedFeatures({
        //   layers: ['expeditions-circles'],
        // })
      }
    },
    updateTopHashers() {
      const hashers = {}
      for (const expedition of this.expeditions) {
        for (const p of expedition.properties.participants) {
          hashers[p] = hashers[p] || { success: 0, fail: 0 }
          hashers[p][expedition.properties.success ? 'success' : 'fail']++
        }
      }
      const hashList = Object.entries(hashers)
        .map(([name, props]) => ({ name, ...props }))
        .sort((a, b) => b.success - a.success)
      window.topHashers = hashList
      this.topHashers = hashList
    },
  },
  computed: {
    // topHashers() {
    //   // if (this.expeditions.length > 1000) {
    //   //     return [];
    //   // }
    // },
  },
}
</script>

<style scoped>
#HashStats {
  background: #333;
}
table {
  font-size: 14px;
}

a,
a:visited {
  text-decoration: none;
  color: hsl(230, 40%, 70%);
}
a:hover {
  color: hsl(230, 40%, 80%);
  text-decoration: underline;
}

th {
  font-weight: 550;
  color: #eee;
}
</style>
