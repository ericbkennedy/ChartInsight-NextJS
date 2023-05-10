/**
 * Renders sparklines for Income Statement, Cash Flow and Balance Sheet.
 */

'use client';

import { useD3, formatDate, formatShares, formatMillions, convertYMToDate, DateIndex, YearMonthIndex} from '@/hooks/useD3';
import * as d3 from 'd3';

interface SparklineInit {
    metric: string;
    title: string;
    metricData: YearMonthIndex[];
}

export default function Sparkline( {metric, title, metricData}: SparklineInit) {

    const ref = useD3(
        (container) => {
            let data : DateIndex[] = convertYMToDate(metricData, metric);

            // set the dimensions and margins of the graph
            let margin = {top: 20, right: 30, bottom: 10, left: 10},
                width = 280 - margin.left - margin.right,
                height = 80 - margin.top - margin.bottom;

            // append the svg object to the body of the page
            let svg = container
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            // X axis function is used to position the path below --> it is a date format
            // @ts-ignore: d3.extent type signature should match data but d3 types may need updating
            let x = d3.scaleTime().domain(d3.extent(data, function(d) { return d.x; })).range([ 0, width ]);

            // Uncomment to show X axis in sparkline :// svg.append("g").attr("transform", "translate(0," + height + ")").call(d3.axisBottom(x));

            // Y axis function is used to position the path below
            // @ts-ignore: d3.extent type signature should match data but d3 types may need updating
            let y = d3.scaleLinear().domain(d3.extent(data, function(d) { return d.y; })).range([ height, 0 ]);

            // Uncomment to show y Axis in sparkline:  //svg.append("g").call(d3.axisLeft(y));

            // Add the line
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "black")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(function(d: any) { return x(d.x) })
                    //.defined(function(d) { return d.y; }) // Uncomment to skip null values instead of zero line
                    .y(function(d: any) {
                        if (d.y != null) {
                            return y(d.y);
                        } else {
                            return y(0);
                        }
                    })
                );

            let i = data.length - 1;
            let lastPoint = data[i];

            while (i > 0 && (lastPoint === undefined || lastPoint === null)) {
                i--;
                lastPoint = data[i];
            }
            // if it is still undefined, there is no valid data for this metric
            if (lastPoint === undefined || lastPoint === null) {
                // console.log(`no valid data for ${metric} so keep div hidden`);
                return;
            } else if (d3.select(".div" + metric).empty() === false) {   // un-hide because this company has data for this metric
                d3.selectAll(".div" + metric).classed("startHidden", false);
            }

            let focus = svg.append("g").append("circle").style("fill", "none").attr("stroke", "black").attr("r", 8.5)
                        .attr("cy", y(lastPoint.y))
                        .attr("cx", x(lastPoint.x));

            let focusText = container.select(".latest").attr("transform", `translate(${width - 5}, 10)`);

            if (metric.includes("Shares")) {
                focusText.html(`<tspan fill="#6633ff">${formatShares(lastPoint.y)}</tspan>`);
            } else {
                focusText.html(`<tspan fill="#6633ff">${formatMillions(lastPoint.y)}</tspan>`);
            }

            let focusDate = container.append("g").append("text").style("opacity", 0);

            container.on("touchmove mousemove", (event: MouseEvent) => {
                const bisect = d3.bisector(function(d: any) { return d.x}).left;
        
                let xOffset = x.invert(d3.pointer(event)[0]);
        
                let i = bisect(data, xOffset, 1) - 1;
                let selectedData = data[i];
                if (selectedData.y == null) { // Skip null values
                    focusDate.style("opacity", 0);
                } else {
        
                    focus.attr("cx", x(selectedData.x)).attr("cy", y(selectedData.y));
                    let xShift = x(selectedData.x) - 10;
                    focusText.attr("transform", "translate(" + xShift + ", 10)");
        
                    let metricLink = formatMillions(selectedData.y);            
                    if (metric.includes("Shares")) {
                        metricLink = formatShares(selectedData.y);
                    }
                    let metricIndex = bisect(data, xOffset, 1) - 1;
                    if (data[metricIndex] && data[metricIndex].uri) {
                        let url = data[metricIndex].fid > 0 ? `/fa/filing/${data[metricIndex].fid}` : "https://www.sec.gov" + data[metricIndex].uri;
                        metricLink = `<a target="_blank" href="${url}"><tspan fill="#6633ff">${metricLink}</tspan></a>`;
                    }
                    focusText.html(metricLink);
        
                    focusDate.style("opacity", 1)
                                .html(formatDate(selectedData.x)).attr("x", x(selectedData.x)).attr("y", 90);
                }
            });
        
            container.on("touchend mouseleave", (event: MouseEvent) => {
                const bisect = d3.bisector(function(d: any) { return d.x}).right;
                // move back to most recent datapoint
                let xOffset = x.invert(d3.pointer(event)[0]);
                let i = bisect(data, xOffset, 1) - 1;
        
                if (i == data.length - 1) { // Hide date when last point is selected
                    focusDate.style("opacity", 0);
                }
            });
        },
        [metricData]
    );

    // Note using className instead of id to allow repeating NetIncomeLoss under Cash Flow
    return (
        <div className={`div${metric} startHidden`}><b>{title.replace('amp;', '')}</b>:
            <svg
                ref={ref}
                className="sparkline"><text className="latest"></text>
            </svg>
        </div>
    )
}
