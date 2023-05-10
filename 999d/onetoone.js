import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import sharp from 'sharp';
const arrIMG1 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,231,252,248,202,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,219,244,219,244,252,250,244,248,239,82,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,231,248,244,219,138,0,82,202,248,252,219,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,202,244,244,202,0,0,0,0,0,0,0,202,231,138,0,0,0,0,0,0,0,0,0,0,0,0,0,138,244,244,138,0,0,0,0,0,0,0,0,0,202,202,0,0,0,0,0,0,0,0,0,0,0,0,138,239,239,138,0,0,0,0,0,0,0,0,0,0,138,219,176,0,0,0,0,0,0,0,0,0,0,0,231,248,176,0,0,0,0,0,0,0,0,0,0,0,0,219,219,0,0,0,0,0,0,0,0,0,0,138,239,219,0,0,0,0,0,0,0,0,0,0,0,0,0,219,219,0,0,0,0,0,0,0,0,0,0,231,239,82,0,0,0,0,0,0,0,0,0,0,0,0,0,231,231,0,0,0,0,0,0,0,0,0,0,244,244,0,0,0,0,0,0,0,0,0,0,0,0,0,0,231,231,0,0,0,0,0,0,0,0,0,0,239,239,0,0,0,0,0,0,0,0,0,0,0,0,0,0,239,239,0,0,0,0,0,0,0,0,0,0,176,231,176,0,0,0,0,0,0,0,0,0,0,0,0,138,239,219,0,0,0,0,0,0,0,0,0,0,0,202,239,176,0,0,0,0,0,0,0,0,0,0,0,239,244,82,0,0,0,0,0,0,0,0,0,0,0,82,219,231,138,0,0,0,0,0,0,0,0,0,0,248,248,0,0,0,0,0,0,0,0,0,0,0,0,0,82,176,219,202,82,0,0,0,0,0,0,0,176,239,202,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,219,202,202,138,0,0,0,0,138,239,219,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,176,231,231,202,176,82,82,239,244,138,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,202,202,202,219,248,250,202,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,202,244,219,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
const arrIMG2 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,202,239,202,244,253,248,219,82,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,239,244,239,202,244,253,250,248,219,82,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,202,248,248,202,0,0,0,0,82,202,239,231,138,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,250,250,138,0,0,0,0,0,0,0,176,231,219,138,0,0,0,0,0,0,0,0,0,0,0,0,0,239,252,202,0,0,0,0,0,0,0,0,0,82,219,239,176,0,0,0,0,0,0,0,0,0,0,0,176,244,219,0,0,0,0,0,0,0,0,0,0,0,138,239,231,82,0,0,0,0,0,0,0,0,0,0,244,244,0,0,0,0,0,0,0,0,0,0,0,0,0,138,244,231,0,0,0,0,0,0,0,0,0,0,250,250,0,0,0,0,0,0,0,0,0,0,0,0,0,0,231,248,176,0,0,0,0,0,0,0,0,0,250,250,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,244,239,0,0,0,0,0,0,0,0,0,248,248,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,239,239,0,0,0,0,0,0,0,0,0,248,248,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,231,231,0,0,0,0,0,0,0,0,0,248,248,0,0,0,0,0,0,0,0,0,0,0,0,0,0,202,239,176,0,0,0,0,0,0,0,0,0,219,244,176,0,0,0,0,0,0,0,0,0,0,0,0,0,244,244,0,0,0,0,0,0,0,0,0,0,82,231,239,138,0,0,0,0,0,0,0,0,0,0,0,0,244,244,0,0,0,0,0,0,0,0,0,0,0,138,219,219,138,0,0,0,0,0,0,0,0,0,0,0,248,248,0,0,0,0,0,0,0,0,0,0,0,0,82,202,219,176,82,0,0,0,0,0,0,0,176,231,250,239,0,0,0,0,0,0,0,0,0,0,0,0,0,82,176,219,219,239,250,244,219,202,202,202,219,231,219,138,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,138,202,239,250,244,219,202,202,202,138,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
const mIMG1 = arrayToMatrix(arrIMG1);
const mIMG2 = arrayToMatrix(arrIMG2);
let img1_28x28 = resize(mIMG1, 28);
let img2_28x28 = resize(mIMG2, 28);

