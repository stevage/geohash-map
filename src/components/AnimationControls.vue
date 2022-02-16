<template lang="pug">
#AnimationControls
  h3 Animation
  button(@click="toggleAnimation") {{ running ? 'Stop' : 'Start' }}
  p(v-if="running && animationDay") {{ (new Date(8.64e7 * animationDay)).toISOString().slice(0,7) }}
</template>

<script>
import { EventBus } from '@/EventBus';
export default {
    name: 'AnimationControls',
    data: () => ({
        running: false,
        animationDay: '',
    }),
    created() {
        window.AnimationControls = this;
        EventBus.$on(
            'animation-cycle',
            ({ animationDay }) => (this.animationDay = animationDay)
        );
        EventBus.$on('animation-ended', () => {
            console.log('not running');
            this.running = false;
        });
    },
    methods: {
        async toggleAnimation() {
            this.running = !this.running;
            console.log(this.running);
            await this.$nextTick();
            EventBus.$emit('animation-change', this.running);
        },
    },
};
</script>

<style scoped>
</style>
