import mysql, { ConnectionOptions } from 'mysql2/promise';

export { getMySqlConnection, getURIList };

export interface URIEntry {
    id: number;
    uri: string;
    name: string;
    combined: string;
}

var _pool : any = undefined;
const _uriList: Map<string, URIEntry> = new Map();

/**
 * Get a ConnectionPool to use for queries.
 * @returns a Promise<Pool> which automatically releases connections when queries resolve
 */
async function getMySqlConnection() {
    if(_pool == undefined){
        let config: ConnectionOptions = {
            host: process.env.MYSQL_HOST,
            port: 3306,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB,
            waitForConnections: true,
            connectionLimit: 10,
            maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
            idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
            queueLimit: 0
        }
        _pool = mysql.createPool(config);
        console.debug('DB Connection Pool created');
    }
    return _pool;   // Pool will release connections automatically when queries finish
}

async function getURIList() {
    if (_uriList.size == 0) {
        let con = await getMySqlConnection();
        const [rows] = await con.query('SELECT id, ticker, uri, shortName FROM stock WHERE hide = 0');

        rows.forEach(function ({id, ticker, uri, shortName}: {id: number, ticker: string, uri: string, shortName: string}) {

            let combined = ticker.toLowerCase() + ' ' + shortName.toLowerCase();
            _uriList.set(ticker, {id, uri, name: shortName, combined});

            let dashIndex = ticker.indexOf('-');
            if (dashIndex > 0) {    // Add an entry without the dash and class
                let tickerWithoutClass = ticker.substring(0, dashIndex);
                _uriList.set(tickerWithoutClass, {id, uri, name: shortName, combined});
            }
        });
        console.log('cached URIList');

        return _uriList;
    } else {
        return _uriList;
    }
}