/**
 * API route handler for /api/insiderBuying/{sector} which caches the result of a slow query 
 */
import { NextResponse } from 'next/server';
import { getMySqlConnection } from '@/models/db';

const MIN_MARKET_CAP_HOME_PAGE = 10000000000; // Ten billion

/**
 * revalidate should cause Next to cache the API response for an hour
 * but it appears to rerun the slow query so the result is cached in
 * the recentInsiderBuying Map() until STALE_CACHE_THRESHOLD has passed.
 */
export const revalidate = 3600; 

const STALE_CACHE_THRESHOLD = revalidate * 1000;

export interface InsiderData {
    stockId: number;
    ticker: string;
    uri: string;
    name: string;
    titles: string;
}

// Map with sector keys has values that are Maps with ticker keys to prevent duplicate InsiderData
const recentInsiderBuying: Map<string, Map<string, InsiderData>> = new Map();
let cacheDate : Date = new Date(0);

export async function GET(request: Request, route: { params: { sector: string }}) {
    let data : InsiderData[] = [];

    if (route && route.params && route.params.sector) { // valid API request
        let sector = route.params.sector.replace('-', ' ');
        data = await getInsiderBuyingBySector(sector);
        // if (data.length == 0) {
        //     console.debug(`No insider buys for ${sector} sector`);
        // }
    }
    return NextResponse.json(data);
}

async function getInsiderBuyingBySector(sector: string): Promise<InsiderData[]> {
    let diffTime = new Date().getTime() - cacheDate.getTime();
    console.log(`Insider cache age ${diffTime} msec`);
    if (recentInsiderBuying.size == 0 || diffTime > STALE_CACHE_THRESHOLD) {
        await cacheInsiderBuying()
    }
    let insiderBuying = recentInsiderBuying.get(sector);
    if (insiderBuying && insiderBuying.size > 0) {
        return Array.from(insiderBuying.values());
    } else {
        return [];
    }
}

/**
 * Cache the result of a slow aggregate query
 */
async function cacheInsiderBuying() {
    recentInsiderBuying.clear();
    let con = await getMySqlConnection();
    let query = `SELECT S.shortName,
                        S.id,
                        S.sector,
                        S.marketCap,
                        S.ticker,
                        S.uri,
                        COUNT(F.insiderCIK) as insiderCount,
                        SUM(F.netChangeSharesDirect) as totalSharesBought,
                        SUM(F.netChangeValueDirect) as totalBuying,
                        GROUP_CONCAT(DISTINCT insiderRelationship ORDER BY insiderRelationship ASC SEPARATOR ', ') as titles
                    FROM insiderFiling F
                    JOIN stock S on S.CIK = F.CIK
                    JOIN insider I on F.insiderCIK = I.CIK
                    WHERE openMarketPurchase = 1 and F.netChangeSharesDirect > 0 and hide = 0
                    AND DATEDIFF(NOW(), F.filingDate) < 30
                    GROUP BY S.shortName, S.id, S.sector, S.marketCap, S.ticker, S.uri ORDER BY totalBuying desc limit 100`;

    const [rows] = await con.query(query);

    let homepageSet: Map<string, InsiderData> = new Map();
    recentInsiderBuying.set('All', homepageSet);
    let countOnHomepage = 0, maxOnHomepage = 14; // Limit insider listings on homepage to keep column heights similar

    rows.forEach((stock: any) => {
        let buyers: InsiderData = { stockId: stock.id, 
                                    ticker: stock.ticker,
                                    uri: stock.uri,                                    
                                    name: stock.shortName,
                                    titles: stock.titles};
                        
        
        if (stock.marketCap > MIN_MARKET_CAP_HOME_PAGE && countOnHomepage < maxOnHomepage) {
            countOnHomepage += 1;
            homepageSet.set(stock.ticker, buyers);
        }

        let sectorSet : Map<string, InsiderData> | undefined = recentInsiderBuying.get(stock.sector);
        if (!sectorSet) {
            sectorSet = new Map();
            recentInsiderBuying.set(stock.sector, sectorSet);
        }
        sectorSet.set(stock.ticker, buyers);
    });
    cacheDate = new Date();
    console.log('Cached insider buying');
}
