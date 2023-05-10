/**
 * Users will be redirected to this page via a call to notFound() by /app/[uri]/page.tsx 
 */
export default function NotFound() {
    return (
        <main>
            <h2>Sorry we could not find what you were looking for</h2>
            <p><a href="/">Go to the ChartInsight home page</a></p>
        </main>
    );
  }