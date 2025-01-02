import { around } from 'geokdbush';
import kdbush from 'kdbush';
import * as turf from '@turf/turf';
let db;
let resolveLoad;
const indexLoaded = new Promise((resolve) => {
    resolveLoad = resolve;
});
// let expeditions, successes;

class ExpeditionIndex {
    constructor() {}
    init(expeditions) {
        function makeIndex(es) {
            const newIndex = new kdbush(es.length);
            for (const f of es) {
                newIndex.add(
                    f.geometry.coordinates[0],
                    f.geometry.coordinates[1]
                );
            }
            newIndex.finish();
            return newIndex;
        }
        this.expeditions = expeditions;
        this.index = makeIndex(expeditions);
        this.successes = expeditions.filter((f) => f.properties.success);
        this.successIndex = makeIndex(this.successes);
        resolveLoad();
    }

    initFromData({ indexData, successIndexData, successes, expeditions }) {
        this.index = kdbush.from(indexData);
        this.successIndex = kdbush.from(successIndexData);
        this.successes = successes;
        this.expeditions = expeditions;
        resolveLoad();
    }

    getExpeditionsNear(center, bounds, filters) {
        if (!this.successIndex) {
            return [];
        }
        const [lon, lat] = center;
        const dist = turf.distance(
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]],
            { units: 'kilometers' }
        );
        const filterFunc = expeditionFilterFunc(filters);
        const results = around(
            this.successIndex,
            lon,
            lat,
            1e9,
            dist * 3,
            (i) => filterFunc(this.successes[i])
        );
        return results.map((i) => this.successes[i]);
    }

    getNearestExpeditions(point, { maxResults, maxDistance } = {}) {
        if (!this.successIndex) {
            return [];
        }
        return around(
            this.successIndex,
            point[0],
            point[1],
            maxResults,
            maxDistance
        ).map((i) => this.successes[i]);
    }

    getExpeditionsNearViewport(map, { filters } = {}) {
        return this.getExpeditionsNear(
            map.getCenter().toArray(),
            map.getBounds().toArray().flat(),
            filters
        );
    }

    getData() {
        return {
            indexData: this.index.data,
            successIndexData: this.successIndex.data,
            expeditions: this.expeditions,
            successes: this.successes,
        };
    }
}

function expeditionFilterFunc(filters) {
    if (!filters) {
        return () => true;
    }
    return (f) => {
        // participantsFilter = [
        //     'any',
        //     ...filters.participants
        //         .split(/,\s*/)
        //         .map((p) => [
        //             'in',
        //             p.replace(/ /g, '_').toLowerCase(),
        //             ['get', 'participantsStringLower'],
        //         ]),
        // ];

        return (
            f.properties.year >= filters.minYear &&
            f.properties.year <= filters.maxYear &&
            // f.properties.success === filters.success
            f.properties.participantsCount >= filters.minParticipants &&
            f.properties.participantsCount <= filters.maxParticipants &&
            filters.participants
                .split(/,\s*/)
                .some((p) =>
                    f.properties.participantsStringLower.includes(
                        p.replace(/ /g, '_').toLowerCase()
                    )
                ) &&
            (f.properties.dayOfWeek === 'all' ||
                f.properties.weekDayName === filters.dayOfWeek)
        );
    };
}

db = new ExpeditionIndex();
export function initIndex(expeditions) {
    db.init(expeditions);
    window.db = db;
    window.si = db.successIndex;
}

export function initFromData(data) {
    db.initFromData(data);
}

export function getExpeditionsNearViewport(map) {
    if (!db) {
        return [];
    }

    return db.getExpeditionsNearViewport(map);
}

export async function getDB() {
    await indexLoaded;
    return db;
}
// export function makeIndex(exps) {
//     function make(es) {
//         const newIndex = new kdbush(es.length);
//         for (const f of es) {
//             newIndex.add(f.geometry.coordinates[0], f.geometry.coordinates[1]);
//         }
//         newIndex.finish();
//         return newIndex;
//     }
//     expeditions = exps;
//     index = make(expeditions);
//     successes = expeditions.filter((f) => f.properties.success);
//     successIndex = make(successes);
//     window.s = successes;
//     window.si = successIndex;
// }

// export function getExpeditionsNearViewport(map) {
//     if (!successIndex) {
//         return [];
//     }
//     const [lon, lat] = map.getCenter().toArray();
//     const dist = turf.distance(
//         map.getBounds().getNorthWest().toArray(),
//         map.getBounds().getSouthEast().toArray(),
//         { units: 'kilometers' }
//     );
//     const results = around(successIndex, lon, lat, 1e9, dist * 3);
//     return results.map((i) => successes[i]);
// }
// window.getExpeditionsNearViewport = getExpeditionsNearViewport;
