"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("Checking...");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data: { status: string; project: string }) => {
        setStatus(`${data.project}: ${data.status}`);
      })
      .catch(() => {
        setStatus("Backend connection failed");
        setError(true);
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold">ChronoSearch</h1>
        <p className="mt-4">Backend status: {status}</p>
        {error && (
          <p className="mt-2 text-red-500">
            Check that the API is running and CORS is configured.
          </p>
        )}
      </div>
    </main>
  );
}
