async function loadGeohashes(map) {
    const hashes = await fetch(
        'https://data.geohashing.info/hash/wk/2022/02/28.json'
    ).then((res) => res.json());
    console.log(hashes);
    const features = [];
    for (const lngSign of [-1, 1]) {
        for (const latSign of [-1, 1]) {
            for (let lng = 0; lng <= 180; lng++) {
                for (let lat = 0; lat <= 85; lat++) {
                    features.push({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [
                                lngSign * (lng + hashes[0].east.lng),
                                latSign * (lat + hashes[0].east.lat),
                            ],
                        },
                    });
                }
            }
        }
    }
    map.U.setData('geohashes', { type: 'FeatureCollection', features });
}

export function updateGeohashes(map) {
    const first = !map.getSource('geohashes');
    if (first) {
        map.U.addGeoJSON('geohashes');
        map.U.addCircle('geohashes-circle', 'geohashes', {
            minzoom: 6,
            visible: false,
            circleColor: 'black',
            circleStrokeColor: 'hsl(50, 90%, 80%)',
            circleStrokeWidth: [
                'interpolate',
                ['linear'],
                ['zoom'],
                7,
                1,
                14,
                5,
            ],
            circleRadius: ['interpolate', ['linear'], ['zoom'], 7, 2, 14, 5],
        });
        loadGeohashes(map);
    }
}
