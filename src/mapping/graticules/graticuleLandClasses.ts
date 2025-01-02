import { mapU } from '@/util';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Polygon } from 'geojson';

export function getClassAreasByVectorLayer(
    map: mapU,
    bbox: turf.helpers.BBox,
    vectorLayer: string
) {
    const flatten = (fs: Feature<Polygon>[]) =>
        turf.flatten(turf.featureCollection(fs)).features;
    function aggregateClasses(landuses: { area: number; class: string }[]) {
        const classes = {} as Record<string, { area: number }>;
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

    const landUsesAll = flatten(
        map.querySourceFeatures('composite', {
            sourceLayer: vectorLayer,
        }) as Feature<Polygon>[]
    );

    // console.log(landUses);
    const landUsesClipped = landUsesAll.map((f) =>
        turf.bboxClip(f, bbox)
    ) as Feature<Polygon>[];
    const landUsesClipped2 = turf.dissolve(
        turf.flatten(turf.featureCollection(landUsesClipped)),
        {
            propertyName: 'class',
        }
    ).features;

    const landUsesClipped3 = landUsesClipped2
        .map((f) => ({ area: turf.area(f), ...f.properties }))
        .filter((f) => f.area > 0);

    // @ts-ignore
    return aggregateClasses(landUsesClipped3);
}
