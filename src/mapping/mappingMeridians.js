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
            ],
        });
        map.U.addLine('meridians-line', 'meridians', {
            lineColor: U.interpolateZoom({
                3: '#333',
                7: '#777',
            }),
            lineDasharray: [4, 8],
        });
    }
}
