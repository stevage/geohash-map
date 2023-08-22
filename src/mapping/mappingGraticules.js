import U from 'map-gl-utils/noflow/index';
import { EventBus } from '@/EventBus';
import * as turf from '@turf/turf';
import { makeGraticuleStats } from '@/mapping/graticules/graticuleStats';
import { makeGraticuleFeatures } from '@/mapping/graticules/graticuleFeatures';
import { getGraticuleNames } from './graticules/graticuleNames';
import { getClassAreasByVectorLayer } from './graticules/graticuleLandClasses';
import {
    addGraticuleLayers,
    updateGraticuleStyle,
} from './graticules/graticuleStyle';

EventBus.$on('expeditions-loaded', ({ local, ...hashes }) => {
    const graticuleStats = makeGraticuleStats({ local, ...hashes });
    window.graticules = graticuleStats;
    // future idea, use feature-state instead of rewriting the geoms
    recalculateGraticules({ graticuleStats, map: window.map });
    for (const y of Object.keys(graticuleStats)) {
        for (const x of Object.keys(graticuleStats[y])) {
            const g = graticuleStats[y][x];
            window.activeGraticules = window.activeGraticules || [];
            window.activeGraticules.push(g);
        }
    }
});

async function recalculateGraticules({ graticuleStats, map }) {
    await window.graticuleNamesP;
    map.U.setData('graticules', makeGraticuleFeatures({ graticuleStats, map }));
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
    EventBus.$emit('show-graticule-info', {
        graticule,
        uses,
        area: turf.area(graticule),
        other: turf.area(graticule) - total,
    });
}

export function setGraticuleStyle({ map, filters }) {
    const first = !map.getSource('graticules');
    if (first) {
        addGraticuleLayers(map);
        window.graticuleNamesP = getGraticuleNames(); // a promise

        EventBus.$on('graticule-options-change', (options) =>
            updateGraticuleStyle(map, options)
        );
        map.on('click', 'graticules-label', (e) => clickGraticuleLabel(map, e));
        map.on(
            'click',
            'graticules-fill',
            (e) =>
                window.app.App.tab === 'graticules' &&
                clickGraticuleLabel(map, e)
        );
    }
}
