# KPI Assignments API

Base path: `/api/v1/kpi-assignments`

---

## GET `/api/v1/kpi-assignments`
Paginated assignment list.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page index |
| size | int | Page size |
| search | string | Search text |
| employeeId | long | Filter by employee |
| departmentId | long | Filter by department |
| kpiId | long | Filter by KPI |
| status | string | Assignment status filter |
| financialYear | string | e.g. `2025-2026` |
| sort | string | Sort field + direction |

### Response `200 OK` — `Page<KpiAssignment>`

---

## GET `/api/v1/kpi-assignments/{id}`
Single assignment detail.

---

## POST `/api/v1/kpi-assignments`
Create an assignment.

**Request:**
```json
{
  "kpiId": 12,
  "employeeId": 5,
  "targetValue": 95.0,
  "weight": 30,
  "dueDate": "2026-08-31",
  "financialYear": "2025-2026"
}
```

---

## PUT `/api/v1/kpi-assignments/{id}`
Update an assignment.

---

## POST `/api/v1/kpi-assignments/{id}/submit`
Employee submits their actual value.

**Request:**
```json
{
  "actualValue": 93.5,
  "notes": "Revenue impacted by seasonal factors."
}
```

---

## POST `/api/v1/kpi-assignments/{id}/approve`
Manager approves the submission.

**Request:**
```json
{ "comment": "Well done!" }
```

---

## POST `/api/v1/kpi-assignments/{id}/reject`
Manager rejects the submission.

**Request:**
```json
{ "comment": "Evidence is insufficient." }
```

---

## POST `/api/v1/kpi-assignments/{id}/request-revision`
Manager requests revision.

**Request:**
```json
{ "comment": "Please attach the monthly report." }
```

---

## Assignment Statuses

| Status | Description |
|--------|-------------|
| `ASSIGNED` | KPI assigned, not yet started |
| `IN_PROGRESS` | Employee has started capturing |
| `SUBMITTED` | Employee submitted for review |
| `UNDER_REVIEW` | Being reviewed by manager |
| `APPROVED` | Approved by manager |
| `REJECTED` | Rejected |
| `REVISION_REQUESTED` | Sent back for revision |

