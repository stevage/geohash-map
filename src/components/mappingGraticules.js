import { EventBus } from '@/EventBus';

let graticules = {};
const string0 = (n) => (Object.is(n, -0) ? '-0' : String(n));
EventBus.$on('expeditions-loaded', ({ local, ...hashes }) => {
    if (local) {
        // avoid computing graticules twice
        // return;
    }
    graticules = {};
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
        graticules[x][y].expeditions++;
        if (hash.properties.success) {
            graticules[x][y].successes++;
        } else {
            graticules[x][y].failures++;
        }
    }
    window.graticules = graticules;
    // future idea, use feature-state instead of rewriting the geoms
    recalculateGraticules(window.map);
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

import { getGraticuleBounds } from './util';
function getGraticules(map) {
    const normx = (x) => ((x + 540) % 360) - 180;
    const boundsNorm = map
        .getBounds()
        .toArray()
        .flat();

    boundsNorm[0] = normx(boundsNorm[0]);
    boundsNorm[2] = normx(boundsNorm[2]);

    function makeGraticules(signx, signy) {
        for (let ax = 0; ax <= 179; ax++) {
            for (let ay = 0; ay <= 89; ay++) {
                const x = ax * signx;
                const y = ay * signy;
                // sigh, took me ages to get this code right, but it's better to just load all the graticules once, rather than refreshing them every time the map moves
                // if (
                //     !bounds.contains([x, y]) &&
                //     !bounds.contains([x + signx, y + signy]) &&
                //     !bounds.contains([x + 360, y]) &&
                //     !bounds.contains([x + signx - 360, y + signy]) &&
                //     !bounds.contains([x - 360, y]) &&
                //     !bounds.contains([x + signx - 360, y + signy])
                // ) {
                //     // continue;
                // }

                graticules.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Polygon',
                        coordinates: [
                            [
                                [x, y],
                                [x + signx, y],
                                [x + signx, y + signy],
                                [x, y + signy],
                                [x, y],
                            ],
                        ],
                    },
                    properties: {
                        x: string0(ax * signx),
                        y: string0(ay * signy),
                        ...getGraticule(x, y),
                    },
                });
            }
        }
    }

    const graticules = [];
    makeGraticules(1, 1);
    makeGraticules(-1, 1);
    makeGraticules(1, -1);
    makeGraticules(-1, -1);

    const fc = { type: 'FeatureCollection', features: graticules };
    console.log(fc.features.length, 'graticules');
    return fc;
}

function recalculateGraticules(map) {
    // if (map.getBounds().getNorth() - map.getBounds().getSouth() < 40) {
    //     map.U.setData('graticules', getGraticules(map));
    // } else {
    //     map.U.setData('graticules');
    // }
    map.U.setData('graticules', getGraticules(map));
}
export function updateGraticuleStyle({ map, filters }) {
    const first = !map.getSource('graticules');
    if (first) {
        map.U.addGeoJSON('graticules');
        map.on('moveend', () => {
            // recalculateGraticules(map);
        });
        // recalculateGraticules(map);

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
        });
        map.U.addFill('graticules-fill', 'graticules', {
            fillColor: [
                'case',
                ['>', ['get', 'successes'], 0],
                // '#ccc',
                // 'hsla(0,0%,30%,0.2)',
                'transparent',
                'hsla(0,0%,30%,0.2)',
            ],
            fillOutlineColor: 'transparent',
            fillOpacity: ['interpolate', ['linear'], ['zoom'], 3, 0, 4, 1],
            minzoom: 3,

            // lineColor: 'red',
        });
    }
}
