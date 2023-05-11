import * as tf from '@tensorflow/tfjs-node';
import Jimp from 'jimp';
import sharp from 'sharp';

const IMAGE_PATH = 'image1.png'; // Image with the white square
const IMAGE_PATH_NO_SQUARE = 'image2.png'; // Image without the white square
const IMAGE_SIZE = 32; // Ваш размер изображения
let outImageName = 'restored_image.png';
const EPOCHS = 30; // Increase the number of epochs
const BATCH_SIZE = 5; // Adjust the batch size as needed
async function loadAndProcessImage(path) {
    const image = await Jimp.read(path);
    image.resize(IMAGE_SIZE, IMAGE_SIZE);
    console.log(image.bitmap.width);
    console.log(image.bitmap.height);
    const data = tf.browser.fromPixels(
        { data: image.bitmap.data, width: image.bitmap.width, height: image.bitmap.height },
        1
    );
    return data.toFloat().div(255).reshape([1, IMAGE_SIZE, IMAGE_SIZE, 1]);
}

async function saveImage(tensor, path) {
    const array = await tensor.mul(255).toInt().array();
    const uint8Array = new Uint8Array(array.flat());
    await sharp(uint8Array, {
        raw: {
            width: IMAGE_SIZE,
            height: IMAGE_SIZE,
            channels: 1,
        },
    })
        .png()
        .toFile(path);
}

async function trainModel(model, input) {
    model.compile({
        optimizer: tf.train.adam(),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
    });

    // Add early stopping
    const earlyStopping = tf.callbacks.earlyStopping({ monitor: 'loss', patience: 5 });

    await model.fit(input, input, {
        epochs: EPOCHS,
        batchSize: BATCH_SIZE,
        callbacks: [earlyStopping],
    });
}

async function removeFeatures(model, input) {
    const encoded = model.predict(input);
    const decoded = model.predict(input);
    const removed = tf.sub(input, decoded);
    return removed;
}

async function main() {
    // Load images
    const inputWithSquare = await loadAndProcessImage(IMAGE_PATH);
    const inputWithoutSquare = await loadAndProcessImage(IMAGE_PATH_NO_SQUARE);

    const encoder = tf.sequential();
    encoder.add(
        tf.layers.conv2d({
            inputShape: [IMAGE_SIZE, IMAGE_SIZE, 1],
            filters: 16,
            kernelSize: 3,
            strides: 1,
            activation: 'relu',
            padding: 'same',
        })
    );
    encoder.add(tf.layers.maxPooling2d({poolSize: [2, 2]}));
    encoder.add(tf.layers.flatten());

    const decoder = tf.sequential();
    decoder.add(
        tf.layers.dense({
            units: Math.floor(IMAGE_SIZE / 2) * Math.floor(IMAGE_SIZE / 2) * 16,
            activation: 'relu',
            inputShape: [encoder.outputShape[1]],
        })
    );
    decoder.add(
        tf.layers.reshape({ targetShape: [Math.floor(IMAGE_SIZE / 2), Math.floor(IMAGE_SIZE / 2), 16] })
    );
    decoder.add(
        tf.layers.conv2dTranspose({
            filters: 1,
            kernelSize: 3,
            strides: 2,
            activation: 'sigmoid',
            padding: 'same',
        })
    );

    const autoencoder = tf.sequential();
    autoencoder.add(encoder);
    autoencoder.add(decoder);

    // Модель поезда на изображении без белого квадрата
    await trainModel(autoencoder, inputWithoutSquare);

    // Примените модель к изображению с помощью белого квадрата
    const output = autoencoder.predict(inputWithSquare);
    await saveImage(output.reshape([IMAGE_SIZE, IMAGE_SIZE]), outImageName);

    // Необязательно: визуализируйте удаленные объекты
    const removedFeatures = tf.sub(inputWithSquare, output);
    await saveImage(removedFeatures.reshape([IMAGE_SIZE, IMAGE_SIZE]), 'removed_features.png');
}

main();
