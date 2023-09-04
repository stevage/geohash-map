<template lang="pug">
#GraticuleRecords.h4.overflow-y-scroll(style="margin-bottom:1em")
  table
    tr
      th.tl Top participants
      th Successes
      th Total
    tr(v-for="p of topParticipants")
      td {{ p[0] }}
      td {{ p[1] }}
      td {{ p[2] }}

</template>

<script>
export default {
    props: ['info'],
    data: () => ({}),
    computed: {
        topParticipants() {
            return Object.entries(this.info.participants)
                .sort(
                    ([participant1, count1], [participant2, count2]) =>
                        (this.info.participantsSuccesses[participant2] || 0) *
                            100 +
                        count2 -
                        ((this.info.participantsSuccesses[participant1] || 0) *
                            100 +
                            count1)
                )

                .map(([participant, count]) => [
                    participant,
                    this.info.participantsSuccesses[participant],
                    count,
                ]);
            // .slice(0, 10);
        },
    },
    created() {
        window.GraticuleRecords = this;
    },
};
</script>

<style scoped></style>
