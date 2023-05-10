/**
 * API returns search results using cached URI list
 */

'use server';

import { NextResponse } from 'next/server';
import { getURIList } from '@/models/db';

export async function GET(request: Request, route: { params: { q: string }}) {
    let matches : [{}?]= [];

    let searchText = route.params.q.toLowerCase().replace(/[^0-9a-z \-']/g, ''); // Remove all other characters
    searchText = searchText.substring(0, 25);   // Test cases: O'reilley 3M Co and BRK-B

    let uriList = await getURIList();

    for (let entry of uriList) {
        let matchStart = entry[1].combined.indexOf(searchText);
        let ticker = entry[0];
        if (matchStart == 0 || matchStart == ticker.length + 1) { // matches start of ticker or name in combined
            let output = `${ticker} ${entry[1].name}`;

            if (ticker.toLowerCase() == searchText) { // insert at front of list
                matches.unshift( {n: output, u: entry[1].uri} );
            } else {
                matches.push( {n: output, u: entry[1].uri} );
            }
            if (matches.length > 9) {
                break;
            }
        }
    }
    return NextResponse.json(matches);
}