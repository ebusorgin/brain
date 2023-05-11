let penSize = ''
let canvasSize = 256
const socket = io();


$(document).ready(function () {
    const penSizeInput = document.getElementById('penSize');
    const canvasSizeInput = document.getElementById('canvasSize');
    penSize = penSizeInput.value;
    canvasSize = canvasSizeInput.value;
    const predictionsCanvas = document.getElementById('predictionsCanvas');
    const traningCanvas = document.getElementById('traningCanvas');
    predictionsCanvas.width = canvasSize;
    predictionsCanvas.height = canvasSize;
    traningCanvas.width = canvasSize;
    traningCanvas.height = canvasSize;
    const predictionsContext = predictionsCanvas.getContext('2d');
    const traningContext = predictionsCanvas.getContext('2d');
    predictionsContext.fillStyle = '#000000';
    traningContext.fillStyle = '#000000';
    predictionsContext.fillRect(0, 0, canvasSize, canvasSize);
    traningContext.fillRect(0, 0, canvasSize, canvasSize);

    let isDrawing = false;
    let lastX, lastY;



    penSizeInput.addEventListener('input', (e) => {
        penSize = e.target.value;
    });
    document.getElementById('colorPicker').addEventListener('input', (e) => {
        predictionsContext.strokeStyle = e.target.value;
    });
    document.getElementById('saveButton').addEventListener('click', (e) => {
       saveImage(predictionsContext)
    });

    predictionsCanvas.addEventListener('mousedown', (e) => {
        predictionsContext.strokeStyle = penSizeInput.value;
        if (predictionsContext.strokeStyle=='#000000'){predictionsContext.strokeStyle = '#ffffff'}
        if (e.button === 0) {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        }
    });
    predictionsCanvas.addEventListener('mousemove', (e) => {
        if (isDrawing) {
            const [x, y] = [e.offsetX, e.offsetY];
            drawCircle(x, y, penSize / 2, predictionsContext.strokeStyle,predictionsContext);
            lastX = x;
            lastY = y;
        }
    });
    predictionsCanvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });


















    function drawCircle(x, y, r, color,context) {
        context.beginPath();
        context.arc(x, y, r, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
    }




})


function saveImage(context){
    // Получаем массив пикселей из всего канваса
    const imageData = context.getImageData(0, 0, canvasSize, canvasSize);
    const pixels = imageData.data;
    // Размеры канваса
    const width = canvasSize;
    const height = canvasSize;

// Проходим по всем пикселям и выводим их значения в консоль
    const arr = []
    for (let i = 0; i < pixels.length; i += 4) {
        const red = pixels[i];
        const green = pixels[i + 1];
        const blue = pixels[i + 2];
        const alpha = pixels[i + 3];
        const average = (red + green + blue) / 3;
        arr.push(parseInt(average))
        // console.log(`Pixel at (${(i / 4) % width}, ${Math.floor(i / 4 / width)}) - R:${red} G:${green} B:${blue} A:${alpha}`);
    }
    socket.on('drawing', function (message) {
        console.log('drawing',message)

    })
    // socket.emit('prepareTestData',{data:arr})
    socket.emit('setData',{data:arr})
    console.log(JSON.stringify(arr))
}
function canvasToArray(){

}

function visualizeArray(array) {
    // Находим минимальное и максимальное значения в массиве
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array[i].length; j++) {
            for (let k = 0; k < array[i][j].length; k++) {
                for (let l = 0; l < array[i][j][k].length; l++) {
                    min = Math.min(min, array[i][j][k][l]);
                    max = Math.max(max, array[i][j][k][l]);
                }
            }
        }
    }

    // Создаем canvas для каждого фильтра
    for (let l = 0; l < array[0][0][0].length; l++) {
        let canvas = document.createElement('canvas');
        canvas.width = array.length;
        canvas.height = array[0].length;
        document.body.appendChild(canvas);

        let ctx = canvas.getContext('2d');

        // Визуализируем массив для каждого фильтра
        for (let i = 0; i < array.length; i++) {
            for (let j = 0; j < array[i].length; j++) {
                // Нормализуем значение и умножаем на 255 для получения оттенка серого
                let normalizedValue = (array[i][j][0][l] - min) / (max - min) * 255;
                let color = `rgb(${normalizedValue}, ${normalizedValue}, ${normalizedValue})`;

                // Рисуем пиксель
                ctx.fillStyle = color;
                ctx.fillRect(i, j, 1, 1);
            }
        }
    }
}

