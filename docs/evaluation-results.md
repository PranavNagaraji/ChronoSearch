# ChronoSearch Evaluation Results

ChronoSearch has separate retrieval and answer evaluation suites. Run the TypeScript build and both suites from `apps/api`:

```arduino
npm run build
npm run evaluate
```

The build runs `tsc`. The `evaluate` script runs retrieval evaluation followed by answer evaluation against the current seven-case sample dataset. The results below record the latest successful run provided for this report.

## Build

- **TypeScript compilation:** Successful (`tsc`).

## Retrieval evaluation

| Test ID | Target date | Expected version | Retrieved version | Retrieved chunks | Result |
| --- | --- | --- | --- | ---: | --- |
| eval-001 | 2025-06-01 | v1 | v1 | 1 | PASS |
| eval-002 | 2026-01-01 | v2 | v2 | 1 | PASS |
| eval-003 | 2025-06-01 | v1 | v1 | 1 | PASS |
| eval-004 | 2026-01-01 | v2 | v2 | 1 | PASS |
| eval-005 | 2023-12-31 | No version | No chunks | 0 | PASS |
| eval-006 | 2024-01-01 | v1 | v1 | 1 | PASS |
| eval-007 | 2025-12-31 | v1 | v1 | 1 | PASS |

| Summary | Result |
| --- | ---: |
| Total cases | 7 |
| Passed | 7 |
| Failed | 0 |
| Retrieval accuracy | 100.00% |

## Answer evaluation

| Test ID | Expected answer/check | Result |
| --- | --- | --- |
| eval-001 | `$300` | PASS |
| eval-002 | `$600` | PASS |
| eval-003 | `two days per week` | PASS |
| eval-004 | `fully remotely with manager approval` | PASS |
| eval-005 | Abstain because no temporally valid evidence is available | PASS |
| eval-006 | `$300` | PASS |
| eval-007 | `$300` | PASS |

| Summary | Result |
| --- | ---: |
| Total cases | 7 |
| Passed | 7 |
| Failed | 0 |
| Answer evaluation pass rate | 100.00% |
| Errors/inconclusive | 0 |

## Representative generated answers

### eval-001 — 2025-06-01

> Answer: The annual equipment allowance was $300.
>
> Evidence: The Remote Work Policy states that the annual equipment allowance is $300.
>
> Source: Remote Work Policy (versionId: v1, source: Company HR Policy)
>
> Limitations: None identified

### eval-002 — 2026-01-01

> Answer: The annual equipment allowance was $600.
>
> Evidence: The annual equipment allowance is stated to be $600.
>
> Source: Remote Work Policy, Version v2, Company HR Policy
>
> Limitations: None identified

### eval-005 — 2023-12-31

> I couldn't find relevant evidence valid for the requested date.

### eval-004 — 2026-01-01

> Answer: Employees are permitted to work fully remotely with manager approval.
>
> Evidence: Employees may work fully remotely with manager approval.
>
> Source: Remote Work Policy (Version: v2, Source: Company HR Policy)
>
> Limitations: None identified

## Retry behavior observed

The latest successful run encountered HTTP 504 responses from Gemini and successfully retried them. All seven answer tests eventually passed. Bounded retries improve resilience to temporary provider errors, but they do not guarantee provider availability.

## Interpretation and limitations

- These results are for the current seven-case evaluation dataset and do not prove universal accuracy.
- Retrieval accuracy measures these specific temporal retrieval cases.
- Answer evaluation uses the project's existing deterministic checks. It does not establish that every factual claim is correct or that all hallucinations are prevented.
- Generated wording may vary across model versions and runs.
- This report represents one successful run at the time the results were captured. The results were not reproduced across multiple runs.
