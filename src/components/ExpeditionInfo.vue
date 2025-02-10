<template lang="pug">

#ExpeditionInfo.pa2(v-if="p")
    .relative
        .closebtn.pointer.absolute(@click="close" style="top: -0.25em; right:-0.125em;") ×
    //- img.image(v-if="imageUrl" :src="imageUrl")
    h3.mt0.mb2 {{ p.success ? 'Successful' : 'Failed' }} expedition

    a.b(:href="`https://geohashing.site/geohashing/${p.id}`" target="_blank") {{ p.id }}
    div {{ p.graticuleName }}


    h4.mb2  Participants
    div(v-for="participant in p.participants")
        a(:href="`https://geohashing.site/geohashing/User:${participant}`") {{ participant }}

    //- h4.mb2 Experience
    //- div Years (most experienced): {{(p.experienceDaysMax / 365).toFixed(2) }}


    //- table#ExpeditionInfo(v-if="feature").bg-white.b--gray.ba.helvetica.ma1

    //-     tr(v-for="(value, prop) in p")
    //-         template(v-if="ignoreProps.indexOf(prop) === -1")
    //-             th.f6 {{ prop }}
    //-             td.f6 {{ value }}

    .story-box.h-5
        WikiPage.story(:pageId="p?.id")

        .reportKb {{ p.reportKb }} kB
        h3 More expeditions
        ExpeditionNav(v-for="nav of navs" :nav="nav" @navigate="step => navigate(nav, step)")

</template>

<script lang="ts">
import { EventBus } from '../EventBus'
import ExpeditionNav from '@/components/ExpeditionNav.vue'
import WikiPage from '@/components/WikiPage.vue'
export default {
  name: 'ExpeditionInfo',
  components: { ExpeditionNav, WikiPage },
  data: () => ({
    feature: undefined,
    ignoreProps: ['id', 'Longitude', 'Latitude', 'image_url'],
  }),
  computed: {
    p() {
      console.log(this.feature)
      return (
        this.feature && {
          ...this.feature.properties,
          participants:
            typeof this.feature.properties.participants === 'string'
              ? JSON.parse(this.feature.properties.participants)
              : this.feature.properties.participants,
          // JSON.parse(
          //     this.feature.properties.participants
          // ),
        }
      )
    },
    imageUrl() {
      return this.p && this.p.image_url
    },
    navs() {
      if (!this.p) {
        return null
      }
      const ret = {
        anywhere: {
          title: 'Anywhere',
          expeditions: window.expeditions.features,
        },
        graticule: {
          title: this.p.graticuleNameShort,
          expeditions: window.expeditions.features.filter(
            (f) => f.properties.graticuleName === this.p.graticuleName,
          ),
        },
        date: {
          title: this.p.id.slice(0, 10),
          expeditions: window.expeditions.features.filter(
            (f) => f.properties.id.slice(0, 10) === this.p.id.slice(0, 10),
          ),
        },
      }
      for (const participant of this.p.participants) {
        ret[`user:${participant}`] = {
          title: participant,
          expeditions: window.expeditions.features.filter((f) =>
            f.properties.participants.includes(participant),
          ),
        }
      }
      for (const key in ret) {
        ret[key].index = ret[key].expeditions.findIndex((f) => f.properties.id === this.p.id)
        ret[key].count = ret[key].expeditions.length
      }
      return ret
    },
  },
  created() {
    window.app.ExpeditionInfo = this
    EventBus.$on('select-feature', (feature) => {
      this.feature = feature
      window.app.App.tab = 'expeditions'
    })
  },
  methods: {
    navigate({ expeditions, index }, step) {
      EventBus.$emit('navigate-expedition', expeditions[index + step])
    },
    close() {
      EventBus.$emit('select-feature')
    },
  },
}
</script>

<style scoped>
#ExpeditionInfo {
  /* border: 1px solid black; */
  box-shadow: 0px 0px 4px 2px hsla(0, 0%, 0%, 0.3);
  border: 1px solid #111;
}

#ExpeditionInfo th {
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
  margin-top: 1em;
}
</style>
<style>
#ExpeditionInfo a {
  color: hsl(220, 80%, 65%);
  text-decoration: none;
}
</style>
