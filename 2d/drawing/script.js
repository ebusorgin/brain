const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const saveButton = document.getElementById('saveButton');
const pixelSize = 20;

canvas.width = 10 * pixelSize;
canvas.height = 10 * pixelSize;

let drawing = false;
const colorPicker = document.getElementById('colorPicker');

colorPicker.addEventListener('input', () => {
    ctx.strokeStyle = colorPicker.value;
});
canvas.addEventListener('mousedown', (e) => {
    drawing = true;

    ctx.strokeStyle = colorPicker.value;
    ctx.beginPath();
    ctx.moveTo(Math.floor((e.clientX - canvas.offsetLeft) / pixelSize) * pixelSize, Math.floor((e.clientY - canvas.offsetTop) / pixelSize) * pixelSize);
});

canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    ctx.lineTo(Math.floor((e.clientX - canvas.offsetLeft) / pixelSize) * pixelSize, Math.floor((e.clientY - canvas.offsetTop) / pixelSize) * pixelSize);
    ctx.lineWidth = pixelSize;
    ctx.lineCap = 'square';
    ctx.stroke();
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});

saveButton.addEventListener('click', () => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelArray = [];

    for(let i = 0; i < imageData.data.length; i += 4) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];
        const grayscale = rgbToGrayscale(red, green, blue);

        pixelArray.push(grayscale);
    }

    // Если вам нужно уменьшить размер массива до 100 элементов
    const resizedPixelArray = [];
    const scaleFactor = Math.sqrt(pixelArray.length / 100);
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
            const index = Math.floor(y * scaleFactor) * canvas.width + Math.floor(x * scaleFactor);
            resizedPixelArray.push(parseInt(pixelArray[index]));
        }
    }

    console.log(JSON.stringify(resizedPixelArray));
});
function rgbToGrayscale(red, green, blue) {
    return 0.299 * red + 0.587 * green + 0.114 * blue;
}
