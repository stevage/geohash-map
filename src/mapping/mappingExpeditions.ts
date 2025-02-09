import type { MapGlUtils } from 'map-gl-utils/dist/types/index.d.ts'
import U from 'map-gl-utils'
import { EventBus } from '@/EventBus'
import { colorFunc, legendColors } from './expeditions/colorFuncs'
import { circleRadiusFunc } from './expeditions/radiusFunc'
import { getExpeditions } from './expeditions/expeditionsData'
import { report, setUrlParam } from '@/util'
import type { Expression, MapLayerMouseEvent, MapMouseEvent } from 'mapbox-gl'
import type { mapU } from '@/util'

import debounce from 'debounce'
import type { FeatureCollection, Point } from 'geojson'
import { initIndex, type Expedition } from './expeditions/expeditionIndex'
import type { Filters } from '@/global'
import {
  getStoredExpeditions,
  saveExpeditions,
  secondsSinceExpeditionsUpdated,
} from './expeditions/expeditionStore'

function updateFilters({ map, filters }: { map: mapU; filters: Filters }) {
  const successFilter =
    filters.outcome === 'all' ? true : ['==', ['get', 'success'], filters.outcome === 'success']
  let participantsFilter: Expression | boolean = true
  if (filters.participants) {
    participantsFilter = [
      'any',
      ...filters.participants
        .split(/,\s*/)
        .map((p: string) => [
          'in',
          p.replace(/ /g, '_').toLowerCase(),
          ['get', 'participantsStringLower'],
        ]),
    ]
  }
  // console.log('filter', participantsFilter);
  const dayOfWeekFilter =
    filters.dayOfWeek === 'all' ? true : ['==', ['get', 'weekDayName'], filters.dayOfWeek]
  map.U.setFilter(/expeditions-/, [
    'all',
    participantsFilter,
    ['>=', ['get', 'participantsCount'], filters.minParticipants],
    ['<=', ['get', 'participantsCount'], filters.maxParticipants],
    ['>=', ['get', 'year'], filters.minYear],
    ['<=', ['get', 'year'], filters.maxYear],
    dayOfWeekFilter,
    successFilter,
  ])
  map.U.setCircleRadius('expeditions-circles', circleRadiusFunc({ filters }))
}

const updateFiltersDebounced = debounce(updateFilters, 1500)
/*
function updateCircleColors({
    map,
    activeColorFunc,
}: {
    map: mapU;
    filters: any;
    activeColorFunc: Expression;
}) {
    map.U.setCircleColor(
        'expeditions-glow',
        U.stepZoom(activeColorFunc, {
            3: ['case', ['get', 'success'], activeColorFunc, 'transparent'],
        })
    );

    map.U.setCircleColor(
        'expeditions-circle',
        U.stepZoom(activeColorFunc, {
            3: ['case', ['get', 'success'], activeColorFunc, 'transparent'],
        })
    );
}
*/
function glowCircleColor(activeColorFunc: Expression) {
  return U.stepZoom(activeColorFunc, 3, [
    'case',
    ['get', 'success'],
    activeColorFunc,
    'transparent',
  ])
}

function circlesCircleColor(activeColorFunc: Expression) {
  return U.stepZoom(activeColorFunc, {
    3: ['case', ['get', 'success'], activeColorFunc, 'transparent'],
  })
}

function circlesStrokeColor(activeColorFunc: Expression) {
  return [
    'case',
    ['get', 'success'],
    ['case', ['get', 'global'], '#fff', 'hsla(0,0%,30%,0.5)'],
    activeColorFunc,
    // 'hsl(180,0%,90%)',
  ]
}

function loadSelectedExpedition(expeditions: FeatureCollection<Point>) {
  const url = new URL(window.location.toString())
  const expeditionId = url.searchParams.get('expedition')
  if (expeditionId) {
    const expedition = expeditions.features.find((f) => f.properties.id === expeditionId)
    if (expedition) {
      EventBus.$emit('select-feature', expedition)
      window.map.jumpTo({
        center: expedition.geometry.coordinates,
        zoom: 9,
      })
    }
  }
}

