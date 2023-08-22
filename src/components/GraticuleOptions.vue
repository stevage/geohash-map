<template lang="pug">
#GraticuleOptions
  .db.mv3
    .dib(style="width:3rem") Color:
    select(v-model="graticules.fillStyle")
        option(value="none") None
        option(value="virgin") Virgin graticules
        option(value="ratio") Success ratio
        option(value="expeditions") Expedition count
        option(value="daysSinceExpedition") Recently active
        option(value="totalParticipants") Total participants
        option(value="firstParticipants") First hasher
        option(value="lastParticipants") Recent hasher
  .db.mv3
    .dib(style="width:3rem") Text:
    select(v-model="graticules.infoLabel")
      option(value="none")
      option(value="firstParticipants") First successful participants
      option(value="lastParticipants") Last successful participants
      option(value="history") History
</template>

<script>
import { EventBus } from '@/EventBus';
export default {
    data: () => ({
        graticules: {
            showGraticules: true,
            showGraticuleLabels: true,
            fillStyle: 'virgin',
            infoLabel: 'none',
        },
    }),
    created() {
        window.GraticuleOptions = this;
    },
    watch: {
        graticules: {
            deep: true,
            handler() {
                EventBus.$emit('graticule-options-change', this.graticules);
            },
        },
    },
};
</script>

<style scoped></style>
