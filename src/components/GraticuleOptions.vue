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
        option(value="firstParticipants") First participant
        option(value="lastParticipants") Recent participant
        option(value="mostSuccessfulParticipants") Most successful participant
  .db.mv3
    .dib(style="width:3rem") Text:
    select(v-model="graticules.infoLabel")
        option(value="none")
        option(value="ratio") Success ratio
        option(value="expeditions") Expedition count
        option(value="daysSinceExpedition") Recently active
        option(value="totalParticipants") Total participants
        option(value="firstParticipants") First successful participants
        option(value="lastParticipants") Recent successful participants
        option(value="mostSuccessfulParticipants") Most successful participants
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
    computed: {
        graticuleFillStyle() {
            return this.graticules.fillStyle;
        },
    },
    watch: {
        graticuleFillStyle() {
            if (
                this.graticules.fillStyle !== 'none' &&
                this.graticules.fillStyle !== 'virgin'
            ) {
                this.graticules.infoLabel = this.graticules.fillStyle;
            }
        },
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
