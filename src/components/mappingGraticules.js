import { EventBus } from '@/EventBus';

let graticules = {};

EventBus.$on('hashes-loaded', (hashes) => {
    graticules = {};
    for (const hash of hashes.features) {
        const { x, y } = hash.properties;
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
    const [minx, miny, maxx, maxy] = getGraticuleBounds(map);
    const graticules = [];
    for (let x = minx; x <= maxx; x++) {
        for (let y = miny; y <= maxy; y++) {
            const sign = y <= 0 ? -1 : 1;
            graticules.push({
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [x, y],
                            [x + 1, y],
                            [x + 1, y + sign],
                            [x, y + sign],
                            [x, y],
                        ],
                    ],
                },
                properties: { x, y, ...getGraticule(x, y) },
            });
        }
    }
    const fc = { type: 'FeatureCollection', features: graticules };
    console.log(fc);
    return fc;
}

function recalculateGraticules(map) {
    if (map.getBounds().getNorth() - map.getBounds().getSouth() < 40) {
        map.U.setData('graticules', getGraticules(map));
    } else {
        map.U.setData('graticules');
    }
}
export function updateGraticuleStyle({ map, filters }) {
    const first = !map.getSource('graticules');
    if (first) {
        map.U.addGeoJSON('graticules');
        map.on('moveend', () => {
            recalculateGraticules(map);
        });
        recalculateGraticules(map);
    }

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
        // lineColor: 'red',
    });
}
