/**
 * Add tabs for mobile devices or small windows.
 * Clicks on the tab titles will adjust the scrollLeft property of div#tabbedContent
 * and scroll events on div#tabbedContent will also change which tab is active.
 */

'use client';

import { MouseEvent, ReactNode } from 'react'; 

let ignoreScroll = false;
const COL_WIDTH = 300;

export default function TabSelector({children, activeIndex, tabText} : {children: ReactNode, activeIndex: number, tabText: string[]}) {
    const scrollToIndex = (e: MouseEvent<HTMLElement>, index: number) => {
        let tabIndexSelected = index;
        const desiredOffset = COL_WIDTH * tabIndexSelected;
    
        const tabItems = document.querySelectorAll('.tab');
        tabItems.forEach(tab => tab.classList.remove('active'));
    
        if (e.currentTarget) {
            e.currentTarget.classList.add('active');
        }
    
        let tabbedContent: HTMLDivElement | null = document.querySelector("#tabbedContent");
        if (tabbedContent) {
            ignoreScroll = true;  
            const currentOffset = tabbedContent.scrollLeft;          
            tabbedContent.scrollBy ({top: 0,
                    left: desiredOffset - currentOffset,
                    behavior: "smooth"});
            setTimeout(() => {
                ignoreScroll = false;   
                }, 2000);               // allows scroll listener to update tab after 2 seconds
        }
    };

    const handleScroll = (e: MouseEvent<HTMLDivElement>) => {
        const currentOffset = e.currentTarget.scrollLeft;
        const desiredOffset = Math.round(currentOffset / COL_WIDTH);
        const tabItems = document.querySelectorAll('.tab');
        let tabIndexSelected = 0;
        if (ignoreScroll === false && desiredOffset != tabIndexSelected) {
            tabItems.forEach((tab, key) => {
                if (key == desiredOffset) {
                    tab.classList.add('active');
                    tab.setAttribute('aria-selected', 'true');
                    tabIndexSelected = desiredOffset;
                } else {
                    tab.classList.remove('active');
                    tab.setAttribute('aria-selected', 'false');
                }
            });
        }
    };

    return (<>
            <div className="tabs">
            {tabText.map((title: string, i: number) => {
                return <div key={i} className={activeIndex == i ? 'tab active' : 'tab'} data-index={i} onClick={(e) => scrollToIndex(e, i)}>{title}</div>
            })}
            </div>
            <div id="tabbedContent" onScroll={handleScroll}>
                {children}
            </div>
            </>);
}