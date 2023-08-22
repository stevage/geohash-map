import { string0 } from '@/util.js';
import { dateToDays } from '@/util';

export function makeGraticuleStats({ local, ...hashes }) {
    let graticules = {};

    if (local) {
        // avoid computing graticules twice
        // return;
    }
    graticules = {};
    window.maxParticipants = 0;
    window.expeditionsByGraticule = {};
    window.graticulesById = {};
    for (const expedition of hashes.features) {
        const x = string0(expedition.properties.x);
        const y = string0(expedition.properties.y);

        if (expedition.properties.global) {
            continue;
        }
        graticules[x] = graticules[x] || {};
        graticules[x][y] = graticules[x][y] || {
            expeditions: 0,
            successes: 0,
            failures: 0,
            history: '',
        };
        window.expeditionsByGraticule[`${y},${x}`] =
            window.expeditionsByGraticule[`${y},${x}`] || [];
        window.expeditionsByGraticule[`${y},${x}`].push(expedition);
        window.graticulesById[`${y},${x}`] = graticules[x][y];
        const g = graticules[x][y];
        g.id = `${y},${x}`;
        g.expeditions++;
        if (expedition.properties.success) {
            g.successes++;
            if (!g.firstParticipants) {
                g.firstParticipants =
                    expedition.properties.participants.join('\n');
                g.firstParticipantsOrMultiple =
                    expedition.properties.participants.length > 1
                        ? 'multiple'
                        : g.firstParticipants;
            }
            g.lastParticipants = expedition.properties.participants.join('\n');
            g.lastParticipantsOrMultiple =
                expedition.properties.participants.length > 1
                    ? 'multiple'
                    : g.lastParticipants;
            g.history += 'Y'; //'✅';
        } else {
            g.failures++;
            if (!g.successes) {
                g.failuresBeforeSuccess = g.failures;
            }
            g.history += '-'; //'❌';
        }
        g.firstExpeditionDays = Math.min(
            g.firstExpeditionDays || 0,
            expedition.properties.days
        );
        g.lastExpeditionDays = expedition.properties.days;
        g.daysSinceExpedition =
            dateToDays(new Date()) - expedition.properties.days;

        g.participants = g.participants || {};
        for (const p of expedition.properties.participants) {
            g.participants[p] = true;
        }
        g.totalParticipants = Object.keys(g.participants).length;

        window.maxParticipants = Math.max(
            g.totalParticipants,
            window.maxParticipants
        );
        if (window.maxParticipants === g.totalParticipants) {
            window.maxParticipantsGraticule = `${x},${y}`;
        }
    }
    return graticules;
}
