<template lang="pug">
#HashInfo(v-if="hashes").mt4
  div
    | Coordinates
    //- for&nbsp;
    //- span.b {{ hash.date }}
    span(v-if="isEast") {{' '}}(using 30W rule)
  table.mt3(style="font-size:12px")
    tr
      th
      th Lat.
      th Long.
    tr(v-for="hash in applicableHashes" :class="getStatus(hash).class")
      //- td Your location
      td {{hash.weekdayShort }} <wbr> {{ hash.date }}
      td {{ isEast ? hash.east.lat : hash.west.lat}}
      td {{ isEast ? hash.east.lng : hash.west.lng}}
      td {{ getStatus(hash).label }}
    tr.unpublished
      td {{ nextUnpublishedHashDate.toLocaleString('en-US', { weekday: 'short' }) + ' ' + nextUnpublishedHashDate.toString() }}
      td
      td
      td
        span(v-if="timeTillNextUnpublishedHash.days") Available in {{ durationString(timeTillNextUnpublishedHash) }}.
        span(v-else) Available in {{ timeTillNextUnpublishedHash.hours }} hrs, {{ timeTillNextUnpublishedHash.minutes }} mins.
  p Your local time is {{ localTime }} on {{ nowDateTime.toPlainDate().toLocaleString() }}.
  small You are {{ isEast ? 'East' : 'West' }} of -30º for the purpose of <a href="https://geohashing.site/geohashing/30W_Time_Zone_Rule">the 30W rule</a>.
  //- p The next time it's 9:30AM in New York City is in {{ nextDowOpening.hours }} hours and {{ nextDowOpening.minutes }} minutes.
  //- It's {{ nextDowOpening.isTomorrow ? 'tomorrow' : 'today' }}.
</template>

<script lang="ts">
import { EventBus } from '@/EventBus';
import { Geohash } from '@/mapping/mappingGeohashes';
import { Temporal } from 'temporal-polyfill';
// const nowString = window.app.overrideTime || new Date().toISOString();
window.z = window.z ?? {};
window.z.Temporal = Temporal;

function durationString(duration: Temporal.Duration): string {
    let s: string = '';
    if (duration.days) s += `${duration.days} days, `;
    s += `${duration.hours} hrs`;
    if (!duration.days) s += `, ${duration.minutes} minutes`;
    return s;
}
export default {
    name: 'HashInfo',
    data: () => ({
        date: null as string | null,
        hash: null as Geohash | null,
        hashes: null as Geohash[] | null,
        nowDateTime: Temporal.PlainDateTime.from(
            window.app.overrideTime ||
                Temporal.Now.zonedDateTimeISO().toPlainDateTime()
        ),
    }),
    created() {
        window.HashInfo = this;
        EventBus.$on(
            'geohash-loaded',
            ({
                hash,
                date,
                hashes,
            }: {
                hash: Geohash;
                date: string;
                hashes: Geohash[];
            }) => {
                this.hashes = hashes;
                this.hash = hash;
                this.date = date;
            }
        );
    },
    methods: {
        getStatus(hash: Geohash): { label: string; class: string } {
            const hashDate = Temporal.PlainDate.from(hash.date);
            const nowDate = Temporal.PlainDate.from(this.nowDateTime);
            const daysSinceStart = nowDate.since(hashDate).days;
            if (daysSinceStart > 0) {
                return { class: 'expired', label: 'Expired' };
            } else if (daysSinceStart < 0) {
                const startDiff = this.nowDateTime.since(hashDate);
                let timeSpec =
                    'in ' +
                    startDiff.negated().round('minute').toLocaleString();
                // if (daysSinceStart === -2) {
                //     timeSpec = 'tomorrow';
                if (daysSinceStart < -1) {
                    timeSpec = 'in ' + -daysSinceStart + ' days';
                }
                return { class: 'future', label: 'Activates ' + timeSpec };
            } else {
                const endDiff = this.nowDateTime.since(
                    hashDate.add({ days: 1 })
                );
                // debugger;
                const duration = endDiff.negated().round('minute');
                return {
                    class: 'active',
                    label: `Expires in ${durationString(duration)}`,
                };
                // return (
                //     'Expires in ' +
                //     -endDiff.hours +
                //     ' hours and ' +
                //     -endDiff.minutes +
                //     ' minutes'
                // );
            }
        },
    },
    computed: {
        timezone() {
            return (
                window.app.overrideTimezone ||
                Temporal.Now.zonedDateTimeISO().getTimeZone()
            );
        },
        timezoneOffset() {
            const zst = window.z.Temporal.Now.zonedDateTimeISO(this.timezone);
            return zst.offsetNanoseconds / 1e9 / 3600;
        },
        longitude() {
            return this.timezoneOffset * 15;
        },

        isEast() {
            return this.longitude > -30;
        },
        applicableHashes() {
            return this.hashes.filter((hash: Geohash) =>
                this.isEast ? hash.east : hash.west
            );
        },
        // return time object of the next time it's 9.30AM in New York City
        nextDowOpening() {
            const nyc = this.nowDateTimeZoned
                .withTimeZone('America/New_York')
                .withPlainTime({ hour: 9, minute: 30 });
            const here = this.nowDateTimeZoned;
            let diff = nyc.since(here);
            const isTomorrow = diff.hours < 0;
            if (isTomorrow) {
                diff = diff.add({ days: 1 });
            }
            return { hours: diff.hours, minutes: diff.minutes, isTomorrow };
        },
        localTime() {
            return this.nowDateTime.toPlainTime().toLocaleString();
        },
        nowDateTimeZoned() {
            return this.nowDateTime.toZonedDateTime(this.timezone);
        },
        nextUnpublishedHashDate() {
            if (!this.hashes) {
                return null;
            } else if (this.applicableHashes.length === 0) {
                return Temporal.PlainDate.from(this.nowDateTime);
            }
            const nextDate = Temporal.PlainDate.from(
                this.applicableHashes.slice(-1)[0].date
            ).add({ days: 1 });
            return nextDate;
        },
        timeTillNextUnpublishedHash() {
            const nextDate = Temporal.PlainDateTime.from(
                this.nextUnpublishedHashDate
            );
            const dowOpening = nextDate
                .subtract({ days: this.isEast ? 1 : 0 })
                .withPlainTime({ hour: 9, minute: 30 })
                .toZonedDateTime('America/New_York');
            const diff = dowOpening
                .since(this.nowDateTimeZoned)
                .round({ largestUnit: 'days' }); // cross-timezone comparisons don't return days
            return {
                days: diff.days,
                hours: diff.hours,
                minutes: diff.minutes,
                // isTomorrow: diff.hours < 0,
            };
        },
    },
};
</script>

<style scoped>
p {
    font-size: 12px;
}
td,
th {
    padding: 7px 4px;
}
th {
    font-weight: normal;
}
td {
    /* font-weight: bold; */
}

.expired {
    color: #999;
}

.unpublished {
    color: #999;
}

.active {
    color: hsl(120, 60%, 50%);
}
</style>
