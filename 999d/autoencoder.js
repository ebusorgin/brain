import * as tf from '@tensorflow/tfjs-node';
import Jimp from 'jimp';
import sharp from 'sharp';
// const IMAGE_PATH = 'Screenshot_9.png';
const IMAGE_PATH = 'image1.png';
const IMAGE_SIZE = 32; // Ваш размер изображения
let outImage_name = 'restored_image.png'
async function loadAndProcessImage(path) {
    const image = await Jimp.read(path);
    image.resize(IMAGE_SIZE, IMAGE_SIZE); // Добавьте эту строку
    console.log(image.bitmap.width)
    console.log(image.bitmap.height)
    const data = tf.browser.fromPixels({ data: image.bitmap.data, width: image.bitmap.width, height: image.bitmap.height }, 1);
    return data.toFloat().div(255).reshape([1, IMAGE_SIZE, IMAGE_SIZE, 1]);

}




async function saveImage(tensor, path) {
    let array = await tensor.mul(255).toInt().array();
    let uint8Array = new Uint8Array(array.flat());
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
        metrics: ['accuracy']
    });

    await model.fit(input, input, {
        epochs: 20,
        batchSize: 1,
    });
}

async function main() {
    const input = await loadAndProcessImage(IMAGE_PATH);

    const encoder = tf.sequential();
    encoder.add(tf.layers.conv2d({
        inputShape: [IMAGE_SIZE, IMAGE_SIZE, 1],
        filters: 16,
        kernelSize: 8,
        batchSize: 10,
        strides: 1,
        activation: 'relu6',
        padding: 'same'
    }));
    outImage_name = 'restored_DEFAULT_F16_KS82_BS10_STR1_ELU2.png'
    // encoder.add(tf.layers.upSampling2d({size: [2, 2]}));
    // encoder.add(tf.layers.maxPooling2d({poolSize: [4, 4], strides: [1, 1]}));
    // encoder.add(
    //     tf.layers.conv2d({
    //         filters: 32,
    //         kernelSize: 4,
    //         strides: 2,
    //         activation: 'relu',
    //         padding: 'same',
    //     })
    // );
    // // Add more convolutional layers for better image recognition
    // encoder.add(
    //     tf.layers.conv2d({
    //         filters: 64,
    //         kernelSize: 4,
    //         strides: 2,
    //         activation: 'relu',
    //         padding: 'same',
    //     })
    // );

    encoder.add(tf.layers.flatten());

    const decoder = tf.sequential();
    decoder.add(tf.layers.dense({
        units: Math.floor(IMAGE_SIZE / 2) * Math.floor(IMAGE_SIZE / 2) * 16,
        activation: 'relu',
        inputShape: [encoder.outputShape[1]]
    }));
    decoder.add(tf.layers.reshape({ targetShape: [Math.floor(IMAGE_SIZE / 2), Math.floor(IMAGE_SIZE / 2), 16] }));
    decoder.add(tf.layers.conv2dTranspose({
        filters: 1,
        kernelSize: 8,
        strides: 2,
        activation: 'sigmoid',
        padding: 'same'
    }));

    const autoencoder = tf.sequential();
    autoencoder.add(encoder);
    autoencoder.add(decoder);

    await trainModel(autoencoder, input);

    const output = autoencoder.predict(input);
    await saveImage(output.reshape([IMAGE_SIZE, IMAGE_SIZE]), outImage_name);

    // Удаление найденных признаков
    const decodedOutput = decoder.predict(output);
    const encodedOutput = encoder.predict(decodedOutput);



    // await saveImage(modifiedOutput.reshape([IMAGE_SIZE, IMAGE_SIZE]), `DEL_${outImage_name}`);
    await saveImage(modifiedInput.reshape([IMAGE_SIZE, IMAGE_SIZE]), `DEL_${outImage_name}`);



}

main();
