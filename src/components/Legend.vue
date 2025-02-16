<template lang="pug">
#Legend.relative.h-100(:class="{ collapsed }" @click="collapsed = !collapsed")
    //- .bg-white.b--gray.ba.shadow-1.pa2.ma2.bottom.absolute.bottom-2
    .bg-dark-gray.light-gray.b--gray.ba.shadow-1.npe.pa2.top.right-0.right-1-ns.top-1-ns.absolute(v-if="showingExpeditions" )
        //- div(style="pointer-events:none")
        h3.ma0.mb1 {{ title }}
        div(:class="{ [`legend-colorvis-${colorVis}`]: true } ")
          div.legend-item(v-for="([year, color], i) in colors.slice().reverse()" :class="{ [`legend-item-${i}`]: true }" )
              .pill(:style="{ backgroundColor: color }")
                  //-   | {{ i === colors.length-1 ? " <= " : "" }}
              | {{ year }}


</template>

<script>
import { EventBus } from '@/EventBus'
export default {
  name: 'Legend',
  data: () => ({
    colors: window.app.yearColors,
    colorVis: 'experienceDaysMax',
    showingExpeditions: true,
    collapsed: false, // sigh, this doesn't work because Legend sits within a no-pointer-events overlay
  }),
  created() {
    window.Legend = this
    EventBus.$on('colors-change', ({ colorVis, colors }) => {
      this.colors = colors
      this.colorVis = colorVis
    })
    EventBus.$on('tab-change', (tab) => {
      this.showingExpeditions = tab === 'expeditions'
    })
  },
  computed: {
    title() {
      return {
        experienceMax: 'Expeditions',
        experienceDaysMax: 'Years of geohashing',
        year: 'Year',
      }[this.colorVis]
    },
  },
}
</script>
<style>
#Legend {
  max-height: calc(100vh - 100px);
  overflow-y: hidden;
}

#Legend.collapsed {
  overflow-y: hidden;
  max-height: 50px;
}
</style>
<style scoped>
.pill {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 5px;
  border-radius: 50%;
}

.npe * {
  /* pointer-events: none; */
}

/* @media (max-height: 800px) { */

.legend-colorvis-year {
  .legend-item:nth-child(odd) {
    display: none;
  }
  .legend-item:first-child {
    display: block;
  }
  .legend-item:last-child {
    display: block;
  }
}
@media (max-width: 500px) {
  .legend-item {
    font-size: 12px;
  }
}
/* } */
</style>
