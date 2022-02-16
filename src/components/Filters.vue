<template lang="pug">
#Filters(:class="{ disabled: !enabled }")
  h3 Filters
  label
    div Participant name
    input#filter-by-participants.mr1(type="text" v-model="filters.participants" :disabled="!enabled")
  label
    div Minimum participants
    input#filter-by-participants.mr1(type="number" v-model.number="filters.minParticipants" min="1" :disabled="!enabled")
  label
    div Minimum year
    input#filter-by-participants.mr1(type="number" v-model.number="filters.minYear" min="2008" :max="filters.maxYear" :disabled="!enabled")
  label
    div Maximum year
    input#filter-by-participants.mr1(type="number" v-model.number="filters.maxYear" min="2008" max="2030" :disabled="!enabled")
  label
    input#filter-by-participants.mr1(type="checkbox" v-model="filters.scaleExpedition" :disabled="!enabled")
    span Scale by expedition size
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
    display: block;
    margin-bottom: 1em;
}

.disabled {
    opacity: 0.5;
    pointer-events: none;
    user-select: none;
}
</style>
