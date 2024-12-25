import { initFromData, getDB } from '../expeditions/expeditionIndex';
import * as turf from '@turf/turf';
import { report } from '@/util';
import md5 from '@/md5';
import { participantToColor } from '../expeditions/colorFuncs';
let taskNo = 0;

function calculateCellWinner(x, y, points) {
    const scores = {};
    let highestScore = 0,
        highestParticipant;
    for (const point of points) {
        const d =
            // turf.distance(turf.point([x, y]), point, { units: 'kilometers' }) ||
            // 1e-7;
            (x - point.geometry.coordinates[0]) *
                (x - point.geometry.coordinates[0]) +
                (y - point.geometry.coordinates[1]) *
                    (y - point.geometry.coordinates[1]) || 1e-7;
        if (d > 15) {
            continue;
        }
        for (const participant of point.properties.participants) {
            if (!scores[participant]) {
                scores[participant] = 0;
            }
            // scores[participant] += 1 / (d * d);
            scores[participant] += 1 / d;
            if (scores[participant] > highestScore) {
                highestScore = scores[participant];
                highestParticipant = participant;
            }
        }
    }
    return [highestParticipant, highestScore];
}

async function sendCanvas(data, keep) {
    let imageBitmap;
    if (keep) {
        // imageBitmap = data.canvas.transferToImageBitmap();
        // data.canvas.getContext('2d').drawImage(imageBitmap, 0, 0);

        imageBitmap = await createImageBitmap(data.canvas);
        // console.log('keep', imageBitmap);
    } else {
        imageBitmap = data.canvas.transferToImageBitmap();
        // return;
    }
    // console.log('sendCanvas', data);
    self.postMessage(
        {
            // ...data,
            type: 'update-canvas',
            bounds: data.bounds,
            clientRect: data.clientRect,
            workerId: data.workerId,
            imageBitmap,
        },
        { transfer: [imageBitmap] }
    );
}
let canvas;
async function makeCanvas({
    points,
    bounds,
    clientRect,
    cellSize = 27,
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
    for (let x = bounds[0]; x <= bounds[2]; x += cellWidth) {
        cols++;
        if (cols % 10 === 0) {
            await sendCanvas({ canvas, bounds, clientRect, ...data }, true);
        }
        for (let y = bounds[1]; y < bounds[3]; y += cellHeight) {
            const [influencer, strength] = calculateCellWinner(
                x + cellWidth / 2,
                y + cellHeight / 2,
                points
            );
            const rect = [
                ((x - bounds[0]) / (bounds[2] - bounds[0])) * clientRect.width,
                ((y - bounds[1]) / (bounds[3] - bounds[1])) * clientRect.height,
                (cellWidth / (bounds[2] - bounds[0])) * clientRect.width,
                (cellHeight / (bounds[3] - bounds[1])) * clientRect.height,
            ];
            ctx.clearRect(...rect);
            ctx.fillStyle = participantToColor(influencer);
            ctx.globalAlpha = Math.min(1, strength / 2000);
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

self.onmessage = async (message) => {
    if (message?.data?.source === 'react-devtools-content-script') {
        return;
    }

    console.log('Worker received message:', message.data);
    if (message.data.type === 'update-expeditions') {
        initFromData(message.data);
        const db = await getDB();
        console.log(db);

        console.log(
            db.getExpeditionsNear(message.data.center, message.data.viewport)
        );
    } else if (message.data.type === 'update-influence-canvas') {
        let data;
        console.log('start work', message.data);
        const process = async (cellSize) => {
            data = {
                ...message.data,
                ...(await makeCanvas({ ...message.data, cellSize })),
            };

            sendCanvas(data, true);
        };
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
