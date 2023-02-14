<template lang="pug">
#Filters.mt4(:class="{ disabled: !enabled }")
  h3.mb2 Filter expeditions
  .group
    label.mb2
      div Participant name
      input#filter-by-participants.mr1(type="text" v-model="filters.participants" :disabled="!enabled")
    label.mv2.db
      .dib At least
      input#filter-by-participants.mr1.w3.dib(type="number" size="2" v-model.number="filters.minParticipants" min="0" :disabled="!enabled")
      .dib participants
    label.mv2.dib
      div.dib Between
      input.w3.dib#filter-by-participants.mr1.ml1(type="number" v-model.number="filters.minYear" min="2008" :max="filters.maxYear" :disabled="!enabled")
    label.dib
      .dib and
      input#filter-by-participants.dib.w3.mr1.ml1(type="number" v-model.number="filters.maxYear" min="2008" max="2030" :disabled="!enabled")

    label.mv2.db
    select(v-model="filters.outcome" :disabled="!enabled")
      option(value="all") All expeditions
      option(value="success") Successful expeditions
      option(value="failure") Failed expeditions

  h3.mb1 Map
  .group
    label.mb2.db
      span Color by
      select(v-model="filters.colorVis" :disabled="!enabled")
        option(value="year") Year
        option(value="month") Month
        option(value="weekday") Day of the week
        option(value="experienceMax") Hasher's previous expeditions
        option(value="experienceDaysMax") Hasher's years of experience
        option(value="participants") Participant

    label.db
      span Scale by
      select(v-model="filters.scaleExpeditionsBy" :disabled="!enabled")
        option(value="none") Don't scale
        option(value="participantCount") Participant count
        option(value="reportKb") Report size
      //- input#filter-by-participants.mr1(type="checkbox" v-model="filters.scaleExpedition" :disabled="!enabled")
      //- span Scale by expedition size

    //- label.db
    //-   input.mr1(type="checkbox" v-model="filters.showStreaks" :disabled="!enabled")
    //-   span Show streaks

    label.db.ml3(v-if="filters.showStreaks")
      span Minimum streak length
      input.w3(type="number" v-model.number="filters.minStreakLength" min="2" size="2" :disabled="!enabled")
    label.db.ml3(v-if="filters.showStreaks")
      input.mr1(type="checkbox" v-model.number="filters.onlySuccessStreaks" :disabled="!enabled")
      span Only show 100% success treaks
      div(style="color: #888; font-size: 0.8em") Excludes success-streaks that have a fail before or after
  h3.mb1 Graticules
  .group
    label.db
      input.mr1(type="checkbox" v-model="graticules.showGraticules" :disabled="!enabled")
      span Show graticules
    label.db(v-show="graticules.showGraticules")
      input.mr1( type="checkbox" v-model="graticules.showGraticuleLabels" :disabled="!enabled")
      span Show graticule labels
    label.db(v-show="graticules.showGraticules")
      .db Color by
      select(v-model="graticules.fillStyle")
        option(value="none") None
        option(value="virgin") Virgin graticules
        option(value="ratio") Success ratio
        option(value="expeditions") Expedition count
        option(value="daysSinceExpedition") Recently active
</template>

<script>
import { EventBus } from '@/EventBus';
export default {
    name: 'Filters',
    data: () => ({
        enabled: true,
        filters: {
            participants: '',
            minParticipants: 0,
            // scaleExpedition: false,
            scaleExpeditionsBy: 'none',
            minYear: 2008,
            maxYear: new Date().getUTCFullYear(),
            outcome: 'all',
            colorVis: 'year',
            showStreaks: false,
            minStreakLength: 3,
            onlySuccessStreaks: true,
        },
        graticules: {
            showGraticules: true,
            showGraticuleLabels: true,
            fillStyle: 'virgin',
        },
    }),
    created() {
        window.Filters = this;
        EventBus.$on(
            'animation-change',
            (running) => (this.enabled = !running)
        );
    },
    watch: {
        filters: {
            deep: true,
            handler() {
                if (this.filters.minYear > this.filters.maxYear) {
                    this.filters.minYear = this.filters.maxYear;
                }
                EventBus.$emit('filters-change', this.filters);
            },
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

<style scoped>
label {
    /* display: block; */
    /* margin-bottom: 1em; */
}

.disabled {
    opacity: 0.5;
    pointer-events: none;
    user-select: none;
}

h4,
h5 {
    margin-bottom: 0.25em;
}
</style>
<style>
select,
input[type='checkbox'] {
    background: #333;
    color: #ddd;
    border: 1px solid #666;
}
input[type='text'],
input[type='number'] {
    -webkit-appearance: none;
    -moz-appearance: none;
    background: #333;
    color: #ddd;
    border: #666 solid 1px;
}

.group {
    padding-left: 16px;
    border-left: 1px solid hsla(0, 100%, 100%, 0.1);
    margin-bottom: 16px;
}
</style>
