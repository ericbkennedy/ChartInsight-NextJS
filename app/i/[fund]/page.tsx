/**
 * Ownership stakes and changes for featured 13F filers
 * 
 * @param fund string is the URI after /i/ for a 13F filter 
 * @returns 
 */
export default function Page({ params} : { params: { fund: string }} ) {
    return (
        <section>
            <h1>Under Construction: {params.fund}</h1>
        </section>
    );
}