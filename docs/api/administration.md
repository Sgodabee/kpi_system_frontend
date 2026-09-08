# Administration API

Base path: `/api/v1/admin`

> **Sprint F8** — Frontend implementation pending.
> All endpoints require `ADMIN` role.

---

## Financial Years

### GET `/api/v1/admin/financial-years`
List all financial years.

### POST `/api/v1/admin/financial-years`
Create a financial year.
```json
{ "name": "2025-2026", "startDate": "2025-04-01", "endDate": "2026-03-31", "status": "ACTIVE" }
```

### PUT `/api/v1/admin/financial-years/{id}`
Update a financial year.

---

## Performance Cycles

### GET `/api/v1/admin/performance-cycles`
List performance cycles.

### POST `/api/v1/admin/performance-cycles`
Create a cycle.
```json
{
  "name": "Q2 2026",
  "financialYearId": 1,
  "startDate": "2026-07-01",
  "endDate": "2026-09-30",
  "submissionDeadline": "2026-08-31",
  "reviewDeadline": "2026-09-15"
}
```

---

## Rating Scales

### GET `/api/v1/admin/rating-scales`
List configured rating scales.

### PUT `/api/v1/admin/rating-scales/{id}`
Update rating scale thresholds.
```json
{
  "outstanding": 95,
  "exceedsExpectations": 80,
  "meetsExpectations": 60,
  "needsImprovement": 40
}
```

---

## System Configuration

### GET `/api/v1/admin/config`
Retrieve system-wide configuration key-value pairs.

### PUT `/api/v1/admin/config`
Update configuration.
```json
{
  "maxEvidenceFileSizeMb": 10,
  "allowedEvidenceTypes": ["PDF", "XLSX", "DOCX"],
  "reviewReminderDays": 3,
  "escalationAfterDays": 7
}
```

---

## Notification Templates

### GET `/api/v1/admin/notification-templates`
List email/notification templates.

### PUT `/api/v1/admin/notification-templates/{code}`
Update a template body/subject.

---

## Working Calendar

### GET `/api/v1/admin/calendar`
List working days / public holidays.

### POST `/api/v1/admin/calendar/holidays`
Add a public holiday.

