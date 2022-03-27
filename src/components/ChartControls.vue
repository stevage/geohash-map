<template lang="pug">
#ChartControls
  h3 Graph
  label
    input.mr2(type="checkbox" v-model="options.showChart")
    | Show graph
  label.db.mt2(v-if="options.showChart")
    | Colour by
    select.ml2(v-model="options.colorBy")
      option(value="weekDay") Week day
      option(value="success") Success/failure
      option(value="participantsCount") Number of participants
      option(value="participants") Participants
      option(value="graticule") Graticule
      option(value="graticuleLongitude") Graticule longitude
      option(value="graticuleLatitude") Graticule latitude
</template>

<script>
import { EventBus } from '@/EventBus';
EventBus.$emit('');
export default {
    name: 'ChartControls',
    data: () => ({
        options: {
            showChart: !!window.location.host.match(/localhost/),
            colorBy: 'success',
        },
    }),
    created() {
        window.ChartControls = this;
    },
    watch: {
        options: {
            deep: true,
            handler() {
                EventBus.$emit('chart-options-change', this.options);
            },
        },
    },
};
</script>

<style scoped></style>
