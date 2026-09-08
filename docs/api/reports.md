# Reports API

Base path: `/api/v1/reports`

> **Sprint F7** — Frontend implementation pending.

---

## Report Types

| Code | Name | Description |
|------|------|-------------|
| `EMPLOYEE_PERFORMANCE` | Employee Performance Report | Individual KPI scores for a period |
| `DEPARTMENT_PERFORMANCE` | Department Performance Report | Aggregate scores per department |
| `KPI_SUMMARY` | KPI Summary Report | Completion and achievement per KPI |
| `MUNICIPALITY_ANNUAL` | Municipality Annual Report | Full-year consolidated report |
| `CYCLE_SUMMARY` | Performance Cycle Summary | All employees in a cycle |
| `TOP_PERFORMERS` | Top Performers | Ranked employee performance |
| `UNDERPERFORMERS` | Underperformers | Employees below threshold |
| `RATING_DISTRIBUTION` | Rating Distribution | Breakdown of ratings by department |
| `EVIDENCE_AUDIT` | Evidence Audit | Evidence submission compliance |
| `WORKFLOW_AUDIT` | Workflow Audit | Review process timing and bottlenecks |

---

## POST `/api/v1/reports/generate`

Submit a report generation request.

**Authorization:** `Bearer {token}`

### Request
```json
{
  "reportType": "EMPLOYEE_PERFORMANCE",
  "format": "PDF",
  "parameters": {
    "departmentId": 3,
    "period": "2026-08",
    "financialYear": "2025-2026"
  }
}
```

### Response `202 Accepted`
```json
{
  "executionId": "rpt-20260818-001",
  "status": "PROCESSING",
  "estimatedSeconds": 15
}
```

---

## GET `/api/v1/reports/executions`

List recent report executions for the current user.

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page index |
| size | int | Page size |
| status | string | `PROCESSING`, `READY`, `FAILED` |

### Response `200 OK`
```json
{
  "content": [
    {
      "id": "rpt-20260818-001",
      "reportType": "EMPLOYEE_PERFORMANCE",
      "reportName": "Finance Performance — August 2026",
      "format": "PDF",
      "status": "READY",
      "requestedAt": "2026-08-18T10:00:00Z",
      "completedAt": "2026-08-18T10:00:15Z",
      "downloadUrl": "/api/v1/reports/executions/rpt-20260818-001/download"
    }
  ]
}
```

---

## GET `/api/v1/reports/executions/{id}/download`

Download a completed report file.

**Response:** Binary file stream with appropriate `Content-Type` and `Content-Disposition` headers.

---

## Supported Formats

| Format | Content-Type |
|--------|-------------|
| `PDF` | `application/pdf` |
| `EXCEL` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `CSV` | `text/csv` |

