import * as tf from '@tensorflow/tfjs-node';
export async function createLayer(params) {
    const layers = [];

    for (const layerData of params.layers) {
        const layerType = layerData.type;
        const layerParams = layerData.params;

        switch (layerType) {
            case 'lstm': {
                layers.push(tf.layers.lstm(layerParams));
                break;
            }
            case 'conv1d': {
                layers.push(tf.layers.conv1d({ ...layerParams, padding: 'same' }));
                break;
            }
            case 'dropout': {
                layers.push(tf.layers.dropout(layerParams));
                break;
            }
            case 'batchNormalization': {
                layers.push(tf.layers.batchNormalization(layerParams));
                break;
            }
        }
    }

    return layers;
}
export class LayerController {
    listConfig = {
        lstm:{},
        flatten:{},
        dropout:{},
        dense:{},
        batchNormalization:{},
    }
    LAYERS = []
    constructor(params) {
        if (params){
            this.init(params)
        }else{
            this.updateParams()
        }

    }
    init(params){
        for (let i = 0; i < params.layers.length; i++) {
            const layer = this.getLayerfromName(params.layers[i].type)
            layer.params = params.layers[i].params
            this.LAYERS.push(layer)
        }
    }
    getLayers(){
        const arr = []
        for (let i = 0; i < this.LAYERS.length; i++) {
            arr.push(this.LAYERS[i])
        }
       return arr
    }
    updateParams(){
        this.listConfig.dropout.rate = Math.random()

        this.listConfig.dense.units = this.getRandomInt()
        this.listConfig.dense.activation = this.getRandomActivation()

        this.listConfig.lstm.units = this.getRandomInt(100,150)
        // this.listConfig.lstm.recurrentActivation = this.getRandomActivation()
        // this.listConfig.lstm.activation = this.getRandomActivation()
        this.listConfig.lstm.returnSequences = Math.random()<.5?true:false;
        // this.listConfig.lstm.kernelInitializer = this.getRandomKernelInitializer()
    }
    getRandomLayer(){
        // const name = this.randomName()
        const name = 'lstm'
        return this.getLayerfromName(name)
    }
    getLayerfromName(name){
        this.updateParams()
        return {type:name,params:this.listConfig[name]}
    }
    randomName() {
        const keys = Object.keys(this.listConfig);
        const randomIndex = Math.floor(Math.random() * keys.length);
        return keys[randomIndex];
    }
    getRandomKernelInitializer (){
        const ac = ['constant','glorotNormal','glorotUniform','heNormal','heUniform','identity', 'leCunNormal','leCunUniform','ones','orthogonal','randomNormal', 'randomUniform','truncatedNormal','varianceScaling','zeros']
        return ac[this.getRandomInt(0,ac.length-1)]
    }
    getRandomActivation (){
        const ac = ['elu','hardSigmoid','linear','relu','relu6', 'selu','sigmoid','softmax','softplus','softsign','tanh','swish', 'mish']
        return ac[this.getRandomInt(0,ac.length-1)]
    }

    getRandomInt(min=0, max=10) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

}



