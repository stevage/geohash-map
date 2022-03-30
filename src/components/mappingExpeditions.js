import { Expression } from 'mapgl-expression';
import { EventBus } from '@/EventBus';
import { dateToDays, dateToWeekday } from './util';
import tableauColors from './tableauColors';

let expeditions;
let loadedExpeditions;

let visibleParticipants;

async function getExpeditions(local, map) {
    const url = local
        ? 'alldata.json'
        : 'https://fippe-geojson.glitch.me/alldata.json';
    const newExpeditions = await window.fetch(url).then((x) => x.json());
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
        f.properties.weekday = dateToWeekday(f.properties.id.slice(0, 10));
        f.properties.weekDayName =
            'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(
                ' '
            )[f.properties.weekday];
        // if (x !== undefined && y !== undefined) {
        // sigh globalexpeditions
        f.properties.x = +x || 0;
        f.properties.y = +y || 0;
        f.properties.global = /global/.test(f.properties.id);
        const gname = window.graticuleNamesHash[`${y},${x}`];
        f.properties.graticuleName = gname;
        f.properties.graticuleNameShort =
            gname && gname.match(/[a-z], [a-z]/i)
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
        f.properties.graticuleLatitude = +f.properties.graticule.split(',')[0];
        f.properties.graticuleLongitude = +f.properties.graticule.split(',')[1];
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

function monthColorFunc() {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'month'],
        0,
        'hsl(0, 100%, 40%)',
        2,
        'hsl(60, 100%, 40%)',
        4,
        'hsl(120, 100%, 40%)',
        8,
        'hsl(240, 100%, 40%)',
        10,
        'hsl(310, 100%, 40%)',
        12,
        'hsl(0, 100%, 40%)',
    ];
    return ret;
}
function weekdayColorFunc() {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'weekday'],
        0,
        'hsl(390, 80%, 40%)',
        2,
        'hsl(240, 80%, 40%)',
        4,
        'hsl(180, 80%, 40%)',
        5,
        'hsl(120, 80%, 40%)',
        6,
        // 'hsl(60, 100%, 50%)', // saturday special
        'hsl(60, 80%, 40%)', // saturday not eye catching
        7,
        'hsl(30, 80%, 40%)',
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

function participantsColorFunc() {
    // TODO cache this result because it's slow to compute and a few things use this result
    // const expeditions = window.map.queryRenderedFeatures({ layers: ['expeditions-circles']});

    const bounds = map.getBounds();
    const visibleExpeditions = window.expeditions.features.filter((f) =>
        bounds.contains(f.geometry.coordinates)
    );
    const participants = {};
    for (const f of visibleExpeditions) {
        // focus on the 1-or-multiple use case
        if (f.properties.participantsCount === 1) {
            for (const p of f.properties.participants) {
                if (!participants[p]) {
                    participants[p] = {
                        expeditions: 0,
                    };
                }
                participants[p].expeditions++;
            }
        }
    }
    const participantsList = [
        { name: 'Multiple' },
        ...Object.entries(participants)
            .map(([name, props]) => ({ name, ...props }))
            .sort((a, b) => b.expeditions - a.expeditions),
    ];

    const scheme = tableauColors[3];
    visibleParticipants = participantsList.slice(0, scheme.length);
    const ret = [
        'match',
        ['get', 'participantsOrMultiple'],
        ...visibleParticipants.flatMap((participant, i) => [
            participant.name,
            `rgb(${scheme[i]})`,
        ]),
        'black',
    ];
    console.log(ret);
    return ret;
}

function colorFunc(filters) {
    return {
        year: yearColorFunc,
        month: monthColorFunc,
        weekday: weekdayColorFunc,
        experienceMax: experienceColorFunc,
        experienceDaysMax: experienceDaysColorFunc,
        participants: participantsColorFunc,
    }[filters.colorVis]();
}
function legendColors(filters, activeColorFunc) {
    const vals = [];
    const feature = (properties) => ({
        type: 'Feature',
        properties,
        geometry: null,
    });
    if (filters.colorVis === 'experienceMax') {
        for (let experienceMax of [1, 5, 10, 20, 50, 100, 250]) {
            const color = Expression.parse(activeColorFunc).evaluate(
                feature({
                    experienceMax,
                })
            );
            vals.push([experienceMax, color]);
        }
    } else if (filters.colorVis === 'experienceDaysMax') {
        for (let experienceYearsMax of [0, 1, 2, 5, 10]) {
            const color = Expression.parse(activeColorFunc).evaluate({
                type: 'Feature',
                properties: {
                    experienceDaysMax: experienceYearsMax * 365,
                },
                geometry: null,
            });
            vals.push([experienceYearsMax, color]);
        }
    } else if (filters.colorVis === 'year') {
        for (let year = 2008; year <= 2022; year++) {
            const color = Expression.parse(activeColorFunc).evaluate({
                type: 'Feature',
                properties: {
                    year,
                    days: dateToDays(year),
                },
                geometry: null,
            });
            vals.push([year, color]);
        }
    } else if (filters.colorVis === 'month') {
        for (let month = 12; month >= 1; month--) {
            const color = Expression.parse(activeColorFunc).evaluate({
                type: 'Feature',
                properties: {
                    month,
                },
                geometry: null,
            });
            const monthName =
                'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[
                    month - 1
                ];
            vals.push([monthName, color]);
        }
    } else if (filters.colorVis === 'weekday') {
        for (let weekday = 6; weekday >= 0; weekday--) {
            const color = Expression.parse(activeColorFunc).evaluate({
                type: 'Feature',
                properties: {
                    weekday,
                },
                geometry: null,
            });
            const weekdayName = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ')[
                weekday
            ];
            vals.push([weekdayName, color]);
        }
    } else if (filters.colorVis === 'participants') {
        for (const participant of visibleParticipants) {
            const color = Expression.parse(activeColorFunc).evaluate(
                feature({
                    participantsOrMultiple: participant.name,
                })
            );
            vals.push([participant.name, color]);
        }
        vals.push(['Other', 'black']); // TODO don't hardcode black

        vals.reverse();
    } else {
        throw 'unknown colorVis' + filters.colorVis;
    }
    return vals;
}
function circleRadiusFunc({ isGlow, isFlash, filters, isClickable } = {}) {
    const extra = isFlash ? 30 : isGlow ? 2 : isClickable ? 4 : 0;
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

        getExpeditions(true, map).then(() =>
            resetHashAnimation({ map, filters, show: true })
        );
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
