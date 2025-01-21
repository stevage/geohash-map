<template lang="pug">
#Chart-container.absolute.w100(v-show="showing" :class="{ opaque: translucentBackground || chartStyle!=='bin'}" @click="translucentBackground =!translucentBackground")
  #chart-legend
  #chart
</template>

<script lang="ts">
// import Chart from 'chartjs';
import * as Plot from '@observablehq/plot'
import { EventBus } from '@/EventBus'
import * as d3 from 'd3'
import type { UtilsMap } from 'map-gl-utils'
import type { Expedition } from '@/mapping/expeditions/expeditionsData'
export default {
  name: 'Chart',
  data: () => ({
    xAxis: 'byWeek',
    showing: false, //!!window.location.host.match(/localhost/),
    chartStyle: null,
    translucentBackground: true,
    expeditions: null as Expedition[] | null,
  }),
  async created() {
    window.Chart = this
    EventBus.$on('map-loaded', (map: UtilsMap) => map.on('moveend', () => this.update(map)))
    EventBus.$on('chart-options-change', async (options: { showChart: boolean }) => {
      this.showing = options.showChart
      await this.$nextTick()
      this.update(window.map)
    })
  },
  mounted() {},

  methods: {
    binChart(expeditions, { chartId, interval, fill, x }: any, chartOptions: any) {
      const scheme = {
        participantsCount: 'turbo',
        graticuleLatitude: 'rdylbu',
        graticuleLongitude: 'rdylbu',
        success: undefined, //'set1',
      }[chartId]

      const plotInterval = {
        month: d3.utcMonth,
        week: d3.utcWeek,
        day: d3.utcDay,
        year: d3.utcYear,
      }[interval]

      if (x === 'date' || x === 'dayOf2008') {
        x = { value: x, interval: plotInterval }
      } else {
        x = { value: x, interval: 1 }
      }

      console.log(x)
      const plotEl = Plot.plot({
        color:
          {
            participantsCount: {
              type: 'threshold',
              domain: d3.range(0, 8),
              scheme,
            },
          }[chartId] || (scheme ? { scheme } : undefined),

        marks: [
          Plot.rectY(
            expeditions,
            Plot.binX(
              {
                y: 'count',
              },
              {
                x,
                fill,
                inset: 0,
                stroke: 'transparent',
                strokeWidth: 0,
              },
            ),
          ),
        ],
        // strokeWidth: 0 // wish this worked - not sure where it would go
        ...chartOptions,
      })
      let legendEl
      if (chartId === 'participantsCount') {
        legendEl = Plot.legend({
          color: {
            type: 'threshold',
            domain: d3.range(0, 8),
            scheme,
          },
          label: 'Particpants',
          style: { color: 'white', background: 'transparent' },
        })
        // } else if (chartId === 'success') {
        //     legendEl = Plot.legend({
        //         color: {
        //             scheme,
        //             type: 'ordinal',
        //             domain: [0, 1],
        //         },
        //         style: { color: 'white', background: 'transparent' },
        //         label: {
        //             success: 'Success',
        //             graticuleLongitude: 'Graticule longitude',
        //             graticuleLatitude: 'Graticule latitude',
        //             weekDay: '',
        //         }[chartId],
        //     });
        //
      } else {
        legendEl = plotEl.legend('color', {
          style: { color: 'white', background: 'transparent' },
          label: {
            success: 'Success',
            graticuleLongitude: 'Graticule longitude',
            graticuleLatitude: 'Graticule latitude',
            weekDay: '',
          }[chartId],
        })
      }
      this.chartStyle = 'bin'

      return { legendEl, plotEl }
    },
    barChart(expeditions, { chartId, x, y, interval /*fill*/ }, chartOptions) {
      debugger
      // interval = 'week';
      const plotInterval = {
        month: d3.utcMonth,
        week: d3.utcWeek,
        day: d3.utcDay,
        year: d3.utcYear,
      }[interval]
      console.log(interval)
      const months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')
      const plotEl = Plot.plot({
        x: {
          label: null,
          interval: plotInterval,
          tickFormat: (d) =>
            // `${Math.floor(d / 12)}-${('0' + (d % 12)).slice(-2)}`,
            `${months[d % 12]} ${Math.floor(d / 12)}`,
        },
        // y: {
        //     // grid: true,
        // },
        marks: [
          Plot.barY(expeditions, {
            // x: {
            //     value: x,
            //     // interval: plotInterval,
            //     // transform: (x) => x.left(7),
            // },
            x: x,
            y,
            fill: y, //'red',
            inset: 0,
            // length: y,
            // inset: 0,
            // stroke: 'transparent',
            // strokeWidth: 0,
          }),
          Plot.ruleY([0]),
        ],
        ...chartOptions,
        color: {
          scheme: 'turbo',
        },
      })
      console.log(expeditions)
      const legendEl = plotEl.legend('color', {
        style: { color: 'white', background: 'transparent' },
        label: {
          success: 'Success',
          graticuleLongitude: 'Graticule longitude',
          graticuleLatitude: 'Graticule latitude',
          weekDay: '',
        }[chartId],
      })
      this.chartStyle = 'bar'

      return { legendEl, plotEl }
    },

    scatterChart(expeditions: Expedition[], { /*chartId, */ r, x, y /*fill*/ }, chartOptions) {
      const plotEl = Plot.plot({
        marks: [
          Plot.dot(expeditions, {
            x,
            y,
            fill: 'longitude',
            r: r === 'participantsCount' ? (f) => f.participantsCount ** 0.75 + 1 : undefined,
            strokeWidth: (f) => (f.participantsCount > 3 ? 1 : 0),
            stroke: 'hsla(0,0%,0%,0.5)',
            title: (f) =>
              f.graticuleNameShort + ' ' + f.id.slice(0, 10) + '\n' + JSON.parse(f.participants),
          }),
        ],
        r: {
          type: 'identity',
        },

        ...chartOptions,
        color: {
          scheme: 'rdylbu',
        },
        x: {
          grid: true,
        },
      })
      const legendEl = plotEl.legend('color', {
        style: { color: 'white', background: 'transparent' },
      })
      this.chartStyle = 'scatter'
      return { plotEl, legendEl }
    },
    cellChart(expeditions, { /*chartId,*/ x, y }, chartOptions) {
      const plotEl = Plot.plot({
        marks: [
          Plot.cell(expeditions, {
            x,
            y,
          }),
        ],
        ...chartOptions,
        x: {
          grid: true,
        },
      })
      this.chartStyle = 'cell'
      return { plotEl }
    },
    initChart(expeditions: Expedition[]) {
      const options = window.ChartControls.options
      const settings = window.ChartControls.selectedSettings
      const chartOptions = {
        background: '#222',
        width: document.getElementById('chart').getClientRects()[0].width,
        height: document.getElementById('Chart-container').getClientRects()[0].height - 50,

        style: {
          background: 'transparent',
          color: 'white',
        },
      }
      const chartTypeFunc = this[`${settings.type}Chart`]
      const { legendEl, plotEl } = chartTypeFunc(
        expeditions,
        { ...options, ...settings },
        chartOptions,
      )

      document.getElementById('chart')?.replaceChildren(plotEl)
      if (legendEl) {
        document.getElementById('chart-legend')?.replaceChildren(legendEl)
      }
    },
    update(map: UtilsMap) {
      if (!this.showing) return
      const ids = {}
      this.expeditions = map
        .queryRenderedFeatures({
          layers: ['expeditions-circles'],
        })
        .filter((f) => {
          // sigh, there are duplicates
          if (ids[f.properties.id]) return false
          ids[f.properties.id] = true
          return true
        })
        .map((e) => ({
          ...e.properties,
          week: Math.round(e.properties.days / 7),
          date: new Date(e.properties.id.slice(0, 10)),
        }))
      try {
        this.initChart(this.expeditions)
      } catch (e) {
        console.error(e)
      }
    },
  },
}
</script>

<style scoped>
#Chart-container {
  background: hsla(0, 0%, 0%, 0.1);
  height: min(min(450px, 45vh), 40vw);
  width: 100%;
  bottom: 30px;
  border: 1px solid #000;
}

#Chart-container.opaque {
  background: hsla(0, 0%, 0%, 1);
}

#chart-legend {
  height: 50px;
}
</style>
