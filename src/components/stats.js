import { dateToDays, daysToDate } from './util';

function computeDryStreaks({ filter } = { filter: () => true }) {
    // calculate each participant's longest dry streak: the time between expeditions
    const participants = {};

    function endStreak(p, days) {
        if (
            days - participants[p].currentStart >
            participants[p].longestLength
        ) {
            participants[p].longestLength = days - participants[p].currentStart;
            participants[p].longestStart = participants[p].currentStart;
            participants[p].longestStartDate = daysToDate(
                participants[p].currentStart
            );
        }
        participants[p].currentStart = days;
        // if (p === 'Felix_Dance') {
        //     console.log(
        //         `End streak: ${p} ${daysToDate(days)} ${daysToDate(
        //             participants[p].currentStart
        //         )} ${daysToDate(participants[p].longestStart)} ${
        //             participants[p].longestLength
        //         }`
        //     );
        // }
    }

    // const start = dateToDays('2008-05-21');
    const start = dateToDays('2009-01-01');

    for (const e of window.expeditions.features.filter(
        (p) => filter(p) && p.properties.year >= 2009
    )) {
        for (const p of e.properties.participants) {
            if (!participants[p]) {
                participants[p] = {
                    participant: p,
                    longestStart: start,
                    currentStart: start,
                    longestLength: 0,
                };
            }
            endStreak(p, e.properties.days);
        }
    }
    for (const p of Object.keys(participants)) {
        endStreak(p, dateToDays(new Date()));
    }

    return Object.entries(participants)
        .filter((e) => e[1].longestLength)
        .sort((a, b) => b[1].longestLength - a[1].longestLength);
}
window.computeDryStreaks = computeDryStreaks;
window.computeDryStreaksSuccesses = () =>
    computeDryStreaks({
        filter: (e) => e.properties.success,
    });

/*
hevek: 1182 days
Geoffistopheles: 1164 days
NinjaBait: 1164 days
Yakamoz: 1106 days
Michael5000: 1008 days
Steingesicht: 992 days
Anthony: 974 days
Frogman: 945 days
NWoodruff: 940 days
Rincewind: 866 days
Crox: 857 days
Jevanyn: 830 days
Mampfred: 722 days
Benjw: 691 days
Sourcerer: 690 days
TheOneRing: 689 days
Danatar: 325 days
Jiml: 282 days
Thomcat: 240 days
Felix_Dance: 204 days"




*/
