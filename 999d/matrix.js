import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import {
    resize,
    arrayToMatrix,
} from './utils.js';


export default class Matrix {
    model = {}
    size = 10
    numClassess = 1
    constructor() {


        this.startMatrix()
    }
    startMatrix(){
        this.model = tf.sequential();
        this.addLayerStep(this.size/2)
    }
    setData(data){

        const m = arrayToMatrix(data);
        let imageSizing = resize(m, this.size);
        const imageTensor = tf.tensor(imageSizing).reshape([1, this.size, this.size, 1]); // преобразуем форму тензора
        // const imageTensor = tf.tensor(image).div(tf.scalar(255)).reshape([1, this.size, this.size, 1]);
        const predictions = this.model.predict(imageTensor);
        let r = predictions.arraySync()
        r.forEach(async (prediction, index) => {
            for (let i = 0; i < prediction.length; i++) {
                if (prediction[i]<0.6){
                    console.log("сеть не поняла что за картинка, нужно внести ее признаки в фильтры, добавить ей класс",prediction[i])
                    const modelWrapper = new Matrix()
                    await modelWrapper.trainAndSaveModel(imageSizing)
                    this.startMatrix()
                }else{
                    console.log("предсказание",prediction[i])
                }
            }


        });

        return predictions.arraySync();
    }
    addLayerStep(sizeDouble){
        let filters = [1];
        let finalFilterTensor = null

        if (fs.existsSync('weights.json')) {
            filters = JSON.parse(fs.readFileSync('weights.json', 'utf8'));


        // Создаем тензор с формой [width, height, inputChannels, outputChannels]
        const filterTensor = tf.tensor4d(filters, [filters.length, sizeDouble, sizeDouble, 1]);

        // Перемещаем оси так, чтобы формат стал [width, height, inputChannels, outputChannels]
        finalFilterTensor = tf.transpose(filterTensor, [1, 2, 3, 0]);

        }
        console.log('EXISTIS LAYERS',filters.length)

        // Добавление сверточного слоя с пользовательскими фильтрами
        const convLayer = tf.layers.conv2d({
            inputShape: [this.size, this.size, 1],
            kernelSize: sizeDouble,
            filters: filters.length,
            strides: 1,
            padding:'same',
            activation: 'relu',
            // kernelInitializer: 'varianceScaling',
            // kernelInitializer: 'zeros', // initialization with zeros
            // biasInitializer: 'zeros',
        });

        this.model.add(convLayer);
        if (fs.existsSync('weights.json')) {
            convLayer.setWeights([finalFilterTensor, tf.zeros([filters.length])]);
        }

        this.model.add(tf.layers.flatten());
        this.model.add(tf.layers.dense({ units: filters.length, activation: 'sigmoid' }));

        // Компиляция модели
        this.model.compile({
            optimizer: tf.train.adam(0.4),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });
    }
    async trainAndSaveModel(image) {

        // Преобразование изображения в тензор и нормализация значений
        const imageTensor = tf.tensor(image).reshape([1, this.size, this.size, 1]);
        // Преобразование метки в тензор
        const weights = this.model.getWeights();
        const weightsJson = weights[0].arraySync();
        console.log("weightsJson.length",weightsJson.length)
        const labels = new Array(weightsJson.length).fill(0);
        labels[weightsJson.length-1]=1

        const labelTensor = tf.tensor1d(labels, 'int32').toFloat();
        console.log("labels")
        this.model.fit(imageTensor, labelTensor, {
            epochs: 3,
            batchSize: 64,
        }).then(() => {
            console.log('Training complete');
            const predictions = this.model.predict(imageTensor);
            // this.createFilter(predictions)

        }).catch(e=>{
            console.log('ERRORRRRR',e)
        });


    }
    createFilter(predictions){
        // Выводим предсказания на консоль
        predictions.print();

        // Получаем веса модели
        const weights = this.model.getWeights();

        // Преобразуем веса в JSON
        const weightsJson = weights[0].arraySync();

        // Перемещаем оси так, чтобы формат стал [outputChannels, width, height, inputChannels]
        const transposedWeights = tf.transpose(weightsJson, [3, 0, 1, 2]);
        const transposedWeightsArray = transposedWeights.arraySync();
        // Сохраняем веса в JSON-файл
        let existingWeights = [];
        // Проверка наличия файла с весами
        if (fs.existsSync('weights.json')) {
            // Если файл существует, загрузить существующие весы
            existingWeights = JSON.parse(fs.readFileSync('weights.json', 'utf8'));
        }

        // Сохранение объединенных весов в файл
        fs.writeFileSync('weights.json', JSON.stringify(existingWeights.concat(transposedWeightsArray)));

    }


}
