import {metrics, regularizers} from "@tensorflow/tfjs-node";
import * as tf from "@tensorflow/tfjs-node";
import {WINDOWS_SIZE} from "./2d/GeneticNetwork.mjs";
import {compile} from "ejs";

const u = [{
    layers: [{
        type:'lstm',
        params:{
            inputShape: [34, 23],
            units: 44,
            returnSequences: true,
            activation:'tanh'
        }
    },{
        type:'flatten',
        params:{}
    },{
        type:'dense',
        params:{
            units: 33,
            activation: 'sigmoid',
            kernelRegularizer: {
                "l1": 0,
                "l2": 0.00872978056605155,
                "hasL1": false,
                "hasL2": true
            },
        }
    }],
    compile: { loss: 'binaryCrossentropy', metrics: ['accuracy'] },
    inputShape: 12,
    outputUnits: 12,
    patience: 5,
    minDelta: 0.001,
    activation: 'relu',
    outputActivation: 'sigmoid',
    epochs: 10,
    batchSize: 32,
    l2Rate: 0.21,
    dropoutRate:0.98,
    kernelSize: 3,
    stride: 1,
    poolSize: 2
}]