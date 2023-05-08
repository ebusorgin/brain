import * as tf from '@tensorflow/tfjs-node';


function generateLineData(width, height, isVertical, intensity = 255, minLength = 2, maxLength = 8) {
    const data = new Array(width * height).fill(0);
    const linePosition = isVertical
        ? Math.floor(Math.random() * width)
        : Math.floor(Math.random() * height);
    const lineLength = Math.floor(Math.random() * (maxLength - minLength + 1) + minLength);
    const lineStart = Math.floor(Math.random() * (isVertical ? height : width - lineLength));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = y * width + x;

            if (
                isVertical &&
                x === linePosition &&
                y >= lineStart &&
                y < lineStart + lineLength
            ) {
                data[index] = intensity;
            } else if (
                !isVertical &&
                y === linePosition &&
                x >= lineStart &&
                x < lineStart + lineLength
            ) {
                data[index] = intensity;
            }
        }
    }

    return data;
}


const width = 10;
const height = 10;
const isVertical = true;

const lineData = generateLineData(width, height, isVertical);

console.log(lineData);
let jsonData = []
for (let i = 0; i < 1000; i++) {
    const lineData = generateLineData(10, 10, true)
    jsonData.push({
        pixels:lineData,
        label:1,
    })
}
for (let i = 0; i < 1000; i++) {
    const lineData = generateLineData(10, 10, false)
    jsonData.push({
        pixels:lineData,
        label:0,
    })
}
//
// Подготовка данных
const data = jsonData.map(sample => ({
    xs: tf.tensor(sample.pixels, [10, 10, 1]),
    ys: tf.oneHot(sample.label, 2)
}));

// Перемешиваем данные
tf.util.shuffle(data);

// Разделение данных на обучающую и тестовую выборки
const splitIndex = Math.floor(data.length * 0.8);
const trainData = data.slice(0, splitIndex);
const testData = data.slice(splitIndex);

// Создание модели
const model = tf.sequential();

model.add(tf.layers.conv2d({
    inputShape: [10, 10, 1],
    filters: 16,
    kernelSize: 3,
    strides: 1,
    activation: 'relu',
    kernelInitializer: 'varianceScaling'
}));

model.add(tf.layers.maxPooling2d({
    poolSize: [2, 2],
    strides: [2, 2]
}));

// model.add(tf.layers.batchNormalization());
model.add(tf.layers.flatten());
model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));

// Компиляция модели
model.compile({
    optimizer: 'adam',
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy']
});

// Обучение модели
async function trainModel() {
    const batchSize = 4;
    const epochs = 10;

    const trainDataset = tf.data.array(trainData).batch(batchSize);
    const testDataset = tf.data.array(testData).batch(batchSize);

    await model.fitDataset(trainDataset, {
        epochs,
        validationData: testDataset
    });
}

trainModel().then(() => {
    console.log('Training completed');

// Новые данные для предсказания

    for (let i = 0; i < 5; i++) {
        const newInput = generateLineData(10, 10, true)
        console.log('Prediction Ver:', predict(newInput));
    }
    for (let i = 0; i < 5; i++) {
        const newInput = generateLineData(10, 10, false)
        console.log('Prediction Gor:', predict(newInput));
    }

});
// Функция для предсказания
function predict(input) {
    // Преобразование входных данных в тензор
    const inputTensor = tf.tensor(input, [1, 10, 10, 1]);

    // Получение предсказания от модели
    const prediction = model.predict(inputTensor);

    // Возвращение результатов предсказания
    return prediction.arraySync();
}
function getRandomInt(min=0, max=10) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}