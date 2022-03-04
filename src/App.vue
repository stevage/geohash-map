<template lang="pug">
    #app.flex.flex-column.vh-100.avenir
        #top.bb.b--gray.bg-washed-yellow
            //- h1 Geohash expeditions map
        #middle.flex.flex-auto
            #sidebar.br.b--dark-gray.overflow-auto.pa2-ns(:class="{ collapsed: !sidebarOpen}")
                .container.light-gray.overflow-auto.pa2.bw2
                    .credits By <a href="https://hire.stevebennett.me">Steve Bennett</a>. Data by <a href="https://fippe.de">fippe</a>.
                    .tabs.mb2.flex
                        .tab.ba.pa3.br3.br--left.flex-auto(:class="{ activeTab: tab === 'expeditions'}" @click="tab='expeditions'")
                            | Expeditions
                        .tab.ba.pa3.br3.br--right.flex-auto(:class="{ activeTab: tab === 'geohash'}" @click="tab='geohash'")
                            | Geohash

                    div(v-if="tab === 'expeditions'")
                        FeatureInfo
                        Filters
                        AnimationControls
                        HashStats
                    div(v-if="tab === 'geohash'")
                        HashInfo

            #sidebar-rim.relative.br.b--gray.bg-dark.bw2(v-show="!sidebarOpen"  style="width:20px" @click="sidebarOpen = true")
            #map-container.relative.flex-auto
                Map
                #sidebarToggle.absolute.bg-black-50.white-90.f3.br.bt.bb.br--right.br-100.b--magenta.bw1.magenta.pa1.pointer.grow.fw8(@click="sidebarOpen = !sidebarOpen")
                  span(v-if="!sidebarOpen") &rarr;
                  span(v-if="sidebarOpen") &larr;
                #overlay.absolute.h-100.w-100
                    Legend
        #bottom.bt.b--light-gray.flex-none
</template>

<script>
import Map from './components/Map.vue';
import FeatureInfo from './components/FeatureInfo.vue';
import Legend from '@/components/Legend.vue';
import Filters from '@/components/Filters.vue';
import AnimationControls from '@/components/AnimationControls.vue';
import HashStats from '@/components/HashStats.vue';
import HashInfo from '@/components/HashInfo.vue';

import { EventBus } from './EventBus';
window.app = {};
window.app.yearColors = '#000 #e69f00 #56b4e9 #009e73 #f0e442 #0072b2 #d55e00 #cc79a7 #999999'.split(
    ' '
);
export default {
    name: 'app',
    components: {
        Map,
        FeatureInfo,
        Legend,
        Filters,
        AnimationControls,
        HashStats,
        HashInfo,
    },
    data() {
        return {
            sidebarOpen: true,
            tab: 'expeditions',
        };
    },
    created() {
        window.app.App = this;
        EventBus.$on('select-feature', () => (this.sidebarOpen = true));
    },
    watch: {
        sidebarOpen() {
            this.$nextTick(() => window.map.resize());
        },
        tab() {
            EventBus.$emit('tab-change', this.tab);
        },
    },
};

require('tachyons/css/tachyons.min.css');
</script>

<style scoped>
html,
body {
    height: 100vh;
    width: 100%;
    margin: 0;
    padding: 0;
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
    width: 310px;
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
}
.container {
    background: #333;
    color: #ddd;
    border-right: 1px solid #222;
    border-bottom: 1px solid #222;
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

.dark-border {
}

.tab {
    color: #555;
    cursor: pointer;
}
.tab:hover {
    background: #555;
    color: #999;
}
.activeTab {
    border: 1px solid #eee;
    color: white;
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
</style>
