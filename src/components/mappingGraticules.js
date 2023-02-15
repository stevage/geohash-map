import { EventBus } from '@/EventBus';
import { getGraticuleBounds, dateToDays } from './util';
import * as d3 from 'd3';
import * as turf from '@turf/turf';

let graticules = {};
const string0 = (n) => (Object.is(n, -0) ? '-0' : String(n));
EventBus.$on('expeditions-loaded', ({ local, ...hashes }) => {
    if (local) {
        // avoid computing graticules twice
        // return;
    }
    graticules = {};
    window.maxParticipants = 0;
    for (const hash of hashes.features) {
        const x = string0(hash.properties.x);
        const y = string0(hash.properties.y);

        if (hash.properties.global) {
            continue;
        }
        graticules[x] = graticules[x] || {};
        graticules[x][y] = graticules[x][y] || {
            expeditions: 0,
            successes: 0,
            failures: 0,
        };
        const g = graticules[x][y];
        g.id = `${y},${x}`;
        g.expeditions++;
        if (hash.properties.success) {
            g.successes++;
        } else {
            g.failures++;
        }
        g.firstExpeditionDays = Math.min(
            g.firstExpeditionDays || 0,
            hash.properties.days
        );
        g.lastExpeditionDays = hash.properties.days;
        g.daysSinceExpedition = dateToDays(new Date()) - hash.properties.days;

        g.participants = g.participants || {};
        for (const p of hash.properties.participants) {
            g.participants[p] = true;
        }
        g.totalParticipants = Object.keys(g.participants).length;
        window.maxParticipants = Math.max(
            g.totalParticipants,
            window.maxParticipants
        );
        if (window.maxParticipants === g.totalParticipants) {
            window.maxParticipantsGraticule = `${x},${y}`;
        }
    }
    window.graticules = graticules;
    // future idea, use feature-state instead of rewriting the geoms
    recalculateGraticules(window.map);
    for (const y of Object.keys(graticules)) {
        for (const x of Object.keys(graticules[y])) {
            const g = graticules[y][x];
            window.activeGraticules = window.activeGraticules || [];
            window.activeGraticules.push(g);
        }
    }
});

function getGraticule(x, y) {
    return (
        (graticules[x] && graticules[x][y]) || {
            expeditions: 0,
            successes: 0,
            failures: 0,
        }
    );
}

async function getGraticules(map) {
    const normx = (x) => ((x + 540) % 360) - 180;
    const boundsNorm = map.getBounds().toArray().flat();

    boundsNorm[0] = normx(boundsNorm[0]);
    boundsNorm[2] = normx(boundsNorm[2]);

    await window.graticuleNamesP;

    function makeGraticules(signx, signy) {
        for (let ax = 0; ax <= 179; ax++) {
            for (let ay = 0; ay <= 89; ay++) {
                const x = ax * signx;
                const y = ay * signy;
                const xstr = string0(ax * signx);
                const ystr = string0(ay * signy);

                graticules.push(
                    turf.polygon(
                        [
                            [
                                [x, y],
                                [x + signx, y],
                                [x + signx, y + signy],
                                [x, y + signy],
                                [x, y],
                            ],
                        ],
                        {
                            x: xstr,
                            y: ystr,
                            type: 'graticule',
                            name:
                                window.graticuleNamesHash[ystr + ',' + xstr] ||
                                null,
                            ...getGraticule(x, y),
                        }
                    )
                );
                const labelX = x + (signx > 0 ? 0 : -1);
                const labelY = y + (signy > 0 ? 1 : 0);
                const yxstr = `${ystr},${xstr}`;
                const name = window.graticuleNamesHash[yxstr];
                const nameShort =
                    name && name.match(/[a-z], [a-z]/i)
                        ? name.split(', ')[0]
                        : name;
                const nameLong = name ? `${name} (${yxstr})` : yxstr;
                const nameCountry =
                    name && name.match(/[a-z], [a-z]/i)
                        ? name.split(', ')[1]
                        : '';
                graticuleLabels.push(
                    turf.point([labelX, labelY], {
                        type: 'graticule-label',
                        x: xstr,
                        y: ystr,
                        nameShort: nameShort || yxstr,
                        name: name || yxstr,
                        nameCountry,
                        nameLong,
                    })
                );
            }
        }
    }

    const graticules = [];
    const graticuleLabels = [];
    for (const signx of [-1, 1]) {
        for (const signy of [-1, 1]) {
            makeGraticules(signx, signy);
        }
    }

    const fc = {
        type: 'FeatureCollection',
        features: [...graticules, ...graticuleLabels],
    };
    // console.log(fc.features.filter(length, 'graticules');
    window.app.graticules = fc;
    return fc;
}

