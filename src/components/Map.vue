<template lang="pug">
#map.absolute.absolute--fill
</template>

<script>
import mapboxgl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import U from 'mapbox-gl-utils';
import { EventBus } from '../EventBus';
import { Expression } from 'mapbox-expression';
function dateToDays(date) {
    if (String(date).length === 4) {
        date = `${date}-01-01`;
    }
    return Math.floor(new Date(date) / (1000 * 60 * 60 * 24));
}
window.dateToDays = dateToDays;
export default {
    data: () => ({
        filters: { minYear: 2008, maxYear: 2022 },
        animationDay: 0,
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
        this.initMapContent(map);
        EventBus.$on('filters-change', (filters) => {
            this.filters = filters;
            map.U.setFilter(/hashes-/, [
                'all',
                [
                    'in',
                    filters.participants.replace(/ /g, '_').toLowerCase(),
                    ['get', 'participantsString'],
                ],
                ['>=', ['get', 'participantsCount'], filters.minParticipants],
                ['>=', ['get', 'year'], filters.minYear],
                ['<=', ['get', 'year'], filters.maxYear],
            ]);
            map.U.setCircleRadius('hashes-circles', this.circleRadiusFunc());
        });
        EventBus.$on(
            'animation-change',
            (running) =>
                running ? this.startAnimation() : this.stopAnimation()
        );
    },
    methods: {
        async getHashes(local, map) {
            const url = local
                ? 'alldata.json'
                : 'https://fippe-geojson.glitch.me/alldata.json';
            const hashes = await window.fetch(url).then((x) => x.json());
            if (this.loadedHashes && !local) {
                // if non-cached data loads first for some reason, abort
                return;
            }
            hashes.features.forEach((f, i) => {
                f.id = i;
                const [date, y, x] = f.properties.id.split('_');
                f.properties.year = +date.slice(0, 4);
                f.properties.days = dateToDays(f.properties.id.slice(0, 10));
                // if (x !== undefined && y !== undefined) {
                // sigh globalhashes
                f.properties.x = +x || 0;
                f.properties.y = +y || 0;
                f.properties.global = /global/.test(f.properties.id);
                // }
                f.properties.participantsString = f.properties.participants
                    .join(', ')
                    .toLowerCase();
                f.properties.participantsCount =
                    f.properties.participants.length;
            });
            hashes.features.sort(
                (a, b) => a.properties.days - b.properties.days
            );
            this.hashes = hashes;
            map.U.setData('hashes', hashes);
            this.stopAnimation();
            this.loadedHashes = true;
        },
        colorFunc() {
            const ret = [
                'interpolate-hcl',
                ['linear'],
                ['get', 'days'],
                dateToDays(2008),
                'hsl(200, 80%, 40%)',
                dateToDays(2016),

                'red',
                dateToDays(2021),
                'hsl(60,100%,40%)',
                dateToDays(2022),
                'hsl(120, 100%, 70%)',
            ];
            return ret;
        },
        legendColors() {
            const vals = [];
            for (let year = 2008; year <= 2022; year++) {
                const color = Expression.parse(this.colorFunc()).evaluate({
                    type: 'Feature',
                    properties: {
                        year,
                        days: dateToDays(year),
                    },
                    geometry: null,
                });
                vals.push([year, color]);
            }
            return vals;
        },
        circleRadiusFunc({ isGlow, isFlash } = {}) {
            const extra = isFlash ? 30 : isGlow ? 2 : 0;
            const getRadius = (r) =>
                this.filters.scaleExpedition
                    ? [
                          '+',
                          [
                              '*',
                              ['sqrt', ['length', ['get', 'participants']]],
                              r,
                          ],
                          extra,
                      ]
                    : ['+', r, extra];

            this.baseCircleRadius = [
                'interpolate',
                ['linear'],
                ['zoom'],
                1,
                isFlash ? 5 : isGlow ? 0 : getRadius(1),
                3,
                isFlash ? 10 : isGlow ? getRadius(1) : getRadius(1),
                5,
                isFlash ? 15 : getRadius(2),
                8,
                getRadius(3),

                10,
                getRadius(4),
                12,
                isGlow ? getRadius(16) : getRadius(10),
            ];
            return this.baseCircleRadius;
        },
        async initMapContent(map) {
            map.U.addGeoJSON('hashes'); //, 'hashes.json');

            const colors = window.app.yearColors;

            const dark = true;

            // const yearColor = [
            //     'match',
            //     ['get', 'year'],
            //     2022,
            //     colors[0],
            //     2021,
            //     colors[1],

            //     2020,
            //     colors[2],

            //     2019,
            //     colors[3],
            //     2018,
            //     colors[4],
            //     2017,
            //     colors[5],
            //     2016,
            //     colors[6],
            //     2015,
            //     colors[7],
            //     colors[8],
            // ];
            const yearColor = this.colorFunc();
            map.U.addCircle('hashes-glow', 'hashes', {
                circleColor: [
                    'step',
                    ['zoom'],
                    yearColor,
                    6,
                    ['case', ['get', 'success'], yearColor, 'transparent'],
                ],
                // circleOpacity: ['case', ['feature-state', 'show'], 0.3, 0],
                circleOpacity: ['feature-state', 'opacity'],
                circleBlur: 0.5,
                circleRadius: this.circleRadiusFunc({ isGlow: true }),
                circleSortKey: ['get', 'days'],
            });
            map.U.addCircle('hashes-circles', 'hashes', {
                circleStrokeColor: [
                    'case',
                    ['get', 'success'],
                    ['case', ['get', 'global'], '#fff', 'hsla(0,0%,30%,0.5)'],
                    yearColor,
                    // 'hsl(180,0%,90%)',
                ],
                circleStrokeWidth: [
                    'step',
                    ['zoom'],
                    ['case', ['get', 'global'], 0, 0],
                    1,
                    ['case', ['get', 'global'], 1, 0],
                    3,
                    ['case', ['get', 'global'], 2, 0],
                    6,
                    ['case', ['get', 'global'], 2, 0.5],
                    8,
                    ['case', ['get', 'global'], 4, 1],
                ],
                circleColor: [
                    'step',
                    ['zoom'],
                    yearColor,
                    6,
                    [
                        'case',
                        ['get', 'success'],
                        yearColor,
                        'transparent' /*'hsl(180,0%,90%)'*/,
                    ],
                ],

                circleRadius: this.circleRadiusFunc(),
                circleSortKey: ['get', 'days'],
                // circleOpacity: ['case', ['feature-state', 'show'], 1, 0],
                circleOpacity: ['feature-state', 'opacity'],
                circleStrokeOpacity: ['case', ['feature-state', 'show'], 1, 0],
            });
            map.U.addCircle('hashes-flash', 'hashes', {
                circleStrokeColor: [
                    'case',
                    ['get', 'success'],
                    'hsla(0,0%,30%,0.5)',
                    yearColor,
                    // 'hsl(180,0%,90%)',
                ],
                // circleStrokeWidth: ['step', ['zoom'], 0, 6, 0.5, 8, 1],
                circleColor: [
                    'step',
                    ['zoom'],
                    yearColor,
                    6,
                    [
                        'case',
                        ['get', 'success'],
                        yearColor,
                        'transparent' /*'hsl(180,0%,90%)'*/,
                    ],
                ],

                circleRadius: this.circleRadiusFunc({ isFlash: true }),
                circleSortKey: ['get', 'days'],
                // circleOpacity: ['case', ['feature-state', 'show'], 1, 0],
                circleOpacity: ['feature-state', 'flashOpacity'],
                circleStrokeOpacity: ['case', ['feature-state', 'show'], 1, 0],
                circleBlur: 1.5,
            });
            map.U.addSymbol('hashes-label', 'hashes', {
                textField: [
                    'step',
                    ['zoom'],
                    ['slice', ['get', 'id'], 0, 4],
                    11,
                    ['slice', ['get', 'id'], 0, 10],
                    12,
                    [
                        'concat',
                        ['slice', ['get', 'id'], 0, 10],
                        '\n',
                        ['get', 'participantsString'],
                    ],
                ],
                textSize: ['interpolate', ['linear'], ['zoom'], 10, 10, 12, 12],
                textOffset: [0, 1.5],
                textColor: yearColor, //dark ? '#bbb' : 'black',
                textHaloColor: dark
                    ? 'hsla(0,0%,0%,0.4)'
                    : 'hsla(0,0%,100%,0.5)',
                textHaloWidth: 1,
                textOpacity: ['feature-state', 'opacity'],
                minzoom: 9,
            });
            map.U.hoverPointer(/hashes-circles/);
            map.on('click', 'hashes-circles', (e) => {
                console.log(e);
                EventBus.$emit('select-feature', e.features[0]);
            });
            map.on('click', 'hashes-glow', (e) => {
                console.log(e);
                EventBus.$emit('select-feature', e.features[0]);
            });

            this.getHashes(true, map);
            this.getHashes(false, map);
            EventBus.$emit('colors-change', this.legendColors());
        },
        startAnimation() {
            this.stopAnimation();
            this.animationDay = dateToDays(`${this.filters.minYear}-01-01`);

            for (const f of this.hashes.features) {
                this.map.setFeatureState(
                    { id: f.id, source: 'hashes' },
                    { opacity: 0, show: false, flashOpacity: 0 }
                );
            }
            this.lastFrame = 0;

            this.timerFunc = (now) => {
                if (
                    !this.timer ||
                    this.animationDay > dateToDays(new Date()) //`${this.filters.maxYear}-12-31`)
                ) {
                    EventBus.$emit('animation-ended');

                    this.stopAnimation();
                } else {
                    this.updateAnimation();
                    if (this.lastFrame) {
                        const elapsed = now - this.lastFrame;
                        const dayJump = Math.max(1, Math.floor(elapsed / 10));
                        this.animationDay += dayJump;
                        // console.log(`Jumping ${dayJump} days`);
                    }
                    this.lastFrame = now;

                    requestAnimationFrame(this.timerFunc);
                }
            };
            // this.timer = setInterval(timerFunc, 1)
            this.timer = 1;
            // this.map.on('idle', this.timerFunc);
            // this.map.triggerRepaint();
            requestAnimationFrame(this.timerFunc);
        },
        stopAnimation() {
            if (this.timer) {
                // clearInterval(this.timer);
            }
            // this.map.off('idle', this.timerFunc);
            this.timer = 0;
            for (const f of this.hashes.features) {
                this.map.setFeatureState(
                    { id: f.id, source: 'hashes' },
                    { opacity: 1, show: true, flashOpacity: 0 }
                );
            }
        },
        updateAnimation() {
            const [minx, miny] = this.map
                .getBounds()
                .toArray()[0]
                .map(Math.floor);
            const [maxx, maxy] = this.map
                .getBounds()
                .toArray()[1]
                .map(Math.ceil);
            EventBus.$emit('animation-cycle', {
                animationDay: this.animationDay,
            });
            // this.map.repaint = false;
            let updated = 0;
            for (const f of this.hashes.features) {
                if (
                    (f.properties.x >= minx &&
                        f.properties.x <= maxx &&
                        f.properties.y >= miny &&
                        f.properties.y <= maxy) ||
                    f.properties.global
                ) {
                    const age = this.animationDay - f.properties.days;
                    if (age < 0) {
                        0 &&
                            console.log(
                                'Break',
                                this.animationDay,
                                f.properties.days,
                                ` after updating ${updated}.`
                            );
                        break;
                    }
                    if (age >= 0 && age <= 730) {
                        this.map.setFeatureState(
                            { id: f.id, source: 'hashes' },
                            {
                                show: age > 0,
                                opacity:
                                    age < 0
                                        ? 0
                                        : Math.max(
                                              1 - age / 730,

                                              0.2
                                          ),
                                flashOpacity:
                                    age < 0
                                        ? 0
                                        : Math.max(
                                              1 - age / 120,

                                              0.0
                                          ),
                            }
                        );
                        updated++;
                    }
                }
            }
            // this.map.repaint = true;
            // this.map.triggerRepaint();
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

<style scoped>
</style>
