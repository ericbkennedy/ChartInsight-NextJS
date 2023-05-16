/**
 *  API route handler for /api/{endpoint}/{stockId}
 */

const MAX_STOCK_ID : number = 6000;

import { NextResponse } from 'next/server';
import { getMySqlConnection } from '@/models/db';
import { CompanyModel } from '@/models/companyModel';

export async function GET(request: Request, route: { params: { endpoint: string, stockId: string }}) {
    let data : [{}?]= [];

    if (route && route.params && route.params.endpoint && route.params.stockId) { // valid API request
        if (route.params.endpoint == 'fundamentals') {    // api/fundamentals/{stockId}

            let stockId = parseInt(route.params.stockId);

            if (stockId > 0 && stockId < MAX_STOCK_ID) {
                data = await getSparklineData(stockId, false);
            }
        }
    }
    if (data.length == 0) {
        data.push({"error": "Sorry that request was not allowed"});
    }

    return NextResponse.json(data);
}

async function getSparklineData(stockId: number, isAdmin = false): Promise<[{}?]> {
    let con = await getMySqlConnection();
    const [rows] = await con.query(`SELECT F.fiscalPeriodFocus, F.id as fid, F.url, FDC.*
                                    FROM filingDataCombined FDC
                                    JOIN filing F on F.id = FDC.filingId and F.periodEndYearMonth = FDC.periodEndYearMonth
                                    WHERE FDC.stockId = ? AND F.skip=0 AND F.useAmendedFilingId=0 ORDER BY periodEndYearMonth DESC`,
                                    [stockId]);

    // first build an array of metrics available
    var metricTag, metricLabel;
    var metricsNN = new Map();
    var metricsFound = new Set();

    // Only use values present for the most recent 4 filings or the order will get mixed up
    for (let i = 0; i < 4 && i < rows.length; i++) {
        let r = rows[i];
        for ([metricTag, metricLabel] of CompanyModel.coreTags.entries()) {
            if (metricsFound.has(metricTag) === false && r[metricTag] != null) {
                metricsFound.add(metricTag);
            }
        }
    }

    // Show only one share count value -- Google only reports CommonStockSharesOutstanding but Boeing has that as a high water mark so mapping isn't possible
    if (metricsFound.has('WeightedAverageNumberOfDilutedSharesOutstanding') && metricsFound.has('WeightedAverageNumberOfSharesOutstandingBasic')) {
        metricsFound.delete('WeightedAverageNumberOfDilutedSharesOutstanding');
        if (metricsFound.has('CommonStockSharesOutstanding')) {
            metricsFound.delete('CommonStockSharesOutstanding');
        }
    } else if (metricsFound.has('WeightedAverageNumberOfSharesOutstandingBasic') && metricsFound.has('CommonStockSharesOutstanding')) {
        metricsFound.delete('CommonStockSharesOutstanding');    // Avoid showing both share count metrics
    }

    if (metricsFound.has('EarningsPerShareBasic') && metricsFound.has('EarningsPerShareDiluted')) {
        metricsFound.delete('EarningsPerShareDiluted'); // Only show one EPS value
    }

    // Now filter the map to only those values present in metricsFound
    for ([metricTag, metricLabel] of CompanyModel.coreTags.entries()) {
        if (metricsFound.has(metricTag)) {
            metricsNN.set(metricTag, metricLabel);
        }
    }

    let jsonOutput : [{}?] = [];

    rows.forEach( (r: any) => {

        let quarterJson : { [key: string]: any } = { pym: r.periodEndYearMonth, fpf: r.fiscalPeriodFocus, uri: r.url};
        quarterJson['fid'] = isAdmin ? r.fid : 0; // For simplicity, include fid in the output always

        for ([metricTag, metricLabel] of metricsNN.entries()) {
            if (r[metricTag] != undefined) {
                quarterJson[metricTag] = Number(r[metricTag]);  // Note, this must be converted to a number to use JSON.stringify()
            } else {
                quarterJson[metricTag] = null;
            }
        }
        jsonOutput.push(quarterJson);
    });

    return jsonOutput;
}