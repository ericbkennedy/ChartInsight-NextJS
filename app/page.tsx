/**
 * Home page is rendered using SectorPage with an empty sector filter specified.
 */

import { SectorPage } from './SectorPage';

export default async function Home() {
    let allSectors = '';
    return SectorPage(allSectors);
}