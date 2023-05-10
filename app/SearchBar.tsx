/**
 * Search input with autocomplete using /api/search/q API.
 */

'use client';
 
import { useRouter } from 'next/navigation';
import { FormEvent, useState} from 'react';

export default function AjaxSearch() {

    const [results, setResults] = useState(null);
    const [inputText, setInputText] = useState('');

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

    const SearchResults = ({results} : {results: []|null}) => {
        const router = useRouter();
    
        const handleClick = (uri: string) => {
            setInputText('');
            setResults(null);
            router.push(uri);
        }
    
        if (results == null) {
            return (<> </>);
        } else {
            return (<>
                    <div id="autocomplete-list" className="autocomplete-items">
                    {results && results.map((r: {n: string, u: string}) => {
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
                    maxLength={128}
                    name="q"
                    type="text"
                    aria-haspopup="false" aria-autocomplete="list" aria-activedescendant=""
                    autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} />
            <SearchResults results={results} key="autocomplete" />
        </div>
        );
    }
