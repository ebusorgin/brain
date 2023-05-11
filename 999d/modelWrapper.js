import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import {resize, arrayToMatrix, matrixToArray,tensorToImages} from './utils.js';
export class ModelWrapper {
    size = 128
    constructor(size,imageSizing) {
        this.size = size;
        // this.model = this.createModel();
        console.log('imageSizing',imageSizing[0].length)
    }

    // Метод для создания новой модели с заданным количеством классов
    createModel() {
        const model = tf.sequential();
        // Добавьте здесь слои модели, например:
        // Добавляем слои
        this.model.add(tf.layers.conv2d({
            inputShape: [28, 28, 1],
            filters: 1,
            kernelSize: 3,
            activation: 'relu',
        }));
        model.add(tf.layers.flatten());
        model.add(tf.layers.dense({ units: 1, activation: 'softmax' }));
        return model;
    }

    // Метод для обучения модели
    train(data, labels) {
        // Подготовьте свои данные и метки здесь
        this.model.compile({  });
        this.model.fit(data, labels, { });
    }

    // Метод для предсказания
    predict(data) {
        return this.model.predict(data);
    }

    // Метод для сохранения весов модели
    saveWeights(path) {
        return this.model.saveWeights(path);
    }

    // Метод для загрузки весов в модель
    loadWeights(path) {
        return this.model.loadWeights(path);
    }

    // Метод для добавления нового класса
    addClass() {
        // Сохраните текущие веса
        this.saveWeights('path/to/weights');

        // Создайте новую модель с дополнительным классом
        this.numClasses += 1;
        this.model = this.createModel(this.numClasses);

        // Загрузите веса из предыдущей модели
        this.loadWeights('path/to/weights');
    }
}