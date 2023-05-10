/**
 * List companies and 13F filers a user is following
 */

import {ReactNode} from 'react';

let email = "";
let followingStocks : ReactNode[]= [<i key="sN">None currently</i>];
let followingOwners : ReactNode[]= [<i key="iN">None currently</i>];

export default function Page() {
    return (
        <main>
            <p>When new filings are posted, an email will be sent to {email}</p>

            <h2>Companies you follow</h2>

            {followingStocks}

            <p><i>Find more companies to follow by sector:</i></p><p><a href="/Communication">Communication</a> <a href="/Consumer-Discretionary">Consumer Discretionary</a>  <a href="/Consumer-Staples">Consumer Staples</a>  <a href="/Energy">Energy</a>  <a href="/Health-Care">Health Care</a>  <a href="/Industrials">Industrials</a>  <a href="/Information-Technology">Information Technology</a>  <a href="/Materials">Materials</a>  <a href="/Real-Estate">Real Estate</a> </p>

            <h2>Investors you follow</h2>

            {followingOwners}
        </main>
    );
}