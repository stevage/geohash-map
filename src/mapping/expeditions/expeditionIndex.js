import { around } from 'geokdbush-tk';
import kdbush from 'kdbush';
import * as turf from '@turf/turf';
let index, successIndex;
let expeditions, successes;
export function makeIndex(exps) {
    function make(es) {
        const newIndex = new kdbush(es.length);
        for (const f of es) {
            newIndex.add(f.geometry.coordinates[0], f.geometry.coordinates[1]);
        }
        newIndex.finish();
        return newIndex;
    }
    expeditions = exps;
    index = make(expeditions);
    successes = expeditions.filter((f) => f.properties.success);
    successIndex = make(successes);
    window.s = successes;
    window.si = successIndex;
}

export function getExpeditionsNearViewport(map) {
    const [lon, lat] = map.getCenter().toArray();
    const dist = turf.distance(
        map.getBounds().getNorthWest().toArray(),
        map.getBounds().getSouthEast().toArray(),
        { units: 'kilometers' }
    );
    const results = around(successIndex, lon, lat, 1e9, dist * 3);
    return results.map((i) => successes[i]);
}
window.getExpeditionsNearViewport = getExpeditionsNearViewport;
