<template lang="pug">
#DominanceControls
  label
    input(type="checkbox" v-model="show")
    span  Show dominance layer
  p(v-if="show") Dominance layer created by keisentraut.
    a(href="https://github.com/keisentraut/geohashing-dominance" target="_blank") Read more
</template>

<script>
export default {
    name: 'DominanceControls',
    data: () => ({ show: false }),
    created() {
        window.DominanceControls = this;
    },
    watch: {
        show() {
            window.map.U.toggle('dominance', this.show);
            if (this.show) {
                window.Filters.filters.colorVis = 'participants';
            }
        },
    },
};
</script>

<style scoped></style>
