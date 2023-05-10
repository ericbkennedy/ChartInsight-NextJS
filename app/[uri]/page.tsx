/**
 * The default export Page() in this file is called for each company and sector. 
 * Company rendering is done by CompanyCharts.
 * Sector rendering is done by calling SectorPage(sectorName).
 */

import { redirect, notFound } from 'next/navigation';
import { getMySqlConnection, getURIList, URIEntry} from '@/models/db';
import CompanyCharts from './CompanyCharts';
import { SectorPage, sectors} from '../SectorPage';
import { cache } from 'react';  // https://beta.nextjs.org/docs/data-fetching/caching#manual-cache-request-deduping

function titleCase(input: string) {
    let stringParts = input.toLowerCase()
             .split(/[ -]/) // Split string into an array of words
             .map(word => word.charAt(0).toUpperCase() + word.slice(1));

   return stringParts.join(' ').replace(/And/, 'and');
}

/**
 * Return the provided name if it is a top level sector, otherwise return null.
 */
function getSectorFromURI(uri: string) {
    if (uri.length > 3) {
        let sectorName = uri.replace('-', ' ');
        if (Object.keys(sectors).includes(sectorName)) {
            return sectorName;
        } else if (Object.keys(sectors).includes(titleCase(sectorName))) {
            redirect('/' + titleCase(sectorName).replace(' ', '-'));  // e.g. /industrials to /Industrials
        }
    }
    return null;
}

/** 
 * Cache the stock query since Next calls generateMetadata() and Page() separately
 */
const getStock = cache(async (uri : string) => {

    let con = await getMySqlConnection();

    let [stock] = await con.query("SELECT * from stock where uri = ?", uri);

    return stock[0];
});

async function getPriceTimestamps(stockId: number, con: any) {

    let startDate = '2010-01-01' // Start with 2010 to avoid comparing against 2009 low
    // Note: must order by ASC (which D3 calls the `natural order`) for bisector to work
    // Note on Ubuntu mysql, DECIMAL adjClose value was returned as a string so it is cast to DOUBLE
    const [rows] = await con.query(`SELECT UNIX_TIMESTAMP(date) AS x, CAST(adjClose as DOUBLE) as adjClose
                                    FROM priceHistory
                                    WHERE stockId=? AND date>=? ORDER BY date ASC`,
                                    [stockId, startDate]);
    let priceTimestamps : number[][] = [];
    rows.forEach((row : {x : number, adjClose: number}) => {
      priceTimestamps.push([row.x, row.adjClose]); // array of arrays avoids string escaping on object keys
    })
    return priceTimestamps;
}

/**
 * Parse uri to find stock in uriList. Caller must redirect to an error on null return value
 * @param uriList Map<string, URIEntry> cached for performance and to redirect to canonical URL
 * @param uri string from request
 * @returns URIEntry | null
 */
function getCompanyInfoByTicker(uriList: Map<string, URIEntry>, uri: string) {

    let firstDashIndex = uri.indexOf('-');
    let ticker = undefined;

    let tickerWithClass = uri.match(/(\w{2,4}-\w)-/); // Handle JW-B or BRK-B

    if (tickerWithClass && tickerWithClass[1] && tickerWithClass[1].length > 2) {
        ticker = tickerWithClass[1];
        if (uriList.has(ticker) === false) { // e.g. TROW-T-Rowe-Price where ticker has no dash in it so get substring
            ticker = uri.substring(0, firstDashIndex);
        }
    } else if (uri.includes('-') && firstDashIndex > 0 && firstDashIndex <= 6) { // longest ticker is 5 chars
        if (uri.length < 6 && uriList.has(uri)) {  //
            ticker = uri; // Allows /fa/BRK-B without trailing dash
        } else {
            ticker = uri.substring(0, firstDashIndex);
        }
    } else if (uri.length <= 5) {
        ticker = uri;
    } else { // anything longer than 5 characters that wasn't picked up by the sector route must be an error
        return null;
    }

    // routing is case insensitive so we need to force upper case for comparison
    ticker = ticker.toUpperCase();

    return uriList.get(ticker);
}

/**
 * Parse the URI and respond with a sector listing (/Technology) or a company page (/AAPL-Apple) or an error
 */
export default async function Page({ params} : { params: { uri: string }} ) {
    let con = await getMySqlConnection();

    let uriList = await getURIList();

    let uri = params.uri; 

    if (uri.includes(',')) {  // Skip anything after comma in /RIVN-Rivian-Automotive,.-/-DE
        uri = uri.substring(0, uri.indexOf(','));
    }
  
    // check URI for sector first
    let sectorName = getSectorFromURI(uri);
    if (sectorName) {
        return SectorPage(sectorName);
    }
  
    let stockInfo = getCompanyInfoByTicker(uriList, uri);
    if (!stockInfo) {   // Invalid company, show a 404
        console.log(`Invalid URI ${uri}`);
        notFound();
    } else if (uri !== stockInfo.uri) { // redirect to canonical URL
        redirect('/' + stockInfo.uri);
    }

    let stock = await getStock(params.uri);

    let priceTimestamps : number[][] = [];
    if (stock && stock.id > 0) {
        priceTimestamps = await getPriceTimestamps(stock.id, con);
    }

    return (<CompanyCharts stock={stock} priceTimestamps={priceTimestamps} />); // Note: rendered on client
}

/**
 * Customize meta tags by sector or company
 */
export async function generateMetadata({ params} : { params: { uri: string }} ) {
    let title = '';
    let sector = getSectorFromURI(params.uri);

    if (sector) {
        title = `${sector} Stock Prices vs Revenue`;
    } else {
        let stock = await getStock(params.uri);
        if (stock) {
            title = stock.name;
        }
    }

    return {
        title,
    };
}
