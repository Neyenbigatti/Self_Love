# Exploration Templates Specification

## Purpose

Define reusable exploration templates with configurable sections and fields stored as JSON config. System templates are seeded on first deploy; professional-scoped templates are planned for future PRs.

## Requirements

### Requirement: List active templates

The system MUST return all active system templates plus the requesting professional's active templates.

#### Scenario: Professional fetches template list
- GIVEN the professional is authenticated
- WHEN they send `GET /api/exploration-templates`
- THEN the response contains all system templates (`is_system=true`, `is_active=true`)
- AND any templates that professional has created (if feature exists)

#### Scenario: No templates exist
- GIVEN no system templates have been seeded and no professional templates exist
- WHEN they send `GET /api/exploration-templates`
- THEN the response SHALL be an empty array `[]`

### Requirement: Get template by slug

The system MUST return a single active template identified by its unique slug.

#### Scenario: Professional fetches template by slug
- GIVEN a template with slug `"facial-exploration"` exists and is active
- WHEN they send `GET /api/exploration-templates/facial-exploration`
- THEN the response includes `id`, `name`, `slug`, `description`, `config`, `is_system`, and `is_active`

#### Scenario: Template slug not found
- GIVEN no template exists with slug `"non-existent"`
- WHEN they send `GET /api/exploration-templates/non-existent`
- THEN the response MUST be `404 Not Found`

### Requirement: Update template config

The system MUST allow updating `name`, `config` JSON, and `is_active` for non-system templates. System templates (`is_system=true`) MUST be read-only via the update endpoint.

#### Scenario: Professional updates own template name
- GIVEN the professional created a template and is authenticated
- WHEN they send `PUT /api/exploration-templates/{slug}` with body `{ "name": "Updated Name", "config": {...} }`
- THEN the response MUST be `200 OK` with the updated template
- AND `updated_at` SHALL reflect the new timestamp

#### Scenario: Professional cannot update system template
- GIVEN a system template with `is_system=true`
- WHEN they send `PUT /api/exploration-templates/facial-exploration` with config changes
- THEN the response MUST be `403 Forbidden`

#### Scenario: Invalid config JSON rejected
- GIVEN the config JSON violates the schema (e.g., field type is not in allowed list)
- WHEN they attempt to update
- THEN the response MUST be `400 Bad Request` with validation error details

### Requirement: Seed system template

The system MUST seed the "Exploración Física Facial" template on first database initialization.

#### Scenario: Seed creates system template
- GIVEN the database is fresh with no templates
- WHEN migrations and seed run
- THEN a row exists with `name="Exploración Física Facial"`, `slug="facial-exploration"`, `is_system=true`, `is_active=true`
- AND the `config` JSON includes sections for skin biotype, skin characteristics, previous treatments, sun exposure, consultation reason, clinical assessment, goals, referrals, and additional notes

#### Scenario: Seed is idempotent
- GIVEN the seed has already been applied
- WHEN seed runs again
- THEN no duplicate `slug` error occurs (upsert by slug or skip-if-exists logic)
