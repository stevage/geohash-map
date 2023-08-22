import * as turf from '@turf/turf';
export function getClassAreasByVectorLayer(map, bbox, vectorLayer) {
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

    landUses = landUses
        .map((f) => ({ area: turf.area(f), ...f.properties }))
        .filter((f) => f.area > 0);

    return aggregateClasses(landUses);
}
