import { notFound, redirect } from 'next/navigation';
import { getInsiderHoldingsForFilingId, getLatestFilingForCIK, getOwnerByURI } from '@/models/ownerModel';
import OwnerHoldings from './OwnerHoldings';
import TabSelector from '@/components/TabSelector';

const MAX_URI_LENGTH = 34; // Longer urls are likely injection attempts and are unsupported

/**
 * Ownership stakes and changes for featured 13F filers
 * 
 * @param fund string is the URI after /i/ for a 13F filter 
 * @returns 
 */
export default async function Page({ params} : { params: { fund: string }} ) {

    if (!params.fund || params.fund.length > MAX_URI_LENGTH) {
        console.log('13F owner URI not supported:', params.fund);
        notFound();
    }

    let owner = await getOwnerByURI(params.fund);

    if (!owner || owner.length == 0) {
        notFound();
    } else if (owner.URI && owner.URI != params.fund) { // redirect to correct case
        redirect(owner.URI);
    }

    let latest13F = await getLatestFilingForCIK(owner.CIK);

    let holdings = await getInsiderHoldingsForFilingId(latest13F.id);

    let tabText = [`Stocks`, `Share Change`, `Value Change`];

    return (
        <main>
            <h1>{owner.name} 13F filings</h1>
            <div className="hpad">
                {owner.managers ? <p>Manager(s): {owner.managers}</p> : null}
                <h3>Holdings as of {latest13F.periodEndDate}</h3>
                <p>Filed on <a target="_blank" href={`https://www.sec.gov${latest13F.url}`}>{latest13F.filingDate}</a>&nbsp;
                    under <a target="_blank" href={`https://www.sec.gov/cgi-bin/browse-edgar?CIK=${owner.CIK}&action=getcompany`}>CIK {owner.CIK}</a>
                </p>
                <TabSelector activeIndex={0} tabText={tabText}>
                    <div className='group'>  
                        <OwnerHoldings holdings={holdings} />
                    </div>
                </TabSelector>
            </div>
        </main>
    );
}