async function recalculateGraticules(map) {
    map.U.setData('graticules', await getGraticules(map));
}

async function getGraticuleNames() {
    const url = 'https://fippe.de/graticules.csv'; // 'graticules.csv'
    const rows = await window
        .fetch(url)
        .then((x) => x.text())
        .then((t) => t.split('\n'));
    // window.graticuleNames = await d3.dsv(';', 'graticules.csv');
    const names = rows.map((x) => {
        const parts = x.split(';');
        // return {
        //     y: parts[0],
        //     x: parts[1],
        //     name: parts[2],
        // };
        return [parts[0] + ',' + parts[1], parts[2]];
    });
    window.graticuleNamesHash = Object.fromEntries(names);
}

function getClassAreasByVectorLayer(map, bbox, vectorLayer) {
    const flatten = (fs) => turf.flatten(turf.featureCollection(fs)).features;
    function aggregateClasses(landuses) {
        const classes = {};
        for (const l of landuses) {
            if (!classes[l.class]) {
                classes[l.class] = {
                    area: 0,
                };
            }
            classes[l.class].area += l.area;
        }
        return classes;
    }

    let landUses = flatten(
        map.querySourceFeatures('composite', {
            sourceLayer: vectorLayer,
        })
    );

    // console.log(landUses);
    landUses = landUses.map((f) => turf.bboxClip(f, bbox));
    landUses = turf.dissolve(turf.flatten(turf.featureCollection(landUses)), {
        propertyName: 'class',
    }).features;

    // if (vectorLayer === 'water') {
    //     console.log('water', landUses);
    //     map.U.addGeoJSON(
    //         'watr',
    //         turf.featureCollection(
    //             landUses
    //                 .filter((f) => turf.area(f) > 0)
    //                 .map(
    //                     (f, i) => (
    //                         (f.properties.color = `hsl(${i * 50}, 100%, 50%)`),
    //                         (f.properties.thickness = (i + 1) % 10),
    //                         f
    //                     )
    //                 )
    //         )
    //     );

    //     map.U.addLine('watr-line', 'watr', {
    //         lineColor: ['get', 'color'],
    //         lineOpacity: 0.3,
    //         lineDasharray: [3, 12],
    //         lineWidth: ['get', 'thickness'],
    //     });
    //     map.U.addFill('watr-fill', 'watr', {
    //         fillColor: ['get', 'color'],
    //         fillOpacity: 0.3,
    //     });
    // }

    landUses = landUses
        .map((f) => ({ area: turf.area(f), ...f.properties }))
        .filter((f) => f.area > 0);

    console.log(landUses);
    return aggregateClasses(landUses);
}

function clickGraticuleLabel(map, e) {
    console.log(e.features[0]);
    const graticule = window.app.graticules.features.find(
        (f) =>
            f.properties.x === e.features[0].properties.x &&
            f.properties.y === e.features[0].properties.y
    );
    const bbox = turf.bbox(graticule);
    // console.log(bbox);

    const uses = {
        ...getClassAreasByVectorLayer(map, bbox, 'landuse'),
        water: getClassAreasByVectorLayer(map, bbox, 'water').undefined,
    };
    const total = Object.values(uses).reduce((acc, val) => acc + val.area, 0);

    console.log(uses);
    EventBus.$emit('show-graticule-info', {
        graticule,
        uses,
        area: turf.area(graticule),
        other: turf.area(graticule) - total,
    });
}

