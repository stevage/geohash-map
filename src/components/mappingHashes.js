import { Expression } from 'mapbox-expression';
import { EventBus } from '@/EventBus';
import { dateToDays } from './util';

let hashes;
let loadedHashes;

async function getHashes(local, map) {
    const url = local
        ? 'alldata.json'
        : 'https://fippe-geojson.glitch.me/alldata.json';
    console.log('1', map);
    const newHashes = await window.fetch(url).then((x) => x.json());
    console.log('2', map);

    if (loadedHashes && local) {
        // if non-cached data loads first for some reason, abort
        return;
    }
    hashes = newHashes;
    const participants = {};
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
    });
    hashes.features.sort((a, b) => a.properties.days - b.properties.days);
    for (const f of hashes.features) {
        // }
        for (const p of f.properties.participants) {
            if (!participants[p]) {
                participants[p] = {
                    expeditions: 0,
                    firstExpeditionDays: f.properties.days,
                };
            }
            participants[p].expeditions++;
        }
        f.properties.participantsString = f.properties.participants
            .join(', ')
            .toLowerCase();
        f.properties.participantsCount = f.properties.participants.length;
        const expeditions = f.properties.participants.map(
            (p) => participants[p].expeditions
        );
        f.properties.experienceMax = Math.max(...expeditions);
        f.properties.experienceMin = Math.min(...expeditions);
        f.properties.experienceTotal = expeditions.reduce((a, b) => a + b, 0);
        const days = f.properties.participants.map(
            (p) => f.properties.days - participants[p].firstExpeditionDays
        );
        f.properties.experienceDaysMax = days.length ? Math.max(...days) : 0;
        f.properties.experienceDaysMin = days.length ? Math.min(...days) : 0;
        f.properties.experienceDaysTotal = days.length
            ? days.reduce((a, b) => a + b, 0)
            : 0;
    }

    map.U.setData('hashes', hashes);
    EventBus.$emit('hashes-loaded', hashes);
    window.hashes = hashes;
    // this.stopAnimation();
    console.log('3', map);
    resetHashAnimation({ map });
    loadedHashes = true;
    // this.findPairs(hashes);
}

