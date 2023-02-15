<template lang="pug">
#map.absolute.absolute--fill
</template>

<script>
// import mapboxgl from 'maplibre-gl';
// import 'maplibre-gl/dist/maplibre-gl.css';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-dev';
import 'mapbox-gl/dist/mapbox-gl.css';
import U from 'map-gl-utils';
import { EventBus } from '../EventBus';

import {
    updateHashStyle,
    updateHashAnimation,
    resetHashAnimation,
} from './mappingExpeditions';
import { updateMeridians } from './mappingMeridians';
import { updateGeohashes } from './mappingGeohashes';

import { updateGraticuleStyle } from './mappingGraticules';

import { dateToDays, getGraticuleBounds } from './util';
import { updateStreakStyle } from './mappingStreaks';
export default {
    data: () => ({
        filters: {
            minYear: 2008,
            maxYear: new Date().getUTCFullYear(),
            colorVis: 'experienceDaysMax',
            participants: '',
            outcome: 'all',
        },
        animationDay: 0,
        globe: window.location.hash.match(/globe/),
    }),
    async mounted() {
        mapboxgl.accessToken =
            // 'pk.eyJ1Ijoic3RldmFnZSIsImEiOiJja3p5cGZvOHowMmZpM21tOW40M3ZnOG5rIn0.c5qZKNfmItrPsv2UiCJxag';
            //  pk.eyJ1Ijoic3RldmFnZSIsImEiOiJja25keW5pYTkxZGx3Mm5vb2UxdzE4cno2In0.ZjjS8eUNwE_vsBzg7hML8w
            'pk.eyJ1Ijoic3RldmFnZSIsImEiOiJja3p5cHdtOGEwMm1hM2RtdzJlYXJrajhrIn0.veC37cfBaslGu1MteavjNA';
        // pk.eyJ1Ijoic3RldmFnZSIsImEiOiJGcW03aExzIn0.QUkUmTGIO3gGt83HiRIjQw ??

        const map = new mapboxgl.Map({
            container: 'map',
            center: [144.96, -37.81],
            zoom: 7,
            // style: 'mapbox://styles/mapbox/light-v9',
            style: 'mapbox://styles/stevage/ckzoqlsr1000115qtr5pendfa/draft', // geohash-dark
            hash: 'center',
            projection: this.globe
                ? 'globe' //{ name: 'globe', center: [0, 0], parallels: [30, 30] }
                : 'mercator',
        });
        U.init(map, mapboxgl);

        window.map = map;
        window.map.hash = 'center';
        this.map = map;
        window.app.Map = this;

        await map.U.onLoad();
        if (this.globe) {
            map.addLayer({
                id: 'sky',
                type: 'sky',
                /*paint: {
                    'sky-opacity': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0,
                        0,
                        5,
                        0.3,
                        8,
                        1,
                    ],
                    // set up the sky layer for atmospheric scattering
                    'sky-type': 'atmosphere',
                    // explicitly set the position of the sun rather than allowing the sun to be attached to the main light source
                    // 'sky-atmosphere-sun': getSunPosition(),
                    // set the intensity of the sun as a light source (0-100 with higher values corresponding to brighter skies)
                    'sky-atmosphere-sun-intensity': 5,
                },*/
                paint: {
                    /*                    'sky-type': 'gradient',
                    'sky-gradient': [
                        'interpolate',
                        ['linear'],
                        ['sky-radial-progress'],
                        0.8,
                        'hsl(260,60%,20%)',
                        1,
                        'black',
                    ],
                    'sky-gradient-radius': 180,
                    'sky-opacity': 1,*/
                    'sky-atmosphere-color': 'black',
                },
            });
        }
        if (this.globe && !window.location.hash.match(/bug/)) {
            map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14,
            });
            // add the DEM source as a terrain layer with exaggerated height
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 0 });
        }
        EventBus.$emit('map-loaded', map);
        this.filters = window.Filters.filters;
        this.initMapContent(map);
        EventBus.$on('filters-change', (filters) => {
            this.filters = filters;
            this.updateMapStyle();
        });
        EventBus.$on('animation-change', (running) =>
            running ? this.startAnimation() : this.stopAnimation()
        );
        EventBus.$on('tab-change', (tab) => {
            this.map.U.toggle(/^expeditions/, tab === 'expeditions');
            this.map.U.toggle(/^geohash/, tab === 'geohash');
        });
    },
    computed: {
        animationMonthISO() {
            return (
                this.animationDay &&
                new Date(8.64e7 * this.animationDay).toISOString().slice(0, 7)
            );
        },
    },
    methods: {
        findPairs(expeditions) {
            const pairs = {};
            let max = [0, null];
            for (const f of expeditions.features) {
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
            const report = (name, task) => {
                const start = performance.now();
                task();
                console.log(
                    `Updated ${name} in`,
                    performance.now() - start,
                    `ms`
                );
            };
            const map = this.map;
            let start = performance.now();
            report('meridians', () => updateMeridians({ map }));
            report('expeditions', () =>
                updateHashStyle({ map: this.map, filters: this.filters })
            );
            report('graticules', () =>
                updateGraticuleStyle({ map: this.map, filters: this.filters })
            );
            report('streaks', () =>
                updateStreakStyle({ map, filters: this.filters })
            );
            updateGeohashes(map);
            // console.log(performance.now() - start);
        },
        startAnimation() {
            this.stopAnimation();
            if (this.filters.minYear == 2008) {
                this.animationDay = dateToDays(`2008-05-01`); // geohashing started on May 21st 2008
            } else {
                this.animationDay = dateToDays(`${this.filters.minYear}-01-01`);
            }
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
                animationMonthISO: this.animationMonthISO,
            });
            updateHashAnimation({
                map: this.map,
                filters: this.filters,
                minx,
                miny,
                maxx,
                maxy,
                animationDay: this.animationDay,
                animationMonthISO: this.animationMonthISO,
            });
            this.frameNo = (this.frameNo || 0) + 1;
        },
        updateGlobeAnimation() {
            if (this.globe) {
                const round = (n, places) => {
                    const mult = Math.pow(10, places);
                    return Math.round(n * mult) / mult;
                };
                // 14092
                const daysPerLoop = 50000;
                // We want x in range -1 to 1

                const x =
                    (((this.animationDay - 14000) % daysPerLoop) /
                        daysPerLoop) *
                        2 -
                    1;
                if (this.frameNo % 2 === 0) {
                    this.map.setFreeCameraOptions({
                        position: {
                            x,
                            y: 0.45,
                            z: 0.5,
                        },
                    });
                }
            }
        },

        startGlobeAnimation() {
            this.lastFrame = 0;

            this.timerFunc = (now) => {
                this.updateGlobeAnimation();
                if (this.lastFrame) {
                    const elapsed = now - this.lastFrame;
                    const dayJump = Math.max(1, Math.floor(elapsed / 10));
                    this.animationDay += dayJump;
                }
                this.lastFrame = now;
                this.frameNo = (this.frameNo || 0) + 1;
                this.updateGlobeAnimation();

                if (this.timer) {
                    requestAnimationFrame(this.timerFunc);
                }
            };
            this.timer = 1;
            requestAnimationFrame(this.timerFunc);
        },
    },
};
/*

TODO a feature-state version of this

renderFunc = () => {
  days+=20;
  map.setFilter('expeditions-circles', ['all', ['<',['get','days'], days], ['>', ['get','x'], -1130]])
  console.log(days)
}

days=13000
map.off('idle', renderFunc)
map.on('idle', renderFunc)

*/
</script>

<style>
#map {
    background: #222;
}
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

.mapboxgl-ctrl-scale {
    background: #222;
    color: #bbb;
}
</style>
