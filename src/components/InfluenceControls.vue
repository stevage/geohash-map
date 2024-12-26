<script setup></script>

<template lang="pug">
#InfluenceControls
    h3.mb1 Influence
    .group
        label
            input.mr2(type="checkbox" v-model="showInfluence")
            | Show Influence heatmap
        p(v-show="showInfluence")
          | Shows who has had the most successful expeditions in an area.
        //- label.db(v-show="showInfluence")
        //-   input.mr1(type="checkbox" v-model="showFade")
        //-   span Show influence strength
        label.db(v-show="showFade && showInfluence")
          input.mr1.dib(type="range" v-model.number="fadeStrength" min="0" max="10000" alt="How quickly influence fades from a point")
          div.dib Fade distance

        label.db.mt3(v-show="showInfluence")
          input.mr1.dib(type="range" v-model.number="rangeCutoff" min="0.1" max="5" step="0.1" alt="Higher is slower, but reduces artefacts")
          div.dib Distance cut-off



</template>

<script>
import { EventBus } from '@/EventBus';
import { getExpeditionsNearViewport } from '@/mapping/expeditions/expeditionIndex';
import { Influence, featureCollection } from '@turf/turf';
import { colorFunc } from '@/mapping/expeditions/colorFuncs';
import { updateInfluenceStyle } from '@/mapping/mappingInfluence';
export default {
    data: () => ({
        showInfluence: window.location.hostname === 'localhost',
        showFade: true,
        rangeCutoff: 1,
        fadeStrength: 20, // 2000...
    }),
    created() {
        window.InfluenceControls = this;
        EventBus.$on(
            'moveend',
            (map) => this.showInfluence && this.update(map)
        );
    },
    computed: {
        params() {
            return `${this.showInfluence} ${this.showFade} ${this.rangeCutoff} ${this.fadeStrength}`;
        },
    },
    watch: {
        params() {
            this.update(window.map);
            if (this.showInfluence) {
                window.Filters.filters.colorVis = 'participantsFixed';
            }
            window.map.U.toggle(/influence-/, this.showInfluence);
        },
    },
    methods: {
        update() {
            updateInfluenceStyle({
                map: window.map,
                filters: window.Filters.filters,
                show: this.showInfluence,
                showFade: this.showFade,
                rangeCutoff: this.rangeCutoff,
                fadeStrength: 10000 - this.fadeStrength, //* this.fadeStrength,
            });
        },
    },
};
</script>

<style scoped></style>
