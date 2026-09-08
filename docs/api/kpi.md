# KPI Library API

Base path: `/api/v1/kpis`, `/api/v1/kpi-categories`

---

## KPI Categories

### GET `/api/v1/kpi-categories`
List all categories.
**Response:** `KpiCategory[]`

### GET `/api/v1/kpi-categories/{id}`
Single category.

### POST `/api/v1/kpi-categories`
Create a category.

### PUT `/api/v1/kpi-categories/{id}`
Update a category.

### DELETE `/api/v1/kpi-categories/{id}`
Delete a category.

---

## KPIs

### GET `/api/v1/kpis`
Paginated KPI list.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page index |
| size | int | Page size |
| search | string | Search by name / code |
| categoryId | long | Filter by category |
| type | string | `QUANTITATIVE`, `QUALITATIVE` |
| status | string | `ACTIVE`, `INACTIVE`, `DRAFT` |
| sort | string | Sort field + direction |

### GET `/api/v1/kpis/{id}`
Single KPI detail.

### GET `/api/v1/kpis/{id}/assignments`
All assignments for this KPI.

### POST `/api/v1/kpis`
Create a KPI.

**Request:**
```json
{
  "name": "Revenue Collection",
  "code": "FIN-001",
  "categoryId": 3,
  "type": "QUANTITATIVE",
  "unit": "%",
  "frequency": "MONTHLY",
  "targetValue": 95.0,
  "weight": 30,
  "status": "ACTIVE"
}
```

### PUT `/api/v1/kpis/{id}`
Update a KPI.

### DELETE `/api/v1/kpis/{id}`
Delete a KPI.

---

## KPI Types

| Value | Description |
|-------|-------------|
| `QUANTITATIVE` | Numeric measurement |
| `QUALITATIVE` | Descriptive / text |

## KPI Frequencies

| Value | Description |
|-------|-------------|
| `MONTHLY` | Reported monthly |
| `QUARTERLY` | Reported quarterly |
| `SEMI_ANNUALLY` | Twice a year |
| `ANNUALLY` | Once per year |

## KPI Data Types (for capture)

| Value | Input Type |
|-------|------------|
| `PERCENTAGE` | Number with % |
| `NUMBER` | Plain number |
| `CURRENCY` | Rand (R) amount |
| `BOOLEAN` | Yes / No |
| `TEXT` | Free text |

## KPI Direction (for scoring)

| Value | Scoring Logic |
|-------|---------------|
| `HIGHER_IS_BETTER` | score = actual / target × 100 |
| `LOWER_IS_BETTER` | score = target / actual × 100 |
| `TARGET_EXACT` | score = 1 − |actual − target| / target |

