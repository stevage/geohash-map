/*
Ok I think this method of trying to stitch together mapbox boundary lines doesn't work.

Other possibilities:

Terria LGA polygon tiles: https://tiles.terria.io/LGA_2021/11/1850/1253.pbf
WFS from somewhere?
Download and process tiles https://www.geoboundaries.org/index.html#getdata
*/

import { EventBus } from '@/EventBus';
import * as turf from '@turf/turf';
import polygonize from '@/lib/polygonize';
import polygonSplitter from 'polygon-splitter';
window.turf = turf;
function toLineString(poly) {
    return turf.lineString(poly.geometry.coordinates[0]);
}

function toMultiLineString(lineStrings) {
    return turf.multiLineString(
        lineStrings.map((ls) => ls.geometry.coordinates)
    );
}

function getCutRegions(map, level) {
    const grats = toMultiLineString(
        map.querySourceFeatures('graticules').map(toLineString)
    );
    const regionLines = turf.featureCollection(
        map.querySourceFeatures('composite', {
            sourceLayer: 'admin',
            filter: ['==', 'admin_level', level],
        })
    );
    let regions;
    try {
        regions = polygonize(regionLines).features.filter(Boolean);
    } catch (e) {
        console.log(e);
        console.log(regionLines);
        return;
    }
    console.log(regions);
    const cutRegions = [];
    for (const region of regions) {
        const r = turf.rewind(region);
        if (turf.area(r) <= 10) continue;
        console.log('split', r, grats);
        console.log('area', turf.area(r));
        const cut = polygonSplitter(r, grats);
        if (cut) {
            cutRegions.push(...cut.features);
        }
    }
    return turf.featureCollection(cutRegions);
}

export function initMappingRegions(map) {
    // map.U.addVector('regions-full', 'mapbox://mapbox.boundaries-adm1-v4');
    // map.U.addLine('regions-full-line', 'regions-full', {
    //     lineColor: 'white',
    // });
    return;
    map.U.addLine('regions-full-line', 'composite', {
        sourceLayer: 'admin',
        filter: ['==', 'admin_level', 2],
        lineColor: 'white',
    });
    EventBus.$on('moveend', () => {
        console.log(getCutRegions(map, 2));
        if (!map.getSource('regions')) {
            map.U.addGeoJSON('regions');
        }
        map.U.setData('regions', getCutRegions(map, 2));
        map.U.addLine('regions-line', 'regions', {
            lineColor: 'black',
            lineWidth: 3,
        });
    });
}