export async function updateHashStyle({
  map,
  filters,
  quickUpdate = false,
}: {
  map: mapU
  filters: any
  quickUpdate?: boolean
}) {
  // const colors = window.app.yearColors;

  const visibility = window.app.App.tab === 'expeditions' ? 'visible' : 'none'
  const dark = true

  const first = !map.getLayer('expeditions-circles')

  if (first) {
    map.U.addGeoJSON('expeditions') //, 'expeditions.json'
    map.U.addGeoJSON('expedition-selected')
    // getExpeditions(true, map).then(() =>
    //     resetHashAnimation({ map, filters, show: true })
    // );
    // const expeditions = await getExpeditions(false);
    let expeditions: FeatureCollection<Point> | undefined = undefined
    await report('Load stored expeditions', async () => {
      expeditions = (await getStoredExpeditions()) ?? undefined
    })

    // if (!expeditions) {
    //     await report('Fetch expeditions', async () => {
    //         expeditions = await getExpeditions(false);
    //     });
    // }
    if (expeditions) {
      report('Add expeditions to map', () => {
        map.U.setData('expeditions', expeditions)
      })
    }
    let gotExpeditions: (value: unknown) => void
    const waitForExpeditions = new Promise((resolve) => (gotExpeditions = resolve))

    const maxAge = window.location.hostname === 'localhost' ? 60 * 60 * 24 : 60 * 20
    if (secondsSinceExpeditionsUpdated() > maxAge || !expeditions) {
      window.setTimeout(
        async () => {
          console.log('Now fetch fresh expeditions')
          expeditions = await getExpeditions(false)
          gotExpeditions(0)
          map.U.setData('expeditions', expeditions)
          saveExpeditions(expeditions)
        },
        !expeditions ? 0 : 5000,
      )
    }
    if (!expeditions) {
      console.log('No expeditions, waiting on fetch')
    } else {
      gotExpeditions(0)
    }
    await waitForExpeditions
    window.setTimeout(() => initIndex(expeditions.features), 1000)

    report('Map is idle', async () => {
      const p = new Promise((resolve) => {
        map.once('idle', resolve)
      })
      await p
    })

    // window.localStorage.setItem('expeditions', JSON.stringify(expeditions));
    // window.localStorage.setItem(
    //     'expeditions-updated',
    //     new Date().toISOString()
    // );

    EventBus.$emit('expeditions-loaded', {
      local: false,
      ...expeditions,
    })
    loadSelectedExpedition(expeditions)
    window.expeditions = expeditions
    resetHashAnimation({ map })

    resetHashAnimation({ map, show: true })
  }

  const activeColorFunc = await colorFunc(filters)
  map.U.addCircleLayer('expeditions-glow', 'expeditions', {
    circleColor: glowCircleColor(activeColorFunc),

    circleOpacity: ['to-number', ['feature-state', 'opacity']],
    circleBlur: 0.5,
    circleRadius: circleRadiusFunc({ isGlow: true, filters }),
    circleSortKey: ['get', 'days'],
    visibility,
  })
  map.U.addCircleLayer('expeditions-clickable', 'expeditions', {
    circleColor: 'transparent',
    circleRadius: circleRadiusFunc({ filters, isClickable: true }),
    circleSortKey: ['get', 'days'],
    visibility,
  })

  map.U.addCircleLayer('expeditions-circles', 'expeditions', {
    circleColor: circlesCircleColor(activeColorFunc),
    circleStrokeColor: circlesStrokeColor(activeColorFunc),
    circleStrokeWidth: U.stepZoom(['case', ['get', 'global'], 0, 0], {
      1: ['case', ['get', 'global'], 1, 0],
      3: ['case', ['get', 'global'], 2, ['case', ['get', 'success'], 0, 2]],
      6: ['case', ['get', 'global'], 2, ['case', ['get', 'success'], 0.5, 2]],

      8: ['case', ['get', 'global'], 4, ['case', ['get', 'success'], 1, 2]],
    }),
    circleRadius: circleRadiusFunc({ filters }),
    circleSortKey: ['get', 'days'],
    // circleOpacity: ['case', ['feature-state', 'show'], 1, 0],
    circleOpacity: ['to-number', ['feature-state', 'opacity']],
    circleStrokeOpacity: ['case', ['to-boolean', ['feature-state', 'show']], 1, 0],
    visibility,
  })
  map.U.addCircleLayer('expedition-selected', 'expedition-selected', {
    circleColor: 'transparent',
    circleStrokeColor: 'yellow',
    circleStrokeWidth: 2,
    circleRadius: 20,
    circleBlur: 0.2,
    visibility,
  })
  map.U.addCircleLayer('expeditions-flash', 'expeditions', {
    circleColor: U.stepZoom(activeColorFunc, {
      4: ['case', ['get', 'success'], activeColorFunc, 'transparent' /*'hsl(180,0%,90%)'*/],
    }),
    circleStrokeColor: ['case', ['get', 'success'], 'hsla(0,0%,30%,0.5)', activeColorFunc],
    circleRadius: circleRadiusFunc({ isFlash: true, filters }),
    circleSortKey: ['get', 'days'],
    // circleOpacity: ['case', ['feature-state', 'show'], 1, 0],
    circleOpacity: ['to-number', ['feature-state', 'flashOpacity']],
    circleStrokeOpacity: ['case', ['to-boolean', ['feature-state', 'show']], 1, 0],
    circleBlur: 1.5,
    visibility,
  })
  map.U.addSymbolLayer('expeditions-label', 'expeditions', {
    textField: U.stepZoom(['slice', ['get', 'id'], 0, 4], {
      11: ['slice', ['get', 'id'], 0, 10],
      12: ['concat', ['slice', ['get', 'id'], 0, 10], '\n', ['get', 'participantsString']],
    }),
    textSize: U.interpolateZoom({ 10: 10, 12: 12 }),
    // textSize: ['interpolate', ['linear'], ['zoom'], 10, 10, 12, 12],
    textOffset: [0, 1.5],
    textColor: activeColorFunc, //dark ? '#bbb' : 'black',
    textHaloColor: dark ? 'hsla(0,0%,0%,0.4)' : 'hsla(0,0%,100%,0.5)',
    textHaloWidth: 1,
    textOpacity: ['feature-state', 'opacity'],
    minzoom: 9,
    visibility,
  })
  // updateCircleColors({ map, filters, activeColorFunc });

  if (!quickUpdate) {
    updateFilters({ map, filters })
  }

  if (first) {
    map.U.hoverPointer(/expeditions-(clickable)/)
    const clickFunc = (e: MapLayerMouseEvent) => {
      console.log(e)
      EventBus.$emit('select-feature', e.features?.[0])
    }
    map.on('click', 'expeditions-clickable', clickFunc)
    // map.on('click', 'expeditions-circles', clickFunc);
    // map.on('click', 'expeditions-glow', clickFunc);

    map.U.hoverPopup(
      'expeditions-glow',
      (f: Expedition) =>
        `<div>${f.properties.id}</div> ${JSON.parse(f.properties.participants).join(', ')}`,
      { closeButton: false },
    )

    map.on('moveend', async () => {
      const filters = window.Filters.filters
      if (filters.colorVis === 'participants' || filters.colorVis === 'participantsFixed') {
        // updateHashStyle({ map, filters, quickUpdate: true });
        const acf = await colorFunc(filters)
        map.U.setCircleColor('expeditions-circles', circlesCircleColor(acf))
        map.U.setCircleStrokeColor('expeditions-circles', circlesStrokeColor(acf))
        map.U.setCircleColor('expeditions-glow', glowCircleColor(acf))
        EventBus.$emit('colors-change', {
          colorVis: filters.colorVis,
          colors: legendColors(filters, acf),
        })
      }
    })
    EventBus.$on('select-feature', (feature: Expedition) => {
      map.U.setData('expedition-selected', feature || { type: 'FeatureCollection', features: [] })

      setUrlParam('expedition', feature ? feature.properties.id : null)
    })
    EventBus.$on('navigate-expedition', (expedition: Expedition) => {
      if (expedition) {
        EventBus.$emit('select-feature', {
          ...expedition,
          properties: {
            ...expedition.properties,
            // select-feature is normally sending a feature that came out of the map, which stringifies complex attribute types
            participants: JSON.stringify(expedition.properties.participants),
          },
        })
        map.flyTo({
          center: expedition.geometry.coordinates as [number, number],
          zoom: 13,
        })
      }
    })
  }
  EventBus.$emit('colors-change', {
    colorVis: filters.colorVis,
    colors: legendColors(filters, activeColorFunc),
  })
}

