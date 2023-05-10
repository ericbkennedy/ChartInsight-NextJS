/**
 * The useD3 React hooks is an imperative escape hatch to allow D3.js to interact directly with the DOM.
 */ 

import React from 'react';
import * as d3 from 'd3';

/**
 * useD3 hook accepts two arguments:
 * renderChartFn is a callback that contains D3.js code to be executed
 * dependencies is a fixed-length array to tell React when to run the renderChartFn.
 */
// eslint-disable-next-line no-unused-vars
export function useD3(renderChartFn: (container: any) => any, dependencies: any[]) {
    const ref = React.useRef<SVGSVGElement>(null);

    React.useEffect(() => {
        renderChartFn(d3.select(ref.current));
        return () => {};
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [renderChartFn, ...dependencies]);
    return ref;
}

export function formatShares(val: number) {
    return d3.format(",.3s")(val).replace("G", "B"); // Billions not Giga
}

export function formatMillions(val: number) : string {
    // Use 3 significant digits above 1M
    if (val > -100 && val < 100) {
        // probably EPS so show 2 decimals e.g. for GOOG
        return d3.format("$,.2f")(val);
    } else {
        return d3.format("$,.3s")(val).replace("G", "B"); // use Billions not Giga
    }
}

export function formatDate(date: Date) : string {
    return date.toLocaleString("en", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

export function dateFromYearMonth(yearMonth: number) : Date {
    let year = parseInt(String(yearMonth).substring(0,4));
    let month = parseInt(String(yearMonth).substring(4,6));
    let lastDay = 0;

    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
        lastDay = 31;
    } else if ([4, 6, 9, 11].includes(month)) {
        lastDay = 30;
    } else if (month == 2) {
        lastDay = 28;
    }

    // Note month is zero indexed
    let dateValue = new Date(year, month - 1, lastDay)//.getTime();

    return dateValue;
}

export interface YearMonthIndex {
    pym: number;
    fpf: string;
    fid: number;
    uri: string;
}

export interface DateIndex {
    x: Date;
    y: number;
    fpf: string;
    fid: number;
    uri: string;
}

export function convertYMToDate(sourceData: YearMonthIndex[], tag: string) : DateIndex[] {
    
    let sin: DateIndex[] = [];
    sourceData.forEach(function(row: any) {
        if (isNaN(row[tag]) === false) {
            sin.unshift({x: dateFromYearMonth(row.pym), y: row[tag], fpf: row.fpf, fid: row.fid, uri: row.uri});
        }
    });
    return sin;
}