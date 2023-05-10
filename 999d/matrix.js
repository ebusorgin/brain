import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import {resize, arrayToMatrix, matrixToArray,tensorToImages} from './utils.js';


















//
// // Добавление полносвязного слоя
// model.add(tf.layers.flatten());
// model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));
//
// // Компиляция модели
// model.compile({
//     optimizer: tf.train.adam(),
//     loss: 'categoricalCrossentropy',
//     metrics: ['accuracy']
// });
//
// // Загрузка данных для обучения
// let trainData = /* Загрузите ваш набор данных для обучения здесь */
//
// // Обучение модели
//     model.fit(trainData.images, trainData.labels, {
//         epochs: 5,
//         shuffle: true
//     }).then(() => {
//         console.log('Training complete');
//     });
export default class Matrix {
    model = tf.sequential();
    size = 128
    constructor() {
        this.addLayerStep(this.size/2)
    }
    setData(data){

        const m = arrayToMatrix(data);
        let data10x10 = resize(m, this.size);
        const imageTensor = tf.tensor(data10x10).reshape([1, this.size, this.size, 1]); // преобразуем форму тензора

        const predictions = this.model.predict(imageTensor);
        let r = predictions.arraySync()
        r.forEach((prediction, index) => {

            prediction.forEach((percent,index)=>{
                console.log(`Image ${index}: `, percent);
                if (percent<0.6){
                    console.log("сеть не поняла что за картинка, нужно внести ее признаки в фильтры, добавить ей класс",percent)

                }
            })

        });

        return predictions.arraySync();
    }
    compileModel(){

    }
    addLayerStep(size){

        let filters = [new Array(size).fill().map(() => new Array(size).fill(Math.random()))];


        if (fs.existsSync('filters.json')) {
            filters = JSON.parse(fs.readFileSync('filters.json', 'utf8'));
        }
        // Добавляем дополнительное измерение для каналов и расширяем до 4D
        let reshapedFilters = [];
        for (let i = 0; i < filters.length; i++) {
            let filter = filters[i];
            let temp = [];
            for (let j = 0; j < filter.length; j++) {
                temp.push(filter[j].map(v => [v]));
            }
            reshapedFilters.push(temp);
        }
        // Создаем тензор с формой [width, height, inputChannels, outputChannels]
        const filterTensor = tf.tensor4d(reshapedFilters, [filters.length, size, size, 1]);

        // Перемещаем оси так, чтобы формат стал [width, height, inputChannels, outputChannels]
        const finalFilterTensor = tf.transpose(filterTensor, [1, 2, 3, 0]);


        // Добавление сверточного слоя с пользовательскими фильтрами
        const convLayer = tf.layers.conv2d({
            inputShape: [this.size, this.size, 1],
            kernelSize: size,
            filters: filters.length,
            strides: 1,
            padding:'same',
            activation: 'relu',
            // kernelInitializer: 'zeros', // initialization with zeros
            // biasInitializer: 'zeros',
        });

        this.model.add(convLayer);
        if (fs.existsSync('filters.json')) {
            convLayer.setWeights([finalFilterTensor, tf.zeros([filters.length])]);
        }

        this.model.add(tf.layers.flatten());
        this.model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

        // Компиляция модели
        this.model.compile({
            optimizer: tf.train.adam(),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

    }
    async trainAndSaveModel(data) {


        // Добавляем слои
        this.model.add(tf.layers.conv2d({
            inputShape: [28, 28, 1],
            filters: 1,
            kernelSize: 3,
            activation: 'relu',
        }));

        this.model.add(tf.layers.maxPooling2d({ poolSize: 6 }));
        this.model.add(tf.layers.flatten());
        this.model.add(tf.layers.dense({ units: 2, activation: 'softmax' }));

        // Компилируем модель
        this.model.compile({
            optimizer: 'adam',
            loss: 'sparseCategoricalCrossentropy',
            metrics: ['accuracy'],
        });

        // Обучаем модель
        // Вам нужно будет подготовить данные для обучения и тестирования в соответствующем формате

        this.model.fit(data.xTest, data.yTest, {
            epochs: 20,
            validationData: [data.xTest, data.yTest]
        }).then(() => {
            console.log('Training complete');
            const predictions = this.model.predict(data.xTest);

            // Выводим предсказания на консоль
            predictions.print();

            // Сохраняем модель
            const saveResults = this.model.save('file://my-model');

            // Получаем веса модели
            const weights = this.model.getWeights();

            // Преобразуем веса в JSON
            const weightsJson = weights[0].arraySync();

            // Перемещаем оси так, чтобы формат стал [outputChannels, width, height, inputChannels]
            const transposedWeights = tf.transpose(weightsJson, [3, 0, 1, 2]);

            // Приводим к формату filters.json
            const formattedWeights = [];
            const transposedWeightsArray = transposedWeights.arraySync();
            for (let i = 0; i < transposedWeightsArray.length; i++) {
                const filter = [];
                for (let j = 0; j < transposedWeightsArray[i].length; j++) {
                    const row = [];
                    for (let k = 0; k < transposedWeightsArray[i][j].length; k++) {
                        row.push(transposedWeightsArray[i][j][k][0]);
                    }
                    filter.push(row);
                }
                formattedWeights.push(filter);
            }

            // Сохраняем веса в JSON-файл
            fs.writeFileSync('weights.json', JSON.stringify(formattedWeights));
        }).catch(e=>{
            console.log('ERRORRRRR',e)
        });


    }
   async prepareTestData(rawData1) {
        const data = {label:'horizontal',image:rawData1}
        const images = [];
        const labels = [];


            const image2D = tf.tensor(data.image, [28, 28]);
            const image3D = image2D.expandDims(2);

            images.push(image3D);

            const label = data.label === 'horizontal' ? 0 : 1;
            labels.push(label);

        console.log(labels)
        const xTest = tf.stack(images);
       const yTest = tf.tensor1d(labels, 'int32').toFloat();
        await this.trainAndSaveModel({xTest, yTest})

    }

}
