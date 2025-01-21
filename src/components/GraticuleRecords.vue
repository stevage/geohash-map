<template lang="pug">
#GraticuleRecords.h4.overflow-y-scroll(style="margin-bottom:1em" v-if="info.participants")
  table
    tbody
        tr
            th.tl(style="min-width:150px") Participant
            th Successes
        tr(v-for="p of topParticipants")
            td {{ p[0] }}
            td {{ p[1] || 0}}  of {{ p[2] }}

</template>

<script lang="ts" t>
export default {
  props: ['info'],
  data: () => ({}),
  computed: {
    topParticipants() {
      if (!this.info.participants) return []
      return Object.entries(this.info.participants)
        .sort(
          ([participant1, count1], [participant2, count2]) =>
            (this.info.participantsSuccesses[participant2] || 0) * 100 +
            count2 -
            ((this.info.participantsSuccesses[participant1] || 0) * 100 + count1),
        )

        .map(([participant, count]) => [
          participant,
          this.info.participantsSuccesses[participant],
          count,
        ])
      // .slice(0, 10);
    },
  },
  created() {
    window.GraticuleRecords = this
  },
}
</script>

<style scoped></style>
