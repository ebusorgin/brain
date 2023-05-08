import pg from 'pg';

const { Client } = pg;

export default class Db {
    constructor() {
        this.db = new Client({
            user: 'postgres',
            host: 'localhost',
            database: 'postgres',
            password: 'postgres',
            port: 5432,
        });
        this.db.connect();
    }
    async query(query,params = []) {
        const result = await this.db.query(query,params);
        return result.rows
    }

    async exportDataToDB() {
        const data = JSON.stringify(this.net.toJSON());
        await this.db.query('UPDATE neyron_data SET data = $1 WHERE id = 1', [data]);
    }

}
