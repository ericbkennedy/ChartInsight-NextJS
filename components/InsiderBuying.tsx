/**
 * Fetches a list of companies with insider buying from the API and adds them to the UI.
 */

'use client';

import { useState, useEffect, ReactElement } from 'react'
import MiniChart from './MiniChart';

export default function InsiderBuying({ sector }: { sector: string}) {

    const [insiderData, setInsiderData] = useState(null);
    
    // have client JS fetch insider data asynchronously using useEffect()
    useEffect(() => {
        fetch(`/api/insiderBuying/${sector}`)
            .then((res) => res.json())
            .then((insiderData) => {
                setInsiderData(insiderData);
            })
    }, [sector]);

    let outputNodes: ReactElement[] = [];

    if (!insiderData) {
        outputNodes.push(<div className="gray" key='insiderDataLoading'>Loading...</div>);    // Loading state

    } else if (insiderData !== null && insiderData !== undefined) {

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