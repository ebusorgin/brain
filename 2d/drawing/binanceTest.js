import * as tf from '@tensorflow/tfjs-node';
import db from '../../db.js';
const DB = new db();
const popularSymbols = [
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
(async () => {
    const symbols = popularSymbols.join("', '");
    const query = `SELECT time, open, high, low, close, volume, close_time, quote_asset_volume, number_of_trades, taker_buy_base_asset_volume, taker_buy_quote_asset_volume, 'BTCUSDT' AS symbol     
      FROM binance.pair_btcusdt ORDER BY time ASC LIMIT 2`
    const res = await DB.query(query);
    console.log(res)




})().catch((err) => console.error(err));
