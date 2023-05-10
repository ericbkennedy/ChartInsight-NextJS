/**
 * Renders comparison chart of stock price and company revenue per share using useD3 hook.
 */

'use client';

import { useD3, convertYMToDate, YearMonthIndex, DateIndex} from '@/hooks/useD3';
import React, {useState} from 'react';
import * as d3 from 'd3';

export interface ClosingPrice {
    x: Date;
    p: number;
}

interface StockChartInit {
    stock: { quarterlyDataStart: number, ticker: string};
    priceDateClose: ClosingPrice[];
    metricData: YearMonthIndex[] | null;
}

export default function StockChart({ stock, priceDateClose, metricData }: StockChartInit) {

    const dataStartYear = Math.floor(stock.quarterlyDataStart / 100);    // won't change for a stock
    const [chartStartYear, setChartStartYear] = useState(dataStartYear); // change via SelectStartYear
    const [comparisonMetric, setComparisonMetric] = useState('CIRevenuePerShare');
    const [useLogScale, setUseLogScale] = useState(false);
    
    function handleComparisonMetricChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setComparisonMetric(e.target.value);
    }

    function handleChartStartYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
        setChartStartYear(parseInt(e.target.value));
    }

    const ref = useD3(
        (container) => {
            if (!priceDateClose || priceDateClose.length < 1) {
                return;
            }

            d3.selectAll(".noJS").remove();
            let containerWidth = container.node().getBoundingClientRect().width;
            let leftPad = 39, rightPad = 49, rectPad = 4;
            let margin = {top: 10, right: rightPad, bottom: 20, left: leftPad}, // actual margin needed for AMZN chart on Ubuntu
                width = containerWidth - margin.left - margin.right,
                height = 250 - margin.top - margin.bottom;

            container.selectAll("*").remove();  // remove all children

            // Now append back left axis callout 
            container.append("text").attr("id", "leftTickTicker").text(stock.ticker);

            let svg = container
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            if (document.getElementById("yearSelectbox") !== null) {
                let firstYearToShow = parseInt((document.getElementById("yearSelectbox") as HTMLInputElement).value);
                priceDateClose = priceDateClose.filter(entry => entry.x.getFullYear() >= firstYearToShow);
            }

            // X axis function is used to position the path below --> it is a date format
            // @ts-ignore: d3.extent type signature should match priceDataClose but d3 types may need updating
            let x = d3.scaleTime().domain(d3.extent(priceDateClose, function(d) { return d.x; })).range([ 0, width ]);


            // One xAxis tick per year
            let xAxisTicks = 1;
            let yearRange = d3.extent(priceDateClose, function(d) { return d.x.getFullYear(); });
            if (yearRange && yearRange[0] && yearRange[1] && yearRange[1] > yearRange[0]) {
                xAxisTicks = yearRange[1] - yearRange[0];
            }

            let xAxis = d3.axisBottom(x).ticks(xAxisTicks).tickFormat(d3.timeFormat("'%y"));
            svg.append("g").attr("transform", "translate(0," + height + ")").call(xAxis).attr("class", "gray")

            let [leftMin, leftMax] = d3.extent(priceDateClose, function(d) { return d.p; });

            let rightMin = leftMin, rightMax = leftMax;
            let metricDataFiltered : DateIndex[] = [];
            if (metricData !== null && metricData !== undefined && metricData.length > 0) {
                metricDataFiltered = convertYMToDate(metricData, comparisonMetric);
            
                [rightMin, rightMax] = d3.extent(metricDataFiltered, function(d) { return d.y;});

                if (priceDateClose && priceDateClose.length > 1) {  // filter out metrics prior to the first stock priceDateClose
                    metricDataFiltered = metricDataFiltered.filter(entry => entry.x.getFullYear() >= priceDateClose[0].x.getFullYear());
                } else {
                    return; // if priceDateClose is still missing
                }
            }

            leftMin = (leftMin as number); // cast unassigned to 0
            leftMax = (leftMax as number); 
            rightMin = (rightMin as number);
            rightMax = (rightMax as number); 

            let scaleSelector = document.querySelector("#changeScale") as HTMLElement;
            
            if (rightMin <= 0) { // disable log 
                if (scaleSelector) {
                    scaleSelector.style.display = "none";
                }
                if (useLogScale) {  // reset to false
                    setUseLogScale(false);
                }
                rightMin = 0;
            } else {        
                let leftRatio = leftMax / leftMin;
                let rightRatio = rightMax / rightMin;
                
                let scaleAdjustment = leftRatio / rightRatio;
                
                if (scaleAdjustment < 1 && scaleAdjustment > 0.01) { // right scale increases more than left
                    leftMax /= scaleAdjustment;
                } else if (Math.abs(scaleAdjustment) < 0.01) {
                    console.log(`scaleAdjustment ${scaleAdjustment} too close to zero so allowing each series to fill chart`);
                } else {
                    rightMax *= scaleAdjustment;
                }
            }
            
            // Y axis function is used to position the path below
            let y0: any, y1: any;
            if (useLogScale) {
                y0 = d3.scaleLog().base(2).range([ height, 0 ]).domain([leftMin, leftMax]).nice();
                // Note: log scale doesn't work with negative revenue. Even using Math.max(1, d.y) makes for a useless chart
                // Set 0 as minimum y axis value since stock price can never be negative
                y1 = d3.scaleLog().base(2).range([height, 0]).domain([rightMin, rightMax]).nice();        
            } else {
                y0 = d3.scaleLinear().range([ height, 0 ]).domain([leftMin, leftMax]).nice();
                // Note: log scale doesn't work with negative revenue. Even using Math.max(1, d.y) makes for a useless chart
                // Set 0 as minimum y axis value since stock price can never be negative
                y1 = d3.scaleLinear().range([height, 0]).domain([rightMin, rightMax]).nice();  
            }

            var yAxisLeft = d3.axisLeft(y0).scale(y0).ticks(5, ".0f");
            svg.append("g").call(yAxisLeft).attr("color", "#999999");

            container.select(".pht").attr("x", (width + leftPad)/2 ).attr("transform", "translate(0, 10)");

            // Add the stock chart which uses the left-hand y0 axis
            svg.append("path")
                .datum(priceDateClose)
                .attr("fill", "none")
                .attr("stroke", "#999999")
                .attr("stroke-width", 1)
                .attr("d", d3.line()
                .x(function(d: any) { return x(d.x) })
                .y(function(d: any) { return y0(d.p) })
                );

            if (!metricData || metricData.length < 1) {
                // console.log('metricData not loaded yet');
                return;
            }

            let metricTextMapping : { [index: string]: string } = {"CIRevenuePerShare": "Q Revenue Per Share",
                                    "EarningsPerShareBasic": "Q Earnings Per Share",
                                    "CINetCashFromOpsPerShare": "Q Cash From Ops Per Share"};

            let yAxisLabel = metricTextMapping[comparisonMetric];

            var yAxisRight = d3.axisRight(y1).scale(y1).ticks(5);
            svg.append("g").attr("transform", "translate(" + width + " ,0)").call(yAxisRight).attr("color", "#6633ff")
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 23)
                .attr("x", -leftPad)    // adjusts vertical position due to 90 degree transform
                .attr("dy", "1.71em")
                .style("text-anchor", "end")
                .style("fill", "#6633ff")
                .text(yAxisLabel);

            // Add metricData line
            svg.append("path")
                .datum(metricDataFiltered)
                .attr("fill", "none")
                .attr("class", "metric")
                .attr("stroke", "#6633ff")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .defined(function(d: any) { return d.y; }) // skip null values
                    .x(function(d: any) { return x(d.x) })
                    .y(function(d: any) { return y1(d.y) })
                );

            let metricTTM : [{x: Date, y: number}?] = [], TTM = 0;

            for (let i = 0; i < metricDataFiltered.length; i++) {
                if (metricDataFiltered[i].y) {
                    TTM += metricDataFiltered[i].y;
                }
                if (i >= 4) {
                    if (metricDataFiltered[i-4].y) {
                        TTM -= metricDataFiltered[i-4].y;
                    }
                    metricTTM[i-4] = {x: metricDataFiltered[i].x, y: (TTM / 4) };
                }
            }

            // Add TTM of metricData
            svg.append("path")
                .datum(metricTTM)
                .attr("fill", "none")
                .attr("stroke", "#6633ff")
                .attr("stroke-width", 0.5)
                .attr("d", d3.line()
                    .defined(function(d: any) { return d.y; }) // skip null values
                    .x(function(d: any) { return x(d.x) })
                    .y(function(d: any) { return y1(d.y) })
                );

            function resetRightTickValue(metricIndex = 0) : string {
                if (metricIndex == 0) {
                    metricIndex = metricDataFiltered.length - 1;
                }
                let lastMetricValue = metricDataFiltered[metricIndex]
                let lastMetricValueText = "";
                if (lastMetricValue && lastMetricValue.y) {
                    lastMetricValueText = Number(lastMetricValue.y).toFixed(2);
                    rightTickRect.attr("y", y1(lastMetricValue.y)).attr("width", 6 * lastMetricValueText.length + rectPad);
                    rightTickText.attr("y", y1(lastMetricValue.y) + 3*rectPad).html(lastMetricValueText);
                }
                return lastMetricValueText;
            }

            var verticalLine = svg.append("line").style("opacity", 0).attr("stroke", "#AAAAAA").attr("stroke-width", 1)
                                    .attr("y1", 10).attr("y2", 190);

            var focusText = container.append("g").append("text").style("opacity", 0).attr("x", width).attr("y", rectPad);

            var rightTickRect = container.append("g").append("rect").style("fill", "#ffffff").attr("stroke", "#6633ff")
                                        .attr("stroke-width", 1)
                                        .attr("width", 3*rectPad).attr("height", 4*rectPad)
                                        .attr("x", width + leftPad).attr("y", rectPad).style("opacity", 1);
            var rightTickText = container.append("g").append("text").style("fill", "#6633ff").style("opacity", 1)
                                        .attr("x", width + leftPad + 1).attr("y", 0);

            resetRightTickValue();

            let priceHistoryLength = priceDateClose.length - 1;
            let lastQuote = priceDateClose[priceHistoryLength]
            if (lastQuote && lastQuote.p > 0) {
                let tickerText = d3.select("#leftTickTicker");
                tickerText.attr("x", 1).attr("y", y0(lastQuote.p) + 3*rectPad);
                let tickerWidth = leftPad; // default
                let tickerTextNode : SVGTextElement = tickerText.node() as SVGTextElement; 
                const computedTextWidth = tickerTextNode.getComputedTextLength();
                if (computedTextWidth && computedTextWidth > leftPad) {
                    tickerWidth = computedTextWidth + 2;
                }
                // Now add box sized around ticker at location of last price quote
                container.append("g").append("rect").style("fill", "#ffffff").attr("stroke", "#999999")
                .attr("stroke-width", 1)
                .attr("width", 3*rectPad).attr("height", 4*rectPad)
                .attr("x", 0).attr("y", rectPad).style("opacity", 1)
                .attr("y", y0(lastQuote.p)).attr("width", tickerWidth);
        
                // Now raise the text above the opaque box
                d3.select("#leftTickTicker").raise();
            }
        
            var focusDate = container.append("g").append("text").style("opacity", 0);
        
            container.on("touchmove mousemove", (event: React.MouseEvent) => {
                // Note the objects in the array must be in ASC order for the bisector to return a value
                const bisect = d3.bisector(function(d: {x: Date}) { return d.x}).right;
                var xOffset = x.invert(d3.pointer(event)[0] - leftPad);   // Offset to center text
                var i = bisect(priceDateClose, xOffset, 1) - 1;
                var selectedData = priceDateClose[i];
                verticalLine.attr("x1", x(selectedData.x)).attr("x2", x(selectedData.x)).style("opacity", 1);
                focusText.attr("x", x(selectedData.x)).attr("y", 10);
        
                var metricIndex = bisect(metricDataFiltered, xOffset, 1) - 1;
                let metricLink : string = resetRightTickValue(metricIndex);  
                if (metricDataFiltered[metricIndex] && metricDataFiltered[metricIndex].fpf && metricDataFiltered[metricIndex].uri) {
                    metricLink = `<a target="_blank" href="https://www.sec.gov${metricDataFiltered[metricIndex].uri}">
                                    <tspan fill="#6633ff">${metricDataFiltered[metricIndex].fpf}: ${metricLink}</tspan></a>`;
                }
                
                focusText.html(metricLink).style("opacity", 1); // style can only be applied within tspan since this is a svg text element
        
                // show the precise date below the x Axis
                var shortDate = "$" + Math.round(selectedData.p) + " " + selectedData.x.toLocaleString("en", { month: "short", day: "numeric" });
        
                focusDate.style("opacity", 1)
                            .html(shortDate).attr("x", x(selectedData.x)).attr("y", height + 9);
            });
        
            container.on("touchend mouseleave", () => {
                verticalLine.style("opacity", 0);
                focusText.style("opacity", 0);
                focusDate.style("opacity", 0);
                resetRightTickValue();
            });

        },
        [priceDateClose.length, metricData, comparisonMetric, chartStartYear]
    );
    
    const SelectStartYear = ({dataStartYear, chartStartYear}: {dataStartYear: number, chartStartYear: number} ) => {
        let currentYear = new Date().getFullYear();
        let years : any[] = []; //: Array<selectObjType> = [];  // type selectObjType = { value: string; label: string; };
        let calculatedYear = dataStartYear;

        while (calculatedYear < currentYear) {
            let yearDiff = currentYear - calculatedYear;
            years.push({value: calculatedYear.toString(), label: `${yearDiff} Y` });
            calculatedYear++;
        }
        if (years.length == 0) {    // Ensure selectbox always has one option even for recent IPOs
            years.push({value: calculatedYear.toString(), label: `1 Y`});
        }
    
        return (
            <select id="yearSelectbox" onChange={handleChartStartYearChange} value={chartStartYear} title="Choose years of data to display">
                {years.map(({ label, value }) => (
                        <option value={value} key={value}>{label}</option>
                    ))}
            </select>
        )
    }

    return (
    <>
        <div id="stockChartTitle">{stock.ticker} 
            <span className="longTitle"> Stock Price</span> vs. Quarterly
            <select id="metricSelectbox" onChange={handleComparisonMetricChange} title="Choose metric to compare to stock price">
                <option value="CIRevenuePerShare">Revenue</option>
                <option value="EarningsPerShareBasic">Earnings</option>
                <option value="CINetCashFromOpsPerShare">Cash From Ops</option>
            </select>
            <SelectStartYear dataStartYear={dataStartYear} chartStartYear={chartStartYear} />
        </div>
        <svg
            ref={ref}
            id="priceHistory"
            className="sparkline">
            <text id="leftTickTicker">{stock.ticker}</text>
            <text className="latest"></text>
        </svg>
    </>
    );
}
