/**
 * Search input with autocomplete using /api/search/q API.
 */

'use client';
 
import { useRouter } from 'next/navigation';
import { FormEvent, KeyboardEvent, useState} from 'react';

interface NameURLEntry {
    n: string; 
    u: string;
}

export default function AjaxSearch() {

    const [results, setResults] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputText, setInputText] = useState('');
    const router = useRouter();

    const clearResults = () => {
        setInputText('');
        setResults(null);
    };

    const goToURI = (uri: string) => {
        clearResults();
        router.push(uri);
    };

    const handleChange = (e: FormEvent<HTMLInputElement>) => {        
        if (e.target) {
            let query = (e.target as HTMLInputElement).value;
            setInputText(query);
            fetch(`/api/search/${query}`)
                .then((res) => res.json())
                .then((results) => {
                    setSelectedIndex(0);
                    setResults(results);
                });
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { 
        if (results) {
            if (selectedIndex < Array.from(results).length && e.key == 'Enter') {
                let selectedResult : NameURLEntry = results[selectedIndex];
                if (selectedResult.u) {
                    goToURI(selectedResult.u);
                }
            } else if (e.key == 'ArrowDown' && selectedIndex + 1 < Array.from(results).length) {
                setSelectedIndex(selectedIndex + 1);

            } else if (e.key == 'ArrowDown' && selectedIndex + 1 >= Array.from(results).length) {
                setSelectedIndex(0); // wrap to start

            } else if (e.key == 'ArrowUp' && selectedIndex == 0) {
                setSelectedIndex(Array.from(results).length - 1); // wrap to end

            } else if (e.key == 'ArrowUp' && selectedIndex > 0) {
                setSelectedIndex(selectedIndex - 1); // wrap to end
            }
        }
    };

    const SearchResults = ({results} : {results: []|null}) => {
    
        const handleClick = (uri: string) => {
            goToURI(uri);
        }
    
        if (results == null) {
            return (<> </>);
        } else {
            return (<>
                    <div id="autocomplete-list" className="autocomplete-items">
                    {results && results.map((r: NameURLEntry, index: number) => {
                        return <div key={r.u}
                                className={ index == selectedIndex ? 'autocomplete-active' : 'inactive'}
                                 onClick={() => handleClick(r.u)}>{r.n}</div>
                    })}
                    </div>
                </>);
        }
    }

    return ( 
        <div id="autocomplete">
            <input id="searchBar"
                    value={inputText} 
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={clearResults}
                    maxLength={128}
                    name="q"
                    type="text"
                    aria-haspopup="false" aria-autocomplete="list" aria-activedescendant=""
                    autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} />
            <SearchResults results={results} key="autocomplete" />
        </div>
        );
    }
