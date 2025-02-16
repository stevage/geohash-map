<template lang="pug">
    #app.flex.flex-column.vh-100.avenir
        #top.bb.b--gray.bg-washed-yellow
        #middle.flex.flex-auto
            #sidebar.br.b--dark-gray.overflow-auto.pv2-ns(:class="{ collapsed: !sidebarOpen}")
                .container.overflow-auto.pa2.bw2
                    .credits By <a href="https://hire.stevebennett.me">Steve Bennett</a>. Data by <a href="https://fippe.de/all">Fippe</a>.

                    label
                      //- span.pa2 Explore
                      //- select.pa2(v-model="tab" style="width:calc(100% - 30px)")
                      //-     option(value="expeditions") Expeditions
                      //-     option(value="graticules") Graticules
                      //-     option(value="geohash") Geohash
                      //-     option(value="participants") People
                    .tabs.mb2.mh4.flex
                        .tab.ba.br3.br--left.flex-auto(:class="{ activeTab: tab === 'expeditions'}" @click="tab='expeditions'")
                          img(src="@/assets/hiking.png")
                          .tooltip Explore expeditions
                        .tab.ba.flex-auto(:class="{ activeTab: tab === 'participants'}" @click="tab='participants'")
                          img(src="@/assets/multiple-users-silhouette.png")
                          .tooltip Explore by participant
                        .tab.ba.flex-auto(:class="{ activeTab: tab === 'graticules'}" @click="tab='graticules'")
                          img(src="@/assets/grid(1).png")
                          .tooltip Explore graticule statistics
                        .tab.ba.br3.br--right.flex-auto(:class="{ activeTab: tab === 'geohash'}" @click="tab='geohash'")
                          img(src="@/assets/pin.png")
                          .tooltip See today's geohash
                    //- .tabs.mb2.mh4.flex
                    //-     .tab.ba.pa3.br3.br--left.flex-auto(:class="{ activeTab: tab === 'expeditions'}" @click="tab='expeditions'")
                    //-         | Expeditions
                    //-     .tab.ba.pa3.flex-auto(:class="{ activeTab: tab === 'graticules'}" @click="tab='graticules'")
                    //-         | Graticules
                    //-     .tab.ba.pa3.br3.br--right.flex-auto(:class="{ activeTab: tab === 'geohash'}" @click="tab='geohash'")
                    //-         | Geohash
                    div(v-if="mapExists")
                      div(v-show="tab === 'expeditions'")
                          ExpeditionInfo
                          Filters.ml2
                          InfluenceControls.ml2
                          h3 Graphs and stats
                          ChartControls.ml2
                          AnimationControls.ml2
                          //- RegionControls.ml2
                          //- VoronoiControls.ml2
                      div(v-show="tab === 'geohash'")
                          HashInfo
                      div(v-show="tab === 'graticules'")
                          GraticuleOptions
                          GraticuleInfo
                      div(v-show="tab === 'participants'")
                        //- HashStats.ml2
                        Participant(:active="tab === 'participants'")

            #sidebar-rim.relative.br.b--gray.bg-dark.bw2(v-show="!sidebarOpen"  style="width:20px" @click="sidebarOpen = true")
            #map-container.relative.flex-auto
                Mapping(@map-created="mapExists = true")
                #sidebarToggle.absolute.bg-black-5.white-90.f3.br.bt.bb.br--right.br-100.bw1.pa1.pointer.grow.fw8(@click="sidebarOpen = !sidebarOpen" style="margin-left:-25px;z-index:100; background:#222;top:10px;")
                  span(v-if="!sidebarOpen") &rarr;
                  span(v-if="sidebarOpen") &larr;
                #overlay.absolute.h-100.w-100
                    MapLegend
                    div.absolute.center.animationMonth {{animationMonthISO}}
                Chart
        #bottom.bt.b--light-gray.flex-none
</template>

<script lang="ts">
import { EventBus } from './EventBus'
import Mapping from './components/Map.vue'
import ExpeditionInfo from './components/ExpeditionInfo.vue'
import MapLegend from '@/components/Legend.vue'
import Filters from '@/components/Filters.vue'
import AnimationControls from '@/components/AnimationControls.vue'
import HashInfo from '@/components/HashInfo.vue'
import ChartControls from '@/components/ChartControls.vue'
import Chart from '@/components/Chart.vue'
import GraticuleInfo from '@/components/GraticuleInfo.vue'
import GraticuleOptions from '@/components/GraticuleOptions.vue'
import RegionControls from '@/components/RegionControls.vue'
import InfluenceControls from '@/components/InfluenceControls.vue'
import VoronoiControls from '@/components/VoronoiControls.vue'
import Participant from '@/components/Participant.vue'
import { getUrlParam, setUrlParam } from './util'

import './components/stats'

