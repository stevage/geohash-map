import { EventBus } from '@/EventBus';
import { dateToDays, dateToWeekday } from '@/mapping/util';
import { colorFunc, legendColors } from './expeditions/colorFuncs';
import { circleRadiusFunc } from './expeditions/radiusFunc';
let expeditions;
let loadedExpeditions;

/* TODO:
- generate all these extra properties in a different dataset that doesn't have to go onto the map
*/

// The data on fippe.de is actually a piece of JavaScript that needs to be parsed
async function expeditionsToGeoJSON() {
    const raw = await window
        .fetch('https://fippe.de/alldata.js')
        // .fetch('demo.js')
        .then((x) => x.text())
        .catch((e) => {
            console.error(e);
        });
    const lines = raw.split('\n').slice(1, -2);
    // remove trailing comma
    const vals = JSON.parse('[' + lines.join(' ').slice(0, -1) + ']');

    const points = {
        type: 'FeatureCollection',
        features: vals.map((val) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [val[2], val[1]],
            },
            properties: {
                id: val[0],
                participants: val[3],
                success: val[4],
                reportKb: val[5],
                achievements: val[6],
            },
        })),
    };
    return points;
}

async function getExpeditions(local, map) {
    // this was needed when fippe.de didn't have CORS setup
    // const url = local
    //     ? 'alldata.json'
    //     : 'https://fippe-geojson.glitch.me/alldata.json';
    // const newExpeditions = await window.fetch(url).then((x) => x.json());

    const newExpeditions = await expeditionsToGeoJSON();
    await window.graticuleNamesP;

    if (loadedExpeditions && local) {
        // if non-cached data loads first for some reason, abort
        return;
    }
    expeditions = newExpeditions;
    const participants = {};
    expeditions.features.forEach((f, i) => {
        f.id = i;
        const [date, y, x] = f.properties.id.split('_');
        f.properties.year = +date.slice(0, 4);
        f.properties.days = dateToDays(f.properties.id.slice(0, 10));
        f.properties.month = +date.slice(5, 7);
        f.properties.yearMonth = f.properties.year * 12 + f.properties.month; //+date.slice(0, 7);
        f.properties.weekday = dateToWeekday(f.properties.id.slice(0, 10));
        f.properties.weekDayName =
            'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(
                ' '
            )[f.properties.weekday];
        // if (x !== undefined && y !== undefined) {
        // sigh globalexpeditions
        f.properties.dayOfYear =
            f.properties.days - dateToDays(f.properties.year + '');
        f.properties.x = +x || 0;
        f.properties.y = +y || 0;
        f.properties.global = /global/.test(f.properties.id);
        const gname = window.graticuleNamesHash[`${y},${x}`];
        f.properties.graticuleName = gname;
        f.properties.graticuleNameShort =
            gname && gname.match(/[a-z() ], [a-z]/i)
                ? gname.split(', ')[0]
                : gname;
        f.properties.graticuleCountry =
            gname && gname.match(/[a-z], [a-z]/i) ? gname.split(', ')[1] : '';

        if (f.properties.global) {
            f.properties.graticule = 'global';
        } else {
            f.properties.graticule = f.properties.id
                .slice(11)
                .replace('_', ',');
        }
        f.properties.latitude = f.geometry.coordinates[1];
        f.properties.longitude = f.geometry.coordinates[0];
        f.properties.graticuleLatitude = +f.properties.graticule.split(',')[0];
        f.properties.graticuleLongitude = +f.properties.graticule.split(',')[1];
        const achievements = f.properties.achievements || [];
        f.properties.transportMode = achievements.includes(
            'Water_geohash_achievement'
        )
            ? 'Boat/swim'
            : achievements.includes('Walk_geohash_achievement')
            ? 'Walk'
            : achievements.includes('Bicycle_geohash_achievement')
            ? 'Bicycle'
            : achievements.includes('Public_transport_geohash_achievement')
            ? 'Public transport'
            : achievements.includes('Beast_of_burden_geohash_achievement')
            ? 'Beast of burden'
            : achievements.includes('Thumbs_up_geohash_achievement')
            ? 'Hitch-hiking'
            : 'Other';
    });
    expeditions.features.sort((a, b) => a.properties.days - b.properties.days);
    for (const f of expeditions.features) {
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
        f.properties.participantsString = f.properties.participants.join(', ');
        f.properties.participantsOrMultiple =
            f.properties.participants.length > 1
                ? 'Multiple'
                : f.properties.participants[0] || 'Unknown';
        f.properties.participantsStringLower =
            f.properties.participantsString.toLowerCase();
        f.properties.participantsCount = f.properties.participants.length;
        const expeditions = f.properties.participants.map(
            (p) => participants[p].expeditions
        );
        f.properties.experienceMax = expeditions.length
            ? Math.max(...expeditions)
            : 0;
        f.properties.experienceMin = expeditions.length
            ? Math.min(...expeditions)
            : 0;
        f.properties.experienceTotal = expeditions.length
            ? expeditions.reduce((a, b) => a + b, 0)
            : 0;
        const days = f.properties.participants.map(
            (p) => f.properties.days - participants[p].firstExpeditionDays
        );
        f.properties.experienceDaysMax = days.length ? Math.max(...days) : 0;
        f.properties.experienceDaysMin = days.length ? Math.min(...days) : 0;
        f.properties.experienceDaysTotal = days.length
            ? days.reduce((a, b) => a + b, 0)
            : 0;
    }

    map.U.setData('expeditions', expeditions);
    EventBus.$emit('expeditions-loaded', { local, ...expeditions });
    window.expeditions = expeditions;
    // this.stopAnimation();
    resetHashAnimation({ map });
    loadedExpeditions = true;
    // this.findPairs(expeditions);
}

