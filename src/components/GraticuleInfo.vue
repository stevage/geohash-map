<template lang="pug">
#GraticuleInfo.bt.b--gray(v-if="info")
  h3 {{ info.graticule.properties.name }} ({{ info.graticule.properties.y }}, {{ info.graticule.properties.x }})
  //- p Total area: {{ Math.round(info.area /1e6).toLocaleString() }} km<sup>2</sup>
  table
    tr
      th.tl Landuse
      th.tr.pl3 Area (km<sup>2</sup>)
      th.tr.pl3 Proportion
    tr(v-for="([key, use]) of uses")
      td(style="text-transform:capitalize") {{ key }}
      td.tr {{ Math.round(use.area /1e6).toLocaleString() }}
      td.tr {{ (use.area / info.area * 100).toFixed(1) }}%
    tr
      td(style="text-transform:capitalize") Other
      td.tr {{ Math.round(info.other /1e6).toLocaleString() }}
      td.tr {{ (info.other / info.area * 100).toFixed(1) }}%

  p.f7.mt4 This breakdown is made by querying the basemap directly. The whole graticule must be within the viewport, and will be more accurate when zoomed in further. Only the "water" type is reliable.
  p.f7 See <a href="https://docs.mapbox.com/data/tilesets/reference/mapbox-streets-v8/" target="_blank">Mapbox documentation</a> for the meanings of "Landuse" ("class").

  div.h5.overflow-y-scroll
    h3 Expeditions
    table(v-if="expeditions.length")
      //- tr.left
        th.tl
        th.tl Date
        //- th.tl Pax
        th.tl Who
      tr(v-for="expedition in [...expeditions].reverse()")
        td.f7.pr2 {{ expedition.properties.success ? '✔' : '✖' }}

        td.f7.pr2 {{ expedition.properties.id.slice(0,10) }}
        //- td {{ expedition.properties.participants.length }}
        td.f7 {{ expedition.properties.participantsString }}
    div(v-else) Virgin graticule!
</template>

<script>
import { EventBus } from '@/EventBus';
export default {
    name: 'GraticuleInfo',
    data: () => ({
        info: undefined,
    }),
    created() {
        window.GraticuleInfo = this;
        EventBus.$on('show-graticule-info', (info) => (this.info = info));
    },
    computed: {
        uses() {
            return Object.entries(this.info.uses)
                .sort((a, b) => b[1].area - a[1].area)
                .filter(([key, use]) => use.area > 5e6);
        },
        expeditions() {
            return (
                window.expeditionsByGraticule[
                    this.info.graticule.properties.id
                ] || []
            );
        },
    },
};
</script>

<style scoped></style>
