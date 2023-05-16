/**
 * Primary metrics shown for each company under Income Statement, Cash Flow, and Balance Sheet
 * The union of these three maps are the coreTags returned by the fundamentals API.
 */

const balanceSheet    : Map<string, string> = new Map();
const cashFlow        : Map<string, string> = new Map();
const coreTags        : Map<string, string> = new Map();
const incomeStatement : Map<string, string> = new Map();
const requiredMetrics : Map<string, string[]> = new Map();  // values are alternate tags

export const CompanyModel = {
    balanceSheet,
    cashFlow,
    coreTags,
    incomeStatement,
    requiredMetrics,
};

incomeStatement.set("SalesRevenueNet", "Revenue, Net");
incomeStatement.set("CIRevenuePerShare", "Revenue Per Share");
//                   ___________

incomeStatement.set("CostOfGoodsAndServicesSold", "Cost of Goods &amp; Services Sold");

incomeStatement.set("GrossProfit", "Gross Profit");
//                   ___________

// Operating expenses:
incomeStatement.set("SellingGeneralAndAdministrativeExpense", "Selling, General &amp; Admin Expense");
incomeStatement.set("ResearchAndDevelopmentExpense", "Research &amp; Development Expense");

incomeStatement.set("OperatingExpenses", "Total Operating Expenses");
//                   _________________

// Pre-tax income
incomeStatement.set("OperatingIncomeLoss", "Operating Income");
incomeStatement.set("IncomeTaxExpenseBenefit", "Income Taxes");
//                   _______________________

incomeStatement.set("NetIncomeLoss", "Net Income");
//                   _____________
// getSparkLineMetrics will only show one EPS metric, preferably EarningsPerShareBasic
incomeStatement.set("EarningsPerShareDiluted", "Earnings Per Share, Diluted");
//                   _______________________
incomeStatement.set("EarningsPerShareBasic", "Earnings Per Share, Basic");
//                   _____________________

// Note the share count is after the end of the quarter (dated with the report itself)
incomeStatement.set("WeightedAverageNumberOfSharesOutstandingBasic", "Shares Outstanding, Basic Avg");
incomeStatement.set("WeightedAverageNumberOfDilutedSharesOutstanding", "Shares Outstanding, Diluted Avg");

incomeStatement.set("CommonStockSharesOutstanding", "Common Stock Shares Outstanding"); // Used by GOOG. getSparklineData() will only return one Share metric

// NOTE: Cash Flows are reported fiscal-year-to-date so prior quarters must be deducted from each value,
// making the mapping process more difficult
cashFlow.set("DepreciationDepletionAndAmortization", "Depreciation, Depletion &amp; Amortization");
cashFlow.set("IncreaseDecreaseInAccountsReceivable", "Change in Accounts Receiveable");
cashFlow.set("NetCashProvidedByUsedInOperatingActivities", "Net Cash from Operations");
cashFlow.set("CINetCashFromOpsPerShare", "Net Cash from Operations Per Share");
//            __________________________________________

// Financing
cashFlow.set("PaymentsForRepurchaseOfCommonStock", "Repurchases/Buybacks Common Stock");
cashFlow.set("ProceedsFromIssuanceOfLongTermDebt", "Issuance of Long-term Debt");
cashFlow.set("PaymentsOfDividends", "Cash Dividends Paid")
cashFlow.set("NetCashProvidedByUsedInFinancingActivities", "Net Cash from Financing Activities");
//            __________________________________________

// Investing
// NOTE: AMZN calculates FreeCashFlow as OperatingCashFlow minus a version of PaymentsToAcquirePropertyPlantAndEquipment
cashFlow.set("PaymentsToAcquirePropertyPlantAndEquipment", "Property, Plant &amp; Equipment Purchases");
cashFlow.set("PaymentsToAcquireBusinessesNetOfCashAcquired", "Purchases of Businesses, Net of Cash");
cashFlow.set("NetCashProvidedByUsedInInvestingActivities", "Net Cash from Investing Activities");
//            __________________________________________

