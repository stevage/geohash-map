import type mapboxgl from 'mapbox-gl'
import type { MapGlUtils, UtilsMap } from 'map-gl-utils/dist/types'
import type { ExpeditionIndex } from '@/mapping/expeditions/expeditionIndex'
import type { Expedition } from '@/mapping/expeditions/expeditionsData'
import type { GraticuleStat, GraticuleStats } from './mapping/graticules/graticuleStats'
import type { FeatureCollection } from 'geojson'
import Vue from 'vue'

declare global {
  interface Window {
    map: UtilsMap // Replace `any` with the correct type if known
    app: {
      yearColors?: string[]
      fippeServer?: string
      App?: typeof Vue
      graticules?: FeatureCollection
      overrideTime?: string
      overrideTimezone?: string
    }
    Filters: typeof Vue
    InfluenceControls: typeof Vue
    HashInfo: typeof Vue
    AnimationControls: typeof Vue
    expeditions: any
    expeditionsByGraticule: Record<string, Expedition[]>
    maxParticipants: number
    maxParticipantsGraticule: string
    db: ExpeditionIndex
    si: any
    graticuleNamesP: Promise<any>
    graticuleNamesHash: Record<string, string>
    z: { [key: string]: any }
    gtg: any
  }
}

// type that extends mapboxgl.Map but also with a U property of type any
export type mapU = mapboxgl.Map & { U: MapGlUtils }
export function dateToDays(date: string | number | Date) {
  if (String(date).length === 4) {
    date = `${date}-01-01`
  }
  return Math.floor(new Date(date).valueOf() / (1000 * 60 * 60 * 24))
}

export function daysToDate(days: number) {
  return new Date(days * 1000 * 60 * 60 * 24).toISOString().slice(0, 10)
}

export function dateToWeekday(date: string | number | Date) {
  if (String(date).length === 4) {
    date = `${date}-01-01`
  }
  return new Date(date).getDay()
}

export function getGraticuleBounds(map: mapboxgl.Map) {
  const [minx, miny] = map.getBounds()!.toArray()[0].map(Math.floor)
  const [maxx, maxy] = map.getBounds()!.toArray()[1].map(Math.ceil)
  return [minx, miny, maxx, maxy]
}

export const string0 = (n: number) => (Object.is(n, -0) ? '-0' : String(n))

export function setUrlParam(key: string, value: string | null) {
  const url = new URL(window.location.toString())
  if (value) {
    url.searchParams.set(key, value)
  } else {
    url.searchParams.delete(key)
  }
  window.history.replaceState({}, '', url)
}

export function getUrlParam(key: string) {
  return new URL(window.location.toString()).searchParams.get(key)
}

export const report = (
  name: string,
  task: (() => any) | (() => Promise<any>),
  isAsync = task.constructor.name === 'AsyncFunction',
) => {
  const start = performance.now()
  if (isAsync) {
    // console.log('(async)', name);
    return (task as () => Promise<any>)().then((ret) => {
      console.log(`${name} in`, Math.round(performance.now() - start), `ms`)
      return ret
    })
  } else {
    const ret = task()
    console.log(`${name} in`, Math.round(performance.now() - start), `ms`)
    return ret
  }
}