export function updateGraticuleStyle({ map, filters }) {
    const first = !map.getSource('graticules');
    if (first) {
        map.U.addGeoJSON('graticules');

        map.U.addLine('graticules-line', 'graticules', {
            // lineOffset: 0.5,
            lineColor: [
                'case',
                ['>', ['get', 'successes'], 0],
                // '#ccc',
                // 'hsla(0,0%,30%,0.2)',
                'hsla(0,0%,30%,0.15)',
                'hsla(0,0%,30%,0.15)',
                // '#ffc',
            ],
            lineOpacity: ['interpolate', ['linear'], ['zoom'], 5, 0, 6, 1],

            minzoom: 4,
            filter: ['==', ['get', 'type'], 'graticule'],
        });
        const virginFillColor = [
            'case',
            ['>', ['get', 'successes'], 0],
            'transparent',
            'hsla(0,0%,30%,0.2)',
        ];
        map.U.addFill('graticules-fill', 'graticules', {
            fillColor: virginFillColor,
            fillOutlineColor: 'transparent',
            fillOpacity: ['interpolate', ['linear'], ['zoom'], 3, 0, 4, 1],
            minzoom: 3,

            // lineColor: 'red',
            filter: ['==', ['get', 'type'], 'graticule'],
        });
        map.U.addSymbol('graticules-label', 'graticules', {
            textField: [
                'step',
                ['zoom'],
                ['get', 'nameShort'],
                9,
                ['get', 'name'],
                11,
                ['get', 'nameLong'],
            ],
            textAnchor: 'top-left',
            // textColor: 'hsla(0,0%,15%,0.9)',
            textColor: 'hsla(0,0%,50%,0.9)',
            textSize: 12,
            textJustify: 'left',
            textMaxWidth: 150,
            filter: ['==', ['get', 'type'], 'graticule-label'],
            minzoom: 7,
        });

        map.on('click', 'graticules-label', (e) => clickGraticuleLabel(map, e));
        window.graticuleNamesP = getGraticuleNames(); // a promise

        EventBus.$on('graticule-options-change', (options) => {
            map.U.toggle(
                ['graticules-line', 'graticules-fill'],
                options.showGraticules
            );
            map.U.toggle(
                'graticules-label',
                options.showGraticules && options.showGraticuleLabels
            );
            map.U.toggle(
                'graticules-fill',
                options.showGraticules && options.fillStyle !== 'none'
            );
            map.U.setFillColor(
                'graticules-fill',
                {
                    virgin: virginFillColor,
                    none: 'transparent',
                    expeditions: [
                        'interpolate-hcl',
                        ['linear'],
                        ['get', 'expeditions'],
                        0,
                        'hsla(0,0%,100%,0.3)',
                        100,
                        'hsla(0,0%,100%,0)',
                    ],
                    ratio: [
                        'case',
                        ['>', ['get', 'expeditions'], 0],
                        [
                            'interpolate-hcl',
                            ['linear'],
                            ['/', ['get', 'successes'], ['get', 'expeditions']],
                            0,
                            'hsla(0,100%,50%,0.3)',
                            1,
                            'hsla(240,100%,50%,0.3)',
                        ],
                        'transparent',
                    ],
                    // TODO: align these colors with the expedition colorss
                    daysSinceExpedition: [
                        'interpolate-hcl',
                        ['linear'],
                        ['get', 'daysSinceExpedition'],
                        0,
                        'hsla(120,100%,50%,0.3)',
                        1 * 365,
                        'hsla(0,100%,50%,0.3)',
                        5 * 365,
                        'hsla(240,100%,50%,0.3)',
                    ],
                    totalParticipants: [
                        'interpolate-hcl',
                        ['linear'],
                        ['get', 'totalParticipants'],
                        0,
                        'hsla(0,100%,50%,0.3)',
                        20,
                        'hsla(100,100%,50%,0.3)',
                    ],
                }[options.fillStyle]
            );
        });
    }
}
