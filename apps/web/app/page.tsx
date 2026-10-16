"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";

interface RagResponse {
  question: string;
  targetDate: string;
  answer: string;
  retrievedChunks: number;
}

export default function Home() {
  // Backend connection status.
  const [status, setStatus] = useState("Checking...");
  const [error, setError] = useState(false);

  // Search form state.
  const [question, setQuestion] = useState("");
  const [targetDate, setTargetDate] = useState("2025-06-01");

  // Search request state.
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [result, setResult] = useState<RagResponse | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check whether the Express backend is running when the page loads.
  useEffect(() => {
    if (!API_URL) {
      setStatus("API URL is not configured");
      setError(true);
      return;
    }
    fetch(`${API_URL}/health`)
      .then((response) => {
        if (!response.ok)
          throw new Error("Backend request failed");
        return response.json();
      })
      .then((data: { status: string, project: string }) => {
        setStatus(`${data.status}: (${data.project})`);
        setError(false);
      })
      .catch(() => {
        setStatus("Backend connection failed");
        setError(true);
      })
  }, [API_URL]);

  // Submit the question and target date to the existing RAG API
  async function handleSearch(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchError("");
    setResult(null);
    if (!API_URL) {
      setSearchError("NEXT_PUBLIC_API_URL is not configured.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          targetDate
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to get an answer.");
      }
      // Save the response so the result section can display it.
      setResult(data as RagResponse);
    } catch (err) {
      setSearchError(
        err instanceof Error ?
          err.message :
          "Failed to get an answer, please try again later."
      );
    } finally {
      setLoading(false);
    }

  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">ChronoSearch</h1>
        <p className="mt-2">
          Ask questions and retrieve answers grounded in historically valid
          documents.
        </p>

        <p className="mt-3 text-sm">
          Backend status: {status}
        </p>

        {error && (
          <p className="mt-2 text-sm text-red-600">
            Check that the Express API is running and the API URL is configured.
          </p>
        )}
      </header>

      <section className="rounded-lg border p-5">
        <h2 className="mb-4 text-xl font-semibold">Ask ChronoSearch</h2>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="question" className="mb-2 block font-medium">
              Your question
            </label>

            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What was the annual equipment allowance?"
              required
              rows={3}
              className="w-full rounded-md border p-3"
            />
          </div>

          <div>
            <label htmlFor="targetDate" className="mb-2 block font-medium">
              Answer as of date
            </label>

            <input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              required
              className="rounded-md border p-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim() || !targetDate}
            className="rounded-md border px-5 py-2 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {searchError && (
          <p role="alert" className="mt-4 text-red-600">
            {searchError}
          </p>
        )}
      </section>

      {result && (
        <section className="mt-6 rounded-lg border p-5">
          <h2 className="text-xl font-semibold">Answer</h2>

          <p className="mt-3 whitespace-pre-wrap">{result.answer}</p>

          <div className="mt-4 border-t pt-3 text-sm">
            <p>Question: {result.question}</p>
            <p>Target date: {result.targetDate}</p>
            <p>Retrieved chunks: {result.retrievedChunks}</p>
          </div>
        </section>
      )}
    </main>
  );
}
