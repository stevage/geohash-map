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
        const [y, x] = expedition.properties.graticule.split(',');

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
        const g = graticules[x][y];
        window.graticulesById[`${y},${x}`] = g;
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
            if (!g.firstSuccessDate) {
                g.firstSuccessDate = expedition.properties.id.slice(0, 10);
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
        g.participantsSuccesses = g.participantsSuccesses || {};
        for (const p of expedition.properties.participants) {
            g.participants[p] = (g.participants[p] || 0) + 1;
            if (expedition.properties.success) {
                g.participantsSuccesses[p] =
                    (g.participantsSuccesses[p] || 0) + 1;
            }
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
    // TODO calculate most successful participant per graticule
    for (const [id, g] of Object.entries(window.graticulesById)) {
        const successes = Object.entries(g.participantsSuccesses);
        if (successes.length === 0) {
            // g.mostSuccessfulParticipant = 'none';
            g.mostSuccessfulParticipantCount = 0;
            g.mostSuccessfulParticipantsOrMultiple = 'none';
            continue;
        }
        g.mostSuccessfulParticipantCount = successes.sort(
            (a, b) => b[1] - a[1]
        )[0][1];
        g.mostSuccessfulParticipants = successes
            .filter(([p, count]) => count === g.mostSuccessfulParticipantCount)
            .map(([id, count]) => id)
            .join('\n');
        g.mostSuccessfulParticipantsOrMultiple =
            successes.filter(
                ([p, count]) => count === g.mostSuccessfulParticipantCount
            ).length > 1
                ? 'multiple'
                : successes.filter(
                      ([p, count]) => count === g.mostSuccessfulParticipantCount
                  )[0][0];
    }

    return graticules;
}
