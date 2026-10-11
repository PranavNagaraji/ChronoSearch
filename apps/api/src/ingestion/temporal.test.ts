import assert from "node:assert/strict";
import { intervalsOverlap } from "./temporal.js";

// 1. Partial overlap -> true
assert.equal(
    intervalsOverlap(
        { validFrom: "2026-01-01", validUntil: "2026-06-01" },
        { validFrom: "2026-04-01", validUntil: "2026-09-01" }
    ),
    true
);

// 2. A contained within B -> true
assert.equal(
    intervalsOverlap(
        { validFrom: "2026-03-01", validUntil: "2026-05-01" },
        { validFrom: "2026-01-01", validUntil: "2026-09-01" }
    ),
    true
);

// 3. No overlap -> false
assert.equal(
    intervalsOverlap(
        { validFrom: "2026-01-01", validUntil: "2026-03-01" },
        { validFrom: "2026-04-01", validUntil: "2026-06-01" }
    ),
    false
);

// 4. Adjacent intervals -> false
assert.equal(
    intervalsOverlap(
        { validFrom: "2026-01-01", validUntil: "2026-03-01" },
        { validFrom: "2026-03-01", validUntil: "2026-06-01" }
    ),
    false
);

// 5. An open-ended interval overlapping a later interval -> true
assert.equal(
    intervalsOverlap(
        { validFrom: "2026-01-01", validUntil: null },
        { validFrom: "2026-06-01", validUntil: "2026-12-01" }
    ),
    true
);

// 6. An open-ended interval that starts after another interval has ended -> false
assert.equal(
    intervalsOverlap(
        { validFrom: "2026-01-01", validUntil: "2026-03-01" },
        { validFrom: "2026-04-01", validUntil: null }
    ),
    false
);

console.log("All interval tests passed successfully!");