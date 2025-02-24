<template lang="pug">
#GraticuleInfo.bt.b--gray(v-if="info")
  a(target="_blank" :href="`https://geohashing.site/geohashing/${info.graticule.properties.y },${info.graticule.properties.x}`")
    h3 {{ info.graticule.properties.name }} ({{ info.graticule.properties.y }}, {{ info.graticule.properties.x }})
  p Total area: {{ Math.round(info.area /1e6).toLocaleString() }} km<sup>2</sup>. {{ percentWater }} % water.


  GraticuleRecords(v-if="info" :info="info.graticule.properties")

  div.h5.overflow-y-scroll
    h3 {{ expeditions.length }} expeditions
    div(v-if="expeditions.length")
      table#expeditions-table
        tbody
            //- tr.left
                th.tl
                th.tl Date
            //- th.tl Pax
                th.tl Who
            //- tr(v-for="expedition in expeditions")
            tr(v-for="expedition in [...expeditions].reverse()")

                td.f7.pr2
                    a(target="_blank" :href="expLink(expedition)") {{ expedition.properties.success ? '✔' : '✖' }}

                td.f7.pr2(style="min-width: 7em")
                    a(target="_blank" :href="expLink(expedition)") {{ expedition.properties.id.slice(0,10) }}
                //- td {{ expedition.properties.participants.length }}
                td.f7
                    a(target="_blank" :href="expLink(expedition)") {{ expedition.properties.participantsString }}
      .dib.ma2.mt4.pa2.ba.b--grey.f6.grey.pointer(@click="copyExpeditions") Copy table for wiki
    div(v-else) Locked graticule!
  div.mt4.f7.overflow-y-scroll.h4
    table
      thead
        th.tl Year
        th.tl Success
        th.tl Attempt rate
      tbody
        tr(v-for="year of Object.keys(statsByYear).sort().reverse()")
          td.pr4 {{ year }}
          td.pr4 {{ statsByYear[year].success }} of {{ statsByYear[year].total }}
          td {{ statsByYear[year].attemptRate }}%
  div.mt4.overflow-y-scroll.h5
    WikiPage(:pageId="`${info.graticule.properties.name}`")
</template>

<script lang="ts">
import { EventBus } from '@/EventBus'
import GraticuleRecords from '@/components/GraticuleRecords.vue'
import WikiPage from '@/components/WikiPage.vue'
import { setUrlParam } from '@/util'
import { Feature } from 'geojson'

import { expeditionsByGraticule } from '@/mapping/graticules/graticuleStats'
import { Temporal } from 'temporal-polyfill'

type Info = {
  graticule: {
    properties: {
      id: string
      name: string
      x: number
      y: number
    }
  }
  area: number
  uses: Record<string, { area: number }>
  other: number
}
export default {
  name: 'GraticuleInfo',
  data: () =>
    ({
      info: undefined,
      expeditions: [] as Feature[],
    }) as { info: Info | undefined },
  components: { GraticuleRecords, WikiPage },
  created() {
    EventBus.$on('show-graticule-info', (info: Info) => (this.info = info))
  },
  computed: {
    uses() {
      return Object.entries((this.info as Info).uses)
        .sort((a, b) => b[1].area - a[1].area)
        .filter(([key, use]) => use.area > 5e6)
    },
    percentWater() {
      return (((this.info.uses.water?.area || 0) / this.info.area) * 100).toFixed(1)
    },
    statsByYear() {
      const stats = {} as Record<string, { success: number; total: number; days: number }>
      for (const exp of this.expeditions) {
        const year = exp.properties.id.slice(0, 4)
        if (!stats[year]) stats[year] = { success: 0, total: 0, days: 0 }
        stats[year].total++
        if (exp.properties.success) stats[year].success++

        // calculate days in that year. 365, or 365 for leap years. if current year, use days up to now
        // don't use getDayOfYear(), use temporal

        if (new Date().getFullYear() === Number(year)) {
          const today = Temporal.Now.plainDateISO()
          const firstDayOfYear = today.with({ month: 1, day: 1 })
          stats[year].days = today.since(firstDayOfYear).days
        } else {
          stats[year].days = +year % 4 === 0 ? 366 : 365
        }
        stats[year].attemptRate = ((stats[year].total / stats[year].days) * 100).toFixed(1)

        // stats[year].days = new Date().getFullYear() === Number(year) ? new Date().getDayOfYear() : 365
      }
      return stats
    },
  },

  methods: {
    async copyExpeditions() {
      const es = [...this.expeditions].reverse()
      const text = es
        .map((expedition, i) => {
          const p = expedition.properties
          const date = p.id.slice(0, 10)
          const weekday = new Date(date).toLocaleString('default', {
            weekday: 'long',
          })
          const month = new Date(date).toLocaleString('default', { month: 'long' }).slice(0, 3)
          const joinWithAnd = (arr: string[]) => {
            if (arr.length === 1) return arr[0]
            return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`
          }
          const participants = joinWithAnd(p.participants.map((p: string) => `[[User:${p}|${p}]]`))
          const arrow = p.success ? 'Arrow2.png' : 'Arrow4.png'
          let text = `[[Image:${arrow}|12px]] ${month} [[${p.id}]] ${weekday} – ${participants}.<br/>`
          if (i === 0 || p.year !== es[i - 1].properties.year) {
            text = `=== ${p.year} ===\n${text}`
          }
          return text
        })
        .join('\n')
      try {
        await navigator.clipboard.writeText(text)
        console.log('Content copied to clipboard')
      } catch (err) {
        console.error('Failed to copy: ', err)
      }
    },
    expLink(exp: Feature) {
      return `https://geohashing.site/geohashing/${exp.properties.id}`
    },
  },
  watch: {
    async info() {
      const id = this?.info?.graticule?.properties?.id
      setUrlParam('graticule', id)
      this.expeditions = (await expeditionsByGraticule())[id] || []
    },
  },
}
/*
//-   table
//-     tr
//-       th.tl Landuse
//-       th.tr.pl3 Area (km<sup>2</sup>)
//-       th.tr.pl3 Proportion
//-     tr(v-for="([key, use]) of uses")
//-       td(style="text-transform:capitalize") {{ key }}
//-       td.tr {{ Math.round(use.area /1e6).toLocaleString() }}
//-       td.tr {{ (use.area / info.area * 100).toFixed(1) }}%
//-     tr
//-       td(style="text-transform:capitalize") Other
//-       td.tr {{ Math.round(info.other /1e6).toLocaleString() }}
//-       td.tr {{ (info.other / info.area * 100).toFixed(1) }}%

//-   p.f7.mt4 This breakdown is made by querying the basemap directly. The whole graticule must be within the viewport, and will be more accurate when zoomed in further. Only the "water" type is reliable.
//-   p.f7 See <a href="https://docs.mapbox.com/data/tilesets/reference/mapbox-streets-v8/" target="_blank">Mapbox documentation</a> for the meanings of "Landuse" ("class").*/
</script>

<style scoped>
a {
  color: unset;
  text-decoration: none;
}

a:hover {
  color: unset;
  text-decoration: underline;
}
</style>
