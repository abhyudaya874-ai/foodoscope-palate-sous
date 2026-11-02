# Entity response lacks molecule array — no direct entity→molecule join

## Environment
- api.foodoscope.com over HTTPS, Bearer auth. Probed 2026-11-02.
- Rate limit measured: 25/window (x-ratelimit-limit header).

## Repro
```bash
# documented param -> 400
curl -H "Authorization: Bearer $KEY" "https://api.foodoscope.com/flavordb/entities/by-natural-source?naturalSource=apple&page=0&size=5"
# corrected param -> 200
curl -H "Authorization: Bearer $KEY" "https://api.foodoscope.com/flavordb/entities/by-natural-source?natural_source_name=apple&page=0&size=5"
```

Expected: documented param works. Actual: 400 "Parameter 'natural_source_name' cannot be empty" on documented name; 200 on snake_case.

## Evidence
- `fixtures/api/flavordb.entities.by.natural.source.69fd2dc2.json`

Severity: low-medium (docs/SDK drift; blocks users following the Postman collection). Suggestion, not asserted.