cashFlow.set("CashAndCashEquivalentsPeriodIncreaseDecrease", "Net Change in Cash &amp; Equivalents");

/* Required metrics

Some companies will report OperatingExpenses but not CostOfGoodsAndServicesSold (or vice versa).

It doesn't make sense to map those values in extraTagMapping since they aren't exactly the same,
however each filing should have a value for one or the other.

requiredMetrics allows identifying filings that are missing BOTH CostOfGoodsAndServicesSold and OperatingExpenses (after mapping),
or missing BOTH EarningsPerShareBasic and EarningsPerShareDiluted.
*/

// Income statement values
requiredMetrics.set("SalesRevenueNet", [] );
requiredMetrics.set("OperatingExpenses", ["CostOfGoodsAndServicesSold"] );
requiredMetrics.set("CostOfGoodsAndServicesSold", ["OperatingExpenses"]);
requiredMetrics.set("OperatingIncomeLoss", []);
requiredMetrics.set("NetIncomeLoss", [] );
requiredMetrics.set("EarningsPerShareBasic", ["EarningsPerShareDiluted"] );
requiredMetrics.set("WeightedAverageNumberOfSharesOutstandingBasic", ["WeightedAverageNumberOfDilutedSharesOutstanding"] );
requiredMetrics.set("WeightedAverageNumberOfDilutedSharesOutstanding", ["WeightedAverageNumberOfSharesOutstandingBasic"] );

// Cash flow
requiredMetrics.set("NetCashProvidedByUsedInOperatingActivities", [] );
requiredMetrics.set("NetCashProvidedByUsedInFinancingActivities", [] );
requiredMetrics.set("NetCashProvidedByUsedInInvestingActivities", [] );

// Balance sheet values (most but not all companies provide Current and Noncurrent values)
requiredMetrics.set("Assets", [] );
requiredMetrics.set("Liabilities", [] );


// Current assets
// TODO: fix handling of reporting of CashAndCashEquivalents at both start and end of quarter
balanceSheet.set("CashAndCashEquivalentsAtCarryingValue", "Cash and Cash Equivalents"); // reported twice per filing (period start and end)
balanceSheet.set("AvailableForSaleSecurities", "Short-Term Investments");
//                _____________
// Other current assets: (some companies don't provide `current` subtotal)
balanceSheet.set("AccountsReceivableNetCurrent", "Accounts Receivable, Net"); // XOM has gaap_ReceivablesNetCurrent
balanceSheet.set("InventoryNet", "Inventories");
balanceSheet.set("AssetsCurrent", "Total Current Assets");
//                _____________

// Non-current assets
balanceSheet.set("PropertyPlantAndEquipmentNet", "Property, Plant &amp; Equipment, Net");
//                _____________
balanceSheet.set("Assets", "Total Assets");
//                ______

// Current liabilities (some companies don't provide `current` subtotal)
balanceSheet.set("AccountsPayableCurrent", "Accounts Payable");
balanceSheet.set("LongTermDebtCurrent", "Current Portion of Long-Term Debt");
balanceSheet.set("LiabilitiesCurrent", "Total Short-Term Liabilities");        // due within following 12 months
//                __________________
// Non-current liabilities:
balanceSheet.set("LongTermDebtNoncurrent", "Long Term Debt, Non-Current Portion");
balanceSheet.set("LiabilitiesNoncurrent", "Total Long-Term Liabilities");        // due within following 12 months
balanceSheet.set("Liabilities", "Total Liabilities");
//                ___________

balanceSheet.forEach((value: string, key: string) => coreTags.set(key, value));

cashFlow.forEach((value: string, key: string) => coreTags.set(key, value));

incomeStatement.forEach((value: string, key: string) => coreTags.set(key, value));
