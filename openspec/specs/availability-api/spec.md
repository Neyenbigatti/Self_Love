# Availability API Specification

## Purpose

Manage weekly availability rules (recurring by day of week) and exceptions (specific date blocks, breaks, or holiday closures). Professionals define when they are available.

## Requirements

### Requirement: List Availability

The system MUST return availability entries scoped to the authenticated professional.

#### Scenario: Professional lists own availability

- GIVEN a professional is authenticated
- WHEN they call `GET /api/availability`
- THEN the response MUST contain availability entries where `professionalId` matches their session
- AND each entry MUST include `dayOfWeek`, `startTime`, `endTime`, `type`, and `isAvailable`

#### Scenario: Explicit professionalId filter

- GIVEN a professional is authenticated
- WHEN they call `GET /api/availability?professionalId={otherId}`
- THEN the response MUST be 403 Forbidden (they can only see their own)

### Requirement: Create Availability Rule

The system MUST let professionals create recurring rules or date-specific exceptions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| dayOfWeek | integer 0-6 | No | Day for recurring rule |
| specificDate | YYYY-MM-DD | No | Date for exception |
| startTime | HH:mm | Yes | Start time |
| endTime | HH:mm | Yes | End time |
| type | enum | Yes | `regular`, `break`, or `blocked` |
| label | string | No | Description |

#### Scenario: Create recurring weekly availability

- GIVEN a professional is authenticated
- WHEN they `POST /api/availability` with `{ dayOfWeek: 1, startTime: "09:00", endTime: "17:00", type: "regular" }`
- THEN the response MUST be 201
- AND the entry MUST have `isAvailable: true`

#### Scenario: Create date-specific block

- GIVEN a professional is authenticated
- WHEN they `POST /api/availability` with `{ specificDate: "2026-12-25", startTime: "00:00", endTime: "23:59", type: "blocked", label: "Navidad" }`
- THEN the response MUST be 201
- AND `isAvailable` MUST be `false`

#### Scenario: Missing dayOfWeek and specificDate

- GIVEN a professional is authenticated
- WHEN they `POST /api/availability` with only `{ startTime: "09:00", endTime: "17:00", type: "regular" }`
- THEN the response MUST be 400 Bad Request

### Requirement: Update Availability

The system MUST allow professionals to modify their own availability entries.

#### Scenario: Update existing rule

- GIVEN a professional owns an availability entry
- WHEN they `PATCH /api/availability/{id}` with `{ startTime: "10:00" }`
- THEN the response MUST be 200
- AND `startTime` MUST be updated

### Requirement: Delete Availability

The system MUST allow professionals to remove availability entries.

#### Scenario: Delete entry

- GIVEN a professional owns an availability entry
- WHEN they call `DELETE /api/availability/{id}`
- THEN the response MUST be 200 with `{ success: true }`

#### Scenario: Delete non-existent entry

- GIVEN a professional is authenticated
- WHEN they call `DELETE /api/availability/{nonExistentId}`
- THEN the response MUST be 404
