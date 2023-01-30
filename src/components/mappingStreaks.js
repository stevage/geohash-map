import { dateToDays } from './util';
import { EventBus } from '@/EventBus';
function makeStreaks(hashesFC) {
    const hashes = hashesFC.features;

    const threshold = 1;
    const streaks = [],
        currentStreaks = {};
    function cleanup(day) {
        Object.keys(currentStreaks).forEach((participant) => {
            const streak = currentStreaks[participant];
            if (streak.end + threshold < day) {
                if (streak.hashes.length > 1) {
                    streaks.push(streak);
                }
                delete currentStreaks[participant];
            }
        });
    }

    function makeStreaks() {
        let day = hashes[0].properties.days;
        for (const hash of hashes) {
            if (hash.properties.days !== day) {
                day = hash.properties.days;
                cleanup(day);
            }
            for (const participant of hash.properties.participants) {
                if (!currentStreaks[participant]) {
                    currentStreaks[participant] = {
                        start: day,
                        participant,
                        hashes: [],
                        allSuccesses: true,
                    };
                }
                const streak = currentStreaks[participant];
                streak.end = day;
                streak.hashes.push(hash);
                streak.allSuccesses =
                    streak.allSuccesses && hash.properties.success;
            }
        }
        cleanup(1e9);
        return streaks;
    }

    return {
        type: 'FeatureCollection',
        features: makeStreaks().map((streak) => ({
            type: 'Feature',
            properties: {
                participant: streak.participant,
                participantLower: streak.participant.toLowerCase(),
                start: streak.start,
                end: streak.end,
                hashes: streak.hashes.map((hash) => hash.id),
                length: streak.hashes.length,
                allSuccesses: streak.allSuccesses,
            },
            geometry: {
                type: 'LineString',
                coordinates: streak.hashes.map(
                    (hash) => hash.geometry.coordinates
                ),
            },
        })),
    };
}

function yearColorFunc() {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'start'],
        dateToDays(2008),
        'hsl(200, 80%, 40%)',
        dateToDays(2016),

        'red',
        dateToDays(2021),
        'hsl(60,100%,40%)',
        dateToDays(new Date().getUTCFullYear()),
        'hsl(120, 100%, 70%)',
    ];
    return ret;
}

export function updateStreakStyle({ map, filters }) {
    const first = !map.getSource('streaks');
    const filter = [
        'all',
        filters.showStreaks ? true : false,
        ['>=', ['get', 'length'], filters.minStreakLength],
        filters.participants || ''
            ? [
                  'in',
                  (filters.participants || '').replace(/ /g, '_').toLowerCase(),
                  ['get', 'participantLower'],
              ]
            : true,
        filters.onlySuccessStreaks ? ['get', 'allSuccesses'] : true,
    ];
    if (first) {
        map.U.addGeoJSON('streaks');

        map.U.addLine('streaks-under', 'streaks', {
            lineColor: '#333',
            // lineDasharray: [2, 2],
            lineOpacity: 0.9,
            lineWidth: ['interpolate', ['linear'], ['zoom'], 5, 3, 10, 6],
            filter,
        });
        map.U.addLine('streaks-line', 'streaks', {
            lineColor: yearColorFunc(),
            lineDasharray: [2, 2],
            lineOpacity: 0.5,
            lineWidth: ['interpolate', ['linear'], ['zoom'], 5, 1, 10, 3],
            filter,
        });
    } else {
        map.U.setFilter(/streaks-/, filter);
    }
}

EventBus.$on('hashes-loaded', (hashes) => {
    const streaks = makeStreaks(hashes);
    window.streaks = streaks;
    window.map.U.setData('streaks', streaks); // hello race condition
});
