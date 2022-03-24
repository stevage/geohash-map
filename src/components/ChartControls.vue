<template lang="pug">
#ChartControls
  h3 Chart controls
  label
    input.mr2(type="checkbox" v-model="options.showChart")
    | Show chart
</template>

<script>
import { EventBus } from '@/EventBus';
EventBus.$emit('');
export default {
    name: 'ChartControls',
    data: () => ({ options: { showChart: false } }),
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

<style scoped>
</style>
