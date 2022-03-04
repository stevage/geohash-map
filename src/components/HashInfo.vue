<template lang="pug">
#HashInfo(v-if="hash").mt4
  | Coordinates for&nbsp;
  span.b {{ date }}
  table.mt3
    tr
      th Latitude
      th Longitude
    tr
      td {{ hash.east.lat }}
      td {{ hash.east.lng }}
</template>

<script>
import { EventBus } from '@/EventBus';
export default {
    name: 'HashInfo',
    data: () => ({ date: null, hash: null }),
    created() {
        window.HashInfo = this;
        EventBus.$on('geohash-loaded', ({ hash, date }) => {
            this.hash = hash;
            this.date = date;
        });
    },
};
</script>

<style scoped>
td,
th {
    padding: 5px;
}
th {
    font-weight: normal;
}
td {
    font-weight: bold;
}
</style>
