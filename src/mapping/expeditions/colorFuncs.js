import { dateToDays, dateToWeekday } from '@//util';
import tableauColors from '@/mapping/tableauColors';
import { Expression } from 'mapgl-expression';
import md5 from '@/md5';
import dominanceColors from './dominanceColors';
let visibleParticipants;

const brewer12 = [
    '#a6cee3',
    '#1f78b4',
    '#b2df8a',
    '#33a02c',
    '#fb9a99',
    '#e31a1c',
    '#fdbf6f',
    '#ff7f00',
    '#cab2d6',
    '#6a3d9a',
    '#ffff99',
    '#b15928',
];
const brewer9 = [
    '#e41a1c',
    '#377eb8',
    '#4daf4a',
    '#984ea3',
    '#ff7f00',
    '#ffff33',
    '#a65628',
    '#f781bf',
    '#999999',
];
const transportModes = [
    'Boat/swim',
    'Walk',
    'Bicycle',
    'Public transport',
    'Beast of burden',
    'Hitch-hiking',
    'Other',
];

const hardships = [
    'One with nature',
    'Raptor attack',
    'Drowned rat',
    'Trail of blood',
    'Frozen',
    'Done with nature',
    'Trainwreck',
    'Other',
];

const colorFuncs = {};

colorFuncs.year = () => {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'days'],
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
};

colorFuncs.month = () => {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'month'],
        0,
        'hsl(0, 100%, 40%)',
        2,
        'hsl(60, 100%, 40%)',
        4,
        'hsl(120, 100%, 40%)',
        8,
        'hsl(240, 100%, 40%)',
        10,
        'hsl(310, 100%, 40%)',
        12,
        'hsl(0, 100%, 40%)',
    ];
    return ret;
};
colorFuncs.weekday = () => {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'weekday'],
        0,
        'hsl(390, 80%, 40%)',
        2,
        'hsl(240, 80%, 40%)',
        4,
        'hsl(180, 80%, 40%)',
        5,
        'hsl(120, 80%, 40%)',
        6,
        // 'hsl(60, 100%, 50%)', // saturday special
        'hsl(60, 80%, 40%)', // saturday not eye catching
        7,
        'hsl(30, 80%, 40%)',
    ];
    return ret;
};
colorFuncs.experienceMax = () => {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'experienceMax'],
        1,
        'hsl(200, 80%, 40%)',
        10,
        'hsl(280, 80%, 40%)',
        50,
        'red',
        100,
        'hsl(60,100%,50%)',
        250,
        'hsl(120, 100%, 70%)',
    ];
    return ret;
};
colorFuncs.experienceDaysMax = () => {
    const ret = [
        'interpolate-hcl',
        ['linear'],
        ['get', 'experienceDaysMax'],
        0,
        'hsl(200, 80%, 40%)',
        365,
        'hsl(280, 80%, 40%)',
        365 * 2,
        'red',
        365 * 5,
        'hsl(60,100%,50%)',
        365 * 10,
        'hsl(120, 100%, 70%)',
        365 * 20,
        'hsl(120, 100%, 70%)',
    ];
    // console.log(ret);
    return ret;
};

// this is supposed to match https://github.com/keisentraut/geohashing-dominance/blob/main/colors.py
// but apparently doesn't. very hard to debug. so we use https://nr47.hohenpoelz.de/geohashing/colors.txt
function participantDominanceColor(participantName) {
    return participantName === 'Multiple'
        ? 'hsl(120,100%,30%)'
        : dominanceColors[participantName]
        ? `${dominanceColors[participantName]}`
        : `black`;
    /*
    const HARD_COLORS = {
        Multiple: (0, 255, 0), // my thing
        Klaus: (255, 0, 0),
        Fippe: (0, 255, 0),
        GeorgDerReisende: (0, 0, 255),
    };
    if (HARD_COLORS[participant]) return `rgb(${HARD_COLORS[participant]})`;
    let r = 0,
        g = 0,
        b = 0;
    let digest = md5(participant);
    let color = '';
    while (!color) {
        // original uses md5.digest (array of bytes), hopefully it's the same if take pairs of hex digits
        r = parseInt(digest.slice(0, 2), 16);
        g = parseInt(digest.slice(2, 4), 16);
        b = parseInt(digest.slice(4, 6), 16);
        if (r + g + b < 256 && r + g + b < 512) {
            return `rgb(${r},${g},${b})`;
        }
        digest = md5(digest);
    }
    return color;
    */
}

