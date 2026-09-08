# Performance API

Base path: `/api/v1/performance`

---

## GET `/api/v1/performance/my`

Current employee's own performance records.

**Authorization:** `Bearer {token}`

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page index (0-based), default 0 |
| size | int | Page size, default 50 |
| period | string | Month filter `YYYY-MM` e.g. `2026-08` |
| status | string | `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `REVISION_REQUESTED` |
| financialYear | string | e.g. `2025-2026` |

### Response `200 OK`
```json
{
  "content": [
    {
      "id": 101,
      "kpiName": "Revenue Collection",
      "kpiCode": "FIN-001",
      "kpiDataType": "PERCENTAGE",
      "targetValue": 95,
      "actualValue": 93.5,
      "achievementPct": 98.4,
      "score": 98.4,
      "weight": 30,
      "status": "SUBMITTED",
      "period": "2026-08",
      "submittedAt": "2026-08-18T09:00:00Z"
    }
  ],
  "totalElements": 12,
  "totalPages": 1,
  "size": 50,
  "number": 0
}
```

---

## GET `/api/v1/performance/summary`

Aggregate counts for the list header cards.

**Authorization:** `Bearer {token}`

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| period | string | Month filter |

### Response `200 OK`
```json
{
  "totalKpis": 12,
  "drafts": 2,
  "submitted": 4,
  "underReview": 1,
  "approved": 5,
  "rejected": 0,
  "overallScore": 94.2
}
```

---

## GET `/api/v1/performance`

All performance records (managers / HR access).

**Authorization:** `Bearer {token}` (requires manager or HR role)

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page index |
| size | int | Page size |
| employeeId | long | Filter by employee |
| departmentId | long | Filter by department |
| status | string | Status filter |
| period | string | Month filter |

---

## GET `/api/v1/performance/{id}`

Single performance record.

### Response `200 OK` — full `PerformanceRecord` object
### Errors
| Status | Description |
|--------|-------------|
| 404 | Record not found |
| 403 | Not the owner and no manager access |

---

## POST `/api/v1/performance`

Create a new performance record.

### Request
```json
{
  "assignmentId": 55,
  "period": "2026-08",
  "financialYear": "2025-2026",
  "actualValue": 93.5,
  "comment": "Achieved target despite difficult market conditions."
}
```

### Response `201 Created` — `PerformanceRecord`

---

## PUT `/api/v1/performance/{id}`

Update an existing record (must be `DRAFT` or `REVISION_REQUESTED`).

### Request — same as POST

### Response `200 OK` — `PerformanceRecord`

---

## POST `/api/v1/performance/{id}/submit`

Submit a draft record for manager review.

**Body:** `{}` (empty)

### Response `200 OK` — `PerformanceRecord` with `status: SUBMITTED`
### Errors
| Status | Description |
|--------|-------------|
| 409 | Record is not in DRAFT or REVISION_REQUESTED status |

---

## POST `/api/v1/performance/{id}/approve`

Manager approves a submitted record.

### Request
```json
{ "comment": "Well done!" }
```

---

## POST `/api/v1/performance/{id}/reject`

Manager rejects a record.

### Request
```json
{ "comment": "Evidence insufficient." }
```

---

## POST `/api/v1/performance/{id}/request-revision`

Manager sends the record back for revision.

### Request
```json
{ "comment": "Please attach the monthly report." }
```

---

## GET `/api/v1/performance/{id}/evidence`

List evidence files attached to a record.

---

## POST `/api/v1/performance/{id}/evidence`

Upload an evidence file.

**Content-Type:** `multipart/form-data`  
**Field:** `file` (the binary)

---

## GET `/api/v1/performance/{id}/comments`

List comments on a record.

---

## POST `/api/v1/performance/{id}/comments`

Add a comment.

### Request
```json
{ "content": "I have updated the actual value." }
```

