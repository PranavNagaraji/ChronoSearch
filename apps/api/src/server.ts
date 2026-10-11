import express from "express";
import cors from "cors";

const app=express();
const PORT=3000;

app.use(cors({
    origin:"http://localhost:3001",
}));

app.get("/health", (req,res)=>{
    res.json({
        status:"OK",
        project:"ChronoSearch",
    });
});

app.listen(PORT, ()=>{
    console.log(`ChronoSearch API running at http://localhost:${PORT}`);
});