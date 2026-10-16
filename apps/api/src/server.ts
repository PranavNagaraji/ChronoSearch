import express from "express";
import cors from "cors";
import { answerQuestion } from "./rag.js";

const app = express();
const PORT = 3000;

app.use(
    cors({
        origin: "http://localhost:3001",
    })
);

app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        project: "ChronoSearch",
    });
});

app.post("/api/ask", async (req, res) => {
    try {
        const { question, targetDate } = req.body ?? {};
        // Validation of required input fields before calling the RAG pipeline
        if (
            typeof question !== "string" ||
            question.trim().length === 0
        ) {
            res.status(400).json({
                error: "Question must be a non empty string."
            });
            return;
        }
        // Checking a valid ISO calendar date in YYYY-MM-DD format.
        if (
            typeof targetDate !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) ||
            !Number.isFinite(Date.parse(`${targetDate}T00:00:00Z`)) ||
            new Date(`${targetDate}T00:00:00Z`)
                .toISOString()
                .slice(0, 10) !== targetDate
        ) {
            res.status(400).json({
                error: "Target date must be a valid calendar date in YYYY-MM-DD format."
            });
            return;
        }
        const result = await answerQuestion(
            question.trim(),
            targetDate
        );
        res.json(result);
    } catch (error) {
        console.error("Error processing /api/ask:", error); //Logging
        res.status(500).json({
            error: "Failed to process the question. Please try again.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`ChronoSearch API running at http://localhost:${PORT}`);
});