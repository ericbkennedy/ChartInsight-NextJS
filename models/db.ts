import mysql, { ConnectionOptions } from 'mysql2/promise';

export interface URIEntry {
    id: number;
    uri: string;
    name: string;
    combined: string;
}

let _con : any = null;
const _uriList: Map<string, URIEntry> = new Map();

export async function getMySqlConnection(){
    if(_con == null){
        let config: ConnectionOptions = {
            host: process.env.MYSQL_HOST,
            port: 3306,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DB
        }
        _con = await mysql.createConnection(config);
        console.debug('DB Connection created');
        return _con;
    } else {
        return _con;
    }
}

export async function getURIList() {
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