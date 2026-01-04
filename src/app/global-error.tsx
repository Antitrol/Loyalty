'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    // Log error details to console for debugging
    console.error('Global error caught:', error);

    return (
        <html>
            <body style={{ padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ color: '#dc2626' }}>Something went wrong!</h2>

                    <div style={{
                        background: '#fee',
                        padding: '15px',
                        borderRadius: '8px',
                        marginTop: '20px',
                        marginBottom: '20px'
                    }}>
                        <h3>Error Details:</h3>
                        <p><strong>Message:</strong> {error.message}</p>
                        {error.digest && <p><strong>Digest:</strong> {error.digest}</p>}

                        {error.stack && (
                            <details style={{ marginTop: '10px' }}>
                                <summary style={{ cursor: 'pointer' }}>Stack Trace</summary>
                                <pre style={{
                                    overflow: 'auto',
                                    fontSize: '12px',
                                    background: '#fff',
                                    padding: '10px',
                                    borderRadius: '4px'
                                }}>
                                    {error.stack}
                                </pre>
                            </details>
                        )}
                    </div>

                    <button
                        onClick={() => reset()}
                        style={{
                            padding: '10px 20px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
