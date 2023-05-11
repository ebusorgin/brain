
function convertToMatrix(arr, rows, cols) {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
        const row = [];
        for (let j = 0; j < cols; j++) {
            row.push(arr[i * cols + j]);
        }
        matrix.push(row);
    }
    return matrix;
}
export function matrixToArray(matrix) {
    return matrix.reduce((arr, row) => [...arr, ...row], []);
}
export  function tensorToImages(tensor) {
    // Преобразуем тензор в JavaScript-массив
    const array = tensor.arraySync();

    // Получаем количество каналов
    const numChannels = array[0][0][0].length;

    // Создаем массив для хранения изображений каждого канала
    let images = [];

    // Перебираем каждый канал
    for (let i = 0; i < numChannels; i++) {
        // Создаем изображение для текущего канала
        let image = array[0].map(row => row.map(pixel => pixel[i]));
        // Добавляем изображение в наш массив
        images.push(image);
    }

    // Возвращаем массив изображений
    return images;
}
export function mergeNestedArrays(arr1, arr2) {
    if (Array.isArray(arr1) && Array.isArray(arr2)) {
        return arr1.map((item, i) => {
            return mergeNestedArrays(item, arr2[i]);
        });
    } else {
        return [arr1, arr2];
    }
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
// callbacks: {
//     onEpochEnd: async (epoch, logs) => {
//         console.log(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
//     }
// }