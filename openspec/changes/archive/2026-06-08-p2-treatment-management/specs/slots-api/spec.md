# Delta for Slots API

## ADDED Requirements

### Requirement: Duration-Aware Slot Filtering

The system MUST filter slots by the optional `duration` query param. When `duration` is provided, only slots whose `[start, start+duration]` range is completely free (no overlap with appointments, breaks, or blocked time) MUST be returned. When `duration` is absent, current 30-min slot behavior SHALL be preserved.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| duration | integer | No | Treatment duration in minutes. MUST be positive and a multiple of 5. |

#### Scenario: 30-min treatment shown correctly

- GIVEN availability `09:00-12:00` and an appointment at `10:00-10:30`
- WHEN `GET /api/availability/slots?duration=30`
- THEN slot `10:00` MUST have `available: false`
- AND slot `10:30` MUST have `available: true`

#### Scenario: 60-min treatment filters partial overlap

- GIVEN availability `09:00-12:00` and an appointment at `10:00-10:30`
- WHEN `GET /api/availability/slots?duration=60`
- THEN slots `09:00` and `09:30` MUST have `available: true`
- AND slot `10:00` MUST have `available: false` (10:00-11:00 overlaps 10:00-10:30)
- AND slot `10:30` MUST have `available: false` (10:30-11:30 overlaps 10:00-10:30)

#### Scenario: No duration param preserves backward compat

- GIVEN availability `09:00-12:00`
- WHEN `duration` is absent from the request
- THEN the system MUST return 30-min slots following existing behavior

#### Scenario: Duration filters across breaks

- GIVEN availability `09:00-12:00` with a break at `11:00-12:00`
- WHEN `GET /api/availability/slots?duration=60`
- THEN slot `11:00` MUST have `available: false` (overlaps break)

## MODIFIED Requirements

### Requirement: Calculate Available Slots

The system MUST compute slots for a specific date and professional. When `duration` is provided, slots MUST be filtered by the `[start, start+duration]` range.
(Previously: always 30-min slots; no duration param)

#### Scenario: Professional gets duration-aware slots

- GIVEN a professional has availability Monday `09:00-12:00` and `14:00-17:00`
- AND an existing appointment at `10:00-10:30`
- WHEN they call `GET /api/availability/slots?date=2026-06-01&professionalId={id}&duration=60`
- THEN slots where `[start, start+60]` overlaps the appointment MUST have `available: false`
- AND slots where `[start, start+60]` does NOT overlap MUST have `available: true`

### Requirement: Input Validation

The system MUST validate query parameters including `duration`.
(Previously: no duration validation)

#### Scenario: Invalid duration format returns 400

- GIVEN any authenticated user
- WHEN they call with `duration=abc`
- THEN the response MUST be 400 Bad Request

#### Scenario: Non-positive duration returns 400

- GIVEN any authenticated user
- WHEN they call with `duration=0`
- THEN the response MUST be 400 Bad Request

#### Scenario: Duration not multiple of 5 returns 400

- GIVEN any authenticated user
- WHEN they call with `duration=17`
- THEN the response MUST be 400 Bad Request
