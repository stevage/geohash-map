declare module 'map-gl-utils/dist/index.esm.js' {
  export * from 'map-gl-utils/dist/types/index.d.ts'
}

declare module 'vue' {
  import { CompatVue } from 'vue'
  const Vue: CompatVue
  export default Vue
  export * from '@vue/runtime-dom'
  const { configureCompat } = Vue
  export { configureCompat }
}

export type Filters = {
  participants: string
  minParticipants: number
  maxParticipants: number
  // scaleExpedition: boolean;
  scaleExpeditionsBy: string
  minYear: number
  maxYear: number
  outcome: string
  dayOfWeek: string
  colorVis: string
  showStreaks: boolean
  minStreakLength: number
  onlySuccessStreaks: boolean
}
