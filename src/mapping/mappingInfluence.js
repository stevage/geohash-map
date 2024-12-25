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
async function computeInfluence({ map, filters }) {
    startTime = performance.now();
    const points = getExpeditionsNearViewport(map);
    for (let workerId = 0; workerId < workerCount; workerId++) {
        // const influenceWorker = new InfluenceWorker();

        if (influenceWorkers[workerId]) {
            console.log('terminate worker');
            influenceWorkers[workerId].terminate();
            influenceWorkers[workerId] = null;
        }
        influenceWorkers[workerId] = initWorker(map, workerId);

        console.log(influenceWorkers[workerId]);
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
                console.log('no clientRect');
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
            });
        } else {
            console.log('no worker');
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
        if (message?.data?.type === 'update-data') {
            console.log('update influence got data');
            map.U.setData('influence', message.data.data);
            updateStyle(map);
        } else if (message?.data?.type === 'update-canvas') {
            const id = message.data.workerId;
            // console.log('update influence got canvas', id);
            const canvas = document.createElement('canvas');
            canvas.width = message.data.clientRect.width;
            canvas.height = message.data.clientRect.height;
            // document.body.appendChild(canvas);

            // load canvas with imagebitmap

            const ctx = canvas.getContext('2d');
            ctx.drawImage(message.data.imageBitmap, 0, 0);
            message.data.imageBitmap.close();

            map.U.removeSource(`influence-canvas-${id}`);
            map.addSource(`influence-canvas-${id}`, {
                type: 'canvas',
                canvas: canvas,
                animate: false,
                // 4 corners of the bounds, clockwise from NW
                coordinates: [
                    // [message.data.bounds[0], message.data.bounds[3]],
                    // [message.data.bounds[2], message.data.bounds[3]],
                    // [message.data.bounds[2], message.data.bounds[1]],
                    // [message.data.bounds[0], message.data.bounds[1]],
                    [message.data.bounds[0], message.data.bounds[1]],
                    [message.data.bounds[2], message.data.bounds[1]],
                    [message.data.bounds[2], message.data.bounds[3]],
                    [message.data.bounds[0], message.data.bounds[3]],
                ],
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
        } else if (message?.data?.type === 'finish-canvas') {
            console.log('finish canvas', message.data.workerId);
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

function updateStyle(map) {
    const fillColor = colorFunc({ colorVis: 'participants' });
    fillColor[1] = ['get', 'influencer'];
    map.U.addFillLayer('influence-fill', 'influence', {
        fillColor,
        fillOpacity: 0.5,
        fillOutlineColor: 'transparent',
    });
}
export function updateInfluenceStyle({ map, filters }) {
    if (map.getZoom() < 5) {
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
    computeInfluence({ map, filters });
}
