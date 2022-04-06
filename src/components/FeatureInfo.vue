<template lang="pug">
#FeatureInfo.pa2(v-if="p")
    .relative
        .closebtn.pointer.absolute(@click="feature=null" style="top: -0.25em; right:-0.125em;") ×
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

    .story.h-5
        .content(v-html="story")
</template>

<script>
import { EventBus } from '../EventBus';
export default {
    name: 'FeatureInfo',
    data: () => ({
        feature: undefined,
        ignoreProps: ['id', 'Longitude', 'Latitude', 'image_url'],
        story: null,
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
    watch: {
        p() {
            this.story = null;
            if (this.p?.id) {
                fetch(
                    // `https://geohashing.site/api.php?action=parse&page=${this.p.id}&format=json`
                    `https://fippe-geojson.glitch.me/wiki/?action=parse&page=${this.p.id}&format=json`
                )
                    .then((res) => res.json())
                    .then((res) => {
                        this.story = res.parse.text['*']
                            .replace(
                                /\/geohashing\/File/g,
                                'https://geohashing.site/geohashing/File'
                            )
                            .replace(
                                /\/geohashing\/Image/g,
                                'https://geohashing.site/geohashing/Image'
                            )
                            .replace(
                                /"\/images\/thumb\//g,
                                '"https://geohashing.site/images/thumb/'
                            );
                    });
            }
        },
    },
};
</script>

<style scoped>
#FeatureInfo {
    /* border: 1px solid black; */
    box-shadow: 0px 0px 4px 2px hsla(0, 0%, 0%, 0.3);
    border: 1px solid #111;
}

#FeatureInfo th {
    text-align: right;
}

.closebtn {
    font-size: 30px;
}

.closebtn:hover {
    color: white;
    font-weight: bold;
}

.image {
    width: 100%;
}

li {
    list-style-type: none;
}

.story {
    overflow-y: scroll;
    height: 500px;
}
</style>
<style>
#FeatureInfo a {
    color: hsl(240, 50%, 70%);
    text-decoration: none;
}

.story .mw-parser-output table.infobox {
    display: none;
}

.story h2 {
    font-size: 14px;
    margin: 0;
}
.story h3,
.story h4 {
    font-size: 14px;
    margin: 0;
}

.story .mw-editsection {
    display: none;
}

.story p,
.story li,
.story {
    font-size: 12px;
}

.story p {
    margin-top: 0;
}

.story #toc {
    display: none;
}

.story {
    background: hsl(0, 0%, 15%);
    padding: 10px;
}

.story ul {
    list-style: none;
    padding: 0;
}

.story ul.gallery {
    list-style: none;
    padding: 0;
}

.story .gallerybox .thumb div {
    margin: 0 !important;
}

.story .gallerybox,
.story .gallerybox div {
    width: unset !important;
}
</style>
