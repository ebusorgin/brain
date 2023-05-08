import * as tf from '@tensorflow/tfjs-node';

// Функция для проверки, находится ли точка в окружности
function getPointsInCircle(numPoints, max, radius, randomRatio) {
    const points1 = [];

    // Генерируем случайные координаты для центра окружности в диапазоне от -max до max
    const centerX = Math.floor(Math.random() * (max * 2 + 1)) - max;
    const centerY = Math.floor(Math.random() * (max * 2 + 1)) - max;

    // Генерируем точки внутри окружности
    const numCirclePoints = Math.round(numPoints * (1 - randomRatio));
    let count = 0;
    while (points1.length < numCirclePoints && count < numPoints * 10) {
        count++;
        let x, y;

        // Генерируем случайные координаты x и y в диапазоне от -max до max
        do {
            x = Math.floor(Math.random() * (max * 2 + 1)) - max;
            y = Math.floor(Math.random() * (max * 2 + 1)) - max;
        } while ((x - centerX) ** 2 + (y - centerY) ** 2 >= radius ** 2);

        points1.push({ x, y, isCircle: 1 });
    }

    // Генерируем случайные точки
    const numRandomPoints = Math.round(numPoints * randomRatio);
    for (let i = 0; i < numRandomPoints; i++) {
        let x, y;

        // Генерируем случайные координаты x и y в диапазоне от -max до max
        do {
            x = Math.floor(Math.random() * (max * 2 + 1)) - max;
            y = Math.floor(Math.random() * (max * 2 + 1)) - max;
        } while ((x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2);

        points1.push({ x, y, isCircle: 0 });
    }

    // Ограничиваем число точек
    const data = points1.slice(0, numPoints);
    const points = [];
    const labels = [];
    for (let i = 0; i < data.length; i++) {
        const x = data[i].x;
        const y = data[i].y;
        points.push([x, y]);
        labels.push([data[i].isCircle]);
    }

    return { points:shuffleArray(points), labels:shuffleArray(labels) };
}
function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export default async function loadData() {


    const trainData = getPointsInCircle(10, 1000, 5,0.5)
    const testData = getPointsInCircle(10, 1000, 5,0.2)
console.log(trainData)
    console.log("Train points size:", trainData.points.length);
    console.log("Train labels size:", trainData.labels.length);
    console.log("Test points size:", testData.points.length);
    console.log("Test labels size:", testData.labels.length);
    return {
        trainData: {
            xs: tf.tensor2d(trainData.points, [trainData.points.length, trainData.points[0].length]),
            ys: tf.tensor2d(trainData.labels, [trainData.points.length, trainData.labels[0].length]),
        },
        testData: {
            xs: tf.tensor2d(testData.points, [testData.points.length, testData.points[0].length]),
            ys: tf.tensor2d(testData.labels, [testData.points.length, testData.labels[0].length]),
        },
        inputShape: trainData.points[0].length,
        outputUnits: testData.labels[0].length,
    };

}
