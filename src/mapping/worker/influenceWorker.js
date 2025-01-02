import { initFromData, getDB } from '../expeditions/expeditionIndex';
import * as turf from '@turf/turf';
import { report } from '@/util';
import md5 from '@/md5';
import { participantToColor } from '../expeditions/colorFuncs';
import CheapRuler from '@/lib/cheap-ruler/cheap-ruler';
const taskNo = 0;
let db;

function calculateCellWinner(
    x,
    y,
    points,
    { rangeCutoff, rangeCutoff2, numberCutoff }
) {
    const scores = {};
    let highestScore = 0,
        highestParticipant = '';
    const ruler = new CheapRuler(y, 'degrees');

    // const closestPoints = db.getNearestExpeditions([x, y], {
    //     maxResults: numberCutoff,
    //     // maxDistance: Infinity,
    //     maxDistance: rangeCutoff * 111,
    // });
    const totalScore = 0;
    let pointCount = 0;
    for (const point of points) {
        pointCount++;
        const d = ruler.distance2([x, y], point.geometry.coordinates) || 1e-7;
        // if (d > rangeCutoff) {
        //     continue;
        // }
        for (const participant of point.properties.participants) {
            if (!scores[participant]) {
                scores[participant] = 0;
            }
            scores[participant] += 1 / d;
            // totalScore += scores[participant];
            if (scores[participant] > highestScore) {
                highestScore = scores[participant];
                highestParticipant = participant;
            }
        }
        // this optimisation was meant to allow skipping scoring if we have a clear winner.
        // if (
        //     highestScore > 5000 &&
        //     highestScore / totalScore > 0.75 &&
        //     pointCount > 5
        // ) {
        //     // console.log('skip', highestScore, totalScore, scores);
        //     return [highestParticipant, 100000]; //highestScore];
        // }
    }
    return [highestParticipant, highestScore];
}

let canvas;
async function makeCanvas({
    points,
    bounds,
    clientRect,
    cellSize = 27,
    showFade = false,
    rangeCutoff = 15,
    fadeStrength = 2000,
    first = false,
    numberCutoff = 10,
    ...data
}) {
    // width in longitude degrees, to make each cell about 10 pixels wide
    const [cellsWide, cellsHigh] = [
        clientRect.width / cellSize,
        clientRect.height / cellSize,
    ];
    const [cellWidth, cellHeight] = [
        (bounds[2] - bounds[0]) / cellsWide,
        (bounds[3] - bounds[1]) / cellsHigh,
    ];
    if (!canvas) {
        canvas = new OffscreenCanvas(clientRect.width, clientRect.height);
    }
    const ctx = canvas.getContext('2d');
    // ctx.fillStyle = 'transparent';
    // ctx.fillRect(0, 0, canvas.width, canvas.height);
    let cols = 0;
    const rangeCutoff2 = rangeCutoff * rangeCutoff;
    for (let x = bounds[0]; x <= bounds[2]; x += cellWidth) {
        cols++;
        if (cols % 10 === 0) {
            await sendCanvas({ canvas, bounds, clientRect, ...data }, true);
        }
        let rows = 0;
        for (let y = bounds[1]; y < bounds[3]; y += cellHeight) {
            rows++;
            if (!first && cols % 3 === 1 && rows % 3 === 1) {
                // in theory we shouldn't have to draw the middle cell of each block of 9 because its color
                // would be the same as the larger block we already drew here but for some reason this is
                // producing artefacts
                // continue;
            }

            const [influencer, strength] = calculateCellWinner(
                x + cellWidth / 2,
                y + cellHeight / 2,
                points,
                {
                    rangeCutoff,
                    rangeCutoff2,
                    numberCutoff,
                }
            );
            const rect = [
                ((x - bounds[0]) / (bounds[2] - bounds[0])) * clientRect.width,
                ((y - bounds[1]) / (bounds[3] - bounds[1])) * clientRect.height,
                (cellWidth / (bounds[2] - bounds[0])) * clientRect.width,
                (cellHeight / (bounds[3] - bounds[1])) * clientRect.height,
            ];
            ctx.clearRect(...rect);
            if (!strength) {
                continue;
            }
            ctx.fillStyle = participantToColor(influencer);
            if (showFade && fadeStrength > 0) {
                ctx.globalAlpha = Math.min(1, strength / fadeStrength);
            }
            // console.log(strength);
            ctx.fillRect(...rect);
        }
    }

    // const canvas2 = canvas.transferControlToOffscreen();
    return {
        canvas: canvas,
        bounds,
        clientRect,
    };
}

async function sendCanvas(data, keep) {
    let imageBitmap;
    if (keep) {
        imageBitmap = await createImageBitmap(data.canvas);
    } else {
        imageBitmap = data.canvas.transferToImageBitmap();
    }
    self.postMessage(
        {
            type: 'update-canvas',
            bounds: data.bounds,
            clientRect: data.clientRect,
            workerId: data.workerId,
            imageBitmap,
        },
        { transfer: [imageBitmap] }
    );
}

self.onmessage = async (message) => {
    if (message?.data?.source === 'react-devtools-content-script') {
        return;
    }

    // console.log('Worker received message:', message.data);
    if (message.data.type === 'update-expeditions') {
        // not used
        initFromData(message.data);
        db = await getDB();
        console.log(db);

        // console.log(
        //     db.getExpeditionsNear(message.data.center, message.data.viewport)
        // );
    } else if (message.data.type === 'update-influence-canvas') {
        let data;
        initFromData(message.data.indexData);
        db = await getDB();

        // console.log('start work', message.data);
        const process = async (cellSize) => {
            data = {
                ...message.data,
                ...(await makeCanvas({ ...message.data, cellSize, first })),
            };

            sendCanvas(data, true);
            first = false;
        };
        let first = true;
        // await process(81);
        await process(27);
        await process(9);
        await process(3);
        await process(1);
        self.postMessage({
            type: 'finish-canvas',
            workerId: message.data.workerId,
        });
    }
};
