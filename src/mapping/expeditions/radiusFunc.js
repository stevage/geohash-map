import U from 'map-gl-utils/noflow/index';
export function circleRadiusFunc({
    isGlow,
    isFlash,
    filters,
    isClickable,
} = {}) {
    const extra = isFlash ? 30 : isGlow ? 2 : isClickable ? 4 : 0;
    const getRadius = (r) =>
        ({
            none: ['+', r, extra],
            participantCount: [
                '+',
                [
                    '*',
                    //   ['sqrt', ['length', ['get', 'participants']]],
                    //   ['length', ['get', 'participants']],
                    //   ['^', ['length', ['get', 'participants']], 0.75],
                    ['log2', ['length', ['get', 'participants']]],
                    r,
                ],
                extra,
            ],
            reportKb: [
                '+',
                [
                    '*',
                    // ['+', 1, ['sqrt', ['get', 'reportKb']]],
                    ['*', 0.5, ['get', 'reportKb']],
                    //   ['sqrt', ['length', ['get', 'participants']]],
                    //   ['length', ['get', 'participants']],
                    //   ['^', ['length', ['get', 'participants']], 0.75],
                    // ['log2', ['length', ['get', 'participants']]],
                    r,
                ],
                extra,
            ],
            achievementCount: [
                '+',
                ['*', ['length', ['get', 'achievements']], r],
                extra,
            ],
            r,
        }[filters.scaleExpeditionsBy]);

    // new way
    return U.interpolateZoom({
        1: isFlash ? 5 : isGlow ? 0 : getRadius(1),
        3: isFlash ? 10 : isGlow ? getRadius(1) : getRadius(1),
        5: isFlash ? 15 : getRadius(2),
        8: getRadius(3),
        10: getRadius(4),
        12: isGlow ? getRadius(16) : getRadius(10),
    });
}
