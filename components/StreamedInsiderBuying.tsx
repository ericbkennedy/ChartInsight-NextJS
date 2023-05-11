/**
 * Server-side streaming receives an in
 * https://nextjs.org/docs/app/building-your-application/data-fetching/fetching
 * Fetches a list of companies with insider buying from the API and adds them to the UI.
 */

import { ReactElement } from 'react'
import MiniChart from './MiniChart';

/**
 * To reduce latency, caller must call fetch(`/api/insiderBuying/${sectorAPIValue}`) and
 * wrap this component in a Suspense block so the server sends a loading indicator to the client.
 * Provide the in-progress Promise as fetchInProgress so StreamedInsiderBuying can
 * await the promise and use the response JSON to stream updated HTML to the client.
 * 
 * Sector must be a param so Next.js caching only returns data for the correct sector
 */
// eslint-disable-next-line no-unused-vars
export default async function StreamedInsiderBuying({sector, fetchInProgress}: {sector: string, fetchInProgress: Promise<Response>}) {
    let response = await fetchInProgress;

    let outputNodes: ReactElement[] = [];

    if (response && response.ok) {
        let insiderData = await response.json();
        let insiderDataArray = Array.from(insiderData);
        if (insiderDataArray.length == 0) {
            outputNodes.push(<div key='insiderDataEmpty'>No recent buying </div>);
        } else {
            outputNodes = insiderDataArray.map((r: any, i: number) => {
                            return <MiniChart stock={r} index={i} key={i} />
                            });
        }
    }

    return (<>
        {outputNodes.map(n => n)}
    </>)
}
