"use client";

// Last-resort boundary for errors in the root layout itself. It replaces the
// whole document, so it has no access to the layout or the theme CSS.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "12px" }}>Something went wrong</h1>
          <p style={{ color: "#555" }}>Please try again in a moment.</p>
          {error.digest && (
            <p style={{ fontFamily: "monospace", fontSize: "12px" }}>Reference: {error.digest}</p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: "16px", padding: "10px 18px", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
