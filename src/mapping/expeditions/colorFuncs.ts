import { dateToDays, dateToWeekday } from '@//util'

import tableauColors from '@/mapping/tableauColors'
// @ts-ignore
import { Expression } from 'mapgl-expression'
import type mapboxgl from 'mapbox-gl'
// @ts-ignore

import md5 from '@/md5'
import type { Filters } from '@/global'

import type { Expedition, Expeditions } from '@/mapping/expeditions/expeditionIndex'
import { getDB } from '@/mapping/expeditions/expeditionIndex'
let visibleParticipants: any[]

const brewer12 = [
  '#a6cee3',
  '#1f78b4',
  '#b2df8a',
  '#33a02c',
  '#fb9a99',
  '#e31a1c',
  '#fdbf6f',
  '#ff7f00',
  '#cab2d6',
  '#6a3d9a',
  '#ffff99',
  '#b15928',
]
const brewer9 = [
  '#e41a1c',
  '#377eb8',
  '#4daf4a',
  '#984ea3',
  '#ff7f00',
  '#ffff33',
  '#a65628',
  '#f781bf',
  '#999999',
]
const transportModes = [
  'Boat/swim',
  'Walk',
  'Bicycle',
  'Public transport',
  'Beast of burden',
  'Hitch-hiking',
  'Other',
]

const hardships = [
  'One with nature',
  'Raptor attack',
  'Drowned rat',
  'Trail of blood',
  'Frozen',
  'Done with nature',
  'Trainwreck',
  'Other',
]

// add type for colorFuncs
type colorFuncTypes =
  | 'year'
  | 'month'
  | 'weekday'
  | 'experienceMax'
  | 'experienceDaysMax'
  | 'participants'
  | 'participantsFixed'
  | 'transportMode'
  | 'hardship'
const colorFuncs: Record<colorFuncTypes, () => any> = {} as any
colorFuncs.year = ({ lighten } = { lighten: 0 }) => {
  lighten = lighten ?? 0
  const ret = [
    'interpolate-hcl',
    ['linear'],
    ['get', 'days'],
    dateToDays(2008),
    `hsl(200, 80%, ${40 + lighten}%)`,
    dateToDays(2016),

    'red',
    dateToDays(2021),
    `hsl(60,100%,${40 + lighten}%)`,
    dateToDays(new Date().getUTCFullYear()),
    `hsl(120, 100%, ${70 + lighten}%)`,
  ]
  return ret
}

colorFuncs.month = () => {
  const ret = [
    'interpolate-hcl',
    ['linear'],
    ['get', 'month'],
    0,
    'hsl(0, 100%, 40%)',
    2,
    'hsl(60, 100%, 40%)',
    4,
    'hsl(120, 100%, 40%)',
    8,
    'hsl(240, 100%, 40%)',
    10,
    'hsl(310, 100%, 40%)',
    12,
    'hsl(0, 100%, 40%)',
  ]
  return ret
}
colorFuncs.weekday = () => {
  const ret = [
    'interpolate-hcl',
    ['linear'],
    ['get', 'weekday'],
    0,
    'hsl(390, 80%, 40%)',
    2,
    'hsl(240, 80%, 40%)',
    4,
    'hsl(180, 80%, 40%)',
    5,
    'hsl(120, 80%, 40%)',
    6,
    // 'hsl(60, 100%, 50%)', // saturday special
    'hsl(60, 80%, 40%)', // saturday not eye catching
    7,
    'hsl(30, 80%, 40%)',
  ]
  return ret
}
colorFuncs.experienceMax = () => {
  const ret = [
    'interpolate-hcl',
    ['linear'],
    ['get', 'experienceMax'],
    1,
    'hsl(200, 80%, 40%)',
    10,
    'hsl(280, 80%, 40%)',
    50,
    'red',
    100,
    'hsl(60,100%,50%)',
    250,
    'hsl(120, 100%, 70%)',
  ]
  return ret
}
colorFuncs.experienceDaysMax = () => {
  const ret = [
    'interpolate-hcl',
    ['linear'],
    ['get', 'experienceDaysMax'],
    0,
    'hsl(200, 80%, 40%)',
    365,
    'hsl(280, 80%, 40%)',
    365 * 2,
    'red',
    365 * 5,
    'hsl(60,100%,50%)',
    365 * 10,
    'hsl(120, 100%, 70%)',
    365 * 20,
    'hsl(120, 100%, 70%)',
  ]
  // console.log(ret);
  return ret
}

