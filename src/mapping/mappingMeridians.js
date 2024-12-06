import U from 'map-gl-utils/noflow/index';
export function updateMeridians({ map }) {
    const first = !map.getSource('meridians');
    if (first) {
        map.U.addGeoJSON('meridians');
        map.U.setData('meridians', {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [-180, 0],
                            [180, 0],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [0, 90],
                            [0, -90],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [180, 90],
                            [180, -90],
                        ],
                    },
                },
                {
                    type: 'Feature',
                    properties: { type: 'W30' },
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [-30, -90],
                            [-30, 90],
                        ],
                    },
                },
            ],
        });
        map.U.addLine('meridians-line', 'meridians', {
            lineColor: U.interpolateZoom({
                3: '#333',
                7: '#777',
            }),
            lineDasharray: [4, 8],
            filter: ['!=', 'type', 'W30'],
        });
        map.U.addLine('meridians-line-W30', 'meridians', {
            lineColor: U.interpolateZoom({
                3: '#335',
                7: '#559',
            }),
            lineDasharray: [2, 4],
            filter: ['==', 'type', 'W30'],
        });
        map.U.addSymbol('meridians-label', 'meridians', {
            textField: ['get', 'type'],
            // textFont: ['Arial Unicode MS Bold'],
            // textAnchor: 'left',
            textOffset: [0, -0.5],
            symbolPlacement: 'line',
            symbolSpacing: 500,
            // textSize: U.interpolateZoom({ 3: 12, 7: 24 }),
            textColor: U.interpolateZoom({
                3: '#335',
                7: '#559',
            }),
            minzoom: 8,
        });
    }
}
