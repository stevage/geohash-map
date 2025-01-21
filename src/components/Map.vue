<template lang="pug">
#map.absolute.absolute--fill
</template>

<script lang="ts">
// import mapboxgl from 'maplibre-gl';
// import 'maplibre-gl/dist/maplibre-gl.css';
import mapboxgl from 'mapbox-gl/dist/mapbox-gl-dev'
import 'mapbox-gl/dist/mapbox-gl.css'
import U from 'map-gl-utils/dist/index.esm.js'
import type { UtilsMap } from 'map-gl-utils/dist/types'
import type { FeatureCollection, Point } from 'geojson'
import { EventBus } from '../EventBus'
import type { DebouncedFunction } from 'debounce'
// import '../global.d.ts';
import {
  updateHashStyle,
  updateHashAnimation,
  resetHashAnimation,
} from '@/mapping/mappingExpeditions'
import { updateMeridians } from '@/mapping/mappingMeridians'
import { updateGeohashes } from '@/mapping/mappingGeohashes'

import { setGraticuleStyle } from '@/mapping/mappingGraticules'

import { dateToDays, getGraticuleBounds, report } from '@//util'
// import { updateStreakStyle } from '@/mapping/mappingStreaks'
import { updateInfluenceStyle } from '@/mapping/mappingInfluence'
// import { initGTG } from '@/mapping/gtg';
import debounce from 'debounce'
import type { Filters } from '@/globals'
export default {
  data: () => ({
    filters: {
      minYear: 2008,
      maxYear: new Date().getUTCFullYear(),
      colorVis: 'experienceDaysMax',
      participants: '',
      outcome: 'all',
    } as Filters,
    frameNo: 0,
    animationDay: 0,
    globe: window.location.hash.match(/globe/),
  }),
  async mounted() {
    mapboxgl.accessToken =
      // 'pk.eyJ1Ijoic3RldmFnZSIsImEiOiJja3p5cGZvOHowMmZpM21tOW40M3ZnOG5rIn0.c5qZKNfmItrPsv2UiCJxag';
      //  pk.eyJ1Ijoic3RldmFnZSIsImEiOiJja25keW5pYTkxZGx3Mm5vb2UxdzE4cno2In0.ZjjS8eUNwE_vsBzg7hML8w
      'pk.eyJ1Ijoic3RldmFnZSIsImEiOiJja3p5cHdtOGEwMm1hM2RtdzJlYXJrajhrIn0.veC37cfBaslGu1MteavjNA'
    // pk.eyJ1Ijoic3RldmFnZSIsImEiOiJGcW03aExzIn0.QUkUmTGIO3gGt83HiRIjQw ??

    let center = [145, -37.8]
    let zoom = 1

    try {
      // console.log(window.localStorage.getItem('center').split(','));
      const centerCookie = window.localStorage.getItem('center')!.split(',').map(parseFloat)
      center = centerCookie.slice(0, 2)
      zoom = centerCookie[2]
    } catch {
      // console.log('ohno', e);
      //
    }
    console.log(center, zoom)
    const minimal = {
      version: 8,
      sources: {},

      layers: [],
      glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
    }
    const map: UtilsMap = new mapboxgl.Map({
      container: 'map',
      center, //: [144.96, -37.81],
      zoom,
      // style: 'mapbox://styles/mapbox/light-v9',
      style:
        window.location.hostname === 'localhost'
          ? minimal
          : 'mapbox://styles/stevage/ckzoqlsr1000115qtr5pendfa', // geohash-dark

      hash: 'center',
      projection: this.globe
        ? 'globe' //{ name: 'globe', center: [0, 0], parallels: [30, 30] }
        : 'mercator',
    })
    U.init(map, mapboxgl)

    window.map = map
    window.map.hash = 'center'
    window.map = map

    await map.U!.onLoad()
    // initMappingRegions(map);

    if (this.globe && !window.location.hash.match(/bug/)) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      })
      // add the DEM source as a terrain layer with exaggerated height
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 0 })
    }

    EventBus.$emit('map-loaded', map)
    this.filters = window.Filters?.filters ?? true
    this.initMapContent()
    EventBus.$on('filters-change', (filters: Filters) => {
      console.log('filters-change')
      this.filters = filters
      this.updateMapStyleDebounced()
    })
    EventBus.$on('animation-change', (running) =>
      running ? this.startAnimation() : this.stopAnimation(),
    )
    // window.map.U.toggle(/^expeditions/, window.app.App.tab === 'expeditions');

    EventBus.$on('tab-change', (tab) => {
      map.U!.toggle(/^expeditions/, tab === 'expeditions')
    })
    // const debouncedMove = debounce(
    //     () => {
    //         EventBus.$emit('move', map);
    //     },
    //     300,
    //     { immediate: true }
    // );
    // map.on('move', debouncedMove);

    // map.on('move', () => EventBus.$emit('move', map));
    map.on('moveend', () => {
      try {
        // map.setBearing(0);
        // map.setPitch(0);
        EventBus.$emit('moveend', map)

        window.localStorage.setItem(
          'center',
          map.getCenter().toArray().join(',') + ',' + map.getZoom(),
        )
      } catch {
        //
      }
    })
    map.on('move', () => {
      if (map.getPitch() !== 0) {
        map.setPitch(0)
      }
      if (map.getBearing() !== 0) {
        map.setBearing(0)
      }
    })
    EventBus.$on('projection-change', (projection: string) => {
      console.log(projection)
      window.map.setProjection(projection)
    })
  },
  created() {
    this.updateMapStyleDebounced = debounce(() => {
      this.updateMapStyle()
    }, 300)
  },
  computed: {
    animationMonthISO() {
      return this.animationDay && new Date(8.64e7 * this.animationDay).toISOString().slice(0, 7)
    },
  },
  methods: {
    updateMapStyleDebounced: (() => undefined) as DebouncedFunction<() => void>, // body will be replaced
    findPairs(expeditions: FeatureCollection<Point>) {
      const pairs = {}
      let max = [0, null]
      for (const f of expeditions.features) {
        for (const p of f.properties.participants) {
          if (!pairs[p]) {
            pairs[p] = {}
          }
          for (const p2 of f.properties.participants) {
            if (p === p2) {
              continue
            }
            pairs[p][p2] = (pairs[p][p2] || 0) + 1
            if (pairs[p][p2] > max[0]) {
              max = [pairs[p][p2], p, p2]
            }
          }
        }
      }
      console.log('Maximum pair', max)
      const out = ''
      for (const [p1, p2s] of Object.entries(pairs)) {
        for (const [p2, count] of Object.entries(p2s)) {
          if (count > 50 && p1 > p2) {
            console.log(p1, p2, count)
            // out += `${p1} ${p2} ${count}\n`;
          }
        }
      }
      console.log(out)
      // for (const [p1, p2s] of Object.entries(pairs).filter(
      //     (pair) => pair[0] === 'Stevage'
      // )) {
      //     for (const [p2, count] of Object.entries(p2s)) {
      //     }
      // }
    },

    async initMapContent() {
      // const colorFunc = this.experienceDaysColorFunc();
      // const colorFunc = this.yearColorFunc();
      this.updateMapStyle()
    },
    updateMapStyle() {
      const map = window.map
      report('Update meridians', () => updateMeridians({ map }))
      report('Update expeditions', () =>
        updateHashStyle({ map: window.map, filters: this.filters }),
      )
      report('Update graticules', () =>
        setGraticuleStyle({ map: window.map, filters: this.filters }),
      )
      // report('Update streaks', () =>
      //     updateStreakStyle({ map, filters: this.filters })
      // );
      report('Update influence', () => updateInfluenceStyle({ map, filters: this.filters }))
      updateGeohashes(map)
      // console.log(performance.now() - start);

      // initGTG(map);
    },
    startAnimation() {
      this.stopAnimation()
      if (this.filters.minYear == 2008) {
        this.animationDay = dateToDays(`2008-05-01`) // geohashing started on May 21st 2008
      } else {
        this.animationDay = dateToDays(`${this.filters.minYear}-01-01`)
      }
      resetHashAnimation({
        map: window.map,
        show: false,
      })

      this.lastFrame = 0

      this.timerFunc = (now) => {
        if (!this.timer || this.animationDay > dateToDays(new Date())) {
          EventBus.$emit('animation-ended')

          this.stopAnimation()
        } else {
          this.updateAnimation()
          if (this.lastFrame) {
            const elapsed = now - this.lastFrame
            const dayJump = Math.max(1, Math.floor(elapsed / 10))
            this.animationDay += dayJump
          }
          this.lastFrame = now

          requestAnimationFrame(this.timerFunc)
        }
      }
      this.timer = 1
      requestAnimationFrame(this.timerFunc)
    },
    stopAnimation() {
      if (this.timer) {
        // clearInterval(this.timer);
      }
      // window.map.off('idle', this.timerFunc);
      this.timer = 0
      resetHashAnimation({
        map: window.map,
        filters: this.filters,
        show: true,
      })
    },
    updateAnimation() {
      const [minx, miny, maxx, maxy] = getGraticuleBounds(window.map)

      EventBus.$emit('animation-cycle', {
        animationDay: this.animationDay,
        animationMonthISO: this.animationMonthISO,
      })
      updateHashAnimation({
        map: window.map,
        minx,
        miny,
        maxx,
        maxy,
        animationDay: this.animationDay,
        animationMonthISO: this.animationMonthISO,
      })
      this.frameNo = (this.frameNo || 0) + 1
    },
    updateGlobeAnimation() {
      if (this.globe) {
        // 14092
        const daysPerLoop = 50000
        // We want x in range -1 to 1

        const x = (((this.animationDay - 14000) % daysPerLoop) / daysPerLoop) * 2 - 1
        if (this.frameNo % 2 === 0) {
          window.map.setFreeCameraOptions({
            position: {
              x,
              y: 0.45,
              z: 0.5,
            },
          })
        }
      }
    },

    startGlobeAnimation() {
      this.lastFrame = 0

      this.timerFunc = (now) => {
        this.updateGlobeAnimation()
        if (this.lastFrame) {
          const elapsed = now - this.lastFrame
          const dayJump = Math.max(1, Math.floor(elapsed / 10))
          this.animationDay += dayJump
        }
        this.lastFrame = now
        this.frameNo = (this.frameNo || 0) + 1
        this.updateGlobeAnimation()

        if (this.timer) {
          requestAnimationFrame(this.timerFunc)
        }
      }
      this.timer = 1
      requestAnimationFrame(this.timerFunc)
    },
  },
}
/*

TODO a feature-state version of this

renderFunc = () => {
  days+=20;
  map.setFilter('expeditions-circles', ['all', ['<',['get','days'], days], ['>', ['get','x'], -1130]])
  console.log(days)
}

days=13000
map.off('idle', renderFunc)
map.on('idle', renderFunc)

*/
</script>

<style>
#map {
  background: #222;
}
.mapboxgl-popup-content {
  background: hsla(0, 0%, 3%, 0.5);
  /* transparent; */
  color: #bbb;
  padding: 2px;
  text-align: center;
  box-shadow: none;
  border: 1px solid #444;
  backdrop-filter: blur(10px);
}

.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip {
  border-top-color: #555;
}
.mapboxgl-popup-anchor-top .mapboxgl-popup-tip {
  border-bottom-color: #555;
}
.mapboxgl-popup-anchor-left .mapboxgl-popup-tip {
  border-right-color: #555;
}
.mapboxgl-popup-anchor-right .mapboxgl-popup-tip {
  border-left-color: #555;
}

.mapboxgl-ctrl-scale {
  background: #222;
  color: #bbb;
}
</style>
