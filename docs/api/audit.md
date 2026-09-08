# Audit & Compliance API

Base path: `/api/v1/audit`

> **Sprint F9** — Frontend implementation pending.
> Requires `ADMIN` role.

---

## GET `/api/v1/audit`

Paginated audit event log.

**Authorization:** `Bearer {token}` (`ADMIN` role required)

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page index |
| size | int | Page size, default 20 |
| userId | long | Filter by actor |
| action | string | `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT`, `LOGIN`, `LOGOUT` |
| module | string | `KPI`, `PERFORMANCE`, `REVIEW`, `EMPLOYEE`, `DEPARTMENT`, `ADMIN` |
| entityId | long | Filter by specific entity |
| from | ISO datetime | Start of date range |
| to | ISO datetime | End of date range |
| search | string | Full-text search in actor name / description |
| sort | string | Sort field + direction, default `timestamp,desc` |

### Response `200 OK`
```json
{
  "content": [
    {
      "id": "audit-001",
      "userId": 1,
      "userName": "John Smith",
      "userRole": "MANAGER",
      "action": "UPDATE",
      "module": "KPI",
      "entityType": "KpiAssignment",
      "entityId": 123,
      "description": "Updated target value for KPI #123",
      "ipAddress": "10.0.1.42",
      "correlationId": "req-abc-123",
      "timestamp": "2026-08-18T10:42:00Z",
      "beforeSnapshot": { "targetValue": 90 },
      "afterSnapshot":  { "targetValue": 95 }
    }
  ],
  "totalElements": 1024,
  "totalPages": 52,
  "size": 20,
  "number": 0
}
```

---

## GET `/api/v1/audit/{id}`

Single audit event detail (includes full before/after snapshots).

### Response `200 OK`
```json
{
  "id": "audit-001",
  "userId": 1,
  "userName": "John Smith",
  "userRole": "MANAGER",
  "action": "UPDATE",
  "module": "KPI",
  "entityType": "KpiAssignment",
  "entityId": 123,
  "description": "Updated target value for KPI #123",
  "ipAddress": "10.0.1.42",
  "userAgent": "Mozilla/5.0 ...",
  "correlationId": "req-abc-123",
  "sessionId": "sess-xyz-456",
  "timestamp": "2026-08-18T10:42:00Z",
  "beforeSnapshot": {
    "id": 123,
    "kpiName": "Revenue Collection",
    "targetValue": 90
  },
  "afterSnapshot": {
    "id": 123,
    "kpiName": "Revenue Collection",
    "targetValue": 95
  }
}
```

---

## GET `/api/v1/audit/export`

Export audit log as CSV or Excel.

**Query Parameters:** Same as GET `/api/v1/audit` plus:
| Param | Type | Description |
|-------|------|-------------|
| format | string | `CSV`, `EXCEL` |

**Response:** Binary file download.

---

## Tracked Modules

| Module | Entity Types |
|--------|-------------|
| `KPI` | Kpi, KpiCategory, KpiAssignment |
| `PERFORMANCE` | PerformanceRecord, PerformanceEvidence |
| `REVIEW` | PerformanceReview, ApprovalEvent |
| `EMPLOYEE` | Employee |
| `DEPARTMENT` | Department, Division |
| `ADMIN` | FinancialYear, PerformanceCycle, SystemConfig |
| `AUTH` | LoginEvent, LogoutEvent |

