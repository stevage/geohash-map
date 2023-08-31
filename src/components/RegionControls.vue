<template lang="pug">
#RegionControls
  h3 Regions
  label(for="region")
    input(type="checkbox" v-model="show")
    span  Show admin level 1 (LGAs, counties, etc.)

</template>

<script>
export default {
    data: () => ({
        show: false,
    }),
    created() {
        window.RegionControls = this;
    },
};
</script>

<style scoped></style>