colorFuncs.participants = () => {
    // TODO cache this result because it's slow to compute and a few things use this result
    // const expeditions = window.map.queryRenderedFeatures({ layers: ['expeditions-circles']});

    const bounds = map.getBounds();
    const visibleExpeditions = window.expeditions.features.filter((f) =>
        bounds.contains(f.geometry.coordinates)
    );
    const participants = {};
    for (const f of visibleExpeditions) {
        // focus on the 1-or-multiple use case
        if (f.properties.participantsCount === 1) {
            for (const p of f.properties.participants) {
                if (!participants[p]) {
                    participants[p] = {
                        expeditions: 0,
                    };
                }
                participants[p].expeditions++;
            }
        }
    }
    const participantsList = [
        { name: 'Multiple' },
        ...Object.entries(participants)
            .map(([name, props]) => ({ name, ...props }))
            .sort((a, b) => b.expeditions - a.expeditions),
    ];

    const scheme = [[0, 255, 0], ...tableauColors[3]];
    visibleParticipants = participantsList.slice(0, scheme.length);
    // visibleParticipants = participantsList.slice(0, 80);
    const ret = [
        'match',
        ['get', 'participantsOrMultiple'],
        ...visibleParticipants.flatMap((participant, i) => [
            participant.name,
            `rgb(${scheme[i]})`,
            // participantDominanceColor(participant.name),
        ]),
        'black',
    ];
    console.log(ret);
    return ret;
};
colorFuncs.transportMode = () => {
    console.log(tableauColors);
    // const cols = [
    //     tableauColors[0][0],
    //     tableauColors[0][1],
    //     tableauColors[0][2],
    //     tableauColors[0][4],
    //     tableauColors[0][5],
    //     tableauColors[0][6],
    // ];
    const cols = [...brewer9, 'grey'];

    const ret = [
        'match',
        ['get', 'transportMode'],
        ...transportModes.flatMap((mode, i) => [mode, cols[i]]),
        'black',
    ];
    return ret;
};
colorFuncs.hardship = () => {
    const cols = [
        ...brewer9.slice(0, hardships.length - 1),
        'hsla(0,0%,50%,0.3)',
    ];

    const ret = [
        'match',
        ['get', 'hardship'],
        ...hardships.flatMap((mode, i) => [mode, cols[i]]),
        'black',
    ];
    return ret;
};

export function colorFunc({ colorVis }) {
    console.log('colorVis', colorVis, colorFuncs[colorVis]);
    return colorFuncs[colorVis]();
}

export function legendColors(filters, activeColorFunc) {
    const vals = [];
    const feature = (properties) => ({
        type: 'Feature',
        properties,
        geometry: null,
    });
    if (filters.colorVis === 'experienceMax') {
        for (let experienceMax of [1, 5, 10, 20, 50, 100, 250]) {
            const color = Expression.parse(activeColorFunc).evaluate(
                feature({
                    experienceMax,
                })
            );
            vals.push([experienceMax, color]);
        }
    } else if (filters.colorVis === 'experienceDaysMax') {
        for (let experienceYearsMax of [0, 1, 2, 5, 10]) {
            const color = Expression.parse(activeColorFunc).evaluate({
                type: 'Feature',
                properties: {
                    experienceDaysMax: experienceYearsMax * 365,
                },
                geometry: null,
            });
            vals.push([experienceYearsMax, color]);
        }
    } else if (filters.colorVis === 'year') {
        for (let year = 2008; year <= new Date().getUTCFullYear(); year++) {
            const color = Expression.parse(activeColorFunc).evaluate({
                type: 'Feature',
                properties: {
                    year,
                    days: dateToDays(year),
                },
                geometry: null,
            });
            vals.push([year, color]);
        }
    } else if (filters.colorVis === 'month') {
        for (let month = 12; month >= 1; month--) {
            const color = Expression.parse(activeColorFunc).evaluate({
                type: 'Feature',
                properties: {
                    month,
                },
                geometry: null,
            });
            const monthName =
                'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[
                    month - 1
                ];
            vals.push([monthName, color]);
        }
    } else if (filters.colorVis === 'weekday') {
        for (let weekday = 6; weekday >= 0; weekday--) {
            const color = Expression.parse(activeColorFunc).evaluate({
                type: 'Feature',
                properties: {
                    weekday,
                },
                geometry: null,
            });
            const weekdayName = 'Sun Mon Tue Wed Thu Fri Sat'.split(' ')[
                weekday
            ];
            vals.push([weekdayName, color]);
        }
    } else if (filters.colorVis === 'participants') {
        for (const participant of visibleParticipants) {
            const color = Expression.parse(activeColorFunc).evaluate(
                feature({
                    participantsOrMultiple: participant.name,
                })
            );
            vals.push([participant.name, color]);
        }
        vals.push(['Other', 'black']); // TODO don't hardcode black

        vals.reverse();
    } else if (filters.colorVis === 'transportMode') {
        for (const transportMode of transportModes) {
            const color = Expression.parse(activeColorFunc).evaluate(
                feature({
                    transportMode,
                })
            );
            vals.push([transportMode, color]);
        }

        vals.reverse();
    } else if (filters.colorVis === 'hardship') {
        for (const hardship of hardships) {
            const color = Expression.parse(activeColorFunc).evaluate(
                feature({
                    hardship,
                })
            );
            vals.push([hardship, color]);
        }

        vals.reverse();
    } else {
        throw 'unknown colorVis' + filters.colorVis;
    }
    return vals;
}
