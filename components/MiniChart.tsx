/**
 * Renders a link with a company name, small stock chart and optionally the titles of insiders who bought recently.
 * Will set loading=lazy after the 10th MiniCharts in a group.
 */
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

export default function MiniChart({stock, index}: {stock: any, index: number}) {
    return (
        <div key={stock.stockId}>
            <Link href={stock.uri} prefetch={false}>{stock.name}</Link><br />
                {stock.titles && <i>{stock.titles}</i>}
            <Link href={stock.uri} prefetch={false}>
                <img src={"https://chartinsight.com/files/mc/" + stock.ticker + ".png"} 
                loading={index > 5 ? "lazy" : "eager" } 
                width="300" height="250" alt={stock.ticker + " stock chart compared to revenue"} />
            </Link>
        </div>
    );
}