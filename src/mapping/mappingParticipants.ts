import type { mapU } from '@/util'
import type { Feature, Point, Position } from 'geojson'
import { featureCollection, point, centerOfMass, centroid, clustersDbscan } from '@turf/turf'
import { getExpeditions } from '@/mapping/expeditions/expeditionsData'
import { colorFunc } from './expeditions/colorFuncs'
import { getUrlParam } from '@/util'
import U from 'map-gl-utils/dist/index.esm.js'

import { openDatabase } from '@/mapping/expeditions/expeditionStore'
let participantsFeatures: Feature<Point>[] | undefined

async function saveExpeditionsByParticipant() {
  const eByP = await getExpeditionsByParticipant()
  const storeName = 'expeditionsByParticipant'
  const db = await openDatabase('participantsdb', storeName)

  const transaction = db.transaction(storeName, 'readwrite')
  const store = transaction.objectStore(storeName)

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      console.log('saved expeditionsByParticipant successfully!')

      resolve('expeditionsByParticipant successfully!')
    }
    // transaction.commit()
  })
}

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
    clusters = clustersDbscan(fc, 200, { mutate: false, minPoints: 2 }).features
  } catch (e) {
    console.error(e)
  }
  const pointsByCluster = clusters.reduce(
    (acc, f) => {
      const { cluster, dbscan } = f.properties
      if (cluster !== undefined && dbscan !== 'edge') {
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

  return center
}

let expeditionsByParticipant:
  | { [participant: string]: { points: Position[]; dates: Date[]; expeditions: any[] } }
  | undefined

// export async function getExpeditionsByParticipant(participant: string) {}

export async function getExpeditionsByParticipant() {
  if (expeditionsByParticipant) return expeditionsByParticipant
  const expeditions = await getExpeditions(false)
  expeditionsByParticipant = {}
  for (const e of expeditions.features) {
    const participants = e.properties.participants
    for (const p of participants) {
      expeditionsByParticipant[p] = expeditionsByParticipant[p] ?? {
        points: [],
        dates: [],
        expeditions: [],
      }
      // expeditionsByParticipant[p].push(e)
      expeditionsByParticipant[p].points.push(e.geometry.coordinates)
      expeditionsByParticipant[p].dates.push(e.properties.days)
      expeditionsByParticipant[p].expeditions.push(e)
    }
  }
  saveExpeditionsByParticipant(expeditionsByParticipant)
  return expeditionsByParticipant
}

export async function getParticipantsData() {
  // const expeditionsByParticipant: { [key: string]: Feature<Point>[] } = {}

  participantsFeatures = []
  for (const [p, e] of Object.entries(await getExpeditionsByParticipant())) {
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

let selectedParticipant = getUrlParam('participants')
export function setSelectedParticipant(p: string) {
  selectedParticipant = p
  window.Filters.filters.participants = p
  updateParticipants(window.map)
}

async function clickLabel(e: MapMouseEvent) {
  if (window.app.App.tab !== 'participants') return
  const fs = window.map.queryRenderedFeatures(e.point, { layers: ['participants-label'] })
  const participant = fs?.[0]?.properties?.name || ''

  if (!participant) {
    // hmm, there's a problem that clicking on an expedition makes this think you missed everything
    // definitely not hacky at all
    const fs2 = window.map.queryRenderedFeatures(e.point, { layers: ['expeditions-clickable'] })
    if (fs2.length > 0) {
      return
    }
  }

  window.app.Participant.participant = participant
  // await $nextTick()
  window.setTimeout(() => {
    setSelectedParticipant(participant)
  }, 10)
  if (participant) {
    // window.setTimeout(() => window.map.U.show(/expeditions/), 300)
  }
}

export async function updateParticipants(map: mapU) {
  const visibility = window.app.App.tab === 'participants' ? 'visible' : 'none'
  if (!map.getSource('participants')?._data?.features?.length) {
    map.U.addGeoJSON('participants')
    if (!participantsFeatures && window.app.App.tab === 'participants') {
      await getParticipantsData()
    }
    map.on('click', clickLabel)
  }

  map.U.setData('participants', featureCollection(participantsFeatures))

  const ifHighlighted = (special, non) => {
    if (selectedParticipant) {
      return ['case', ['==', ['get', 'name'], selectedParticipant], special, non]
    } else return special
  }
  map.U.addSymbolLayer('participants-label', 'participants', {
    textField: ['get', 'name'],
    textSize: U.interpolate('count', { 0: 8, 12: 10, 50: 14, 100: 16, 200: 20 }),
    textColor: ifHighlighted(
      await colorFunc({ colorVis: 'year', lighten: 10 }),
      'hsla(0, 0%, 60%, 0.8)',
    ),
    // minzoom: 0,
    symbolSortKey: ['-', ['get', 'count']],
    textHaloColor: 'hsla(0, 0%, 0%, 0.5)',
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
    textJustify: 'auto',
    textRadialOffset: 0.75,

    filter: ['>=', ['get', 'count'], U.interpolateZoom(5, 3, 10, 1)],
    // textOpacity: ifHighlighted(1, 0.5),
    textHaloWidth: ifHighlighted(2, 0),
    // textIgnorePlacement: true,
    // textJustify: 'center',
    // textVariableAnchor: ['top', 'bottom', 'left', 'right'],
    visibility,
  })
}
