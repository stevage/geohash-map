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
        //- tr.left
          th.tl
          th.tl Date
          //- th.tl Pax
          th.tl Who
        tr(v-for="expedition in [...expeditions].reverse()")
          td.f7.pr2
            a(target="_blank" :href="expLink(expedition)") {{ expedition.properties.success ? '✔' : '✖' }}

          td.f7.pr2
            a(target="_blank" :href="expLink(expedition)") {{ expedition.properties.id.slice(0,10) }}
          //- td {{ expedition.properties.participants.length }}
          td.f7
            a(target="_blank" :href="expLink(expedition)") {{ expedition.properties.participantsString }}
      .dib.ma2.mt4.pa2.ba.b--grey.f6.grey.pointer(@click="copyExpeditions") Copy table for wiki
    div(v-else) Locked graticule!
  div.mt4.overflow-y-scroll.h5
    WikiPage(:pageId="`${info.graticule.properties.name}`")
</template>

<script lang="ts">
import { EventBus } from '@/EventBus';
import GraticuleRecords from '@/components/GraticuleRecords.vue';
import WikiPage from '@/components/WikiPage.vue';
import { setUrlParam } from '@/util';
import { Feature } from 'geojson';

type Info = {
    graticule: {
        properties: {
            id: string;
            name: string;
            x: number;
            y: number;
        };
    };
    area: number;
    uses: Record<string, { area: number }>;
    other: number;
};
export default {
    name: 'GraticuleInfo',
    data: () =>
        ({
            info: undefined,
        } as { info: Info | undefined }),
    components: { GraticuleRecords, WikiPage },
    created() {
        EventBus.$on('show-graticule-info', (info: Info) => (this.info = info));
    },
    computed: {
        uses() {
            return Object.entries((this.info as Info).uses)
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
        percentWater() {
            return (
                ((this.info.uses.water?.area || 0) / this.info.area) *
                100
            ).toFixed(1);
        },
    },

    methods: {
        async copyExpeditions() {
            const es = [...this.expeditions].reverse();
            const text = es
                .map((expedition, i) => {
                    const p = expedition.properties;
                    const date = p.id.slice(0, 10);
                    const weekday = new Date(date).toLocaleString('default', {
                        weekday: 'long',
                    });
                    const month = new Date(date)
                        .toLocaleString('default', { month: 'long' })
                        .slice(0, 3);
                    const joinWithAnd = (arr: string[]) => {
                        if (arr.length === 1) return arr[0];
                        return `${arr.slice(0, -1).join(', ')} and ${
                            arr[arr.length - 1]
                        }`;
                    };
                    const participants = joinWithAnd(
                        p.participants.map((p: string) => `[[User:${p}|${p}]]`)
                    );
                    const arrow = p.success ? 'Arrow2.png' : 'Arrow4.png';
                    let text = `[[Image:${arrow}|12px]] ${month} [[${p.id}]] ${weekday} – ${participants}.<br/>`;
                    if (i === 0 || p.year !== es[i - 1].properties.year) {
                        text = `=== ${p.year} ===\n${text}`;
                    }
                    return text;
                })
                .join('\n');
            try {
                await navigator.clipboard.writeText(text);
                console.log('Content copied to clipboard');
            } catch (err) {
                console.error('Failed to copy: ', err);
            }
        },
        expLink(exp: Feature) {
            return `https://geohashing.site/geohashing/${exp.properties.id}`;
        },
    },
    watch: {
        info() {
            const id = this?.info?.graticule?.properties?.id;
            setUrlParam('graticule', id);
        },
    },
};
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
