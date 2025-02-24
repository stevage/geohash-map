import tableauColors from '@/mapping/tableauColors'
// @aots-ignore
//a
import U from 'map-gl-utils/dist/index.esm.js'
import type { mapU } from '@/util'
import type { GraticuleStat } from './graticuleStats'

/*'match',
    ['to-string', ['feature-state', 'gtg']],
    'in',
    'hsla(120,100%,80%,0.4)',
    'out',
    'hsla(0,100%,20%,0.4)',
    'hsla(0,50%,30%,0.4)',
    */
const uninitiatedFillColor = [
  'case',
  ['>', ['get', 'successes'], 0],
  'transparent',
  'hsla(0,0%,30%,0.2)',
]

export function addGraticuleLayers(map: mapU) {
  map.U.addGeoJSON('graticules')

  map.U.addLineLayer('graticules-line', 'graticules', {
    // lineOffset: 0.5,
    lineColor: [
      'case',
      ['>', ['get', 'successes'], 0],
      // '#ccc',
      // 'hsla(0,0%,30%,0.2)',
      'hsla(0,0%,30%,0.15)',
      'hsla(0,0%,30%,0.15)',
      // '#ffc',
    ],
    lineOpacity: U.interpolateZoom({ 5: 0, 6: 1 }),

    minzoom: 4,
    filter: ['==', ['get', 'type'], 'graticule'],
  })

  map.U.addFillLayer('graticules-fill', 'graticules', {
    fillColor: uninitiatedFillColor,
    fillOutlineColor: 'transparent',
    fillOpacity: U.interpolateZoom({ 3: 0, 4: 1 }),
    minzoom: 3,

    // lineColor: 'red',
    filter: ['==', ['get', 'type'], 'graticule'],
  })
  map.U.addSymbolLayer('graticules-label', 'graticules', {
    textField: U.stepZoom(['get', 'nameShort'], {
      9: ['get', 'name'],
      11: ['get', 'nameLong'],
    }),
    textAnchor: 'top-left',
    // textColor: 'hsla(0,0%,15%,0.9)',
    textColor: 'hsla(0,0%,50%,0.9)',
    textSize: 12,
    textJustify: 'left',
    textMaxWidth: 150,
    filter: ['==', ['get', 'type'], 'graticule-label'],
    minzoom: 7,
  })
  // TODO: depend on a setting
  map.U.addSymbolLayer('graticules-center-label', 'graticules', {
    textField: '',

    textAnchor: 'center',
    textColor: 'hsla(60,100%,80%,0.9)',
    textSize: U.interpolateZoom({ 5: 8, 8: 18 }),
    textJustify: 'center',
    textMaxWidth: 150,
    filter: ['==', ['get', 'type'], 'graticule-center-label'],
    minzoom: 5,
  })
  map.U.addGeoJSON('selected-graticule')
  map.U.addLineLayer('selected-graticule-line', 'selected-graticule', {
    lineColor: 'hsla(60,100%,50%,0.5)',
  })
}

function graticuleColorByParticipantsFunc(
  type: 'firstParticipants' | 'lastParticipants' | 'mostSuccessfulParticipants',
) {
  const map = window.map
  // TODO filter out dupes
  const visibleGraticules = map.queryRenderedFeatures({
    // @ts-ignore
    layers: ['graticules-fill'],
  })
  const counts: { [key: string]: number } = {}
  // const firstParticipants = {};
  // const lastParticipants = {};
  // const mostSuccessfulParticipants = {};
  const field = `${type}OrMultiple` as keyof GraticuleStat

  for (const f of visibleGraticules) {
    const g = window.graticules[f.properties.x] && window.graticules[f.properties.x][f.properties.y]
    if (!g) {
      continue
    }
    // const firstName = g.firstParticipants.match(/\\n/) ? 'multiple': g.firstParticipants;
    // const lastName = g.lastParticipants.match(/\\n/) ? 'multiple': g.lastParticipants;
    // for (const p of g.firstParticipants.split('\n')) {
    //     firstParticipants[p] = (firstParticipants[p] || 0) + 1;
    // }
    // for (const p of g.lastParticipants.split('\n')) {
    //     lastParticipants[p] = (lastParticipants[p] || 0) + 1;
    // }
    const stat = g[field] as string
    counts[stat] = (counts[stat] || 0) + 1
  }
  const scheme = tableauColors[3].map((rgb) => `rgb(${rgb})`)
  const participantList = Object.entries(counts)
    .filter(([participant]) => participant !== 'multiple' && participant !== 'none')

    .sort((a, b) => b[1] - a[1])
    .slice(0, scheme.length)
  console.log(participantList)

  const noneColor = 'hsla(0,0%,0%,0.3)'

  const ret = [
    'case',
    ['has', field],
    [
      'match',
      ['get', field],
      ...participantList.flatMap(([participant, expeditionCount], i) => [participant, scheme[i]]),
      'multiple',
      'hsl(100, 0%,30%)',

      'none',
      noneColor,
      'hsl(100, 30%,30%)',
    ],
    noneColor,
  ]
  console.log(ret)
  return ret
}

