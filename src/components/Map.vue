<template lang="pug">
#map.absolute.absolute--fill
</template>

<script>
// import mapboxgl from 'maplibre-gl';
// import 'maplibre-gl/dist/maplibre-gl.css';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-dev';
import 'mapbox-gl/dist/mapbox-gl.css';
import U from 'map-gl-utils/noflow/index';
import { EventBus } from '../EventBus';

import {
    updateHashStyle,
    updateHashAnimation,
    resetHashAnimation,
} from '@/mapping/mappingExpeditions';
import { updateMeridians } from '@/mapping/mappingMeridians';
import { updateGeohashes } from '@/mapping/mappingGeohashes';

import { setGraticuleStyle } from '@/mapping/mappingGraticules';

import { dateToDays, getGraticuleBounds } from '@//util';
import { updateStreakStyle } from '@/mapping/mappingStreaks';
import { initMappingRegions } from '@/mapping/mappingRegions';
import debounce from 'debounce';
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

        let center = [145, -37.8];
        let zoom = 1;

        try {
            // console.log(window.localStorage.getItem('center').split(','));
            let centerCookie = window.localStorage
                .getItem('center')
                .split(',')
                .map(parseFloat);
            center = centerCookie.slice(0, 2);
            zoom = centerCookie[2];
        } catch (e) {
            // console.log('ohno', e);
            //
        }
        console.log(center, zoom);
        const map = new mapboxgl.Map({
            container: 'map',
            center, //: [144.96, -37.81],
            zoom,
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
        map.U.addRasterSource('dominance', {
            tiles: [
                // 'https://nr47.hohenpoelz.de/geohashing/output/{z}/{x}/{y}.png',
                `https://fippe-geojson.glitch.me/dominance/geohashing/output/{z}/{x}/{y}.png`,
            ],
            tileSize: 256,
            type: 'raster',
            minzoom: 0,
            maxzoom: 9,
        });
        map.U.addRasterLayer(
            'dominance',
            'dominance',
            {
                rasterOpacity: U.interpolateZoom({ 5: 0.25, 12: 0.1 }),

                visibility: 'none',
            },
            'building'
        );
        // initMappingRegions(map);

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
        map.U.addGeoJSON('voronoi');
        map.U.addFill(
            'voronoi-fill',
            'voronoi',
            {
                fillOpacity: 0.5,
                fillAntiAlias: false,
                fillOutlineColor: 'transparent',
            },
            'natural-point-label'
        );
        EventBus.$emit('map-loaded', map);
        this.filters = window.Filters?.filters ?? true;
        this.initMapContent(map);
        EventBus.$on('filters-change', (filters) => {
            console.log('filters-change');
            this.filters = filters;
            this.updateMapStyleDebounced();
        });
        EventBus.$on('animation-change', (running) =>
            running ? this.startAnimation() : this.stopAnimation()
        );
        // this.map.U.toggle(/^expeditions/, window.app.App.tab === 'expeditions');

        EventBus.$on('tab-change', (tab) => {
            this.map.U.toggle(/^expeditions/, tab === 'expeditions');
        });
        map.on('moveend', () => {
            try {
                EventBus.$emit('moveend');
                window.localStorage.setItem(
                    'center',
                    map.getCenter().toArray().join(',') + ',' + map.getZoom()
                );
            } catch (e) {
                //
            }
        });
        EventBus.$on('projection-change', (projection) => {
            console.log(projection);
            this.map.setProjection(projection);
        });
    },
    created() {
        this.updateMapStyleDebounced = debounce(() => {
            this.updateMapStyle();
        }, 500);
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
                setGraticuleStyle({ map: this.map, filters: this.filters })
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
