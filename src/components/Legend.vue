<template lang="pug">
#Legend.relative.h-100
    //- .bg-white.b--gray.ba.shadow-1.pa2.ma2.bottom.absolute.bottom-2
    .bg-dark-gray.light-gray.b--gray.ba.shadow-1.pa2.ma2.bottom.absolute.bottom-2
        //- div(v-for="(color, i) in colors")
        //-   .pill(:style="{ backgroundColor: color }")
        //-   | {{ i === colors.length-1 ? " <= " : "" }}
        //-   | {{ 2022 - i }}
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
    }),
    created() {
        window.Legend = this;
        EventBus.$on('colors-change', (colors) => (this.colors = colors));
    },
};
</script>

<style scoped>
.pill {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 5px;
    border-radius: 50%;
}
</style>
