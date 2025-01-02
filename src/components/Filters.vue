<template lang="pug">
#Filters.mt4(:class="{ disabled: !enabled }")
  //- h3.mb2 Expeditions filter
  label.pointer.mb2.db(for="showfilters")
      input.mr2#showfilters(type="checkbox" v-model="showFilters" :disabled="!enabled")
      span Apply filter...
  .group

    div(v-if="showFilters")
      label.mb2
        span.mr2(title="Comma-separated list of participant names") Participant
        input.mr1(type="text" v-model="filters.participants" :disabled="!enabled")
      div.mt3.mb3
      label.mv2
        .dib.mr1 From
        input.mr1.w3.dib(type="number" size="2" v-model.number="filters.minParticipants" min="0" :disabled="!enabled")
      label.mv2
        .dib.mr1 to
        input.mr1.w3.dib(type="number" size="2" v-model.number="filters.maxParticipants" max="100" :disabled="!enabled")
        .dib participants
      label.mv2.dib
        div.dib Between
        input.w3.dib.mr1.ml1(type="number" v-model.number="filters.minYear" min="2008" :max="filters.maxYear" :disabled="!enabled")
      label.dib
        .dib and
        input.dib.w3.mr1.ml1(type="number" v-model.number="filters.maxYear" min="2008" max="2030" :disabled="!enabled")

      label.mv2.db
      select(v-model="filters.outcome" :disabled="!enabled")
        option(value="all") Successes and failures
        option(value="success") Successful expeditions
        option(value="failure") Failed expeditions
      label.mv2.db
      select(v-model="filters.dayOfWeek" :disabled="!enabled")
        option(value="all") Any day of the week
        option(value="Monday") Mondays
        option(value="Tuesday") Tuesdays
        option(value="Wednesday") Wednesdays
        option(value="Thursday") Thursdays
        option(value="Friday") Fridays
        option(value="Saturday") Saturdays
        option(value="Sunday") Sundays


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
        option(value="participantsFixed") Participant (fixed palette)
        option(value="transportMode") Transport mode
        option(value="hardship") Hardship

    label.db
      span Scale by
      select(v-model="filters.scaleExpeditionsBy" :disabled="!enabled")
        option(value="none") Don't scale
        option(value="participantCount") Number of participants
        option(value="reportKb") Report size
        option(value="achievementCount") Number of achievements
    label.mb2.db
      span Projection
      select(v-model="projection" :disabled="!enabled")
        option(value="mercator") Mercator cylindrical
        option(value="globe") Globe
        option(value="equirectangular") Equirectangular
        option(value="equalEarth") Equal Earth pseudocylindrical
        option(value="naturalEarth") Natural Earth pseudocylindrical
        option(value="albers") Albers equal-area conic
        option(value="lambertConformalConic") Lambert Conformal Conic
        option(value="winkelTripel") Winkel Tripel azimuthal

      //- input.mr1(type="checkbox" v-model="filters.scaleExpedition" :disabled="!enabled")
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
  //- h3.mb1 Graticules
  //- .group
  //-   label.db
  //-     input.mr1(type="checkbox" v-model="graticules.showGraticules" :disabled="!enabled")
  //-     span Show graticules
  //-   label.db(v-show="graticules.showGraticules")
  //-     input.mr1( type="checkbox" v-model="graticules.showGraticuleLabels" :disabled="!enabled")
  //-     span Show graticule labels
</template>

<script>
import { EventBus } from '@/EventBus';
import { getUrlParam, setUrlParam } from '@/util';
export default {
    name: 'Filters',
    data: () => ({
        enabled: true,
        showFilters: true,
        filters: {
            participants: getUrlParam('participants') || '',
            minParticipants: 0,
            maxParticipants: 100,
            // scaleExpedition: false,
            scaleExpeditionsBy: 'none',
            minYear: 2008,
            maxYear: new Date().getUTCFullYear(),
            outcome: 'all',
            dayOfWeek: 'all',
            colorVis: 'year',
            showStreaks: false,
            minStreakLength: 3,
            onlySuccessStreaks: true,
        },
        projection: 'mercator',
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
                setUrlParam('participants', this.filters.participants || null);
            },
        },

        projection() {
            console.log('projection change', this.projection);
            EventBus.$emit('projection-change', this.projection);
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