function yearColorFunc() {
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
}
function experienceColorFunc() {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'experienceMax'],
        1,
        'hsl(200, 80%, 40%)',
        10,
        'hsl(280, 80%, 40%)',
        50,
        'red',
        100,
        'hsl(60,100%,50%)',
        250,
        'hsl(120, 100%, 70%)',
    ];
    return ret;
}
function experienceDaysColorFunc() {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'experienceDaysMax'],
        0,
        'hsl(200, 80%, 40%)',
        365,
        'hsl(280, 80%, 40%)',
        365 * 2,
        'red',
        365 * 5,
        'hsl(60,100%,50%)',
        365 * 10,
        'hsl(120, 100%, 70%)',
        365 * 20,
        'hsl(120, 100%, 70%)',
    ];
    // console.log(ret);
    return ret;
}
function colorFunc(filters) {
    return {
        year: yearColorFunc(),
        experienceMax: experienceColorFunc(),
        experienceDaysMax: experienceDaysColorFunc(),
    }[filters.colorVis];
}
function legendColors(filters) {
    const vals = [];
    if (filters.colorVis === 'experienceMax') {
        for (let experienceMax of [1, 5, 10, 20, 50, 100, 250]) {
            const color = Expression.parse(colorFunc(filters)).evaluate({
                type: 'Feature',
                properties: {
                    experienceMax,
                },
                geometry: null,
            });
            vals.push([experienceMax, color]);
        }
    } else if (filters.colorVis === 'experienceDaysMax') {
        for (let experienceYearsMax of [0, 1, 2, 5, 10]) {
            const color = Expression.parse(colorFunc(filters)).evaluate({
                type: 'Feature',
                properties: {
                    experienceDaysMax: experienceYearsMax * 365,
                },
                geometry: null,
            });
            vals.push([experienceYearsMax, color]);
        }
    } else {
        for (let year = 2008; year <= 2022; year++) {
            const color = Expression.parse(colorFunc(filters)).evaluate({
                type: 'Feature',
                properties: {
                    year,
                    days: dateToDays(year),
                },
                geometry: null,
            });
            vals.push([year, color]);
        }
    }
    return vals;
}
function circleRadiusFunc({ isGlow, isFlash, filters } = {}) {
    const extra = isFlash ? 30 : isGlow ? 2 : 0;
    const getRadius = (r) =>
        filters.scaleExpedition
            ? [
                  '+',
                  [
                      '*',
                      //   ['sqrt', ['length', ['get', 'participants']]],
                      //   ['length', ['get', 'participants']],
                      //   ['^', ['length', ['get', 'participants']], 0.75],
                      ['log2', ['length', ['get', 'participants']]],
                      r,
                  ],
                  extra,
              ]
            : ['+', r, extra];

    return [
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
}

function updateFilters({ map, filters }) {
    const successFilter =
        filters.outcome === 'all'
            ? true
            : ['==', ['get', 'success'], filters.outcome === 'success'];
    map.U.setFilter(/hashes-/, [
        'all',
        [
            'in',
            (filters.participants || '').replace(/ /g, '_').toLowerCase(),
            ['get', 'participantsString'],
        ],
        ['>=', ['get', 'participantsCount'], filters.minParticipants],
        ['>=', ['get', 'year'], filters.minYear],
        ['<=', ['get', 'year'], filters.maxYear],
        successFilter,
    ]);
    map.U.setCircleRadius('hashes-circles', circleRadiusFunc({ filters }));
}

export function updateHashStyle({ map, filters }) {
    // const colors = window.app.yearColors;

    const dark = true;

    const first = !map.getLayer('hashes-circles');

    if (first) {
        map.U.addGeoJSON('hashes'); //, 'hashes.json');
        getHashes(true, map).then(() =>
            resetHashAnimation({ map, filters, show: true })
        );
        getHashes(false, map).then(() =>
            resetHashAnimation({ map, filters, show: true })
        );
    }

    map.U.addCircle('hashes-glow', 'hashes', {
        circleColor: [
            'step',
            ['zoom'],
            colorFunc(filters),
            3,
            ['case', ['get', 'success'], colorFunc(filters), 'transparent'],
        ],
        // circleOpacity: ['case', ['feature-state', 'show'], 0.3, 0],
        circleOpacity: ['feature-state', 'opacity'],
        circleBlur: 0.5,
        circleRadius: circleRadiusFunc({ isGlow: true, filters }),
        circleSortKey: ['get', 'days'],
    });
    map.U.addCircle('hashes-circles', 'hashes', {
        circleStrokeColor: [
            'case',
            ['get', 'success'],
            ['case', ['get', 'global'], '#fff', 'hsla(0,0%,30%,0.5)'],
            colorFunc(filters),
            // 'hsl(180,0%,90%)',
        ],
        circleStrokeWidth: [
            'step',
            ['zoom'],
            ['case', ['get', 'global'], 0, 0],
            1,
            ['case', ['get', 'global'], 1, 0],
            3,
            ['case', ['get', 'global'], 2, ['case', ['get', 'success'], 0, 2]],
            6,
            [
                'case',
                ['get', 'global'],
                2,
                ['case', ['get', 'success'], 0.5, 2],
            ],

            8,
            ['case', ['get', 'global'], 4, ['case', ['get', 'success'], 1, 2]],
        ],
        circleColor: [
            'step',
            ['zoom'],
            colorFunc(filters),
            3,
            [
                'case',
                ['get', 'success'],
                colorFunc(filters),
                'transparent' /*'hsl(180,0%,90%)'*/,
            ],
        ],

        circleRadius: circleRadiusFunc({ filters }),
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
            colorFunc(filters),
        ],
        // circleStrokeWidth: ['step', ['zoom'], 0, 6, 0.5, 8, 1],
        circleColor: [
            'step',
            ['zoom'],
            colorFunc(filters),
            4,
            [
                'case',
                ['get', 'success'],
                colorFunc(filters),
                'transparent' /*'hsl(180,0%,90%)'*/,
            ],
        ],

        circleRadius: circleRadiusFunc({ isFlash: true, filters }),
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
        textColor: colorFunc(filters), //dark ? '#bbb' : 'black',
        textHaloColor: dark ? 'hsla(0,0%,0%,0.4)' : 'hsla(0,0%,100%,0.5)',
        textHaloWidth: 1,
        textOpacity: ['feature-state', 'opacity'],
        minzoom: 9,
    });

    updateFilters({ map, filters });

    if (first) {
        map.U.hoverPointer(/hashes-circles/);
        map.on('click', 'hashes-circles', (e) => {
            console.log(e);
            EventBus.$emit('select-feature', e.features[0]);
        });
        map.on('click', 'hashes-glow', (e) => {
            console.log(e);
            EventBus.$emit('select-feature', e.features[0]);
        });

        map.U.hoverPopup(
            'hashes-glow',
            (f) =>
                `<div>${f.properties.id}</div> ${JSON.parse(
                    f.properties.participants
                ).join(', ')}`,
            { closeButton: false }
        );
    }

    EventBus.$emit('colors-change', {
        colorVis: filters.colorVis,
        colors: legendColors(filters),
    });
}

export function resetHashAnimation({ map, filters, show }) {
    for (const f of hashes.features) {
        map.setFeatureState(
            { id: f.id, source: 'hashes' },
            { opacity: show ? 1 : 0, show, flashOpacity: 0 }
        );
    }
}

export function updateHashAnimation({
    map,
    filters,
    minx,
    maxx,
    miny,
    maxy,
    animationDay,
}) {
    let updated = 0;
    for (const f of hashes.features) {
        // heh, why did I do it this way? could just use actual x/y, not graticule x/y
        if (
            (f.properties.x >= minx &&
                f.properties.x <= maxx &&
                f.properties.y >= miny &&
                f.properties.y <= maxy) ||
            f.properties.global
        ) {
            const age = animationDay - f.properties.days;
            if (age < 0) {
                0 &&
                    console.log(
                        'Break',
                        animationDay,
                        f.properties.days,
                        ` after updating ${updated}.`
                    );
                break;
            }
            if (age >= 0 && age <= 730) {
                map.setFeatureState(
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
}