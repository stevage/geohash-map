<template lang="pug">
#AnimationControls
  h3 Animation
  .ma3.pa2.button.tc.br3.pointer(@click="toggleAnimation") {{ running ? 'Stop' : 'Start' }}
  .tc.f2(v-if="running && animationMonthISO") {{ animationMonthISO }}
</template>

<script lang="ts">
import { EventBus } from '@/EventBus'
export default {
  name: 'AnimationControls',
  data: () => ({
    running: false,
    animationMonthISO: '',
  }),
  created() {
    EventBus.$on(
      'animation-cycle',
      ({ animationMonthISO }: { animationMonthISO: string }) =>
        (this.animationMonthISO = animationMonthISO),
    )
    EventBus.$on('animation-ended', () => {
      console.log('not running')
      this.running = false
    })
  },
  methods: {
    async toggleAnimation() {
      this.running = !this.running
      console.log(this.running)
      await this.$nextTick()
      EventBus.$emit('animation-change', this.running)
    },
  },
}
</script>

<style scoped>
.button:hover {
  background: #555;
}
.button {
  border: 1px solid #666;
}
</style>
