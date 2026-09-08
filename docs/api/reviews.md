# Reviews & Approvals API

Base path: `/api/v1/reviews`

The Angular frontend never calls Camunda directly.
All workflow transitions are delegated to Spring Boot:

```
Angular
   │
   ▼
POST /api/v1/reviews/{id}/approve
   │
   ▼
Spring WorkflowService
   │
   ▼
Camunda / Zeebe
```

---

## Workflow Steps

```
EMPLOYEE_SUBMISSION  → Employee submits performance record
MANAGER_REVIEW       → Direct manager reviews
DIRECTOR_REVIEW      → Department director reviews
HR_MODERATION        → HR moderates rating and compliance
MUNICIPAL_MANAGER    → Final approval by municipal manager
FINALISED            → Process complete
LOCKED               → Record locked — no further changes
```

---

## GET `/api/v1/reviews`

Paginated review inbox for the authenticated reviewer.
Only returns reviews at the reviewer's current workflow step.

**Authorization:** `Bearer {token}` (requires reviewer role)

### Query Parameters
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page index, default 0 |
| size | int | Page size, default 20 |
| status | string | `PENDING`, `IN_PROGRESS`, `APPROVED`, `REJECTED`, `REVISION_REQUESTED`, `OVERDUE` |
| step | string | Workflow step filter |
| departmentId | long | Filter by department |
| employeeId | long | Filter by employee |
| search | string | Search employee name / department |
| sort | string | Sort field + direction e.g. `submittedAt,desc` |

### Response `200 OK`
```json
{
  "content": [
    {
      "id": 201,
      "employeeName": "John Smith",
      "employeeNumber": "EMP-0042",
      "positionTitle": "Senior Manager",
      "departmentName": "Finance",
      "overallScore": 94.0,
      "status": "PENDING",
      "currentStep": "MANAGER_REVIEW",
      "submittedAt": "2026-08-18T08:00:00Z",
      "dueDate": "2026-08-25T00:00:00Z"
    }
  ],
  "totalElements": 24,
  "totalPages": 2,
  "size": 20,
  "number": 0
}
```

---

## GET `/api/v1/reviews/stats`

Aggregate counts for the inbox header cards.

### Response `200 OK`
```json
{
  "pending": 24,
  "overdue": 4,
  "completed": 182,
  "rejected": 7
}
```

---

## GET `/api/v1/reviews/{id}`

Full review detail including KPI breakdown, evidence, and comments.

### Response `200 OK`
```json
{
  "id": 201,
  "performanceRecordId": 101,
  "processInstanceId": "camunda-process-uuid",
  "employeeName": "John Smith",
  "employeeNumber": "EMP-0042",
  "positionTitle": "Senior Manager",
  "departmentName": "Finance",
  "overallScore": 94.0,
  "status": "PENDING",
  "currentStep": "MANAGER_REVIEW",
  "submittedAt": "2026-08-18T08:00:00Z",
  "dueDate": "2026-08-25T00:00:00Z",
  "employeeComment": "I am confident all targets were met.",
  "kpiItems": [
    {
      "kpiName": "Revenue Collection",
      "kpiCode": "FIN-001",
      "categoryName": "Financial",
      "unit": "%",
      "weight": 30,
      "targetValue": 95,
      "actualValue": 93.5,
      "achievementPct": 98.4,
      "score": 29.5
    }
  ],
  "evidence": [
    {
      "id": 501,
      "fileName": "Monthly_Report.pdf",
      "contentType": "application/pdf",
      "fileSizeBytes": 204800,
      "uploadedByName": "John Smith",
      "uploadedAt": "2026-08-18T07:30:00Z",
      "downloadUrl": "/api/v1/performance/101/evidence/501/download"
    }
  ],
  "comments": [
    {
      "id": 901,
      "authorName": "John Smith",
      "authorRole": "Employee",
      "content": "Monthly report attached.",
      "createdAt": "2026-08-18T07:32:00Z"
    }
  ]
}
```

---

## POST `/api/v1/reviews/{id}/approve`

Approve the review and advance the Camunda workflow.

**Authorization:** Role must match the current `workflowStep`

### Request
```json
{
  "rating": "MEETS_EXPECTATIONS",
  "comment": "Solid performance across all KPIs."
}
```

### Response `200 OK`
```json
{
  "reviewId": 201,
  "action": "APPROVED",
  "nextStep": "DIRECTOR_REVIEW",
  "processInstanceId": "camunda-process-uuid",
  "timestamp": "2026-08-18T10:00:00Z",
  "message": "Review approved. Forwarded to Director."
}
```

### Errors
| Status | Description |
|--------|-------------|
| 403 | Caller is not the reviewer for this step |
| 409 | Review is not in an approvable state |

---

## POST `/api/v1/reviews/{id}/reject`

Reject the review and terminate the workflow path.

### Request
```json
{
  "reason": "Performance does not meet minimum standards.",
  "comment": "Revenue collection was 40% below target."
}
```

### Response `200 OK`
```json
{
  "reviewId": 201,
  "action": "REJECTED",
  "timestamp": "2026-08-18T10:05:00Z"
}
```

---

## POST `/api/v1/reviews/{id}/request-revision`

Send the review back to the employee for revision.

### Request
```json
{
  "comment": "Please attach the Q3 budget report.",
  "specificRequirements": "Evidence for budget compliance KPI is missing."
}
```

### Response `200 OK`
```json
{
  "reviewId": 201,
  "action": "REVISION_REQUESTED",
  "timestamp": "2026-08-18T10:10:00Z"
}
```

---

## GET `/api/v1/reviews/{id}/history`

Workflow audit trail for a review.

### Response `200 OK`
```json
[
  {
    "step": "EMPLOYEE_SUBMISSION",
    "stepLabel": "Employee Submission",
    "actorName": "John Smith",
    "actorRole": "Employee",
    "action": "SUBMITTED",
    "comment": null,
    "timestamp": "2026-08-18T08:00:00Z"
  },
  {
    "step": "MANAGER_REVIEW",
    "stepLabel": "Manager Review",
    "actorName": "Sarah Dlamini",
    "actorRole": "Manager",
    "action": "APPROVED",
    "rating": "MEETS_EXPECTATIONS",
    "comment": "Good work.",
    "timestamp": "2026-08-18T10:00:00Z"
  }
]
```

---

## Supported Ratings

| Value | Label | Score Range |
|-------|-------|-------------|
| `OUTSTANDING` | Outstanding | 95–100% |
| `EXCEEDS_EXPECTATIONS` | Exceeds Expectations | 80–94% |
| `MEETS_EXPECTATIONS` | Meets Expectations | 60–79% |
| `NEEDS_IMPROVEMENT` | Needs Improvement | 40–59% |
| `UNACCEPTABLE` | Unacceptable | 0–39% |

