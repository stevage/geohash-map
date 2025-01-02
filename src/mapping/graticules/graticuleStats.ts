import { string0 } from '@/util';
import { dateToDays } from '@/util';
import type { Expedition } from '@/mapping/expeditions/expeditionIndex';

export type GraticuleStat = {
    expeditions: number;
    successes: number;
    failures: number;
    history: string;
    id?: string;
    firstParticipants?: string;
    firstParticipantsOrMultiple?: string;
    firstSuccessDate?: string;
    lastParticipants?: string;
    lastParticipantsOrMultiple?: string;
    firstExpeditionDays?: number;
    lastExpeditionDays?: number;
    daysSinceExpedition?: number;
    participants?: { [key: string]: number };
    participantsSuccesses?: { [key: string]: number };
    totalParticipants?: number;
    mostSuccessfulParticipant?: string;
    mostSuccessfulParticipantCount?: number;
    mostSuccessfulParticipants?: string;
    mostSuccessfulParticipantsOrMultiple?: string;
    failuresBeforeSuccess?: number;
};
export function makeGraticuleStats({
    local,
    ...hashes
}: {
    local: boolean;
    [key: string]: any; // featurecollection
}) {
    let graticules = {} as {
        [x: string]: {
            [y: string]: GraticuleStat;
        };
    };

    if (local) {
        // avoid computing graticules twice
        // return;
    }
    graticules = {};

    let maxParticipants: number = 0;
    let maxParticipantsGraticule: string = '';

    const expeditionsByGraticule: Record<string, Expedition[]> = {};

    const graticulesById: Record<string, GraticuleStat> = {};
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
        expeditionsByGraticule[`${y},${x}`] =
            expeditionsByGraticule[`${y},${x}`] || [];

        expeditionsByGraticule[`${y},${x}`].push(expedition);
        const g = graticules[x][y];

        graticulesById[`${y},${x}`] = g;
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

        maxParticipants = Math.max(g.totalParticipants, maxParticipants);

        if (maxParticipants === g.totalParticipants) {
            maxParticipantsGraticule = `${x},${y}`;
        }
    }
    // TODO calculate most successful participant per graticule
    for (const [id, g] of Object.entries(graticulesById)) {
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

    // @ts-ignore
    window.graticulesById = graticulesById;
    // @ts-ignore
    window.expeditionsByGraticule = expeditionsByGraticule;
    // @ts-ignore
    window.maxParticipants = maxParticipants;
    // @ts-ignore
    window.maxParticipantsGraticule = maxParticipantsGraticule;

    return graticules;
}
