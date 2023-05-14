/**
 * Renders a company page using StockChart and Sparkline components.
 */

/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, MouseEvent, ReactNode} from 'react'
import Link from 'next/link';

import CompanyModel from '@/models/companyModel';
import Sparkline from './Sparkline';
import StockChart, {ClosingPrice} from './StockChart';
import TabSelector from '@/components/TabSelector';

export default function CompanyCharts({ stock, priceTimestamps }: { stock: any, priceTimestamps: any[]}) {

    const [metricData, setMetricData] = useState(null);
    
    // have client JS fetch fundamental core tags asynchronously using useEffect()
    useEffect(() => {
        fetch(`/api/fundamentals/${stock.id}`)
            .then((res) => res.json())
            .then((metrics) => {
                setMetricData(metrics);
            })
    }, [stock.id]);

    if (priceTimestamps.length < 1) return <p>Loading...</p>;

    let priceDateClose : ClosingPrice[] = priceTimestamps.map((row: number[]) => {
        // array of timestamp and doubles packs best into JSON so reformat to objects with Date arrays on client
        // Convert UNIXTIME in seconds to a Date (Javascript UNIXTIME is in milliseconds)
        // and return as {x, ...} obj so bisect() can use entry.x for price and metric data
        return {x: new Date(row[0]*1000), p: row[1]}; 
    });

    // Put sparklines into arrays because Map.forEach returns nothing/undefined
    let incomeStatementSparklines : ReactNode[] = [];
    let cashFlowSparklines : ReactNode[] = [];
    let balanceSheetSparklines : ReactNode[] = [];

    if (metricData !== null && metricData !== undefined) {
        CompanyModel.incomeStatement.forEach((value, key) => {
            incomeStatementSparklines.push(<Sparkline metric={key} key={key} title={value} metricData={metricData} />);
        });

        let titleCICashFlow = "Net Income"; // repeated from income statement by convention
        cashFlowSparklines.push(<Sparkline metric="NetIncomeLoss" key="CICashFlow" title={titleCICashFlow} metricData={metricData} />);

        CompanyModel.cashFlow.forEach((value, key) => {
            cashFlowSparklines.push(<Sparkline metric={key} key={key} title={value} metricData={metricData} />);
        });

        CompanyModel.balanceSheet.forEach((value, key) => {
            balanceSheetSparklines.push(<Sparkline metric={key} key={key} title={value} metricData={metricData} />);
        });
    }

    let sectorURI = '/' + stock.sector.replace(' ', '-');

    let subsector = '';
    if (stock.standardIndustrialCodeDesc && stock.standardIndustrialCodeDesc.length > 1) {
        subsector = stock.standardIndustrialCodeDesc;
    }

    let companyWebsiteLink = <></>, websiteURL = stock.companyWebsite;
    if (websiteURL && websiteURL.length > 5) {
        let companyDomain = websiteURL.substring(websiteURL.indexOf('://') + 3 ).replace('www.', '');
        if (companyDomain.indexOf('/') > 0) {
            companyDomain = companyDomain.substring(0, companyDomain.indexOf('/'));
        }
        companyWebsiteLink = <a target="_blank" rel="nofollow" href={websiteURL} className="link">{companyDomain}</a>;
    }

    let handleClickExternalLinks = (e: MouseEvent<HTMLElement>) => {
        let currentDropdown = e.currentTarget.closest("[data-dropdown]");
        if (currentDropdown) {
            currentDropdown.classList.toggle("active")
        }
    };

    return (
        <section>
            <div className="crumb"><Link href={sectorURI} prefetch={false}>{stock.sector}</Link> &rsaquo; {subsector}</div>
            <div className="companyHeader">
                <img src={`https://chartinsight.com/files/mlogo/${stock.ticker}.png`} 
                    alt={`${stock.ticker} correlated with revenue`}/>
                <h1>{stock.ticker} <span className="longTitle">Stock Price</span> Correlated With {stock.shortName}</h1>
            </div>
            <div className="fw">
                <StockChart 
                stock={stock}
                priceDateClose={priceDateClose}
                metricData={metricData} /> 
            </div>
            <div className="companyActions">
                <form className="container" method="GET" action="/try-it-free" style={{paddingTop: "12px"}}>
                    <input type="hidden" name="stockId" value="2" />
                    {/* Uncomment after user auth working <button>Get {stock.ticker} alerts</button> */}
                </form>
                <div className="dropdown" data-dropdown>
                    <div className="external" data-dropdown-button onClick={handleClickExternalLinks}>
                        External Links &#8964;
                    </div>
                    <div className="dropdown-menu">
                        <div className="dropdown-links">
                            {companyWebsiteLink}
                            {(stock.dividendAnnual && Number.isNaN(stock.dividendAnnual) === false) ?
                                <a target="_blank" rel="nofollow" href={`https://www.nasdaq.com/market-activity/stocks/${stock.ticker}/dividend-history`}>Dividend History</a>
                                : ''}
                            <a target="_blank" rel="nofollow" href={`https://finviz.com/quote.ashx?t=${stock.ticker}`} className="link">FinViz</a>
                            <a target="_blank" rel="nofollow" href={`https://www.nasdaq.com/market-activity/stocks/${stock.ticker}/real-time`}>Real-Time Quote</a>
                            <a target="_blank" rel="nofollow" href={`https://seekingalpha.com/symbol/${stock.ticker}`} className="link">SeekingAlpha</a>
                            <a target="_blank" rel="nofollow" href={`https://www.sec.gov/edgar/browse/?CIK={stock.CIK}`} className="link">SEC Filings</a>
                            <a target="_blank" rel="nofollow" href={`https://www.sec.gov/edgar/search/#/entityName=${stock.CIK.toString().padStart(10, '0')}`} className="link">SEC Search</a>
                            <a target="_blank" rel="nofollow" href={`https://www.tradingview.com/chart/?symbol=${stock.ticker}`} className="link">TradingView</a>
                            <a target="_blank" rel="nofollow" href={`https://finance.yahoo.com/quote/${stock.ticker}`} className="link">Yahoo Finance</a>
                        </div>
                    </div>
                </div>
            </div>
            <TabSelector activeIndex={0} tabText={['Income Statement', 'Cash Flow', 'Balance Sheet']}>
                <div className="group">
                    <div className="col">
                        <h3>{stock.ticker} Income Statement</h3>
                        {incomeStatementSparklines}
                    </div>
                    <div className="col">
                        <h3>{stock.ticker} Cash Flow</h3>
                        {cashFlowSparklines}
                    </div>
                    <div className="col">
                        <h3>{stock.ticker} Balance Sheet</h3>
                        {balanceSheetSparklines}
                    </div>
                </div>
            </TabSelector>
        </section>
    )
}