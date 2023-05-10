/**
 * Renders the listing of companies on the homepage (using recent filings and largest market caps),
 * and for each sector.
 */

import Link from 'next/link';
import { getMySqlConnection} from '../models/db';
import InsiderBuying from '../components/InsiderBuying';
import MiniChart from '../components/MiniChart';
import TabSelector from '../components/TabSelector';

export const sectors = {
    "Communication": "📡",
    "Consumer Discretionary": "👚",
    "Consumer Staples": "🛒",
    "Energy": "⚡",
    "Financials": "💳",
    "Health Care": "⚕",
    "Industrials": "🏭",
    "Materials": "⛏️",
    "Real Estate": "🏘",
    "Technology": "💻"
}

export async function SectorPage(sector: string) {
    let con = await getMySqlConnection();

    let sectorFilter = {};
    let sectorSQL = '';
    let title = ''
    let investorLinks = [];
    let tabText = [`Recent ${sector} Filings`, `Largest Companies`, `Insider Buying`];

    if (sector.length > 1) {
        sectorFilter = {'': 'All', ...sectors};
        sectorSQL = ` AND sector='${sector}' `;
        title = `${sector} Stock Prices vs Revenue`;

    } else {
        sectorFilter = sectors;
        tabText.push(`Leading Investors`); // Home page also shows 13F investors
        sectorSQL = ' AND dividendAnnual > 0 '; // Only show dividend paying companies on homepage
        title = 'Visual Fundamental Analysis and Insider Buying for S&amp;P 500 and Russell 2000';

        let [rows] = await con.query(`SELECT O.shortName, O.managers, O.uri
                                        FROM owner O
                                        WHERE O.priority = 0
                                        ORDER by O.name ASC`);
        for (var i = 0; i < rows.length; i++) {
            investorLinks.push({uri: rows[i].uri, name: rows[i].shortName, managers: rows[i].managers});
        }
    }

    let query = `SELECT S.id as stockId,uri,name,ticker,S.latestFilingDate
                    FROM (SELECT id,uri,name,ticker,latestFilingDate,marketCap
                            FROM stock WHERE hide = 0 ${sectorSQL} AND quarterlyDataStart < 202100
                            ORDER BY latestFilingDate DESC LIMIT 20) S
                    ORDER By latestFilingDate DESC, marketCap DESC`;
    let [recentFilings] = await con.query(query);

    query = 'SELECT S.id AS stockId,uri,name,ticker FROM stock S WHERE hide=0 ';
    if (sector) {
        query += sectorSQL;
    } else {
        query += ' AND S.id < 23 '; // Only show largest companies on homepage
    }
    let [largestStocks] = await con.query(query + ' ORDER By marketCap DESC');


    return (
    <section>
        <div className="hpad">
            <h1>{title.replace('amp;', '')}</h1>
            <p>Quarterly revenue and earnings fluctuate like stock prices. Get the big picture with insights from company insiders and leading investors.</p>
            <div className="sectorList">
                <div>Sector:</div>
                {Object.entries(sectorFilter).map(([key, value]) => (
                    <div key={key}><Link href={'/' + key.replace(' ', '-')}>
                        {String(value).length > 0 ? String(value) : ''}
                        <span>{key.replace('Consumer ', '')}</span></Link>
                    </div>
                ))}
            </div>
        </div>
        <TabSelector activeIndex={0} tabText={tabText}>
            <div className={sector.length > 0 ? 'group' : 'groupFour'}>  
                <div className="col"><h3>Recent Filings</h3>
                    {recentFilings.map( (r: any, i: number) => 
                    <MiniChart stock={r} index={i} key={r.stockId} />
                    )}
                </div>
                <div className="col"><h3>Largest Market Caps</h3>
                    {largestStocks.map( (r: any, i: number) => 
                    <MiniChart stock={r} index={i} key={r.stockId} />
                    )}
                </div>
                <div className="col"><h3>Companies With Insider Buying</h3>
                    <InsiderBuying key='insiderBuying' sector={sector||'All'} />
                </div>
                <div className={sector.length > 0 ? 'startHidden' : 'col'}><h3>13F Ownership Filings</h3>
                    {investorLinks.map( (r: {uri: string, name: string, managers: string}, i: number) => 
                        <p key={i}><Link href={'/i/' + r.uri}>{r.name}</Link><br />{r.managers}</p>
                    )}
                </div>
            </div>
        </TabSelector>
    </section>
    )
}
