import * as tf from '@tensorflow/tfjs-node';
import { Callback, layers, regularizers } from '@tensorflow/tfjs-node';


import workerpool from 'workerpool';
import loadData from './loadData.js';

// Создание пула воркеров
const numWorkers = 1; // Установите ограничение на количество воркеров

const populationSize = 4;
const numGenerations = 16;
const numParents = 4;
const initialPopulation = [];



const pool = workerpool.pool('./trainWorker.mjs', { maxWorkers: numWorkers });
class EarlyStopping extends Callback {
    constructor(patience = 5, minDelta = 0.001) {
        super();
        this.patience = patience;
        this.minDelta = minDelta;
        this.wait = 0;
        this.stoppedEpoch = 0;
        this.bestPerformance = Infinity;
    }

    onEpochEnd(epoch, logs) {
        const currentPerformance = logs.loss;

        if (currentPerformance < this.bestPerformance - this.minDelta) {
            this.bestPerformance = currentPerformance;
            this.wait = 0;
        } else {
            this.wait++;
            if (this.wait >= this.patience) {
                this.stoppedEpoch = epoch;
                this.model.stopTraining = true;
            }
        }
    }
}


// Определите функции для создания и обучения моделей, оценки их производительности, мутации и кроссовера

export async function createModel(params) {
    const model = tf.sequential();
    try {
        model.add(
            tf.layers.dense({
                units: params.hiddenUnits[0],
                inputShape: [params.inputShape],
                activation: params.activation,
                kernelRegularizer: regularizers.l2({ l2: params.l2Rate }),
            })
        );

        for (let i = 1; i < params.hiddenUnits.length; i++) {
            model.add(
                tf.layers.dense({
                    units: params.hiddenUnits[i],
                    activation: params.activation,
                    kernelRegularizer: regularizers.l2({ l2: params.l2Rate }),
                })
            );
            if (params.dropoutRate > 0) {
                model.add(layers.dropout({ rate: params.dropoutRate }));
            }
        }

        model.add(
            tf.layers.dense({
                units: params.outputUnits,
                activation: params.outputActivation,
                kernelRegularizer: regularizers.l2({ l2: params.l2Rate }),
            })
        );

        model.compile({ optimizer: tf.train.adam(params.learningRate), loss: 'binaryCrossentropy', metrics: ['accuracy'] });

        return model;
    } catch (e) {
        console.log(e, params);
    }
}


export async function trainModel(model, data, params) {
    const earlyStopping = new EarlyStopping(params.patience, params.minDelta);
    const history = await model.fit(data.xs, data.ys, { epochs: params.epochs, batchSize: params.batchSize, callbacks: [earlyStopping] });
    const performance = history.history.loss[history.history.loss.length - 1];
    return { model, performance };
}


function mutate(params) {
    const mutationRate = 0.1;
    if (Math.random() < mutationRate) {
        params.l2Rate = Math.max(0.0001, params.l2Rate * (1 + (Math.random() * 2 - 1) * mutationRate));
    }
    if (Math.random() < mutationRate) {
        params.dropoutRate = Math.min(0.5, Math.max(0, params.dropoutRate + (Math.random() * 2 - 1) * mutationRate));
    }

    if (Math.random() < mutationRate) {
        params.hiddenUnits = params.hiddenUnits.map(units => Math.max(1, units + Math.floor(Math.random() * 3) - 1));
        params.hiddenLayers = params.hiddenUnits.length;
    }

    if (Math.random() < mutationRate) {
        params.learningRate = Math.max(0.001, params.learningRate * (1 + (Math.random() * 2 - 1) * mutationRate));
    }

    return params;
}

function crossover(parent1Params, parent2Params) {
    const childParams = { ...parent1Params };

    if (Math.random() < 0.5) {
        childParams.l2Rate = parent2Params.l2Rate;
    }
    if (Math.random() < 0.5) {
        childParams.dropoutRate = parent2Params.dropoutRate;
    }
    if (Math.random() < 0.5) {
        childParams.hiddenUnits = parent2Params.hiddenUnits.slice();
    }

    if (Math.random() < 0.5) {
        childParams.learningRate = parent2Params.learningRate;
    }


    return childParams;
}





