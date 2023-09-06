<script setup></script>

<template lang="pug">
#VoronoiControls
    h3.mb1 Voronoi
    .group
        label
            input.mr2(type="checkbox" v-model="showVoronoi")
            | Show Voronoi polygon  layer
        p(v-show="showVoronoi")
          | Voronoi polygons are coloured by which participant has achieved the nearest successful geohash.
        label(v-show="showVoronoi").db
            input.mr2(type="checkbox" v-model="onlySolo")
            | Only solo expeditions

</template>

<script>
import { EventBus } from '@/EventBus';
import { getExpeditionsNearViewport } from '@/mapping/expeditions/expeditionIndex';
import { voronoi, featureCollection } from '@turf/turf';
import { colorFunc } from '@/mapping/expeditions/colorFuncs';
export default {
    data: () => ({ showVoronoi: false, onlySolo: true }),
    created() {
        window.VoronoiControls = this;
        EventBus.$on('map-loaded', (map) =>
            map.on('moveend', () => this.showVoronoi && this.update(map))
        );
    },
    watch: {
        showVoronoi() {
            if (this.showVoronoi) {
                this.update(window.map);
                window.Filters.filters.colorVis = 'participants';
            }
            window.map.U.toggle('voronoi-fill', this.showVoronoi);
        },
        onlySolo() {
            this.update();
        },
    },
    methods: {
        update() {
            let points = getExpeditionsNearViewport(window.map);
            if (this.onlySolo) {
                points = points.filter(
                    (f) => f.properties.participantsOrMultiple !== 'Multiple'
                );
            }
            const v = voronoi(featureCollection(points));
            v.features.forEach((f, i) => {
                f.properties = points[i].properties;
            });
            console.log(v);
            window.map.U.setData('voronoi', v);
            window.map.U.setFillColor(
                'voronoi-fill',
                colorFunc({ colorVis: 'participants' })
            );
            //
        },
    },
};
</script>

<style scoped></style>
