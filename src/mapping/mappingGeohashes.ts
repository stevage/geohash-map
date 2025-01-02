import { EventBus } from '@/EventBus';
// @ts-ignore
import U from 'map-gl-utils/noflow/index';
import type { mapU } from '@/util';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { Feature, LineString, MultiLineString, Point } from 'geojson';

// return a number from 0 to 24, using current time UTC to work out the hour, ignoring actual timezones, daylight savings etc
function timeAtLongitude(longitude: number) {
    const date = new Date();
    const hours = date.getUTCHours() + (longitude / 360) * 24;
    return hours < 0 ? hours + 24 : hours;
}

function dateToDays(date: string | number | Date) {
    return Math.floor(new Date(date).getTime() / 1000 / 60 / 60 / 24);
}

function daysAtLongitude(longitude: number) {
    const date = new Date();
    const hours = (longitude / 360) * 24;

    date.setTime(date.getTime() + hours * 60 * 60 * 1000);
    return dateToDays(date);
}

async function loadGeohashes(map: mapU) {
    function makeHash(
        coordinates: number[],
        [graticuleX, graticuleY]: [number, number],
        date: Date,
        weekday: string
    ) {
        return {
            type: 'Feature',
            properties: {
                graticuleX,
                graticuleY,
                weekday,
            },
            geometry: {
                type: 'Point',
                coordinates,
            },
        };
    }
    // startDate is todays' date, minus one day
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    const [year, month, day] = startDate.toISOString().slice(0, 10).split('-');
    const hashes = await fetch(
        `https://data.geohashing.info/hash/wk/${year}/${month}/${day}.json`
    ).then((res) => res.json());

    console.log('hashes', hashes);
    const features = [];

    for (const hash of hashes) {
        const date = new Date(hash.date);
        const weekday = date.toLocaleString(navigator.language, {
            weekday: 'long',
        });
        for (const lngSign of [-1, 1]) {
            for (const latSign of [-1, 1]) {
                for (let lng = 0; lng <= 179; lng++) {
                    const whichHash =
                        lng < 30 || lngSign === 1 ? hash['east'] : hash['west'];
                    if (!whichHash) continue;

                    const daysAtLng = daysAtLongitude(lng * lngSign);
                    const daysAtHash = dateToDays(hash.date);
                    // don't show hashes that are already "yesterday" in local time
                    if (daysAtHash < daysAtLng) continue;
                    for (let lat = 0; lat <= 85; lat++) {
                        features.push(
                            makeHash(
                                [
                                    lngSign * (lng + whichHash?.lng),
                                    latSign * (lat + whichHash?.lat),
                                ],
                                [lngSign * lng, latSign * lat],
                                date,
                                weekday
                            )
                        );
                    }
                }
            }
        }
    }
    map.U.setData('geohashes', { type: 'FeatureCollection', features });
    EventBus.$emit('geohash-loaded', {
        hash: hashes.slice(-1)[0],
        date: `${year}-${month}-${day}`,
    });
}

