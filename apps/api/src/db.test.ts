import assert from "node:assert/strict";
import { pool } from "./config/db.js";

async function main() {
    try {
        const result = await pool.query(
            "SELECT NOW() AS current_time"
        );
        assert.ok(result.rows[0]?.current_time);
        console.log("Supabase connection successful!");
        console.log("Database time:", result.rows[0].current_time);
    } catch (error: unknown) {
        console.error("Supabase connection failed: ", error);
        process.exit(1);
    }
    finally {
        await pool.end();
    }
}

main();