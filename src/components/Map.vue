<template lang="pug">
#map.absolute.absolute--fill
</template>

<script>
import mapboxgl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import U from 'mapbox-gl-utils';
import { EventBus } from '../EventBus';

import {
    updateHashStyle,
    updateHashAnimation,
    resetHashAnimation,
} from './mappingHashes';

import { updateGraticuleStyle } from './mappingGraticules';

import { dateToDays, getGraticuleBounds } from './util';

export default {
    data: () => ({
        filters: {
            minYear: 2008,
            maxYear: 2022,
            colorVis: 'experienceDaysMax',
            participants: '',
            outcome: 'all',
        },
        animationDay: 0,
        // colorVis: 'experienceMax',
        // colorVis: 'year',
    }),
    async mounted() {
        // replace this Mapbox access token with your own
        mapboxgl.accessToken =
            'pk.eyJ1Ijoic3RldmFnZSIsImEiOiJja25keW5pYTkxZGx3Mm5vb2UxdzE4cno2In0.ZjjS8eUNwE_vsBzg7hML8w';
        const map = new mapboxgl.Map({
            container: 'map',
            center: [144.96, -37.81],
            zoom: 7,
            // style: 'mapbox://styles/mapbox/light-v9',
            style: 'mapbox://styles/stevage/ckzoqlsr1000115qtr5pendfa/draft', // geohash-dark
            hash: 'center',
        });
        U.init(map, mapboxgl);

        window.map = map;
        window.map.hash = 'center';
        this.map = map;
        window.app.Map = this;

        await map.U.onLoad();
        this.filters = window.Filters.filters;
        this.initMapContent(map);
        EventBus.$on('filters-change', (filters) => {
            this.filters = filters;
            this.updateMapStyle();
        });
        EventBus.$on(
            'animation-change',
            (running) =>
                running ? this.startAnimation() : this.stopAnimation()
        );
    },
    methods: {
        findPairs(hashes) {
            const pairs = {};
            let max = [0, null];
            for (const f of hashes.features) {
                for (const p of f.properties.participants) {
                    if (!pairs[p]) {
                        pairs[p] = {};
                    }
                    for (const p2 of f.properties.participants) {
                        if (p === p2) {
                            continue;
                        }
                        pairs[p][p2] = (pairs[p][p2] || 0) + 1;
                        if (pairs[p][p2] > max[0]) {
                            max = [pairs[p][p2], p, p2];
                        }
                    }
                }
            }
            console.log('Maximum pair', max);
            let out = '';
            for (const [p1, p2s] of Object.entries(pairs)) {
                for (const [p2, count] of Object.entries(p2s)) {
                    if (count > 50 && p1 > p2) {
                        console.log(p1, p2, count);
                        // out += `${p1} ${p2} ${count}\n`;
                    }
                }
            }
            console.log(out);
            for (const [p1, p2s] of Object.entries(pairs).filter(
                (pair) => pair[0] === 'Stevage'
            )) {
                for (const [p2, count] of Object.entries(p2s)) {
                    if (true) {
                        console.log(p1, p2, count);
                        // out += `${p1} ${p2} ${count}\n`;
                    }
                }
            }
        },

        async initMapContent(map) {
            // const colorFunc = this.experienceDaysColorFunc();
            // const colorFunc = this.yearColorFunc();
            this.updateMapStyle();
        },
        updateMapStyle() {
            updateHashStyle({ map: this.map, filters: this.filters });
            updateGraticuleStyle({ map: this.map, filters: this.filters });
        },
        startAnimation() {
            this.stopAnimation();
            this.animationDay = dateToDays(`${this.filters.minYear}-01-01`);
            resetHashAnimation({
                map: this.map,
                filters: this.filters,
                show: false,
            });

            this.lastFrame = 0;

            this.timerFunc = (now) => {
                if (!this.timer || this.animationDay > dateToDays(new Date())) {
                    EventBus.$emit('animation-ended');

                    this.stopAnimation();
                } else {
                    this.updateAnimation();
                    if (this.lastFrame) {
                        const elapsed = now - this.lastFrame;
                        const dayJump = Math.max(1, Math.floor(elapsed / 10));
                        this.animationDay += dayJump;
                    }
                    this.lastFrame = now;

                    requestAnimationFrame(this.timerFunc);
                }
            };
            this.timer = 1;
            requestAnimationFrame(this.timerFunc);
        },
        stopAnimation() {
            if (this.timer) {
                // clearInterval(this.timer);
            }
            // this.map.off('idle', this.timerFunc);
            this.timer = 0;
            resetHashAnimation({
                map: this.map,
                filters: this.filters,
                show: true,
            });
        },
        updateAnimation() {
            const [minx, miny, maxx, maxy] = getGraticuleBounds(this.map);

            EventBus.$emit('animation-cycle', {
                animationDay: this.animationDay,
            });
            updateHashAnimation({
                map: this.map,
                filters: this.filters,
                minx,
                miny,
                maxx,
                maxy,
                animationDay: this.animationDay,
            });
        },
    },
};
/*

TODO a feature-state version of this

renderFunc = () => {
  days+=20;
  map.setFilter('hashes-circles', ['all', ['<',['get','days'], days], ['>', ['get','x'], -1130]])
  console.log(days)
}

days=13000
map.off('idle', renderFunc)
map.on('idle', renderFunc)

*/
</script>

<style>
.mapboxgl-popup-content {
    background: hsla(0, 0%, 3%, 0.5);
    /* transparent; */
    color: #bbb;
    padding: 2px;
    text-align: center;
    box-shadow: none;
    border: 1px solid #444;
    backdrop-filter: blur(10px);
}

.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
    border-top-color: #555;
}
.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
    border-bottom-color: #555;
}
.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
    border-right-color: #555;
}
.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
    border-left-color: #555;
}
</style>
