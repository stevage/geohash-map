import {
    getExpeditionsNearViewport,
    getDB,
} from './expeditions/expeditionIndex';
import { colorFunc, legendColors } from './expeditions/colorFuncs';
import * as turf from '@turf/turf';
import InfluenceWorker from './worker/influenceWorker?worker';
import md5 from '@/md5';
window.md5 = md5;

const workerCount = 8;
const influenceWorkers = new Array(workerCount).fill(null);
let startTime;
function wrap(deg) {
    while (deg < -180) deg += 360;
    while (deg > 180) deg -= 360;
    return deg;
}

async function computeInfluence({ map, filters, ...options }) {
    startTime = performance.now();
    const points = getExpeditionsNearViewport(map);
    for (let workerId = 0; workerId < workerCount; workerId++) {
        // const influenceWorker = new InfluenceWorker();

        if (influenceWorkers[workerId]) {
            influenceWorkers[workerId].terminate();
            influenceWorkers[workerId] = null;
        }
        influenceWorkers[workerId] = initWorker(map, workerId);

        if (influenceWorkers[workerId]?.postMessage) {
            // influenceWorker.postMessage({
            //     type: 'update-expeditions',
            //     center: map.getCenter().toArray(),
            //     viewport: map.getBounds().toArray().flat(),
            //     ...(await getDB()).getData(),
            // });

            // canvas method
            const bounds = map.getBounds().toArray().flat();
            // divide bounds into 4 vertical strips
            const stripWidth = (bounds[2] - bounds[0]) / workerCount;
            bounds[0] = bounds[0] + stripWidth * workerId;
            bounds[2] = bounds[0] + stripWidth; // - 1;

            const clientRect = map.getCanvas().getClientRects()[0];
            if (!clientRect) {
                // sometimes we don't have a clientRect, immediately after resizing?
                window.setTimeout(() => {
                    computeInfluence({ map, filters });
                }, 100);
                return;
            }
            // do same for clientRect
            // clientRect.width = clientRect.width / workerCount;

            influenceWorkers[workerId].postMessage({
                type: 'update-influence-canvas',
                bounds,
                points,
                clientRect: {
                    width: Math.ceil(clientRect.width / workerCount),
                    height: clientRect.height,
                },
                workerId,
                ...options,
            });
        } else {
            console.log("Couldn't start worker");
        }
    }
    // return makeCells(map, points);
    // console.log('poitns', points);
}
function initWorker(map) {
    const influenceWorker = new Worker(
        new URL('./worker/influenceWorker.js', import.meta.url)
    );
    influenceWorker.onmessage = (message) => {
        if (message?.data?.type === 'update-canvas') {
            const id = message.data.workerId;
            console.log('update influence got canvas', message.data.bounds);
            const canvas = document.createElement('canvas');
            canvas.width = message.data.clientRect.width;
            canvas.height = message.data.clientRect.height;
            // document.body.appendChild(canvas);

            // load canvas with imagebitmap

            const ctx = canvas.getContext('2d');
            ctx.drawImage(message.data.imageBitmap, 0, 0);
            message.data.imageBitmap.close();

            map.U.removeSource(`influence-canvas-${id}`);
            const coordinates = [
                [message.data.bounds[0], message.data.bounds[1]],
                [message.data.bounds[2], message.data.bounds[1]],
                [message.data.bounds[2], message.data.bounds[3]],
                [message.data.bounds[0], message.data.bounds[3]],
            ];
            // console.log('adding influence canvas', id, coordinates);
            try {
                map.addSource(`influence-canvas-${id}`, {
                    type: 'canvas',
                    canvas: canvas,
                    animate: false,

                    coordinates,
                });
                map.U.addRasterLayer(
                    `influence-canvas-${id}`,
                    `influence-canvas-${id}`,
                    {
                        rasterFadeDuration: 0,
                        rasterOpacity: 0.75,
                    },
                    'expeditions-circles'
                );
            } catch (e) {
                // Mapbox doesn't seem to like rasters that cross the antimeridian
                // possibly a contributing factor is that our image is actually upside down and we're flipping it
                // console.error(e);
            }
        } else if (message?.data?.type === 'finish-canvas') {
            // console.log('finish canvas', message.data.workerId);
            influenceWorkers[message.data.workerId].terminate();

            influenceWorkers[message.data.workerId] = null;
            const count = influenceWorkers.filter((w) => w).length;
            if (count === 0) {
                console.log(
                    `Influence canvas finished in ${
                        performance.now() - startTime
                    }ms`
                );
            }
        }
    };
    return influenceWorker;
}

export function updateInfluenceStyle({ map, filters, show, ...options }) {
    for (let workerId = 0; workerId < workerCount; workerId++) {
        if (influenceWorkers[workerId]) {
            influenceWorkers[workerId].terminate();
            influenceWorkers[workerId] = null;
        }
    }

    if (map.getZoom() < 3 || !show) {
        if (map.getSource('influence')) {
            map.U.removeLayer('influence-fill');
            map.U.removeSource('influence');
        }
        return;
    }
    if (!window.si) return;
    const first = !map.getSource('influence');

    if (first) map.U.addGeoJSON('influence');
    // updateStyle(map);
    computeInfluence({ map, filters, ...options });
}