const colorFunc = {
  uninitiated: () => uninitiatedFillColor,
  none: () => 'transparent',
  expeditions: () => [
    'interpolate-hcl',
    ['linear'],
    ['get', 'expeditions'],
    0,
    'hsla(0,0%,100%,0.3)',
    100,
    'hsla(0,0%,100%,0)',
  ],
  ratio: () => [
    'case',
    ['>', ['get', 'expeditions'], 0],
    [
      'interpolate-hcl',
      ['linear'],
      ['/', ['get', 'successes'], ['get', 'expeditions']],
      0,
      'hsla(0,100%,50%,0.3)',
      1,
      'hsla(240,100%,50%,0.3)',
    ],
    'transparent',
  ],
  // TODO:  align these colors with the expedition colorss
  daysSinceExpedition: () => [
    'interpolate-hcl',
    ['linear'],
    ['get', 'daysSinceExpedition'],
    0,
    'hsla(120,100%,50%,0.3)',
    1 * 365,
    'hsla(0,100%,50%,0.3)',
    5 * 365,
    'hsla(240,100%,50%,0.3)',
  ],
  totalParticipants: () => [
    'interpolate-hcl',
    ['linear'],
    ['get', 'totalParticipants'],
    0,
    'hsla(0,100%,50%,0.3)',
    20,
    'hsla(100,100%,50%,0.3)',
  ],
  firstParticipants: () => graticuleColorByParticipantsFunc('firstParticipants'),
  lastParticipants: () => graticuleColorByParticipantsFunc('lastParticipants'),
  mostSuccessfulParticipants: () => graticuleColorByParticipantsFunc('mostSuccessfulParticipants'),
}

export function updateGraticuleStyle(
  map: mapU,
  options: {
    fillStyle: keyof typeof colorFunc
    showGraticules: any
    showGraticuleLabels: any
    infoLabel: string | number
  },
) {
  console.log(options)
  console.log(options.fillStyle)
  map.U.toggle(
    ['graticules-line', 'graticules-fill', 'selected-graticule-line'],
    options.showGraticules,
  )
  map.U.toggle('graticules-label', options.showGraticules && options.showGraticuleLabels)
  // map.U.toggle(
  //     'graticules-fill',
  //     options.showGraticules && options.fillStyle !== 'none'
  // );
  // console.log('colorFunc', colorFunc);
  console.log('are we')
  map.U.setFillColor('graticules-fill', colorFunc[options.fillStyle]())
  map.U.setTextField(
    'graticules-center-label',
    {
      none: '',
      firstSuccessDate: [
        'step',
        ['zoom'],
        ['slice', ['get', 'firstSuccessDate'], 0, 4],
        8,
        ['get', 'firstSuccessDate'],
      ],

      // daysSinceExpedition: [
      //     'case',
      //     ['has', 'daysSinceExpedition'],
      //     ['get', 'daysSinceExpedition'],
      //     '',
      // ],
    }[options.infoLabel] || ['get', options.infoLabel],
  )
}
