import type { mapU } from '@/util'
import type { Feature, Point, Position } from 'geojson'
import { featureCollection, point, centerOfMass, centroid, clustersDbscan } from '@turf/turf'
import { getExpeditions } from '@/mapping/expeditions/expeditionsData'
import { colorFunc } from './expeditions/colorFuncs'
import U from 'map-gl-utils/dist/index.esm.js'

let participantsFeatures: Feature<Point>[] | undefined

function weightedCenterOfMass(points: Point[]): Point {
  if (points.length === 0) {
    throw new Error('At least one point is required')
  }

  // Compute unweighted center
  let sumX = 0,
    sumY = 0
  for (const [x, y] of points) {
    sumX += x
    sumY += y
  }
  const centerX = sumX / points.length
  const centerY = sumY / points.length

  // Compute weights inversely proportional to distance from center
  let totalWeight = 0
  let weightedX = 0
  let weightedY = 0

  for (const [x, y] of points) {
    const distance = Math.hypot(x - centerX, y - centerY) || 1 // Avoid division by zero
    const weight = 1 / distance
    weightedX += x * weight
    weightedY += y * weight
    totalWeight += weight
  }

  return point([weightedX / totalWeight, weightedY / totalWeight])
}

function getCenter(points: Position[], participant: string): Feature<Point> {
  const fc = featureCollection(points.map(point))
  let clusters: Feature<Point>[] = []
  try {
    clusters = clustersDbscan(fc, 200, { mutate: false }).features
  } catch (e) {
    console.error(e)
  }
  const pointsByCluster = clusters.reduce(
    (acc, f) => {
      const { cluster, dbscan } = f.properties
      if (cluster !== undefined && dbscan === 'core') {
        acc[cluster] = [...(acc[cluster] ?? []), f]
      }
      return acc
    },
    {} as { [cluster: number]: Feature<Point>[] },
  )
  const biggestCluster = Object.values(pointsByCluster).reduce(
    (a, b) => (a.length > b.length ? a : b),
    [] as Feature<Point>[],
  )

  const center =
    // biggestCluster.length === 0 ? centerOfMass(fc) : centerOfMass(featureCollection(biggestCluster))
    biggestCluster.length === 0
      ? weightedCenterOfMass(fc.features.map((f) => f.geometry.coordinates as Position))
      : weightedCenterOfMass(biggestCluster.map((f) => f.geometry.coordinates as Position))

  if (participant.match(/TdL/)) {
    console.log(participant, center)
    console.log(featureCollection(clusters))
    console.log(biggestCluster)
  }
  return center
}

async function makeParticipantsData() {
  // const expeditionsByParticipant: { [key: string]: Feature<Point>[] } = {}
  const expeditions = await getExpeditions(false)
  const expeditionsByParticipant: { [participant: string]: { points: Position[]; dates: Date[] } } =
    {}
  for (const e of expeditions.features) {
    const participants = e.properties.participants
    for (const p of participants) {
      expeditionsByParticipant[p] = expeditionsByParticipant[p] ?? { points: [], dates: [] }
      // expeditionsByParticipant[p].push(e)
      expeditionsByParticipant[p].points.push(e.geometry.coordinates)
      expeditionsByParticipant[p].dates.push(e.properties.days)
    }
  }
  participantsFeatures = []
  for (const [p, e] of Object.entries(expeditionsByParticipant)) {
    const center = getCenter(e.points, p)
    participantsFeatures.push({
      // ...centerOfMass(featureCollection(e.points.map(point))),
      // ...centroid(featureCollection(e.points.map(point))),
      ...center,
      properties: {
        days: e.dates[Math.floor(e.dates.length / 2)],
        count: e.points.length,
        //average(e.dates) ,
        name: p,
      },
    })
    // participantsFeatures = participantsFeatures ?? []
    // participantsFeatures.push(feature)
  }
  console.log('participantsFeatures', participantsFeatures)
}

export async function updateParticipants(map: mapU) {
  const visibility = window.app.App.tab === 'participants' ? 'visible' : 'none'
  if (!map.getSource('participants')?._data?.features?.length) {
    map.U.addGeoJSON('participants')
    if (!participantsFeatures) {
      // && window.app.App.tab === 'participants') {
      await makeParticipantsData()
    }
    map.U.setData('participants', featureCollection(participantsFeatures))
    map.U.addSymbolLayer('participants-label', 'participants', {
      textField: ['get', 'name'],
      // textAllowOverlap: true,
      // textOffset: [0, 1],
      // textAnchor: 'top',
      // textAnchor: 'center',
      textSize: U.interpolate('count', 0, 8, 12, 10, 50, 14, 100, 16, 200, 20),
      // textColor: 'white',
      // textColor: [
      //   'interpolate-hcl',
      //   ['linear'],
      //   ['get', 'count'],
      //   0,
      //   'hsl(0, 100%, 50%)',
      //   100,
      //   'hsl(240, 100%, 50%)',
      // ],
      textColor: await colorFunc({ colorVis: 'year', lighten: 10 }),
      minzoom: 1,
      symbolSortKey: ['-', ['get', 'count']],
      // symbolSortKey: ['-', ['get', 'days']],

      textHaloColor: 'hsla(0, 0%, 0%, 0.5)',
      textHaloWidth: 2,
      textVariableAnchor: [
        'center',
        'left',
        'right',
        'top',
        'bottom',
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ],
      textRadialOffset: 1,

      filter: ['>=', ['get', 'count'], U.interpolateZoom(5, 5, 10, 1)],
      // textIgnorePlacement: true,
      // textJustify: 'center',
      // textVariableAnchor: ['top', 'bottom', 'left', 'right'],
      visibility,
    })
  }
}
