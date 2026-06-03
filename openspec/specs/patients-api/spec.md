# Patients API Specification

## Purpose

Search for patients by name, email, or phone. Used by the appointment dialog to find and select patients. Restricted to professionals only. Results exclude sensitive data.

## Requirements

### Requirement: Search Patients

The system MUST search patients by name, email, or phone using partial matching.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | Yes | Search term (LIKE %term% on name, email, phone) |

#### Scenario: Search by name returns matches

- GIVEN a professional is authenticated
- AND the database has patients named "María García" and "María López"
- WHEN they call `GET /api/patients?search=maría`
- THEN the response MUST include both patients
- AND each patient MUST have `id`, `name`, `email`, `phone`, and `avatar`

#### Scenario: Search by email returns match

- GIVEN a professional is authenticated
- AND a patient has email "juan@ejemplo.com"
- WHEN they call `GET /api/patients?search=juan@ejemplo.com`
- THEN the response MUST include that patient

#### Scenario: No match returns empty array

- GIVEN a professional is authenticated
- WHEN they call `GET /api/patients?search=zzznonexistent`
- THEN the response MUST be 200 with an empty `patients` array

### Requirement: Exclude Sensitive Data

The system MUST NOT expose sensitive patient fields.

#### Scenario: Response excludes passwordHash and medicalHistory

- GIVEN a professional is authenticated
- WHEN they call `GET /api/patients?search=maría`
- THEN the response MUST NOT include `passwordHash` or `medicalHistory` fields

### Requirement: Access Control

The system MUST restrict patient search to professionals only.

#### Scenario: Patient cannot search

- GIVEN a patient is authenticated
- WHEN they call `GET /api/patients?search=maría`
- THEN the response MUST be 403 Forbidden

#### Scenario: Missing search parameter

- GIVEN a professional is authenticated
- WHEN they call `GET /api/patients` without a search query
- THEN the response MUST be 400 Bad Request
