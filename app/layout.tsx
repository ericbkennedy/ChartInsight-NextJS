/**
 * Layout file used for all user-facing page.tsx files
 */
import Link from 'next/link';
import '../public/style.css';
import SearchBar from './SearchBar';

let currentYear : number = new Date().getFullYear();

export const metadata = {
    title: "Visual Fundamental Analysis - ChartInsight",
    description: "Quarterly revenue and earnings fluctuate like stock prices. Get the big picture with insights from company insiders and leading investors",
}

export default function RootLayout({
    children,
} : {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
        <body>
            <header>
                <section>
                    <div className="logo">
                    <Link href="/" className="nU"><span className="green" translate="no">ChartInsight</span></Link>
                    </div>
                <SearchBar />
                <div>
                    {/* <Link href="/try-it-free" prefetch={false}>Free Alerts</Link> &nbsp; 
                    <Link href="/get-magic-link" prefetch={false}>Login</Link> */}
                    </div>
                </section>
            </header>
            {children}
            <div className="footer">
                <section>
                    <span className="fR">
                        <Link href="/about">About</Link> &nbsp; <Link href="/about/privacy">Privacy</Link> &nbsp; <Link href="/about/terms">Terms</Link></span>&copy; <span translate="no">ChartInsight LLC</span> {currentYear} &nbsp; <p className="tinytext">All data provided without any warranty because SEC XML files are imported via an automated process. Check original SEC filings before making any investment decision. </p>
                </section>
            </div>
        </body>
        </html>
    );
}