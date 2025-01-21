import { mapU } from '@/util'
import { idStringToNumeric } from '@/mapping/graticules/graticuleFeatures'
import * as turf from '@turf/turf'
import { Feature, FeatureCollection, Polygon } from 'geojson'
export async function initGTG(map: mapU) {
  map.U.addSource('rgb', {
    type: 'raster',
    url: 'mapbox://mapbox.terrain-rgb',
  })
  map.U.addRasterLayer(
    'rgb-elevation',
    'rgb',
    {
      paint: {
        'raster-color-range': [0, 8848],
        'raster-color-mix': [1677721.6, 6553.6, 25.6, -10000],

        'raster-color': [
          'interpolate',
          ['linear'],
          ['raster-value'],
          1499,
          'hsla(0,100%,20%,0.0)',
          1500,
          // 'transparent',
          'hsla(90,100%,80%,0.3)',
          // 1700,
          // 'blue',
        ],
        rasterOpacity: 0.2,
      },
      // 'raster-color-range': [0, 8848],
      // 'raster-color-mix': [1677721.6, 6553.6, 25.6, -10000],
      // 'raster-color': [
      //     'interpolate',
      //     ['linear'],
      //     ['raster-value'],
      //     0,
      //     'hsl(40,50%,80%)',
      //     392,
      //     'hsl(110,80%,20%)',
      //     785,
      //     'hsl(120,70%,20%)',
      //     1100,
      //     'hsl(100,0%,50%)',
      //     1300,
      //     'hsl(215,40%,70%)',
      //     1550,
      //     'white',
      // ],
      // 'raster-opacity': 0.25,
    },
    'graticules-line',
  )

  map.U.addGeoJSON('countries-gtg')
  map.U.addFillLayer('countries-gtg-fill', 'countries-gtg', {
    fillColor: 'hsla(150,100%,80%,0.05)',
  })
  map.U.addLineLayer('countries-gtg-line', 'countries-gtg', {
    lineColor: 'hsla(150,100%,80%,0.2)',
    lineWidth: 1,
  })
  const countries = await fetch('gtg/countries.geojson').then((r) => r.json())
  const countriesShifted = turf.featureCollection(
    (turf.flatten(countries) as unknown as FeatureCollection<Polygon>).features.map(
      (f: Feature<Polygon>) => translateFeature(f, 180, 0),
    ),
  )
  window.z.countriesShifted = countriesShifted
  map.U.setData('countries-gtg', countriesShifted)
}

// shifts every coordinate in the feature without using Turf
function translateFeature(f: Feature<Polygon>, deltaX: number, deltaY: number) {
  function shift(c: any) {
    if (typeof c[0] === 'number') {
      return [c[0] + deltaX, c[1] + deltaY]
    } else {
      return c.map(shift)
    }
  }
  return {
    ...f,
    geometry: {
      ...f.geometry,
      coordinates: f.geometry.coordinates.map(shift),
    },
  }
}

function updateGtg() {
  for (const [yxstr, state] of Object.entries(gtgGraticules)) {
    window.map.setFeatureState(
      { source: 'graticules', id: idStringToNumeric(yxstr) },
      { gtg: state },
    )
  }
  window.localStorage.setItem('gtg', JSON.stringify(gtgGraticules))
}
window.z.updateGtg = updateGtg

export function gtg(
  ystr: string | number = undefined,
  xstr: string | number = undefined,
  state: string = undefined,
  update = true,
) {
  if (ystr !== undefined) {
    // const [ystr, xstr] = yxstr.split(',');
    gtgGraticules[`${ystr},${xstr}`] = state
  }
  if (update) updateGtg()
}
const gtgGraticules = JSON.parse(window.localStorage.getItem('gtg') || '{}')
// window.setTimeout(() => updateGtg(), 2000);
window.z.gtg = gtg
window.gtg = gtg
window.z.gtgGraticules = gtgGraticules

function onlyBorders() {
  for (let y = 0; y < 30; y++)
    for (let x = 0; x < 180; x++) {
      const pixelBounds = [window.map.project([x, y]), window.map.project([x + 1, y + 1])]
      const features = window.map.queryRenderedFeatures(pixelBounds, {
        layers: ['admin-0-boundary'],
      })
      if (features.length) {
        console.log(x, y, gtgGraticules[`${y},${x}`])
        if (gtgGraticules[`${y},${x}`] !== 'out') {
          // console.log(x, y, gtgGraticules[`${y},${x}`]);
          gtg(String(y), String(x), 'in', false)
          // console.log(features);
          // console.log('gtg', y, x, 'in', false);
        }
        if (features.find((f: any) => f.properties.iso_3166_1.match(/(^MM-|-MM$)/))) {
          // console.log('Myanmar', y, x);
          gtg(String(y), String(x), 'out', false)
        }
      }
      //
    }
  gtg()
}

window.z.needLand = () => {
  for (let y = 0; y < 30; y++)
    for (let x = 0; x < 180; x++) {
      const graticuleBounds = turf.bboxPolygon([x, y, x + 1, y + 1])
      if (gtgGraticules[`${y},${x}`] === 'in') {
        // @ts-ignore
        const intersect = turf.booleanIntersects(graticuleBounds, window.z.countriesShifted)
        if (!intersect) {
          console.log('no intersect', y, x)
          gtg(y, x, 'out', false)
        }
      }
    }
  // if (window.graticulesById[`${y},${x + i}`]?.successes)
  //     gtg(y, x, 'out', false);
  gtg()
}

window.z.reloadGtg = () => {
  // ocean to west must not be atlantic
  for (let y = 30; y < 90; y++) for (let x = 0; x < 180; x++) gtg(y, x, 'out', false)

  // no expeditions within 2 any direction
  for (let y = 0; y < 30; y++)
    for (let x = 0; x < 180; x++)
      for (let i = -2; i <= 2; i++)
        for (let j = -2; j <= 2; j++)
          if (window.graticulesById[`${y + j},${x + i}`]) gtg(y, x, 'out', false)

  // no unlocked graticules within 5 to east
  for (let y = 0; y < 30; y++)
    for (let x = 0; x < 180; x++)
      for (let i = 1; i <= 5; i++)
        if (window.graticulesById[`${y},${x + i}`]?.successes) gtg(y, x, 'out', false)

  onlyBorders()

  // mostly for having more than 2 border/graticule intersections
  '21,93 27,91 22,102 19,104 29,61, 29,60'.split(' ').forEach((p) => gtg(...p.split(','), 'out'))

  // due to blue highway shields
  '18,105 22,104 21,103 21,102 18,104 18,103 17,102 18,102 29,66'
    .split(' ')
    .forEach((p) => gtg(...p.split(','), 'out'))

  /* possible:
    Kaihua, China (23, 104)
    Pithorāgarh, India (29, 80)
    Khāsh, Iran (28, 61)

    */

  window.z.needLand()
}

window.z.checkUnnamed = () => {
  for (let y = 0; y < 30; y++) {
    for (let x = 0; x < 180; x++) {
      if (!window.graticuleNamesHash[`${y},${x}`]) {
        console.log('no name', y, x)
        gtg(y, x, 'out', false)
        continue
      }
      let foundUnnamed = false
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (!window.graticuleNamesHash[`${y + j},${x + i}`]) {
            foundUnnamed = true
            break
          }
        }
      }
      if (!foundUnnamed) {
        console.log('no unnamed neighbour', y, x)
        gtg(y, x, 'out', false)
      }
    }
  }
  gtg()
}

window.z.onlyBorders = onlyBorders

/*
Khāsh, Iran (28, 61)

*/
