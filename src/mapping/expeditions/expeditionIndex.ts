import { around } from 'geokdbush'
import kdbush from 'kdbush'

// @ts-ignore TODO
import * as turf from '@turf/turf'
import type { Feature, Point } from 'geojson'
import type mapboxgl from 'mapbox-gl'
import type { Filters } from '@/global'

let resolveLoad: () => void
const indexLoaded = new Promise((resolve): void => {
  resolveLoad = resolve as () => void
})
// let expeditions, successes;
// export type Expedition = Feature<Point, any> // TODO...
// export type Expeditions = Expedition[]

import type { Expedition } from '@/mapping/expeditions/expeditionsData'

export class ExpeditionIndex {
  expeditions?: Expedition[]
  index?: kdbush
  successes: any
  successIndex?: kdbush
  constructor() {}

  init(expeditions: Expedition[]) {
    function makeIndex(es: Expedition[]) {
      const newIndex = new kdbush(es.length)
      for (const f of es) {
        newIndex.add(f.geometry.coordinates[0], f.geometry.coordinates[1])
      }
      newIndex.finish()
      return newIndex
    }
    this.expeditions = expeditions
    this.index = makeIndex(expeditions)
    this.successes = expeditions.filter((f) => f.properties.success)
    this.successIndex = makeIndex(this.successes)
    resolveLoad()
  }

  initFromData({
    indexData,
    successIndexData,
    successes,
    expeditions,
  }: {
    indexData: any
    successIndexData: any
    successes: Feature<Point, any>[]
    expeditions: Feature<Point, any>[]
  }): void {
    this.index = kdbush.from(indexData)
    this.successIndex = kdbush.from(successIndexData)
    this.successes = successes
    this.expeditions = expeditions
    resolveLoad()
  }

  getExpeditionsNear(center: number[], bounds: number[], filters: any): Feature<Point, any>[] {
    if (!this.successIndex) {
      return []
    }
    const [lon, lat] = center
    const dist = turf.distance([bounds[0], bounds[1]], [bounds[2], bounds[3]], {
      units: 'kilometers',
    })
    const filterFunc = expeditionFilterFunc(filters)
    const results = around(this.successIndex, lon, lat, 1e9, dist * 3, (i: number) =>
      filterFunc(this.successes[i]),
    ) as number[]
    return results.map((i: number) => this.successes[i])
  }

  getNearestExpeditions(
    point: [number, number],
    { maxResults, maxDistance }: { maxResults?: number; maxDistance?: number } = {
      maxResults: undefined,
      maxDistance: undefined,
    },
  ): Feature<Point, any>[] {
    if (!this.successIndex) {
      return []
    }
    const indices: number[] = around(this.successIndex, point[0], point[1], maxResults, maxDistance)
    return indices.map((i: number) => this.successes[i])
  }

  getExpeditionsNearViewport(
    map: mapboxgl.Map,
    { filters }: { filters?: any } = { filters: undefined },
  ) {
    return this.getExpeditionsNear(
      map.getCenter().toArray(),
      // @ts-ignore
      map.getBounds().toArray().flat(),
      filters,
    )
  }

  getData() {
    return {
      indexData: this.index?.data,
      successIndexData: this.successIndex?.data,
      expeditions: this.expeditions,
      successes: this.successes,
    }
  }
}

function expeditionFilterFunc(filters: Filters) {
  if (!filters) {
    return () => true
  }
  return (f: Expedition) => {
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
          f.properties.participantsStringLower.includes(p.replace(/ /g, '_').toLowerCase()),
        ) &&
      (filters.dayOfWeek === 'all' || f.properties.weekDayName === filters.dayOfWeek)
    )
  }
}

const db = new ExpeditionIndex()
export function initIndex(expeditions: Expedition[]) {
  db.init(expeditions)
  window.db = db

  window.si = db.successIndex
}

export function initFromData(data: any) {
  db.initFromData(data)
}

export function getExpeditionsNearViewport(map: mapboxgl.Map) {
  if (!db.expeditions) {
    return []
  }

  return db.getExpeditionsNearViewport(map)
}

export async function getDB() {
  await indexLoaded
  return db
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