window.app = {
  yearColors: '#000 #e69f00 #56b4e9 #009e73 #f0e442 #0072b2 #d55e00 #cc79a7 #999999'.split(' '),
  fippeServer: '', //'https://fippe.de/'
  // overrideTime: '2024-12-31T09:30:00',
  // overrideTime: undefined, //'2024-12-31T09:30:00',
  // overrideTime: '2024-05-31T20:30:00',
  // overrideTime: '2025-01-01T20:30:00',
  // overrideTime: '2025-01-02T10:19:00',
  // // overrideTimezone: 'America/New_York',
  // overrideTimezone: 'Europe/London',
}
window.z = window.z ?? {}
export default {
  name: 'app',
  components: {
    Mapping,
    ExpeditionInfo,
    MapLegend,
    Filters,
    AnimationControls,
    // HashStats,
    HashInfo,
    ChartControls,
    Chart,
    GraticuleInfo,
    GraticuleOptions,
    RegionControls,
    InfluenceControls,
    VoronoiControls,
    Participant,
  },
  data() {
    return {
      sidebarOpen: true,
      tab: 'expeditions',
      animationMonthISO: null,
      mapExists: false,
    } as {
      sidebarOpen: boolean
      tab: string
      animationMonthISO: string | null
      mapExists: boolean
    }
  },
  created() {
    // @ts-ignore
    window.app.App = this
    EventBus.$on('select-feature', () => (this.sidebarOpen = true))
    EventBus.$on(
      'animation-cycle',
      ({ animationMonthISO }: { animationMonthISO: string }) =>
        (this.animationMonthISO = animationMonthISO),
    )
    EventBus.$on('animation-ended', () => {
      this.animationMonthISO = null
    })
    EventBus.$on('map-loaded', () => {
      if (getUrlParam('tab')) {
        this.tab = getUrlParam('tab') ?? 'expeditions'
      }
      if (this.tab === 'graticules') {
        const graticuleId = getUrlParam('graticule')
        if (graticuleId) {
          EventBus.$emit('select-graticule-by-id', graticuleId)
        }
      }
    })
  },
  mounted() {
    window.setTimeout(() => {
      // this.tab = getUrlParam('tab') || 'expeditions';
      // EventBus.$emit('tab-change', this.tab);
    }, 500)
  },
  watch: {
    sidebarOpen() {
      this.$nextTick(() => window.map.resize())
    },
    tab() {
      EventBus.$emit('tab-change', this.tab)
      setUrlParam('tab', this.tab === 'expeditions' ? null : this.tab)
      if (this.tab !== 'graticule') {
        setUrlParam('graticule', null)
      }
    },
  },
}

import 'tachyons/css/tachyons.min.css'
</script>

<style>
html,
body {
  height: 100vh;
  width: 100%;
  margin: 0;
  padding: 0;
}
html,
body,
#app {
  background: #222;
}

#sidebarToggle:hover {
  background: hsl(220, 100%, 95%);
}

#sidebar.collapsed {
  position: absolute;
  animation-duration: 0.5s;
  animation-name: slideout;
  pointer-events: none;
  animation-fill-mode: forwards;
}

#sidebar {
  animation-duration: 0.5s;
  animation-name: slidein;
  z-index: 1;
  width: calc(min(400px, 90vw));
}

@keyframes slidein {
  from {
    transform: translate(-310px, 0);
  }
  to {
    transform: translate(0px, 0);
  }
}
@keyframes slideout {
  from {
    transform: translate(0px, 0);
  }
  99% {
    opacity: 1;
  }
  to {
    transform: translate(-310px, 0);
    opacity: 0; /* The sidebar will still be present, so we need to hide it. Relies on animation-fill-mode: forwards*/
  }
}

#sidebarToggle:hover {
  background: hsl(220, 100%, 95%);
}

#sidebar {
  background: #333;
  color: #777;
}

#sidebar h3 {
  color: #fff;
}

.container {
  background: #333;
  color: #ddd;
  color: #ccc;
  border-right: 1px solid #222;
  border-bottom: 1px solid #222;
}

.container h3 {
  color: #fff;
}

/* Exists to ensure whole sidebar animates together */
.collapsed .container {
  height: 100vh;
}

#overlay {
  pointer-events: none;
}

.credits {
  position: absolute;
  padding: 10px 5px;
  bottom: 0;
  width: 310px;
  z-index: -1;
  background: #333;
  color: #fff;
  margin: 0;
  left: 0;
  right: 0;
}

.credits a {
  color: #88f;
}

.bg-dark {
  background-color: #333;
}

/* .dark {
    color: #555;
} */

.tab {
  color: #555;
  cursor: pointer;
  text-align: center;
  position: relative;
}
.tab:hover {
  background: #555;
  color: #999;
}
.activeTab {
  border: 1px solid #eee;
  color: white;
}

.tab {
  padding: 16px 0px;
}

.tab img {
  height: 30px;
  width: 30px;
  /* margin: 18px 28px; */
  filter: invert(1) brightness(0.6);
}
.activeTab img {
  filter: invert(1) brightness(1) drop-shadow(0 0 2px #09f);
}

.tab:hover img {
  filter: invert(1) brightness(1) drop-shadow(0px 0px 4px #bbb);
}

.animationMonth {
  background: transparent;
  height: 300px;
  bottom: 0;
  width: 100%;
  text-align: center;
  font-size: 50px;
  font-weight: 600;
  /* text-stroke: #ccc 1px;
    color:black; */
  /* text-stroke: #333 5px; */
  -webkit-text-stroke: #111 2px;
  color: #777;
}
</style>

<style>
@media screen and (min-width: 768px) {
  .only-mobile {
    display: none;
  }
}
@media screen and (max-width: 767px) {
  .not-mobile {
    display: none;
  }
}

a,
a:visited {
  text-decoration: none;
  color: hsl(230, 40%, 70%);
}
a:hover {
  color: hsl(230, 40%, 80%);
  text-decoration: underline;
}

.tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: hsla(0, 0%, 30%, 0.6);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  white-space: nowrap;
  font-size: 14px;
  opacity: 0;
  pointer-events: none;
  /* transition: opacity 0.2s; */
  transition: opacity 0.3s ease-in-out;
}

*:hover > .tooltip {
  opacity: 1;
}

* {
  scrollbar-color: #777 #444; /* thumb color, track color */
}
::-webkit-scrollbar-track {
  /* background: #333; Dark background */
}
</style>
