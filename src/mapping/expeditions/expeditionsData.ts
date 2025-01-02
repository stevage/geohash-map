import { dateToDays, dateToWeekday } from '@//util';
import { EventBus } from '@/EventBus';
import { initIndex } from './expeditionIndex';
import type { Expedition } from './expeditionIndex';
import type { FeatureCollection, Feature, Point } from 'geojson';
import type { mapU } from '@/util';
/* TODO:
- generate all these extra properties in a different dataset that doesn't have to go onto the map
*/

let loadedExpeditions: boolean;

// The data on fippe.de is actually a piece of JavaScript that needs to be parsed
async function expeditionsToGeoJSON(): Promise<FeatureCollection<Point>> {
    const raw =
        (await window
            .fetch('https://fippe.de/alldata.js')
            // .fetch('demo.js')
            .then((x) => x.text())
            .catch((e) => {
                console.error(e);
                return;
            })) || '';
    const lines = raw.split('\n').slice(1, -2);
    // remove trailing comma
    const vals = JSON.parse('[' + lines.join(' ').slice(0, -1) + ']') as [
        string,
        number,
        number,
        string[],
        boolean,
        number,
        string[]
    ][];

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
    } as FeatureCollection<Point>;
    return points;
}
let expeditions: FeatureCollection<Point>;

export async function getExpeditions(
    local: boolean
): Promise<FeatureCollection<Point>> {
    // this was needed when fippe.de didn't have CORS setup
    // const url = local
    //     ? 'alldata.json'
    //     : 'https://fippe-geojson.glitch.me/alldata.json';
    // const newExpeditions = await window.fetch(url).then((x) => x.json());

    const newExpeditions = await expeditionsToGeoJSON();
    // @ts-ignore
    await window.graticuleNamesP;

    if (loadedExpeditions && local) {
        // if non-cached data loads first for some reason, abort
        return expeditions;
    }
    expeditions = newExpeditions;
    const participants = {} as {
        [key: string]: { expeditions: number; firstExpeditionDays: number };
    };
    expeditions.features.forEach((f, i) => {
        f.id = i;
        // type is object with any properties
        const exp = f.properties as { [key: string]: any };
        const [date, y, x] = f.properties.id.split('_');
        exp.year = +date.slice(0, 4);
        exp.days = dateToDays(exp.id.slice(0, 10));
        exp.month = +date.slice(5, 7);
        exp.yearMonth = exp.year * 12 + exp.month; //+date.slice(0, 7);
        exp.weekday = dateToWeekday(exp.id.slice(0, 10));
        exp.weekDayName =
            'Sunday Monday Tuesday Wednesday Thursday Friday Saturday'.split(
                ' '
            )[exp.weekday];
        // if (x !== undefined && y !== undefined) {
        // sigh globalexpeditions
        exp.dayOfYear = exp.days - dateToDays(exp.year + '');
        exp.x = +x || 0;
        exp.y = +y || 0;
        exp.global = /global/.test(exp.id);

        // @ts-ignore
        const gname = window.graticuleNamesHash[`${y},${x}`];
        exp.graticuleName = gname;
        exp.graticuleNameShort =
            gname && gname.match(/[a-z() ], [a-z]/i)
                ? gname.split(', ')[0]
                : gname;
        exp.graticuleCountry =
            gname && gname.match(/[a-z], [a-z]/i) ? gname.split(', ')[1] : '';

        if (exp.global) {
            exp.graticule = 'global';
        } else {
            exp.graticule = exp.id.slice(11).replace('_', ',');
        }
        exp.latitude = f.geometry.coordinates[1];
        exp.longitude = f.geometry.coordinates[0];
        exp.graticuleLatitude = +exp.graticule.split(',')[0];
        exp.graticuleLongitude = +exp.graticule.split(',')[1];
        const achievements = exp.achievements || [];
        exp.transportMode = achievements.includes('Water_geohash_achievement')
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

        exp.hardship = achievements.includes(
            'One_with_Nature_geohash_achievement'
        )
            ? 'One with nature'
            : achievements.includes('Velociraptor_geohash_achievement')
            ? 'Raptor attack'
            : achievements.includes('Drowned_rat_geohash_achievement')
            ? 'Drowned rat'
            : achievements.includes('Trail_of_blood_consolation_prize')
            ? 'Trail of blood'
            : achievements.includes('Done_with_Nature_consolation_prize')
            ? 'Done with nature'
            : achievements.includes('Train_wreck_geohash_consolation_prize')
            ? 'Trainwreck'
            : achievements.includes('Frozen_geohash_achievement')
            ? 'Frozen'
            : 'Other';
    });
    expeditions.features.sort((a, b) => a.properties.days - b.properties.days);
    expeditions.features.forEach((f) => {
        const exp = f.properties;
        for (const p of exp.participants) {
            if (!participants[p]) {
                participants[p] = {
                    expeditions: 0,
                    firstExpeditionDays: exp.days,
                };
            }
            participants[p].expeditions++;
        }
        exp.participantsString = exp.participants.join(', ');
        exp.participantsOrMultiple =
            exp.participants.length > 1
                ? 'Multiple'
                : exp.participants[0] || 'Unknown';
        exp.participantsStringLower = exp.participantsString.toLowerCase();
        exp.participantsCount = exp.participants.length;
        const expeditions = exp.participants.map(
            (p: string) => participants[p].expeditions
        );
        exp.experienceMax = expeditions.length ? Math.max(...expeditions) : 0;
        exp.experienceMin = expeditions.length ? Math.min(...expeditions) : 0;
        exp.experienceTotal = expeditions.length
            ? expeditions.reduce((a: number, b: number) => a + b, 0)
            : 0;
        const days = exp.participants.map(
            (p: string) => exp.days - participants[p].firstExpeditionDays
        );
        exp.experienceDaysMax = days.length ? Math.max(...days) : 0;
        exp.experienceDaysMin = days.length ? Math.min(...days) : 0;
        exp.experienceDaysTotal = days.length
            ? days.reduce((a: number, b: number) => a + b, 0)
            : 0;
    });
    loadedExpeditions = true;
    window.setTimeout(() => initIndex(expeditions.features), 1000);
    return expeditions;
}
