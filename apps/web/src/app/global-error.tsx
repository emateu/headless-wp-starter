"use client";

export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#fff",
          color: "#111",
        }}
      >
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>Server error</h1>
          <p
            style={{
              marginTop: "1rem",
              fontSize: "1.125rem",
              color: "#666",
            }}
          >
            An unexpected error occurred. Please try again later.
          </p>
          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
            }}
          >
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "none",
                backgroundColor: "#111",
                color: "#fff",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a href="/" style={{ color: "#111", textDecoration: "underline" }}>
              Go to homepage
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
