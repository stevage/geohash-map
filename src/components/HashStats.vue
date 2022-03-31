<template lang="pug">
#HashStats
  h3.mb1 Stats
  .group
    label
        input.mr2(type="checkbox" v-model="showStats")
        | Show stats
    div(v-show="showStats && expeditions.length")
        //- div (Based on visible area)
        h3.mb1 Hashers in this area
        //- ol
        //-   li(v-for="hasher in topHashers.slice(0,5)") {{ hasher.name }} ({{ hasher.success }} + {{ hasher.fail }} = {{ hasher.success + hasher.fail }})
        table.mt3
            tr
                th.tl.pv2 Name
                th Success
                th Fail
                th Total
            tr(v-for="hasher in topHashers.slice(0,10)")
                td
                    a(:href="`https://geohashing.site/geohashing/User:${hasher.name}`") {{ hasher.name }}
                td {{ hasher.success }}
                td {{ hasher.fail }}
                td {{ hasher.success + hasher.fail }}

</template>

<script>
import { EventBus } from '@/EventBus';
export default {
    name: 'HashStats',
    data: () => ({ expeditions: [], showStats: false }),
    created() {
        window.HashStats = this;
        EventBus.$on('map-loaded', (map) =>
            map.on('moveend', () => this.update(map))
        );
    },
    methods: {
        update(map) {
            if (this.showStats) {
                this.expeditions = map.queryRenderedFeatures({
                    layers: ['expeditions-circles'],
                });
            }
        },
    },
    computed: {
        topHashers() {
            // if (this.expeditions.length > 1000) {
            //     return [];
            // }
            const hashers = {};
            for (const hash of this.expeditions) {
                for (const p of JSON.parse(hash.properties.participants)) {
                    hashers[p] = hashers[p] || { success: 0, fail: 0 };
                    hashers[p][hash.properties.success ? 'success' : 'fail']++;
                }
            }
            const hashList = Object.entries(hashers)
                .map(([name, props]) => ({ name, ...props }))
                .sort((a, b) => b.success - a.success);
            window.topHashers = hashList;
            return hashList;
        },
        newestHashers() {},
    },
    watch: {
        showStats() {
            if (this.showStats) {
                this.update(window.map);
            }
        },
    },
};
</script>

<style scoped>
#HashStats {
    background: #333;
}
table {
    font-size: 14px;
}

a,
a:visited {
    text-decoration: none;
    color: hsl(230, 40%, 70%);
}
a:hover {
    color: hsl(230, 40%, 80%);
}

th {
    font-weight: 550;
    color: #eee;
}
</style>
