<template lang="pug">
#InfluenceControls
    //- h3.mb1 Influence
    .group
        label(title="Shows who has had the most successful expeditions in an area.")
            input.mr2(type="checkbox" v-model="showInfluence")
            | Show heatmap
        //- label.db(v-show="showInfluence")
        //-   input.mr1(type="checkbox" v-model="showFade")
        //-   span Show influence strength
        label.db.ml2.mt2(v-show="showFade && showInfluence" title="How quickly influence fades from a geohash")
          input.mr1.dib(type="range" v-model.number="fadeStrength" min="0" max="12" step="0.1" )
          div.dib() Fade distance
        //- div {{fadeStrength}} &rarr; {{ usedFadeStrength }}

        label.db.mt2.ml2(v-show="showInfluence" title="Maximum distance influence extends from a a geohash. Higher is slower, but reduces artefacts")
          input.mr1.dib(type="range" v-model.number="rangeCutoff" min="0.1" max="5" step="0.1" )
          div.dib Distance cut-off
        //- label.db.mt3(v-show="showInfluence" title="")
        //-   input.mr1.dib(type="range" v-model.number="numberCutoff" min="1" max="250" step="1" )
        //-   div.dib Number cut-off {{ numberCutoff }}



</template>

<script lang="ts">
// future idea: if number cutoff is 1, you essentially get Voronoi polygons. but only works if we're using the method
// of computing points in decreasing distance order, which is quite slow
import { EventBus } from '@/EventBus';
import { updateInfluenceStyle } from '@/mapping/mappingInfluence';
export default {
    data: () => ({
        showInfluence: false, // window.location.hostname === 'localhost',
        showFade: true,
        rangeCutoff: 1,
        fadeStrength: 4,
        numberCutoff: 10,
        // rangeCutoff: 5,
        // fadeStrength: 12,
        // numberCutoff: 250,
    }),
    created() {
        window.InfluenceControls = this;
        // another great idea that didn't work...
        // EventBus.$on('move', () => {
        //     this.showInfluence && this.update();
        // });
        EventBus.$on('moveend', () => {
            window.setTimeout(() => {
                this.showInfluence && this.update(true);
            }, 100);
        });
        EventBus.$on('filters-change', () => this.update());
    },
    computed: {
        params() {
            return `${this.showInfluence} ${this.showFade} ${this.rangeCutoff} ${this.fadeStrength} ${this.numberCutoff}`;
        },
        usedFadeStrength() {
            // 12 maximum, 0 minimum
            return Math.exp(12 - this.fadeStrength) - 1;
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
        update(finished = false) {
            updateInfluenceStyle({
                map: window.map,
                filters: window.Filters.filters,
                finished: !!finished,
                show: this.showInfluence,
                showFade: this.showFade,
                rangeCutoff: !finished ? 0.1 : this.rangeCutoff,
                fadeStrength: this.usedFadeStrength, //* this.fadeStrength,
                numberCutoff:
                    this.numberCutoff === 250 ? Infinity : this.numberCutoff,
            });
        },
    },
};
</script>

<style scoped></style>