const participantLookup = {} as Record<string, string>
export function participantToColor(participant: string) {
  function stringToHSL(str = '') {
    // Generate a hash code from the string
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
      // hash = hash & hash; // Convert to 32bit integer
    }

    // Map hash to HSL values
    const hue = Math.abs(hash) % 360 // Hue: 0-359
    const saturation = 50 // Saturation: 70%
    const lightness = 70 // Lightness: 50%

    return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.5)`
  }

  function useMd5(str = '') {
    if (str === 'Multiple') {
      return 'hsla(120, 0%, 100%, 0.1)'
    }
    const hash = md5(str)
    // const h = ((parseInt(hash.slice(0, 2), 16) / 256) * 280 + 120) % 360;
    // const s = (parseInt(hash.slice(2, 4), 16) / 256) * 25 + 50;
    // const l = (parseInt(hash.slice(4, 6), 16) / 256) * 50 + 25;
    const h = ((parseInt(hash.slice(0, 2), 16) / 256) * 300 + 120) % 360
    const s = (parseInt(hash.slice(3, 5), 16) / 256) * 20 + 30
    const l = (parseInt(hash.slice(4, 6), 16) / 256) * 20 + 40

    return `hsla(${h}, ${s}%, ${l}%, 1)`
  }

  if (!participantLookup[participant]) {
    participantLookup[participant] = useMd5(participant)
  }
  return participantLookup[participant]
  // return stringToHSL(participant);
}

const makeParticipantsLookup = async (mode: 'local' | 'fixed') => {
  // TODO cache this result because it's slow to compute and a few things use this result
  const db = await getDB()
  const visibleExpeditions = db.getExpeditionsNearViewport(window.map)
  const participants = {} as Record<string, { expeditions: number }>
  for (const f of visibleExpeditions) {
    // focus on the 1-or-multiple use case
    if (f.properties.participantsCount === 1) {
      for (const p of f.properties.participants) {
        if (!participants[p]) {
          participants[p] = {
            expeditions: 0,
          }
        }
        participants[p].expeditions++
      }
    }
  }
  const participantsList = [
    { name: 'Multiple' },
    ...Object.entries(participants)
      .map(([name, props]) => ({ name, ...props }))
      .sort((a, b) => b.expeditions - a.expeditions),
  ]

  const scheme = [[0, 255, 0], ...tableauColors[3]]
  visibleParticipants = participantsList.slice(0, scheme.length)
  // visibleParticipants = participantsList.slice(0, 80);
  const ret = [
    'match',
    ['get', 'participantsOrMultiple'],
    ...visibleParticipants.flatMap((participant, i) => [
      participant.name,
      mode === 'local' ? `rgb(${scheme[i]})` : participantToColor(participant.name),
    ]),
    'black',
  ]
  // console.log(ret);
  return ret
}

colorFuncs.participants = async () => {
  return await makeParticipantsLookup('local')
}
colorFuncs.participantsFixed = async () => {
  return await makeParticipantsLookup('fixed')
}

// colorFuncs.participants2 = () => {
//     const bounds = map.getBounds();
//     const visibleExpeditions = window.expeditions.features.filter((f) =>
//         bounds.contains(f.geometry.coordinates)
//     );
//     const participants = {};
//     for (const f of visibleExpeditions) {

colorFuncs.transportMode = () => {
  console.log(tableauColors)
  // const cols = [
  //     tableauColors[0][0],
  //     tableauColors[0][1],
  //     tableauColors[0][2],
  //     tableauColors[0][4],
  //     tableauColors[0][5],
  //     tableauColors[0][6],
  // ];
  const cols = [...brewer9, 'grey']

  const ret = [
    'match',
    ['get', 'transportMode'],
    ...transportModes.flatMap((mode, i) => [mode, cols[i]]),
    'black',
  ]
  return ret
}
colorFuncs.hardship = () => {
  const cols = [...brewer9.slice(0, hardships.length - 1), 'hsla(0,0%,50%,0.3)']

  const ret = [
    'match',
    ['get', 'hardship'],
    ...hardships.flatMap((mode, i) => [mode, cols[i]]),
    'black',
  ]
  return ret
}

export async function colorFunc({ colorVis, ...rest }: { colorVis: colorFuncTypes }) {
  // console.log('colorVis', colorVis, colorFuncs[colorVis]);
  return await colorFuncs[colorVis](rest)
}

export function legendColors(filters: Filters, activeColorFunc: mapboxgl.Expression) {
  const vals = []
  // const makeFeature = (properties: { [key in colorFuncTypes]?: number }) => ({
  const makeFeature = (properties: Record<string, number | string>) => ({
    type: 'Feature',
    properties,
    geometry: null as null,
  })
  if (filters.colorVis === 'experienceMax') {
    for (const experienceMax of [1, 5, 10, 20, 50, 100, 250]) {
      const color = Expression.parse(activeColorFunc).evaluate(
        makeFeature({
          experienceMax,
        }),
      )
      vals.push([experienceMax, color])
    }
  } else if (filters.colorVis === 'experienceDaysMax') {
    for (const experienceYearsMax of [0, 1, 2, 5, 10]) {
      const color = Expression.parse(activeColorFunc).evaluate({
        type: 'Feature',
        properties: {
          experienceDaysMax: experienceYearsMax * 365,
        },
        geometry: null,
      })
      vals.push([experienceYearsMax, color])
    }
  } else if (filters.colorVis === 'year') {
    for (let year = 2008; year <= new Date().getUTCFullYear(); year++) {
      const color = Expression.parse(activeColorFunc).evaluate({
        type: 'Feature',
        properties: {
          year,
          days: dateToDays(year),
        },
        geometry: null,
      })
      vals.push([year, color])
    }
  } else if (filters.colorVis === 'month') {
    for (let month = 12; month >= 1; month--) {
      const color = Expression.parse(activeColorFunc).evaluate({
        type: 'Feature',
        properties: {
          month,
        },
        geometry: null,
      })
      const monthName = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[month - 1]
      vals.push([monthName, color])
    }
  } else if (filters.colorVis === 'weekday') {
    for (let weekday = 6; weekday >= 0; weekday--) {
      const color = Expression.parse(activeColorFunc).evaluate({
        type: 'Feature',
        properties: {
          weekday,
        },
        geometry: null,
      })
      const weekdayName = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ')[weekday]
      vals.push([weekdayName, color])
    }
  } else if (filters.colorVis === 'participants' || filters.colorVis === 'participantsFixed') {
    for (const participant of visibleParticipants) {
      const color = Expression.parse(activeColorFunc).evaluate(
        makeFeature({
          participantsOrMultiple: participant.name,
        }),
      )
      vals.push([participant.name, color])
    }
    vals.push(['Other', 'black']) // TODO don't hardcode black

    vals.reverse()
  } else if (filters.colorVis === 'transportMode') {
    for (const transportMode of transportModes) {
      const color = Expression.parse(activeColorFunc).evaluate(
        makeFeature({
          transportMode,
        }),
      )
      vals.push([transportMode, color])
    }

    vals.reverse()
  } else if (filters.colorVis === 'hardship') {
    for (const hardship of hardships) {
      const color = Expression.parse(activeColorFunc).evaluate(
        makeFeature({
          hardship,
        }),
      )
      vals.push([hardship, color])
    }

    vals.reverse()
  } else {
    throw 'unknown colorVis' + filters.colorVis
  }
  return vals
}
