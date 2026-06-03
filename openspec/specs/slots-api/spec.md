# Slots API Specification

## Purpose

Calculate available time windows for a given date by combining availability rules, exceptions, and existing appointments. Returns 30-minute slots with availability status.

## Requirements

### Requirement: Calculate Available Slots

The system MUST compute 30-minute slots for a specific date and professional. Accessible by both roles.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| date | YYYY-MM-DD | Yes | Target date |
| professionalId | string | Yes | Professional to query |

#### Scenario: Professional gets slots for a regular day

- GIVEN a professional has availability Monday `09:00-12:00` and `14:00-17:00`
- AND a `break` entry on `11:00-12:00`
- WHEN they call `GET /api/availability/slots?date=2026-06-01&professionalId={id}`
- June 1, 2026 is a Monday
- THEN the response MUST include slots `09:00`, `09:30`, `10:00`, `10:30` (from first range), `14:00`, `14:30`, `15:00`, `15:30`, `16:00`, `16:30` (from second range)
- AND slot `11:00` MUST have `available: false` (break)
- AND slot `09:30` MUST have `available: true`

#### Scenario: Existing appointments reduce available slots

- GIVEN a professional has availability Monday `09:00-12:00`
- AND an existing confirmed appointment at `09:00-10:00`
- WHEN they call `GET /api/availability/slots?date=2026-06-01&professionalId={id}`
- THEN slot `09:00` MUST have `available: false`
- AND slot `09:30` MUST have `available: false`
- AND slot `10:00` MUST have `available: true`

#### Scenario: Date with blocked exception returns no slots

- GIVEN a professional has a `blocked` exception for `2026-12-25`
- WHEN they call `GET /api/availability/slots?date=2026-12-25&professionalId={id}`
- THEN the response MUST contain an empty slots array

#### Scenario: No availability rules for given day

- GIVEN a professional has no availability rules for Sunday
- WHEN they call `GET /api/availability/slots?date=2026-06-07&professionalId={id}`
- June 7, 2026 is a Sunday
- THEN the response MUST contain an empty slots array

### Requirement: Input Validation

The system MUST validate query parameters.

#### Scenario: Missing date returns 400

- GIVEN any authenticated user
- WHEN they call `GET /api/availability/slots` without a date
- THEN the response MUST be 400 Bad Request

#### Scenario: Invalid date format returns 400

- GIVEN any authenticated user
- WHEN they call `GET /api/availability/slots?date=02-06-2026&professionalId={id}`
- THEN the response MUST be 400 Bad Request
