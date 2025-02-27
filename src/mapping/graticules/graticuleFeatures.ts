import { string0 } from '@/util'
// @ts-ignore TODO
import * as turf from '@turf/turf'
// @ts-ignore TODO
import type { Properties } from '@turf/turf'
import humanizeDuration from 'humanize-duration'
import type { Feature, Polygon, Point, FeatureCollection, GeoJsonProperties } from 'geojson'

interface GraticuleStats {
  [key: string]: {
    [key: string]: {
      expeditions: number
      successes: number
      failures: number
      daysSinceExpedition?: number
    }
  }
}

export function makeGraticuleFeature(
  xstr: string,
  ystr: string,
  props: Properties,
): Feature<Polygon, { [name: string]: any }> {
  const x = +xstr
  const y = +ystr
  const signx = xstr[0] === '-' ? -1 : 1
  const signy = ystr[0] === '-' ? -1 : 1

  const f = turf.polygon(
    [
      [
        [x, y],
        [x + signx, y],
        [x + signx, y + signy],
        [x, y + signy],
        [x, y],
      ],
    ],
    props,
  )
  f.id = idStringToNumeric(`${ystr},${xstr}`)
  return f
}

const splitBy10 = (string: string) => (string.match(/.{1,10}/g) || []).join('\n')

export function idStringToNumeric(yxstr: string = ''): number {
  // need to be very careful about -0
  const [ystr, xstr] = yxstr.split(',')
  const yn = Math.abs(+ystr) + (ystr[0] === '-' ? 0 : 200)
  const xn = Math.abs(+xstr) + (xstr[0] === '-' ? 0 : 500)
  // const yn = (Math.abs(+ystr) + 1) * (ystr[0] === '-' ? -1 : 1);
  // const xn = (Math.abs(+xstr) + 1) * (xstr[0] === '-' ? -1 : 1);
  return yn * 1000 + xn
}

export function numericToIdString(n: number): string {
  const y = Math.floor(n / 1000)
  const x = n % 1000
  const ystr = (y < 200 ? '-' : '') + (y % 200)
  const xstr = (x < 500 ? '-' : '') + (x % 500)
  return `${ystr},${xstr}`
}

export function makeGraticuleFeatures({
  graticuleStats,
  map,
}: {
  graticuleStats: GraticuleStats
  map: any
}) {
  function getGraticuleStats(x: string, y: string) {
    return (
      graticuleStats[x]?.[y] || {
        expeditions: 0,
        successes: 0,
        failures: 0,
      }
    )
  }

  function graticuleLabelProps(
    xstr: string,
    ystr: string,
    {
      yxstr,
      name,
      nameShort,
      nameCountry,
      nameLong,
    }: {
      yxstr: string
      name: string
      nameShort: string
      nameCountry: string
      nameLong: string
    },
  ) {
    const gstats = getGraticuleStats(xstr, ystr)
    const g = window.graticules[xstr] && window.graticules[xstr][ystr]

    return {
      type: 'graticule-center-label',
      x: xstr,
      y: ystr,
      nameShort: nameShort || yxstr,
      name: name || yxstr,
      nameCountry,
      nameLong,
      firstParticipants: g && g.firstParticipants,
      lastParticipants: g && g.lastParticipants,
      history: g && splitBy10(g.history),
      ...gstats,
      daysSinceExpedition:
        gstats.daysSinceExpedition !== undefined
          ? humanizeDuration(gstats.daysSinceExpedition * 86400000, {
              largest: 2,
              round: true,
            })
          : '',
      ratio: gstats.expeditions
        ? Math.round((gstats.successes / gstats.expeditions) * 100) + '%'
        : '',
    }
  }

  const normx = (x: number) => ((x + 540) % 360) - 180
  const boundsNorm = map.getBounds().toArray().flat()

  boundsNorm[0] = normx(boundsNorm[0])
  boundsNorm[2] = normx(boundsNorm[2])

  function makeGraticules(signx: number, signy: number) {
    for (let ax = 0; ax <= 179; ax++) {
      for (let ay = 0; ay <= 89; ay++) {
        const x = ax * signx
        const y = ay * signy
        const xstr = string0(ax * signx)
        const ystr = string0(ay * signy)
        const yxstr = `${ystr},${xstr}`
        const name = window.graticuleNamesHash[yxstr] || null
        const gratProps = {
          type: 'graticule',
          x: xstr,
          y: ystr,
          name,
          ...getGraticuleStats(xstr, ystr),
        }

        graticules.push(makeGraticuleFeature(xstr, ystr, gratProps))
        const labelX = x + (signx > 0 ? 0 : -1)
        const labelY = y + (signy > 0 ? 1 : 0)
        const names = {
          nameShort: (name && name.match(/[a-z], [a-z]/i) ? name.split(', ')[0] : name) || yxstr,
          nameLong: name ? `${name} (${yxstr})` : yxstr,
          nameCountry: name && name.match(/[a-z], [a-z]/i) ? name.split(', ')[1] : '',
          name: name || yxstr,
        }

        graticuleLabels.push(
          turf.point([labelX, labelY], {
            type: 'graticule-label',
            x: xstr,
            y: ystr,
            ...names,
          }),
        )
        const labelCenterX = x + (signx > 0 ? 0.5 : -0.5)
        const labelCenterY = y + (signy > 0 ? 0.5 : -0.5)
        graticuleCenterLabels.push(
          turf.point(
            [labelCenterX, labelCenterY],
            graticuleLabelProps(xstr, ystr, {
              yxstr,
              ...names,
            }),
          ),
        )
      }
    }
  }

  const graticules: Feature<Polygon, { [name: string]: any }>[] = []
  const graticuleLabels: Feature<
    Point,
    {
      nameShort: any
      nameLong: string
      nameCountry: any
      name: any
      type: string
      x: string
      y: string
    }
  >[] = []
  const graticuleCenterLabels: Feature<Point, any>[] = []
  for (const signx of [-1, 1]) {
    for (const signy of [-1, 1]) {
      makeGraticules(signx, signy)
    }
  }

  const fc = {
    type: 'FeatureCollection',
    features: [...graticules, ...graticuleLabels, ...graticuleCenterLabels],
  } as FeatureCollection<Polygon | Point>
  graticuleFeaturesResolve(fc)
  gfc = fc
  return fc
}
let gfc
let graticuleFeaturesResolve: (value: FeatureCollection<Polygon | Point>) => void
const graticulesFC: Promise<FeatureCollection<Polygon | Point, GeoJsonProperties>> = new Promise(
  (resolve) => {
    graticuleFeaturesResolve = resolve
  },
)

export async function getGraticuleFeature(
  xstr: string,
  ystr: string,
): Promise<Feature | undefined> {
  const g = await graticulesFC
  const graticule = g.features.find((f) => f.properties!.x === xstr && f.properties!.y === ystr)
  return graticule
}

window.z = window.z || {}
window.z.idStringToNumeric = idStringToNumeric
window.z.numericToIdString = numericToIdString