const imgBuffer1 = fs.readFileSync('image1.jpg');
const imgBuffer2 = fs.readFileSync('image3.png');
const [img_1, img_2] = await Promise.all([
    sharp(imgBuffer1).png().toBuffer(),
    sharp(imgBuffer2).png().toBuffer()
]);
const [img1, img2] = await Promise.all([
    sharp(img_1).resize(224, 224).toBuffer(),
    sharp(img_2).resize(224, 224).toBuffer(),

]);

const img1Tensor = tf.node.decodeImage(img1, 4);
const img2Tensor = tf.node.decodeImage(img2, 4);

const model = tf.sequential({
    layers: [
        tf.layers.conv2d({ inputShape: [224, 224, 4], filters: 16, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }),
        tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
    ]
});


model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });


const inputTensor = tf.stack([img1Tensor, img2Tensor]);
const targetTensor = tf.tensor([[1], [0]]);
model.fit(inputTensor, targetTensor, { epochs: 10 }) .then(() => {



    const img1Features = model.predict(img1Tensor.expandDims());
    const img2Features = model.predict(img2Tensor.expandDims());
console.log(img1Features.arraySync())
console.log(img2Features.arraySync())

    const diff = tf.abs(tf.sub(img1Features, img2Features));

    const weights = diff.mean().dataSync();

    console.log(`Найдено ${weights.length} совпадений:`);
    console.log(weights);
    const filters = model.layers[0].getWeights()[0];
    // console.log(filters.arraySync()[0]);

});


// Функция для бикубической интерполяции
export function bicubicInterpolation(x, y, points) {
    let ret = 0
    function weight(x) {
        if (x <= 1) {
            ret =  1 - 2 * x * x + x * x * x;
        } else if (x <= 2) {
            ret= 4 - 8 * x + 5 * x * x - x * x * x;
        } else {
            ret= 0;
        }

        return ret
    }

    let total = 0;
    let weightSum = 0;
    for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 4; i++) {
            let w = weight(Math.abs(x - i)) * weight(Math.abs(y - j));

            if (points.length > 0 && points[j]) {
                let point = points[j][i];
                if (point !== undefined) {
                    total += point * w;
                    weightSum += w;
                }
            }
        }
    }
    const res =  total / weightSum
    return isNaN(res)?0:res
}


export function resize(filter, newSize) {
    let newFilter = [];
    let oldSize = filter.length;
    let ratio = oldSize / newSize;

    for (let i = 0; i < newSize; i++) {
        let row = [];
        for (let j = 0; j < newSize; j++) {
            let x = i * ratio;
            let y = j * ratio;

            let x1 = Math.floor(x) - 1;
            let y1 = Math.floor(y) - 1;
            let x2 = x1 + 2;
            let y2 = y1 + 2;

            // Обрабатывает краевые случаи, когда индексы выходят за границы массива
            x1 = Math.max(0, x1);
            y1 = Math.max(0, y1);
            x2 = Math.min(oldSize - 1, x2);
            y2 = Math.min(oldSize - 1, y2);

            // Получает 4x4 ближайшие точки
            let points = [];
            for (let a = y1; a <= y2; a++) {
                let rowPoints = [];
                for (let b = x1; b <= x2; b++) {
                    if (filter[a] && filter[a][b]) {
                        rowPoints.push(filter[a][b]);
                    }
                }
                if (rowPoints.length > 0) {
                    points.push(rowPoints);
                }
            }

            // Использует бикубическую интерполяцию для получения нового значения
            let newValue = bicubicInterpolation(x - x1, y - y1, points);

            row.push(newValue);
        }
        newFilter.push(row);
    }
    return newFilter;
}

export function arrayToMatrix(arr) {
    const length = arr.length;
    const sqrt = Math.sqrt(length);
    const size = Math.ceil(sqrt);

    const result = [];

    for (let i = 0; i < size; i++) {
        result.push(arr.slice(i * size, i * size + size));
    }

    return result;
}