async function makeHashRing(map: mapU) {
    if (map.getZoom() > 7) {
        // give hash a chance to be rendered
        await map.once('idle');
        const hashes = map.queryRenderedFeatures({
            // @ts-ignore
            layers: ['geohashes-circle'],
        }) as Feature<Point>[];
        if (hashes.length < 1) {
            return;
        }
        const hash = hashes.slice(-1)[0];
        const rings = [];
        for (const distance of [100, 200, 500, 1000, 2000, 5000, 10000]) {
            const ring = turf.circle(hash.geometry.coordinates, distance, {
                units: 'meters',
                properties: {
                    name: `${String(distance + 'm').replace('000m', 'km')}`,
                },
            });
            rings.push(ring);
        }
        map.U.setData('hashRing', {
            type: 'FeatureCollection',
            features: rings,
        });
        makeBushBash(map);
    }
}
let lastHash: Feature<Point>;
async function makeBushBash(map: mapU) {
    function reset() {
        map.U.setData('bushBash');
        lastHash = null;
    }
    if (map.getZoom() > 13) {
        // give hash a chance to be rendered
        // await map.once('idle');
        const hashes = map.queryRenderedFeatures({
            // @ts-ignore
            layers: ['geohashes-circle'],
        }) as Feature<Point>[];
        if (hashes.length < 1) {
            return reset();
        }
        if (
            lastHash &&
            lastHash.geometry.coordinates[0] ===
                hashes[0].geometry.coordinates[0] &&
            lastHash.geometry.coordinates[1] ===
                hashes[0].geometry.coordinates[1]
        ) {
            return;
        }
        lastHash = hashes.slice(-1)[0];

        const hash = hashes.slice(-1)[0];

        const roadIds = map
            .getStyle()
            .layers.map((l) => l.id)
            .filter((id) => id.match(/road/));

        const roads = turf.flatten(
            turf.featureCollection(
                map.queryRenderedFeatures({
                    // @ts-ignore
                    layers: roadIds,
                }) as Feature<LineString | MultiLineString>[]
            )
        ).features;

        type Road = Feature<LineString | MultiLineString>;
        const distances = roads
            .map((road) => {
                const d: [Road, number] = [
                    road,
                    turf.pointToLineDistance(hash, road),
                ];
                return d;
            })
            .sort((a: [Road, number], b: [Road, number]) => a[1] - b[1]);
        if (distances[0]) {
            const bushBashStart = turf.nearestPointOnLine(
                distances[0][0],
                hash
            );
            const bushBash = turf.lineString(
                [bushBashStart.geometry.coordinates, hash.geometry.coordinates],
                { distance: `${Math.round(1000 * distances[0][1])}m` }
            );
            map.U.setData('bushBash', bushBash);
        } else {
            lastHash = null;
            map.U.setData('bushBash');
        }
    }
}

export function updateGeohashes(map: mapU) {
    const first = !map.getSource('geohashes');
    if (first) {
        map.U.addGeoJSON('geohashes');
        map.U.addCircle('geohashes-circle', 'geohashes', {
            minzoom: 5,
            visibility: 'none',
            circleColor: 'black',
            circleStrokeColor: 'hsl(50, 90%, 80%)',

            circleStrokeWidth: U.interpolateZoom({ 7: 1, 14: 5 }),
            circleRadius: U.interpolateZoom({ 7: 2, 14: 5 }),
            circleOpacity: U.interpolateZoom({ 5: 0, 7: 1 }),
            circleStrokeOpacity: U.interpolateZoom({
                5: 0,
                7: 1,
            }),
        });
        map.U.addSymbol('geohashes-label', 'geohashes', {
            minzoom: 8,
            visibility: 'none',
            textField: ['get', 'weekday'],
            textAnchor: 'left',
            textOffset: [0.75, 0],
            textColor: 'hsl(50, 90%, 80%)',
        });

        map.U.addGeoJSON('hashRing');
        map.U.addLine('hashRing-underline', 'hashRing', {
            lineColor: 'hsl(50,30%,18%)',
        });
        map.U.addLine('hashRing-line', 'hashRing', {
            lineColor: 'hsl(50,50%,70%)',
            lineDasharray: [4, 50],
        });
        map.U.addSymbol('hashRing-label', 'hashRing', {
            textField: ['get', 'name'],
            symbolPlacement: 'line',
            symbolSpacing: 400,
            textColor: 'hsl(50,50%,70%)',
            textOffset: [0, -0.9],
            textSize: 12,
        });

        map.U.addGeoJSON('bushBash');
        map.U.addLine('bushBash-line', 'bushBash', {
            lineColor: 'hsl(50,50%,70%)',
            lineDasharray: [2, 2],
        });
        map.U.addSymbol('bushBash-label', 'bushBash', {
            textField: ['get', 'distance'],
            textColor: 'hsl(50,50%,70%)',
            textOffset: [0, 0.8],
            symbolPlacement: 'line',
        });

        loadGeohashes(map);
        map.on('moveend', () => makeHashRing(map));
        EventBus.$on('geohash-loaded', () => makeHashRing(map));
    }
    // @ts-ignore
    map.U.toggle(/hashRing|geohashes/, window.app.App.tab === 'geohash');

    const scale = new mapboxgl.ScaleControl();
    console.log(scale);
    EventBus.$on('tab-change', (tab: string) => {
        map.U.toggle(/hashRing|geohashes/, tab === 'geohash');
        if (tab === 'geohash') {
            console.log(scale, map);
            makeHashRing(map);
            map.addControl(scale);
        } else {
            try {
                map.removeControl(scale);
            } catch (e) {
                //
            }
        }
    });
}