async function runGeneticAlgorithm() {
    let population = initialPopulation.slice();
    const { trainData, testData } = await loadData();
    let trainedModels;

    for (let generation = 0; generation < numGenerations; generation++) {
        console.log(`Generation ${generation + 1}`);

        // Обучите модели в популяции параллельно
        const trainPromises = [];
        for (const params of population) {
            const promise = pool.exec('train', [{ ...params, trainDataIndices: [...Array(trainData.xs.shape[0]).keys()] }]);
            trainPromises.push(promise);
        }
        const trainedModelsInfo = await Promise.all(trainPromises);
        trainedModels = await Promise.all(trainedModelsInfo.map(async (info) => {
            const model = await createModel(info.params);
            const { performance } = await trainModel(model, testData, info.params);
            return { model, params: info.params, performance };
        }));

        // Отсортируйте модели по производительности
        trainedModels.sort((a, b) => a.performance - b.performance);

        // Выберите лучших родителей для создания нового поколения
        const parents = trainedModels.slice(0, numParents);
        // Выведите информацию о текущем поколении и лучших родителях
        console.log('Best parents in current generation:', parents.map(parent => parent.params));
        // Создайте новое поколение с помощью мутаций и кроссовера
        population = [];
        for (let i = 0; i < populationSize; i++) {
            if (i < numParents) {
                population.push(parents[i].params);
            } else {
                const parent1 = parents[Math.floor(Math.random() * numParents)].params;
                const parent2 = parents[Math.floor(Math.random() * numParents)].params;
                let childParams = crossover(parent1, parent2);
                childParams = mutate(childParams);
                population.push(childParams);
            }
        }

        // Выведите информацию о лучшей модели
        const bestModelInfo = trainedModels[0];
        console.log('Best model:', bestModelInfo.params);
        console.log('Performance (loss):', bestModelInfo.performance);
    }
    // Завершите пул воркеров
    pool.terminate();

    // Оцените лучшую модель на тестовых данных
    const testAccuracy = (await trainedModels[0].model.evaluate(testData.xs, testData.ys))[1].dataSync();
    console.log('Test accuracy:', testAccuracy);
    // Сохраните лучшую модель
    await saveModel(trainedModels[0].model, 'best_model1');
}

async function mapLimit(tasks, limit, fn) {
    const results = [];
    const executing = [];

    for (const task of tasks) {
        const promise = fn(task);
        results.push(promise);

        if (limit <= tasks.length) {
            const executingTask = promise.then(() => executing.splice(executing.indexOf(executingTask), 1));
            executing.push(executingTask);

            if (executing.length >= limit) {
                await Promise.race(executing);
            }
        }
    }

    return Promise.all(results);
}



async function saveModel(model, modelName) {
    await model.save(`file://./${modelName}`);
}
// Создайте начальную популяцию моделей
async function init() {
    const { trainData, testData, inputShape,outputUnits } = await loadData();
    console.log(trainData.length)

    for (let i = 0; i < populationSize; i++) {

        const hiddenUnits = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => Math.floor(Math.random() * 10) + 1);

        initialPopulation.push({
            hiddenLayers: hiddenUnits.length,
            hiddenUnits: hiddenUnits,
            learningRate: Math.random() * 0.05 + 0.001,
            inputShape: inputShape,
            outputUnits: outputUnits,
            patience: 5, // Количество эпох, в течение которых модель должна улучшаться
            minDelta: 0.001, // Минимальное улучшение модели для продолжения обучения
            activation: 'relu',
            outputActivation: 'sigmoid',
            epochs: 20,
            batchSize: 32,
            l2Rate: Math.random() * 0.01,
            dropoutRate: Math.random() * 0.5,
        });
    }
    await runGeneticAlgorithm();
}
init().catch(err => console.error(err));