function updateFilters({ map, filters }) {
    const successFilter =
        filters.outcome === 'all'
            ? true
            : ['==', ['get', 'success'], filters.outcome === 'success'];
    map.U.setFilter(/expeditions-/, [
        'all',
        filters.participants || ''
            ? [
                  'in',
                  (filters.participants || '').replace(/ /g, '_').toLowerCase(),
                  ['get', 'participantsStringLower'],
              ]
            : true,
        ['>=', ['get', 'participantsCount'], filters.minParticipants],
        ['<=', ['get', 'participantsCount'], filters.maxParticipants],
        ['>=', ['get', 'year'], filters.minYear],
        ['<=', ['get', 'year'], filters.maxYear],
        successFilter,
    ]);
    map.U.setCircleRadius('expeditions-circles', circleRadiusFunc({ filters }));
}

function updateCircleColors({ map, filters, activeColorFunc }) {
    map.U.setCircleColor('expeditions-glow', [
        'step',
        ['zoom'],
        activeColorFunc,
        3,
        ['case', ['get', 'success'], activeColorFunc, 'transparent'],
    ]);

    map.U.setCircleColor('expeditions-circle', [
        'step',
        ['zoom'],
        activeColorFunc,
        3,
        ['case', ['get', 'success'], activeColorFunc, 'transparent'],
    ]);
}

function glowCircleColor(activeColorFunc) {
    return [
        'step',
        ['zoom'],
        activeColorFunc,
        3,
        ['case', ['get', 'success'], activeColorFunc, 'transparent'],
    ];
}

function circlesCircleColor(activeColorFunc) {
    return [
        'step',
        ['zoom'],
        activeColorFunc,
        3,
        ['case', ['get', 'success'], activeColorFunc, 'transparent'],
    ];
}

function circlesStrokeColor(activeColorFunc) {
    return [
        'case',
        ['get', 'success'],
        ['case', ['get', 'global'], '#fff', 'hsla(0,0%,30%,0.5)'],
        activeColorFunc,
        // 'hsl(180,0%,90%)',
    ];
}

