import * as tf from '@tensorflow/tfjs-node';
import { regularizers } from '@tensorflow/tfjs-node';
import { v4 as uuidv4 } from 'uuid';
import loadData from './loadData.js';
import db from '../db.js';
import {LayerController} from "./generateParams.js";
import {ServerNetwork} from "./server.js";
import {uid} from "chart.js/helpers";
import {cpuUsage} from "process";
const DB = new db();


export const WINDOWS_SIZE = 24
export class GeneticNetwork {

    initialPopulation = []
    constructor(data) {
        this.populationSize=data.populationSize
        this.numGenerations=data.numGenerations
        this.numParents=data.numParents
        this.loadData = loadData
    }
    async init(){
        const { trainData, testData, inputShape, outputUnits } = await this.loadData();
        for (let i = 0; i < this.populationSize; i++) {
            const pConfig = {
                uid: i,
                layers: [{
                    type:'lstm',
                    params:{
                        inputShape: [WINDOWS_SIZE, inputShape],
                        units: inputShape,
                        returnSequences: true,
                    }
                },{
                    type:'flatten',
                    params:{}
                },{
                    type:'dense',
                    params:{
                        units: outputUnits,
                        activation: 'sigmoid',
                    }
                }],
                compile: { optimizer: tf.train.adam(Math.random() * 0.05 + 0.001), loss: 'binaryCrossentropy', metrics: ['accuracy'] },
                inputShape: inputShape,
                outputUnits: outputUnits,
                patience: 5,
                minDelta: 0.001,
                activation: 'relu',
                outputActivation: 'sigmoid',
                epochs: 10,
                batchSize: 32,
                l2Rate: Math.random() * 0.01,
                dropoutRate: Math.random() * 0.5,
                kernelSize: 3,
                stride: 1,
                poolSize: 2,
                performance:[1]
            }
            this.initialPopulation.push(pConfig);
        }

        await this.runGeneticAlgorithm();
    }
    async runGeneticAlgorithm() {
        server.sendMessage('models',this.initialPopulation)

        const { trainData, testData } = await loadData();
        let trainedModels;

        for (let generation = 0; generation < this.numGenerations; generation++) {
            console.log(`Generation ${generation + 1}`,this.initialPopulation.length);
            server.sendMessage('generation',{generation:generation + 1})
            const trainPromises = [];


            for (const params of this.initialPopulation) {
                const p = { ...params, trainDataIndices: [...Array(trainData.xs.shape[0]).keys()] }
                // console.log(' for (const params of population) {',p,params)
                trainPromises.push(this.train(p));
            }

            const trainedModelsInfo = await Promise.all(trainPromises);
            trainedModels = await Promise.all(trainedModelsInfo.map(async (info) => {
                if (!info.params){
                    console.log('info',info)
                }
                const model = await this.createModel(info.params);
                const { performance } = await this.trainModel(model, testData, info.params);
                info.params.performance.push(performance)
                server.sendMessage('updateModel',info.params)
                return { model, params: info.params, performance};
            }));

            trainedModels.sort((a, b) => a.performance - b.performance);

            const parents = trainedModels.slice(0, this.numParents);
            // console.log('Best parents in current generation:', parents.map(parent => parent.params));

            for (let i = 0; i < trainedModels.length; i++) {
                const params = this.initialPopulation.find(m2=>trainedModels[i].params.uid===m2.uid)
                await this.mutate(params,i/this.initialPopulation.length);
            }
            const bestModelInfo = trainedModels[0];
            // server.sendMessage('bestModelInfo',trainedModels)

            // server.sendMessage('models',this.initialPopulation)
            // console.log('Best model:', bestModelInfo.params);
            // console.log('Performance (loss):', bestModelInfo.performance);
        }


        const testAccuracy = (await trainedModels[0].model.evaluate(testData.xs, testData.ys))[1].dataSync();
        console.log('FINSH Test accuracy:', testAccuracy);
        await this.saveModel(trainedModels[0].model, 'best_model1');
    }
    async saveModel(model, modelName) {
        await model.save(`file://./${modelName}`);
    }
    async createModel(params) {

        // console.log('CREATE MODEL',params)
        const layer = new LayerController(params)
        const leyersArr = layer.getLayers()
        const arrLayers = []
        for (let i = 0; i < leyersArr.length; i++) {
            arrLayers.push(tf.layers[leyersArr[i].type](leyersArr[i].params))
        }
        if (arrLayers.length==0){
            console.log('CREATE MODEL params',params)
        }

        const model = tf.sequential({layers :arrLayers});
        model.compile({ optimizer: tf.train.adam(Math.random() * 0.05 + 0.001), loss: 'binaryCrossentropy', metrics: ['accuracy'] });
        return model;

    }
    async mutate(params,mutationRate) {

        if (Math.random() < mutationRate) {
            const m = mutateNumber(params.layers.length)
            console.log('mutateNumber uid: ',params.uid,m)
            if (m>params.layers.length){
                const l = new LayerController()
                const newlayer = l.getRandomLayer()

                // insertBeforePreLast(params.layers,newlayer)
                console.log('MUTATE: NEW LAYER',newlayer)
                // server.sendMessage('updateModel',params)
                try {

                    // const rrr = this.trainUpdate(params)
                    // if (!rrr){
                    //     console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
                    // }
                } catch (e) {
                    // removeBeforePreLast(params.layers)
                    console.log('ERRRRRRRRRRO',params.uid,params.layers.length)
                    // server.sendMessage('updateModel',params)
                }
                // server.sendMessage('updateModel',params)
            }




        }
        // if (Math.random() < mutationRate) {
        //     params.dropoutRate = Math.min(0.5, Math.max(0, params.dropoutRate + (Math.random() * 2 - 1) * mutationRate));
        // }
        // if (Math.random() < mutationRate) {
        //     params.filters = params.filters.map(filters => Math.max(1, filters + Math.floor(Math.random() * 3) - 1));
        // }
        //
        // if (Math.random() < mutationRate) {
        //     params.learningRate = Math.max(0.001, params.learningRate * (1 + (Math.random() * 2 - 1) * mutationRate));
        // }

        return params;
    }
    async crossover(parent1Params, parent2Params) {
        const childParams = { ...parent1Params };
        // if (Math.random() < 0.5) {
        //     childParams.l2Rate = parent2Params.l2Rate;
        // }
        // if (Math.random() < 0.5) {
        //     childParams.dropoutRate = parent2Params.dropoutRate;
        // }
        // if (Math.random() < 0.5) {
        //     childParams.filters = parent2Params.filters.slice();
        // }
        //
        // if (Math.random() < 0.5) {
        //     childParams.learningRate = parent2Params.learningRate;
        // }

        return childParams;
    }
    async trainUpdate(params) {
        try {
            const newmodel = await this.createModel(params);
            const { trainData, testData, inputShape,outputUnits } = await this.loadData();
            const { model, performance } = await this.trainModel(newmodel,testData,params)
            return { params, performance };
        }catch (e) {
            return false
        }
    }
    async train(params) {

            const newmodel = await this.createModel(params);
            const { trainData, testData, inputShape,outputUnits } = await this.loadData();
            const { model, performance } = await this.trainModel(newmodel,testData,params)
            return { params, performance };

    }
    async trainModel(model, data, params) {
        const history = await model.fit(data.xs, data.ys, {
            epochs: params.epochs,
            batchSize: params.batchSize,
            verbose: false,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    server.sendMessageLogs('onEpochEnd',params.uid,{epoch, logs})
                    // console.log(`Epoch ${epoch + 1}: loss = ${logs.loss}`);
                },
                onBatchEnd: async (batch, logs) => {
                    server.sendMessageLogs('onBatchEnd',params.uid,{batch, logs})
                    // console.log(`Batch ${batch + 1}: loss = ${logs.loss}`);
                },
            },


        });
        const performance = history.history.loss[history.history.loss.length - 1];
        return { model, performance };
    }
}



function mutateNumber(minNumber) {
    const mutationRate = 0.2;
    const mutation = Math.random() < 0.5 ? -1 : 1;

    if (Math.random() < mutationRate) {
        minNumber = Math.max(1, minNumber + mutation);
    }

    return minNumber+1;
}
function insertBeforePreLast(arr, newItem) {
    const preLastIndex = arr.length - 2;
    arr.splice(preLastIndex, 0, newItem);
    return arr
}
function removeBeforePreLast(arr) {
    if (arr.length >=3) {
        const preLastIndex = arr.length - 2;
        arr.splice(preLastIndex, 1);
    }
    return arr;
}