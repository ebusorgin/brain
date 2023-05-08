import * as tf from '@tensorflow/tfjs-node';
import { EMA, MACD, RSI, BollingerBands } from 'technicalindicators';
import Table from 'cli-table';
import db from '../db.js';
import {WINDOWS_SIZE} from "./GeneticNetwork.mjs";
import jsonData from './drawing/data.json';
const DB = new db();
class selectData {
    constructor() {
        this.DB = new db();
        this.dataDB = []
        this.popularSymbols = [
            'BTCUSDT',
            // 'ETHUSDT',
            // 'BNBUSDT',
            // 'ADAUSDT',
            // 'DOGEUSDT',
            // 'XRPUSDT',
            // 'SOLUSDT',
            // 'DOTUSDT',
            // 'MATICUSDT',
        ];
    }
    async loadData2(){
        const symbols = this.popularSymbols.join("', '");
        const query = `SELECT time, open, high, low, close, volume, close_time, quote_asset_volume, number_of_trades, taker_buy_base_asset_volume, taker_buy_quote_asset_volume, 'BTCUSDT' AS symbol     
      FROM binance.pair_btcusdt ORDER BY time ASC LIMIT 24*30`
        const res = await this.DB.query(query);
        this.dataDB = res
        return this.dataDB
    }
    async loadData() {
        if (this.dataDB.length>0){
            return this.dataDB
        }
        const symbols = this.popularSymbols.join("', '");

        const query = `
      SELECT time, array_agg(json_build_object('symbol', symbol, 'open', open, 'high', high, 'low', low, 'close', close, 'volume', volume, 'close_time', close_time, 'quote_asset_volume', quote_asset_volume, 'number_of_trades', number_of_trades, 'taker_buy_base_asset_volume', taker_buy_base_asset_volume, 'taker_buy_quote_asset_volume', taker_buy_quote_asset_volume)) AS data
      FROM (
        ${this.popularSymbols.map((symbol) => `
          SELECT time, open, high, low, close, volume, close_time, quote_asset_volume, number_of_trades, taker_buy_base_asset_volume, taker_buy_quote_asset_volume, '${symbol}' AS symbol
          FROM binance.pair_${symbol.toLowerCase()}
        `).join('UNION ALL')}
      ) AS subquery
      GROUP BY time
      ORDER BY time ASC;
    `;
        const res = await this.DB.query(query);
        this.dataDB = res
        return this.dataDB

    }

}
function createTensors2(arr) {
    const filteredArr = arr.filter(row => {
        const macd = row[0];
        return !isNaN(macd.MACD) && !isNaN(macd.signal) && !isNaN(macd.histogram);
    });
    const tensorData = filteredArr.map(data => {
        const macd = data[0];
        const features = data.slice(1);

        return [macd.MACD, macd.signal, macd.histogram, ...features];
    });

    return tf.tensor2d(tensorData);
}
(async () => {
console.log(jsonData.length)

    // const tensor1d = tf.tensor1d(jsonData);
    // const tensor1d = tf.tensor1d([1, 2, 3, 4, 5, 6]);
    // const tensor2d = tensor1d.reshape([2,3]);
    // console.log('tensor1d shape:', tensor1d.shape); // tensor1d shape:  [ 6 ]
    // console.log('tensor2d shape:', tensor2d.shape); // tensor2d shape: [ 2, 3 ]
    // [
    //     [1, 2, 3],
    //     [4, 5, 6]
    // ]
    // tensor2d.print()
    const inputShape = [100, 3];
    const outputClasses = 2;
    const epochs = 10;
    const learningRate = 0.01;
    const data = tf.tensor(jsonData).reshape([-1, ...inputShape]);
    const labels = tf.tensor2d([0, 1], [2, outputClasses]); // Целевые значения для классов

    // Создаем модель
    const model = tf.sequential({
        layers: [
            tf.layers.lstm({
                inputShape: inputShape,
                units: 128,
                returnSequences: true,
            }),
            tf.layers.flatten(),
            tf.layers.dense({
                units: outputClasses,
                activation: 'softmax',
            }),
        ],
    });
// Компилируем модель
    model.compile({
        optimizer: tf.train.adam(learningRate),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
    });
    // Обучаем модель
    model.fit(data, labels, {
        epochs: epochs,
        shuffle: true,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch}: loss = ${logs.loss}, acc = ${logs.acc}`);
            },
        },
    }).then(() => {
        // Получаем предсказания модели на тестовых данных
        const testData = data.slice([0, 0, 0], [1, ...inputShape]);
        const prediction = model.predict(testData).dataSync();

        console.log(`Prediction: ${prediction}`);
    });
})().catch((err) => console.error(err));


// {
//     symbol: 'BTCUSDT',
//         open: 28113.13,
//     high: 28122.38,
//     low: 28063.89,
//     close: 28086.22,
//     volume: 831.51057,
//     close_time: '2023-04-08T14:59:59.999',
//     quote_asset_volume: 23362692.6507453,
//     number_of_trades: 26926,
//     taker_buy_base_asset_volume: 430.06971,
//     taker_buy_quote_asset_volume: 12083810.2051395
// }

// function calculateIndicators(candles) {
//     const closePrices = candles.map(candle => candle.close);
//
//     const sma20 = SMA.calculate({ period: 20, values: closePrices });
//     const sma50 = SMA.calculate({ period: 50, values: closePrices });
//
//     const ema20 = EMA.calculate({ period: 20, values: closePrices });
//     const ema50 = EMA.calculate({ period: 50, values: closePrices });
//
//     const rsi = RSI.calculate({ period: 14, values: closePrices });
//
//     const macdValues = MACD.calculate({
//         fastPeriod: 12,
//         slowPeriod: 26,
//         signalPeriod: 9,
//         values: closePrices
//     });
//
//     return { sma20, sma50, ema20, ema50, rsi, macdValues };
// }

function createTensors(data, windowSize) {
    const inputTensors = [];
    const outputTensors = [];
    let numInput = 0;
    let numOutput = 0;
    const select = new selectData();
    const popularSymbols = select.popularSymbols.slice().sort()
    for (const symbol in data) {
        const symbolData = data[symbol];
        // Создать one-hot encoding вектор для текущей валютной пары
        const oneHotSymbol = popularSymbols.map(s => (s === symbol ? 1 : 0));
        // Рассчитать технические индикаторы
        const closePrices = symbolData.map(candle => candle.close);
        const ema = EMA.calculate({ period: 14, values: closePrices });
        const macd = MACD.calculate({ values: closePrices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
        const rsi = RSI.calculate({ values: closePrices, period: 14 });
        const bollingerBands = BollingerBands.calculate({ values: closePrices, period: 20, stdDev: 2 });

        for (let i = windowSize - 1; i < symbolData.length - windowSize - 1; i++) {
            const inputWindow = symbolData.slice(i - windowSize + 1, i + 1).map((candle, idx) => {
                const features = [
                    ...oneHotSymbol,
                    candle.open,
                    candle.high,
                    candle.low,
                    candle.close,
                    candle.volume,
                    candle.quote_asset_volume,
                    candle.number_of_trades,
                    candle.taker_buy_base_asset_volume,
                    candle.taker_buy_quote_asset_volume,
                    ema[i - windowSize + 1 + idx]||0,
                    macd[i - windowSize + 1 + idx].histogram||0,
                    rsi[i - windowSize + 1 + idx]||0,
                    bollingerBands[i - windowSize + 1 + idx].upper||0,
                    bollingerBands[i - windowSize + 1 + idx].middle||0,
                    bollingerBands[i - windowSize + 1 + idx].lower||0,
                    // Оконные функции
                    idx > 0 ? (candle.close - symbolData[i - windowSize + idx].close) : 0,
                    // Временные метки
                    new Date(candle.close_time).getHours(),
                    new Date(candle.close_time).getDay(),
                    new Date(candle.close_time).getMonth()
                ];
                numInput = features.length
                return features;
            });

            const outputWindow = [
                ...oneHotSymbol,
                // Относительные изменения
                (symbolData[i + 1].close - symbolData[i].close) / symbolData[i].close,
                // Направление движения
                symbolData[i + 1].close > symbolData[i].close ? 1 : 0,
                symbolData[i + 2].close > symbolData[i].close ? 1 : 0,
                symbolData[i + 3].close > symbolData[i].close ? 1 : 0,
            ];
            numOutput = outputWindow.length
            inputTensors.push(inputWindow);
            outputTensors.push(outputWindow);
        }
    }

    // Группируем outputTensors по валютным парам
    const numSymbols = Object.keys(data).length;
    const numWindowsPerSymbol = outputTensors.length / numSymbols;
    const groupedOutputTensors = [];
    for (let i = 0; i < numSymbols; i++) {
        groupedOutputTensors.push(outputTensors.slice(i * numWindowsPerSymbol, (i + 1) * numWindowsPerSymbol));
    }

    const outputTensor = tf.concat(groupedOutputTensors.map(tensors => tf.tensor2d(tensors)), 0);
    return {
        inputTensors: tf.tensor3d(inputTensors),
        outputTensors: outputTensor,
        numInput,
        numOutput,
    };
}





// function getTrendString(trendArray) {
//     const ups = trendArray.filter(value => value === 1).length;
//     const downs = trendArray.filter(value => value === 0).length;
//     return ups > downs ? 'up' : 'down';
// }

// async function buildAndTrainModel({inputTensors,outputTensors},lookbackPeriod = 24) {
//
//     const splitIndex = Math.floor(inputTensors.shape[0] * 0.8);
//     const [trainInputs, testInputs] = tf.split(inputTensors, [splitIndex, inputTensors.shape[0] - splitIndex], 0);
//     const [trainOutputs, testOutputs] = tf.split(outputTensors, [splitIndex, outputTensors.shape[0] - splitIndex], 0);
//
//     const numFeatures = inputTensors.shape[2];
//     // Создаем модель
//     const model = tf.sequential();
//     model.add(tf.layers.lstm({ inputShape: [lookbackPeriod, numFeatures], units: 128, returnSequences: true }));
//     // model.add(tf.layers.batchNormalization());
//     model.add(tf.layers.lstm({ units: 128, returnSequences: false }));
//     model.add(tf.layers.batchNormalization());
//     model.add(tf.layers.dropout({ rate: 0.2 }));
//     model.add(tf.layers.dense({ units: 128, activation: 'sigmoid' }));
//     model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
//     model.add(tf.layers.dense({ units: 13, activation: 'sigmoid' }));
//
//     // Try using RMSprop optimizer and binary crossentropy loss
//     model.compile({
//         optimizer: tf.train.rmsprop(0.001), // Add learning rate here
//         loss: 'binaryCrossentropy',
//         metrics: ['accuracy']
//     });
//
//     // Обучаем модель
//     const history = await model.fit(trainInputs, trainOutputs, {
//         epochs: 2,
//         validationData: [testInputs, testOutputs],
//         batchSize: 32,
//         callbacks: tf.node.tensorBoard('./logs')
//     });
//
//     // Оцениваем модель на тестовых данных
//     const evaluation = model.evaluate(testInputs, testOutputs);
//     console.log('Model evaluation:', evaluation);
//
//
//
//     // Прогнозируем значения на основе последнего элемента тестовых данных
//     const lastTestInput = testInputs.slice(testInputs.shape[0] - 1);
//     const lastTestOutput = model.predict(lastTestInput);
//     const lastTestOutputArray = Array.from(lastTestOutput.dataSync());
//
//     // Выводим таблицу с прогнозируемыми значениями
//     const table = new Table({
//         head: ['symbol', 'out1', 'trend'],
//         colWidths: [10, 10, 10]
//     });
//     const select = new selectData();
//     const popularSymbols = select.popularSymbols.slice()
//     for (let i = 0; i < popularSymbols.length; i++) {
//         table.push([popularSymbols[i], lastTestOutputArray[i], lastTestOutputArray[i] > 0.5 ? 'UP' : 'DOWN']);
//     }
//
//
//     console.log(table.toString());
//
//     return model;
// }





// (async () => {
//     const select = new selectData();
//     const candleData = await select.loadData()
//     const popularSymbols = select.popularSymbols.slice()
// console.log(popularSymbols)
//     // Конвертация данных свечей
//     let data = {};
//
//     for (let i = 0; i < candleData.length; i++) {
//         for (let s = 0; s < candleData[i].data.length; s++) {
//             const {symbol, open, high, low, close, volume, close_time, quote_asset_volume, number_of_trades, taker_buy_base_asset_volume, taker_buy_quote_asset_volume} = candleData[i].data[s];
//
//             if (!data[symbol]) {
//                 data[symbol] = [];
//             }
//
//             data[symbol].push(candleData[i].data[s]);
//         }
//     }
//
//     const dasd = await createTensors(data,24)
//     console.log(candleData.length)
//
//     const model = await buildAndTrainModel(dasd)
//     // console.log(model)
//
//
// })().catch((err) => console.error(err));
export default async function loadData() {
    const select = new selectData();
    const candleData = await select.loadData();
    const popularSymbols = select.popularSymbols.slice();

    // Конвертация данных свечей
    let data = {};

    for (let i = 0; i < candleData.length; i++) {
        for (let s = 0; s < candleData[i].data.length; s++) {
            const { symbol, open, high, low, close, volume, close_time, quote_asset_volume, number_of_trades, taker_buy_base_asset_volume, taker_buy_quote_asset_volume } = candleData[i].data[s];

            if (!data[symbol]) {
                data[symbol] = [];
            }

            data[symbol].push(candleData[i].data[s]);
        }
    }

    const tensors = await createTensors(data, WINDOWS_SIZE);

    const splitIndex = Math.floor(tensors.inputTensors.shape[0] * 0.8);
    const [trainInputs, testInputs] = tf.split(tensors.inputTensors, [splitIndex, tensors.inputTensors.shape[0] - splitIndex], 0);
    const [trainOutputs, testOutputs] = tf.split(tensors.outputTensors, [splitIndex, tensors.outputTensors.shape[0] - splitIndex], 0);

    return {
        trainData: {
            xs: trainInputs,
            ys: trainOutputs,
        },
        testData: {
            xs: testInputs,
            ys: testOutputs,
        },
        validData: {
            xs: testInputs,
            ys: testOutputs,
        },
        inputShape: tensors.numInput,
        outputUnits: tensors.numOutput,
    };
}

// "symbol": символ торгуемого актива (например, "BTCUSDT" - пара криптовалют Bitcoin и USDT).
// "open": цена актива на момент открытия свечи.
// "high": максимальная цена актива за интервал свечи.
// "low": минимальная цена актива за интервал свечи.
// "close": цена актива на момент закрытия свечи.
// "volume": количество актива, проданного или купленного за интервал свечи.
// "close_time": время закрытия свечи.
// "quote_asset_volume": общее количество второй валюты (например, USDT) в торгах за интервал свечи.
// "number_of_trades": количество сделок, совершенных за интервал свечи.
// "taker_buy_base_asset_volume": количество актива, купленного тейкерами за интервал свечи.
// "taker_buy_quote_asset_volume": общее количество второй валюты (например, USDT), потраченное тейкерами на покупку актива за интервал свечи.