export function updateHashStyle({ map, filters, quickUpdate = false }) {
    // const colors = window.app.yearColors;

    const dark = true;

    const first = !map.getLayer('expeditions-circles');

    if (first) {
        map.U.addGeoJSON('expeditions'); //, 'expeditions.json'
        map.U.addGeoJSON('expedition-selected');
        // getExpeditions(true, map).then(() =>
        //     resetHashAnimation({ map, filters, show: true })
        // );
        getExpeditions(false, map).then(() =>
            resetHashAnimation({ map, filters, show: true })
        );
    }

    const activeColorFunc = colorFunc(filters);
    map.U.addCircle('expeditions-glow', 'expeditions', {
        circleColor: glowCircleColor(activeColorFunc),

        circleOpacity: ['feature-state', 'opacity'],
        circleBlur: 0.5,
        circleRadius: circleRadiusFunc({ isGlow: true, filters }),
        circleSortKey: ['get', 'days'],
    });
    map.U.addCircle('expeditions-clickable', 'expeditions', {
        circleColor: 'transparent',
        circleRadius: circleRadiusFunc({ filters, isClickable: true }),
        circleSortKey: ['get', 'days'],
    });

    map.U.addCircle('expeditions-circles', 'expeditions', {
        circleColor: circlesCircleColor(activeColorFunc),
        circleStrokeColor: circlesStrokeColor(activeColorFunc),
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

        circleRadius: circleRadiusFunc({ filters }),
        circleSortKey: ['get', 'days'],
        // circleOpacity: ['case', ['feature-state', 'show'], 1, 0],
        circleOpacity: ['feature-state', 'opacity'],
        circleStrokeOpacity: ['case', ['feature-state', 'show'], 1, 0],
    });
    map.U.addCircle('expedition-selected', 'expedition-selected', {
        circleColor: 'transparent',
        circleStrokeColor: 'yellow',
        circleStrokeWidth: 2,
        circleRadius: 20,
        circleBlur: 0.2,
    });
    map.U.addCircle('expeditions-flash', 'expeditions', {
        circleColor: [
            'step',
            ['zoom'],
            activeColorFunc,
            4,
            [
                'case',
                ['get', 'success'],
                activeColorFunc,
                'transparent' /*'hsl(180,0%,90%)'*/,
            ],
        ],
        circleStrokeColor: [
            'case',
            ['get', 'success'],
            'hsla(0,0%,30%,0.5)',
            activeColorFunc,
        ],
        // circleStrokeWidth: ['step', ['zoom'], 0, 6, 0.5, 8, 1],

        circleRadius: circleRadiusFunc({ isFlash: true, filters }),
        circleSortKey: ['get', 'days'],
        // circleOpacity: ['case', ['feature-state', 'show'], 1, 0],
        circleOpacity: ['feature-state', 'flashOpacity'],
        circleStrokeOpacity: ['case', ['feature-state', 'show'], 1, 0],
        circleBlur: 1.5,
    });
    map.U.addSymbol('expeditions-label', 'expeditions', {
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
        textColor: activeColorFunc, //dark ? '#bbb' : 'black',
        textHaloColor: dark ? 'hsla(0,0%,0%,0.4)' : 'hsla(0,0%,100%,0.5)',
        textHaloWidth: 1,
        textOpacity: ['feature-state', 'opacity'],
        minzoom: 9,
    });
    // updateCircleColors({ map, filters, activeColorFunc });

    if (!quickUpdate) {
        updateFilters({ map, filters });
    }

    if (first) {
        map.U.hoverPointer(/expeditions-(clickable)/);
        const clickFunc = (e) => {
            console.log(e);
            EventBus.$emit('select-feature', e.features[0]);
        };
        map.on('click', 'expeditions-clickable', clickFunc);
        // map.on('click', 'expeditions-circles', clickFunc);
        // map.on('click', 'expeditions-glow', clickFunc);

        map.U.hoverPopup(
            'expeditions-glow',
            (f) =>
                `<div>${f.properties.id}</div> ${JSON.parse(
                    f.properties.participants
                ).join(', ')}`,
            { closeButton: false }
        );

        map.on('moveend', () => {
            const filters = window.Filters.filters;
            if (filters.colorVis === 'participants') {
                // updateHashStyle({ map, filters, quickUpdate: true });
                const acf = colorFunc(filters);

                map.U.setCircleColor(
                    'expeditions-circles',
                    circlesCircleColor(acf)
                );
                map.U.setCircleStrokeColor(
                    'expeditions-circles',
                    circlesStrokeColor(acf)
                );
                map.U.setCircleColor('expeditions-glow', glowCircleColor(acf));
                EventBus.$emit('colors-change', {
                    colorVis: filters.colorVis,
                    colors: legendColors(filters, acf),
                });
            }
        });
        EventBus.$on('select-feature', (feature) =>
            map.U.setData(
                'expedition-selected',
                feature || { type: 'FeatureCollection', features: [] }
            )
        );
        EventBus.$on('navigate-expedition', (expedition) => {
            if (expedition) {
                EventBus.$emit('select-feature', {
                    ...expedition,
                    properties: {
                        ...expedition.properties,
                        // select-feature is normally sending a feature that came out of the map, which stringifies complex attribute types
                        participants: JSON.stringify(
                            expedition.properties.participants
                        ),
                    },
                });
                map.flyTo({
                    center: expedition.geometry.coordinates,
                    zoom: 13,
                });
            }
        });
    }
    EventBus.$emit('colors-change', {
        colorVis: filters.colorVis,
        colors: legendColors(filters, activeColorFunc),
    });
}

export function resetHashAnimation({ map, filters, show }) {
    for (const f of expeditions.features) {
        map.setFeatureState(
            { id: f.id, source: 'expeditions' },
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
    for (const f of expeditions.features) {
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
                    { id: f.id, source: 'expeditions' },
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
