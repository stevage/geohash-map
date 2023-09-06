import { dateToDays, dateToWeekday } from '@//util';
import { EventBus } from '@/EventBus';
import { makeIndex } from './expeditionIndex';
/* TODO:
- generate all these extra properties in a different dataset that doesn't have to go onto the map
*/

let loadedExpeditions;

// The data on fippe.de is actually a piece of JavaScript that needs to be parsed
async function expeditionsToGeoJSON() {
    const raw = await window
        .fetch('https://fippe.de/alldata.js')
        // .fetch('demo.js')
        .then((x) => x.text())
        .catch((e) => {
            console.error(e);
        });
    const lines = raw.split('\n').slice(1, -2);
    // remove trailing comma
    const vals = JSON.parse('[' + lines.join(' ').slice(0, -1) + ']');

    const points = {
        type: 'FeatureCollection',
        features: vals.map((val) => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [val[2], val[1]],
            },
            properties: {
                id: val[0],
                participants: val[3],
                success: val[4],
                reportKb: val[5],
                achievements: val[6],
            },
        })),
    };
    return points;
}
let expeditions;

export async function getExpeditions(local, map) {
    // this was needed when fippe.de didn't have CORS setup
    // const url = local
    //     ? 'alldata.json'
    //     : 'https://fippe-geojson.glitch.me/alldata.json';
    // const newExpeditions = await window.fetch(url).then((x) => x.json());

    const newExpeditions = await expeditionsToGeoJSON();
    await window.graticuleNamesP;

    if (loadedExpeditions && local) {
        // if non-cached data loads first for some reason, abort
        return expeditions;
    }
    expeditions = newExpeditions;
    const participants = {};
    expeditions.features.forEach((f, i) => {
        f.id = i;
        const [date, y, x] = f.properties.id.split('_');
        f.properties.year = +date.slice(0, 4);
        f.properties.days = dateToDays(f.properties.id.slice(0, 10));
        f.properties.month = +date.slice(5, 7);
        f.properties.yearMonth = f.properties.year * 12 + f.properties.month; //+date.slice(0, 7);
        f.properties.weekday = dateToWeekday(f.properties.id.slice(0, 10));
        f.properties.weekDayName =
            'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(
                ' '
            )[f.properties.weekday];
        // if (x !== undefined && y !== undefined) {
        // sigh globalexpeditions
        f.properties.dayOfYear =
            f.properties.days - dateToDays(f.properties.year + '');
        f.properties.x = +x || 0;
        f.properties.y = +y || 0;
        f.properties.global = /global/.test(f.properties.id);
        const gname = window.graticuleNamesHash[`${y},${x}`];
        f.properties.graticuleName = gname;
        f.properties.graticuleNameShort =
            gname && gname.match(/[a-z() ], [a-z]/i)
                ? gname.split(', ')[0]
                : gname;
        f.properties.graticuleCountry =
            gname && gname.match(/[a-z], [a-z]/i) ? gname.split(', ')[1] : '';

        if (f.properties.global) {
            f.properties.graticule = 'global';
        } else {
            f.properties.graticule = f.properties.id
                .slice(11)
                .replace('_', ',');
        }
        f.properties.latitude = f.geometry.coordinates[1];
        f.properties.longitude = f.geometry.coordinates[0];
        f.properties.graticuleLatitude = +f.properties.graticule.split(',')[0];
        f.properties.graticuleLongitude = +f.properties.graticule.split(',')[1];
        const achievements = f.properties.achievements || [];
        f.properties.transportMode = achievements.includes(
            'Water_geohash_achievement'
        )
            ? 'Boat/swim'
            : achievements.includes('Walk_geohash_achievement')
            ? 'Walk'
            : achievements.includes('Bicycle_geohash_achievement')
            ? 'Bicycle'
            : achievements.includes('Public_transport_geohash_achievement')
            ? 'Public transport'
            : achievements.includes('Beast_of_burden_geohash_achievement')
            ? 'Beast of burden'
            : achievements.includes('Thumbs_up_geohash_achievement')
            ? 'Hitch-hiking'
            : 'Other';

        f.properties.hardship = achievements.includes(
            'MNIMB_geohash_achievement'
        )
            ? 'MNIMB'
            : achievements.includes('Velociraptor_geohash_achievement')
            ? 'Raptor attack'
            : achievements.includes('Drowned_rat_geohash_achievement')
            ? 'Drowned rat'
            : achievements.includes('Trail_of_blood_consolation_prize')
            ? 'Trail of blood'
            : achievements.includes('MNB_geohash_consolation_prize')
            ? 'MNB'
            : achievements.includes('Train_wreck_geohash_consolation_prize')
            ? 'Trainwreck'
            : achievements.includes('Frozen_geohash_achievement')
            ? 'Frozen'
            : 'Other';
    });
    expeditions.features.sort((a, b) => a.properties.days - b.properties.days);
    for (const f of expeditions.features) {
        // }
        for (const p of f.properties.participants) {
            if (!participants[p]) {
                participants[p] = {
                    expeditions: 0,
                    firstExpeditionDays: f.properties.days,
                };
            }
            participants[p].expeditions++;
        }
        f.properties.participantsString = f.properties.participants.join(', ');
        f.properties.participantsOrMultiple =
            f.properties.participants.length > 1
                ? 'Multiple'
                : f.properties.participants[0] || 'Unknown';
        f.properties.participantsStringLower =
            f.properties.participantsString.toLowerCase();
        f.properties.participantsCount = f.properties.participants.length;
        const expeditions = f.properties.participants.map(
            (p) => participants[p].expeditions
        );
        f.properties.experienceMax = expeditions.length
            ? Math.max(...expeditions)
            : 0;
        f.properties.experienceMin = expeditions.length
            ? Math.min(...expeditions)
            : 0;
        f.properties.experienceTotal = expeditions.length
            ? expeditions.reduce((a, b) => a + b, 0)
            : 0;
        const days = f.properties.participants.map(
            (p) => f.properties.days - participants[p].firstExpeditionDays
        );
        f.properties.experienceDaysMax = days.length ? Math.max(...days) : 0;
        f.properties.experienceDaysMin = days.length ? Math.min(...days) : 0;
        f.properties.experienceDaysTotal = days.length
            ? days.reduce((a, b) => a + b, 0)
            : 0;
    }
    loadedExpeditions = true;
    window.setTimeout(() => makeIndex(expeditions.features), 1000);
    return expeditions;
}
