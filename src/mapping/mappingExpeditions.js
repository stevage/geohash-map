import U from 'map-gl-utils/noflow/index';
import { EventBus } from '@/EventBus';
import { colorFunc, legendColors } from './expeditions/colorFuncs';
import { circleRadiusFunc } from './expeditions/radiusFunc';
import { getExpeditions } from './expeditions/expeditionsData';
import { setUrlParam } from '@/util';

import debounce from 'debounce';

function updateFilters({ map, filters }) {
    const successFilter =
        filters.outcome === 'all'
            ? true
            : ['==', ['get', 'success'], filters.outcome === 'success'];
    let participantsFilter = true;
    if (filters.participants) {
        participantsFilter = [
            'any',
            ...filters.participants
                .split(/,\s*/)
                .map((p) => [
                    'in',
                    p.replace(/ /g, '_').toLowerCase(),
                    ['get', 'participantsStringLower'],
                ]),
        ];
    }
    console.log('filter', participantsFilter);
    map.U.setFilter(/expeditions-/, [
        'all',
        participantsFilter,
        ['>=', ['get', 'participantsCount'], filters.minParticipants],
        ['<=', ['get', 'participantsCount'], filters.maxParticipants],
        ['>=', ['get', 'year'], filters.minYear],
        ['<=', ['get', 'year'], filters.maxYear],
        successFilter,
    ]);
    map.U.setCircleRadius('expeditions-circles', circleRadiusFunc({ filters }));
}

const updateFiltersDebounced = debounce(updateFilters, 1500);

function updateCircleColors({ map, filters, activeColorFunc }) {
    map.U.setCircleColor(
        'expeditions-glow',
        U.stepZoom(activeColorFunc, {
            3: ['case', ['get', 'success'], activeColorFunc, 'transparent'],
        })
    );

    map.U.setCircleColor(
        'expeditions-circle',
        U.stepZoom(activeColorFunc, {
            3: ['case', ['get', 'success'], activeColorFunc, 'transparent'],
        })
    );
}

function glowCircleColor(activeColorFunc) {
    return U.stepZoom(activeColorFunc, 3, [
        'case',
        ['get', 'success'],
        activeColorFunc,
        'transparent',
    ]);
}

function circlesCircleColor(activeColorFunc) {
    return U.stepZoom(activeColorFunc, {
        3: ['case', ['get', 'success'], activeColorFunc, 'transparent'],
    });
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

function loadSelectedExpedition(expeditions) {
    const url = new URL(window.location);
    const expeditionId = url.searchParams.get('expedition');
    if (expeditionId) {
        const expedition = expeditions.features.find(
            (f) => f.properties.id === expeditionId
        );
        if (expedition) {
            EventBus.$emit('select-feature', expedition);
            window.map.jumpTo({
                center: expedition.geometry.coordinates,
                zoom: 9,
            });
        }
    }
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
        getExpeditions(false, map).then((expeditions) => {
            map.U.setData('expeditions', expeditions);
            EventBus.$emit('expeditions-loaded', {
                local: false,
                ...expeditions,
            });
            loadSelectedExpedition(expeditions);
            window.expeditions = expeditions;
            resetHashAnimation({ map });

            resetHashAnimation({ map, filters, show: true });
        });
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
        circleStrokeWidth: U.stepZoom(['case', ['get', 'global'], 0, 0], {
            1: ['case', ['get', 'global'], 1, 0],
            3: [
                'case',
                ['get', 'global'],
                2,
                ['case', ['get', 'success'], 0, 2],
            ],
            6: [
                'case',
                ['get', 'global'],
                2,
                ['case', ['get', 'success'], 0.5, 2],
            ],

            8: [
                'case',
                ['get', 'global'],
                4,
                ['case', ['get', 'success'], 1, 2],
            ],
        }),
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
        circleColor: U.stepZoom(activeColorFunc, {
            4: [
                'case',
                ['get', 'success'],
                activeColorFunc,
                'transparent' /*'hsl(180,0%,90%)'*/,
            ],
        }),
        circleStrokeColor: [
            'case',
            ['get', 'success'],
            'hsla(0,0%,30%,0.5)',
            activeColorFunc,
        ],
        circleRadius: circleRadiusFunc({ isFlash: true, filters }),
        circleSortKey: ['get', 'days'],
        // circleOpacity: ['case', ['feature-state', 'show'], 1, 0],
        circleOpacity: ['feature-state', 'flashOpacity'],
        circleStrokeOpacity: ['case', ['feature-state', 'show'], 1, 0],
        circleBlur: 1.5,
    });
    map.U.addSymbol('expeditions-label', 'expeditions', {
        textField: U.stepZoom(['slice', ['get', 'id'], 0, 4], {
            11: ['slice', ['get', 'id'], 0, 10],
            12: [
                'concat',
                ['slice', ['get', 'id'], 0, 10],
                '\n',
                ['get', 'participantsString'],
            ],
        }),
        textSize: U.interpolateZoom({ 10: 10, 12: 12 }),
        // textSize: ['interpolate', ['linear'], ['zoom'], 10, 10, 12, 12],
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
            if (
                filters.colorVis === 'participants' ||
                filters.colorVis === 'participantsFixed'
            ) {
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
        EventBus.$on('select-feature', (feature) => {
            map.U.setData(
                'expedition-selected',
                feature || { type: 'FeatureCollection', features: [] }
            );

            setUrlParam('expedition', feature ? feature.properties.id : null);
        });
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
    for (const f of window.expeditions.features) {
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
    for (const f of window.expeditions.features) {
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
