<template lang="pug">
#Legend.relative.h-100(:class="{ collapsed }" @click="collapsed = !collapsed")
    //- .bg-white.b--gray.ba.shadow-1.pa2.ma2.bottom.absolute.bottom-2
    .bg-dark-gray.light-gray.b--gray.ba.shadow-1.npe.pa2.mh2.top.right-1.absolute(v-if="showingExpeditions" )
        //- div(style="pointer-events:none")
        h3.ma0.mb1 {{ title }}
        div(v-for="[year, color] in colors.slice().reverse()")
            .pill(:style="{ backgroundColor: color }")
                //-   | {{ i === colors.length-1 ? " <= " : "" }}
            | {{ year }}


</template>

<script>
import { EventBus } from '@/EventBus';
export default {
    name: 'Legend',
    data: () => ({
        colors: window.app.yearColors,
        colorVis: 'experienceDaysMax',
        showingExpeditions: true,
        collapsed: false, // sigh, this doesn't work because Legend sits within a no-pointer-events overlay
    }),
    created() {
        window.Legend = this;
        EventBus.$on('colors-change', ({ colorVis, colors }) => {
            this.colors = colors;
            this.colorVis = colorVis;
        });
        EventBus.$on('tab-change', (tab) => {
            this.showingExpeditions = tab === 'expeditions';
        });
    },
    computed: {
        title() {
            return {
                experienceMax: 'Expeditions',
                experienceDaysMax: 'Years of geohashing',
                year: 'Year',
            }[this.colorVis];
        },
    },
};
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
    ponter-events: none;
}
</style>
