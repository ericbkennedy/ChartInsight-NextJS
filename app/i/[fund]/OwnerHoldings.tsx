/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';

function HoldingEntry(entry: any, currencyFormatter: any, numberFormatter: any) {

    const formatIssuerName = (entry: any) => {
        let optionOrBond = '';
        if (entry.principalSum > 0 || entry.principalDiff != 0) {
            optionOrBond = ' Bonds';
        } else if (entry.putOrCall.includes('P')) {
            optionOrBond += ' Put options';
        } else if (entry.putOrCall.includes('C')) {
            optionOrBond = ' Call options';
        }

        if (entry.issuerCIK > 0 && entry.uri) {
            return (<td>
                        <Link id={entry.ticker} href={'/' + entry.uri}>
                        {entry.ticker}&nbsp;
                        {entry.nameOfIssuer}
                        </Link>
                            {optionOrBond}
                            
                        <div className="imgPreview">
                            <img src={`https://chartinsight.com/files/mc/${entry.ticker}.png`} width={300} height={250} alt={entry.nameOfIssuer}/>
                        </div>
                    </td>);
        } else {
            return (<td>{entry.nameOfIssuer}
                        {optionOrBond}
                    </td>);
        }
    };

    let formattedValue='', formattedValueDiff='', shareCount='', shareCountDiff='', percentageChange='', color='';

    if (entry.principalSum > 0 || entry.principalDiff != 0) {
        formattedValue = currencyFormatter.format(entry.principalSum);
        if (entry.principalDiff != 0) {
            formattedValueDiff = currencyFormatter.format(entry.principalDiff);
            percentageChange = `${Math.round(entry.changeInOwnership)}%`;
            color= entry.principalDiff > 0 ? 'green' : 'red';
        }
    } else {
        formattedValue = currencyFormatter.format(entry.valueSum*1000);
        shareCount = `${numberFormatter.format(entry.sharesSum)} sh`;

        if (entry.valueDiff != 0) {
            formattedValueDiff = currencyFormatter.format(entry.valueDiff*1000);
            percentageChange = `${Math.round(entry.changeInOwnership)}%`;
            color= entry.valueDiff < 0 ? 'red' : 'green';
        }

        if (entry.sharesDiff !== 0) {
            shareCountDiff = `${numberFormatter.format(entry.sharesDiff)} sh`;
            if (entry.sharesDiff == entry.sharesSum) {
                percentageChange = `NEW`;
            } else {
                percentageChange = `${Math.round(entry.changeInOwnership)}%`;
            }
            color = entry.sharesDiff < 0 ? 'red' : 'green';
        }
    }

    return (<tr className="orow" key={entry.id}>
                {formatIssuerName(entry)}
                <td> {shareCount} </td>
                <td className={color}> {shareCountDiff} </td>
                <td className={color}> {percentageChange} </td>
                <td> {formattedValue} </td>
                <td className={color}> {formattedValueDiff} </td>
            </tr>);
}

export default function OwnerHoldings({holdings}: { holdings: [{}?] }) {

    if (!holdings || holdings.length == 0) {
        return <p><i>Incomplete filing import</i></p>;
    } else {

        let currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency',
                                            currency: 'USD', minimumFractionDigits: 0,maximumFractionDigits: 0 });
        let numberFormatter = new Intl.NumberFormat('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0});
        
        return (<table>
                    <tbody>
                    <tr key='header'>
                        <th>Company</th>
                        <th colSpan={2}>Shares</th>
                        <td>&nbsp;</td>
                        <th>Value</th>
                        <th>$ Change</th>
                        <th>&nbsp;</th>
                    </tr>
                    <tr key='subhead'>
                        <td>&nbsp;</td>
                        <td>Total</td>
                        <td>Change</td>
                        <td>%</td>
                        <td>&nbsp;</td>
                    </tr>
                    {holdings.map(row => HoldingEntry(row, currencyFormatter, numberFormatter))}
                    </tbody>
                </table>);
    }
}