export function resetHashAnimation({ map, show = false }: { map: mapU; show?: boolean }) {
  for (const f of window.expeditions.features) {
    map.setFeatureState(
      { id: f.id, source: 'expeditions' },
      { opacity: show ? 1 : 0, show, flashOpacity: 0 },
    )
  }
}

export function updateHashAnimation({
  map,
  minx,
  maxx,
  miny,
  maxy,
  animationDay,
}: {
  map: mapU
  minx: number
  maxx: number
  miny: number
  maxy: number
  animationDay: number
}) {
  let updated = 0
  for (const f of window.expeditions.features) {
    // heh, why did I do it this way? could just use actual x/y, not graticule x/y
    if (
      (f.properties.x >= minx &&
        f.properties.x <= maxx &&
        f.properties.y >= miny &&
        f.properties.y <= maxy) ||
      f.properties.global
    ) {
      const age = animationDay - f.properties.days
      if (age < 0) {
        0 && console.log('Break', animationDay, f.properties.days, ` after updating ${updated}.`)
        break
      }
      if (age >= 0 && age <= 730) {
        map.setFeatureState(
          { id: f.id, source: 'expeditions' },
          {
            show: age > 0,
            opacity:
              age < 0
                ? 0
                : Math.max(
                    1 - age / 730,

                    0.2,
                  ),
            flashOpacity:
              age < 0
                ? 0
                : Math.max(
                    1 - age / 120,

                    0.0,
                  ),
          },
        )
        updated++
      }
    }
  }
}
