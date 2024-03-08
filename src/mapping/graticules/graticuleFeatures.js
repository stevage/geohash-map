import { string0 } from '@/util';
import * as turf from '@turf/turf';
import humanizeDuration from 'humanize-duration';

export function makeGraticuleFeature(xstr, ystr, props) {
    const x = +xstr;
    const y = +ystr;
    const signx = xstr[0] === '-' ? -1 : 1;
    const signy = ystr[0] === '-' ? -1 : 1;

    return turf.polygon(
        [
            [
                [x, y],
                [x + signx, y],
                [x + signx, y + signy],
                [x, y + signy],
                [x, y],
            ],
        ],
        props
    );
}

const splitBy10 = (string) => string.match(/.{1,10}/g).join('\n');

export function makeGraticuleFeatures({ graticuleNames, graticuleStats, map }) {
    function getGraticuleStats(x, y) {
        return (
            graticuleStats[x]?.[y] || {
                expeditions: 0,
                successes: 0,
                failures: 0,
            }
        );
    }

    function graticuleLabelProps(
        xstr,
        ystr,
        { yxstr, name, nameShort, nameCountry, nameLong }
    ) {
        const x = +xstr,
            y = +ystr;

        const gstats = getGraticuleStats(xstr, ystr);
        const g = window.graticules[xstr] && window.graticules[xstr][ystr];

        return {
            type: 'graticule-center-label',
            x: xstr,
            y: ystr,
            nameShort: nameShort || yxstr,
            name: name || yxstr,
            nameCountry,
            nameLong,
            firstParticipants: g && g.firstParticipants,
            lastParticipants: g && g.lastParticipants,
            history: g && splitBy10(g.history),
            ...gstats,
            daysSinceExpedition:
                gstats.daysSinceExpedition !== undefined
                    ? humanizeDuration(gstats.daysSinceExpedition * 86400000, {
                          largest: 2,
                          round: true,
                      })
                    : '',
            ratio: gstats.expeditions
                ? Math.round((gstats.successes / gstats.expeditions) * 100) +
                  '%'
                : '',
        };
    }

    const normx = (x) => ((x + 540) % 360) - 180;
    const boundsNorm = map.getBounds().toArray().flat();

    boundsNorm[0] = normx(boundsNorm[0]);
    boundsNorm[2] = normx(boundsNorm[2]);

    function makeGraticules(signx, signy) {
        for (let ax = 0; ax <= 179; ax++) {
            for (let ay = 0; ay <= 89; ay++) {
                const x = ax * signx;
                const y = ay * signy;
                const xstr = string0(ax * signx);
                const ystr = string0(ay * signy);
                const yxstr = `${ystr},${xstr}`;
                const name = window.graticuleNamesHash[yxstr] || null;
                const gratProps = {
                    type: 'graticule',
                    x: xstr,
                    y: ystr,
                    name,
                    ...getGraticuleStats(xstr, ystr),
                };

                graticules.push(makeGraticuleFeature(xstr, ystr, gratProps));
                const labelX = x + (signx > 0 ? 0 : -1);
                const labelY = y + (signy > 0 ? 1 : 0);
                const names = {
                    nameShort:
                        (name && name.match(/[a-z], [a-z]/i)
                            ? name.split(', ')[0]
                            : name) || yxstr,
                    nameLong: name ? `${name} (${yxstr})` : yxstr,
                    nameCountry:
                        name && name.match(/[a-z], [a-z]/i)
                            ? name.split(', ')[1]
                            : '',
                    name: name || yxstr,
                };

                graticuleLabels.push(
                    turf.point([labelX, labelY], {
                        type: 'graticule-label',
                        x: xstr,
                        y: ystr,
                        ...names,
                    })
                );
                const labelCenterX = x + (signx > 0 ? 0.5 : -0.5);
                const labelCenterY = y + (signy > 0 ? 0.5 : -0.5);
                graticuleCenterLabels.push(
                    turf.point(
                        [labelCenterX, labelCenterY],
                        graticuleLabelProps(xstr, ystr, {
                            yxstr,
                            ...names,
                        })
                    )
                );
            }
        }
    }

    const graticules = [];
    const graticuleLabels = [];
    const graticuleCenterLabels = [];
    for (const signx of [-1, 1]) {
        for (const signy of [-1, 1]) {
            makeGraticules(signx, signy);
        }
    }

    const fc = {
        type: 'FeatureCollection',
        features: [...graticules, ...graticuleLabels, ...graticuleCenterLabels],
    };
    // console.log(fc.features.filter(length, 'graticules');
    window.app.graticules = fc;
    return fc;
}
