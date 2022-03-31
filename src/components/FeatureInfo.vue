<template lang="pug">
#FeatureInfo.pa2(v-if="p")
    //- img.image(v-if="imageUrl" :src="imageUrl")
    h2.mt0.mb2 {{ p.success ? 'Successful' : 'Failed' }} expedition

    a.b(:href="`https://geohashing.site/geohashing/${p.id}`" target="_blank") {{ p.id }}
    div {{ p.graticuleName }}


    h4.mb2  Participants
    div(v-for="participant in JSON.parse(p.participants)")
        a(:href="`https://geohashing.site/geohashing/User:${participant}`") {{ participant }}

    //- h4.mb2 Experience
    //- div Years (most experienced): {{(p.experienceDaysMax / 365).toFixed(2) }}


    //- table#FeatureInfo(v-if="feature").bg-white.b--gray.ba.helvetica.ma1

    //-     tr(v-for="(value, prop) in p")
    //-         template(v-if="ignoreProps.indexOf(prop) === -1")
    //-             th.f6 {{ prop }}
    //-             td.f6 {{ value }}
</template>

<script>
import { EventBus } from '../EventBus';
export default {
    name: 'FeatureInfo',
    data: () => ({
        feature: undefined,
        ignoreProps: ['id', 'Longitude', 'Latitude', 'image_url'],
    }),
    computed: {
        p() {
            console.log(this.feature);
            return this.feature && this.feature.properties;
        },
        imageUrl() {
            return this.p && this.p.image_url;
        },
    },
    created() {
        window.app.FeatureInfo = this;
        EventBus.$on('select-feature', (feature) => (this.feature = feature));
    },
};
</script>

<style scoped>
#FeatureInfo {
    /* border: 1px solid black; */
    box-shadow: 0px 0px 4px 2px hsla(0, 0%, 0%, 0.3);
    border: 1px solid #111;
}

a {
    color: hsl(240, 50%, 70%);
    text-decoration: none;
}

#FeatureInfo th {
    text-align: right;
}

.image {
    width: 100%;
}

li {
    list-style-type: none;
}
</style>
