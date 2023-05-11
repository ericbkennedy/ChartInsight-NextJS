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
    const [inputText, setInputText] = useState('');
    const router = useRouter();

    const goToURI = (uri: string) => {
        setInputText('');
        setResults(null);
        router.push(uri);
    };

    const handleChange = (e: FormEvent<HTMLInputElement>) => {        
        if (e.target) {
            let query = (e.target as HTMLInputElement).value;
            setInputText(query);
            fetch(`/api/search/${query}`)
                .then((res) => res.json())
                .then((results) => {
                    setResults(results);
                });
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => { 
        if (results) {
            if (Array.from(results).length > 0 && e.key == 'Enter') {
                let firstResult : NameURLEntry = results[0];
                if (firstResult.u) {
                    goToURI(firstResult.u);
                }
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
                    {results && results.map((r: NameURLEntry) => {
                        return <div key={r.u} onClick={() => handleClick(r.u)}>{r.n}</div>
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
                    maxLength={128}
                    name="q"
                    type="text"
                    aria-haspopup="false" aria-autocomplete="list" aria-activedescendant=""
                    autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} />
            <SearchResults results={results} key="autocomplete" />
        </div>
        );
    }
