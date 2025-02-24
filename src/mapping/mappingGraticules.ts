import { EventBus } from '@/EventBus'
import * as turf from '@turf/turf'
import { makeGraticuleStats } from '@/mapping/graticules/graticuleStats'
import {
  makeGraticuleFeatures,
  makeGraticuleFeature,
  getGraticuleFeature,
} from '@/mapping/graticules/graticuleFeatures'
import { getGraticuleNames } from './graticules/graticuleNames'
import { getClassAreasByVectorLayer } from './graticules/graticuleLandClasses'
import { addGraticuleLayers, updateGraticuleStyle } from './graticules/graticuleStyle'
import { report } from '@/util'
import type { Filters } from '@/global'
import type { UtilsMap } from 'map-gl-utils/dist/types'
import type { MapMouseEvent } from 'mapbox-gl'

EventBus.$on('expeditions-loaded', ({ local, ...hashes }: { local: boolean }) => {
  const graticuleStats = report('make graticule stats', () =>
    makeGraticuleStats({ local, ...hashes }),
  )
  window.graticules = graticuleStats
  // future idea, use feature-state instead of rewriting the geoms
  recalculateGraticules({ graticuleStats, map: window.map })
  for (const y of Object.keys(graticuleStats)) {
    for (const x of Object.keys(graticuleStats[y])) {
      const g = graticuleStats[y][x]
      window.activeGraticules = window.activeGraticules || []
      window.activeGraticules.push(g)
    }
  }
})

async function recalculateGraticules({ graticuleStats, map }) {
  await window.graticuleNamesP
  map.U.setData('graticules', makeGraticuleFeatures({ graticuleStats, map }))
}

async function selectGraticuleByXY(map: UtilsMap, x: string, y: string) {
  const graticule = await getGraticuleFeature(x, y)

  const bbox = turf.bbox(graticule)

  const uses = {
    ...getClassAreasByVectorLayer(map, bbox, 'landuse'),
    water: getClassAreasByVectorLayer(map, bbox, 'water').undefined,
  }
  const total = Object.values(uses).reduce((acc, val) => acc + (val?.area || 0), 0)
  EventBus.$emit('show-graticule-info', {
    graticule,
    uses,
    area: turf.area(graticule),
    other: turf.area(graticule) - total,
  })
  map.U.setData('selected-graticule', makeGraticuleFeature(x, y))
}

function clickGraticuleLabel(map: UtilsMap, e: MapMouseEvent) {
  const p = e.features?.[0].properties
  console.log(e.features?.[0])

  selectGraticuleByXY(map, p?.x, p?.y)
}

EventBus.$on('select-graticule-by-id', (id) => {
  const [y, x] = id.split(',')
  selectGraticuleByXY(window.map, x, y)
})

export function setGraticuleStyle({ map, filters }: { map: UtilsMap; filters: Filters }) {
  const first = !map.getSource('graticules')
  if (first) {
    addGraticuleLayers(map)
    window.graticuleNamesP = getGraticuleNames() // a promise

    EventBus.$on('graticule-options-change', (options) => updateGraticuleStyle(map, options))
    map.on('click', 'graticules-label', (e) => clickGraticuleLabel(map, e))
    map.on('click', 'graticules-fill', (e) => {
      if (window.app.App.tab === 'graticules') {
        clickGraticuleLabel(map, e)
      }
    })
    EventBus.$on('tab-change', (tab) => {
      if (tab !== 'graticules') {
        map.U.setData('selected-graticule')
      }
      // map.U.toggle(/selected-graticule/, tab === 'graticules');
    })
  }
}
