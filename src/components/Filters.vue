<template lang="pug">
#Filters.mt4(:class="{ disabled: !enabled }")
  h3 Filters
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
  h5 Outcome
  label.db
    input.mr1(type="radio" v-model="filters.outcome" value="all" :disabled="!enabled")
    | All
  label.db
    input.mr1(type="radio" v-model="filters.outcome" value="success" :disabled="!enabled")
    | Successes
  label.db
    input.mr1(type="radio" v-model="filters.outcome" value="failure" :disabled="!enabled")
    | Failures

  h4.mb1 Visualisation
  label.mb2.db
    span Color by
    select(v-model="filters.colorVis" :disabled="!enabled")
      option(value="year") Year
      option(value="month") Month
      option(value="weekday") Day of the week
      option(value="experienceMax") Hasher's previous expeditions
      option(value="experienceDaysMax") Hasher's years of experience

  label.db
    input#filter-by-participants.mr1(type="checkbox" v-model="filters.scaleExpedition" :disabled="!enabled")
    span Scale by expedition size

  label.db
    input.mr1(type="checkbox" v-model="filters.showStreaks" :disabled="!enabled")
    span Show streaks

  label.db.ml3(v-if="filters.showStreaks")
    span Minimum streak length
    input.w3(type="number" v-model.number="filters.minStreakLength" min="2" size="2" :disabled="!enabled")
  label.db.ml3(v-if="filters.showStreaks")
    input.mr1(type="checkbox" v-model.number="filters.onlySuccessStreaks" :disabled="!enabled")
    span Only show 100% success treaks
    div(style="color: #888; font-size: 0.8em") Excludes success-streaks that have a fail before or after

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
            scaleExpedition: false,
            minYear: 2008,
            maxYear: 2022,
            outcome: 'all',
            colorVis: 'year',
            showStreaks: false,
            minStreakLength: 3,
            onlySuccessStreaks: true,
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

.container select,
.container input[type='checkbox'] {
    background: #333;
    color: #ddd;
    border: 1px solid #666;
}
.container input[type='text'],
.container input[type='number'] {
    -webkit-appearance: none;
    -moz-appearance: none;
    background: #333;
    color: #ddd;
    border: #666 solid 1px;
}
</style>
