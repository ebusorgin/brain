import { createModel, trainModel } from './index.mjs';
import workerpool from 'workerpool';
import loadData from './loadData.js';
import * as tf from '@tensorflow/tfjs-node';

async function train(params) {
    const model = await createModel(params);
    const { trainData, testData } = await loadData();
    const xs = tf.slice(trainData.xs, [params.trainDataIndices[0], 0], [params.trainDataIndices.length, -1]);
    const ys = tf.slice(testData.ys, [params.trainDataIndices[0], 0], [params.trainDataIndices.length, -1]);
    const trainDataSubset = { xs, ys };
    const { performance } = await trainModel(model, trainDataSubset, params);
    return { params, performance };
}

workerpool.worker({
    train,
});
