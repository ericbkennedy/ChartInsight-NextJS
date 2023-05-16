import { getMySqlConnection} from '@/models/db';

export {
    getInsiderHoldingsForFilingId,
    getLatestFilingForCIK,
    getOwnerByURI,
}

/**
 * Owner lookup using the lowercase URI
 * @param uri string URI excluding leading /i/ in /i/Altimeter-Capital-Management 
 * @returns {} | null
 */
async function getOwnerByURI(uri: string) {
    let con = await getMySqlConnection();
    let [rows] = await con.query(`SELECT id, CIK, name, shortName, form13FFileNumber, URI, managers
                                    FROM owner O
                                    WHERE LOWER(uri) = LOWER(?) AND O.priority = 0`, uri);
    if (rows && rows.length == 1) {
        return rows[0];
    }
    return null;
}

/**
 * Latest 13F filing based on the ownerFiling.CIK 
 * @param CIK number
 * @returns {} | null
 */
async function getLatestFilingForCIK(CIK: number) {
    let con = await getMySqlConnection();
    let [rows] = await con.query(`SELECT id,
                                        LEFT(periodEndDate,10) as periodEndDate,
                                        periodEndYearMonth,
                                        LEFT(filingDate, 10) as filingDate,
                                        filingType,
                                        otherIncludedManagersJSON,
                                        url
                                    FROM ownerFiling
                                    WHERE CIK = ?
                                    AND importedHoldings > 0 AND filingType LIKE '13F%'
                                    ORDER BY periodEndDate DESC LIMIT 1`, [CIK]);
    if (rows && rows.length == 1) {
        return rows[0];
    }
    return null;
}

async function getInsiderHoldingsForFilingId(filingId: number) {
    let con = await getMySqlConnection();

    let [rows] = await con.query(`SELECT filingId,
                                C.nameOfIssuer,
                                C.titleOfClass,
                                C.issuerCIK,
                                OFE.CUSIP,
                                valueSum,
                                valueDiff,
                                sharesSum,
                                sharesDiff,
                                principalSum,
                                principalDiff,
                                changeInValue,
                                changeInOwnership,
                                putOrCall,
                                IFNULL(investmentDiscretion, '') as investmentDiscretion,
                                IFNULL(otherManagers, '') as otherManagers,
                                S.ticker,
                                S.uri
                            FROM ownerFilingInsight OFE
                            LEFT OUTER JOIN cusipInfo C ON OFE.CUSIP = C.CUSIP
                            LEFT OUTER JOIN stock S ON C.issuerCIK > 0 AND C.issuerCIK=S.CIK and 0 = S.hide 
                            WHERE filingId = ?
                            ORDER by valueSum DESC, valueDiff ASC, nameOfIssuer ASC`, [filingId]);

    if (rows.length == 0) { // no cached insight so run aggregate query
        [rows] = await con.query(`SELECT filingId,
                                        C.nameOfIssuer,
                                        C.titleOfClass,
                                        C.issuerCIK,
                                        OFE.CUSIP,
                                        sum(OFE.value) as valueSum,
                                        0 as valueDiff,
                                        sum(OFE.shares) as sharesSum,
                                        0 as sharesDiff,
                                        sum(OFE.principal) as principalSum,
                                        sum(OFE.principal) as principalDiff,
                                        0 as changeInOwnership,
                                        0 as changeInValue,
                                        putOrCall,
                                        GROUP_CONCAT(DISTINCT investmentDiscretion) as investmentDiscretion,
                                        GROUP_CONCAT(DISTINCT otherManager) as otherManagers,
                                        S.ticker,
                                        S.uri
                                    FROM ownerFilingEntry OFE
                                    LEFT OUTER JOIN cusipInfo C ON OFE.CUSIP = C.CUSIP
                                    LEFT OUTER JOIN stock S ON C.issuerCIK > 0 AND C.issuerCIK=S.CIK and 0 = S.hide 
                                                WHERE filingId = ?
                                                GROUP BY filingId, cusip, putOrCall, S.uri, S.ticker
                                                ORDER by nameOfIssuer ASC`, [filingId]);
    }
    return rows;
}