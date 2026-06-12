# Explorations Schema v2 Specification

## Purpose

Augment the explorations table with a template-driven data model while preserving backward compatibility with legacy `skin_evaluation` and `facial_analysis` JSON columns.

## Requirements

### Requirement: Schema adds template_id and responses columns

The system MUST add `template_id` (nullable FK to `exploration_templates.id`) and `responses` (nullable JSON text) columns to the explorations table.

#### Scenario: Migration adds columns
- GIVEN the explorations table exists with legacy columns
- WHEN the PR #1 migration runs
- THEN `template_id` (nullable text FK) and `responses` (nullable text) columns SHALL exist
- AND existing rows SHALL have `null` in both new columns

#### Scenario: Existing columns are preserved
- GIVEN the explorations table before migration
- AFTER migration runs
- THEN `skin_evaluation` and `facial_analysis` columns MUST still exist and retain data

### Requirement: Read with v2 fallback

When reading an exploration, the system MUST return `responses` content if non-null; otherwise fall back to parsing `skin_evaluation` and/or `facial_analysis`.

#### Scenario: Read v2 exploration returns responses
- GIVEN an exploration with `template_id` set and `responses` JSON `{ "skinType": "oleosa", "phototype": "III" }`
- WHEN the exploration is fetched via API
- THEN the response MUST include the `responses` object parsed from JSON
- AND `skin_evaluation` and `facial_analysis` MAY be omitted or returned as `null`

#### Scenario: Read legacy exploration falls back to legacy columns
- GIVEN an exploration with `responses` set to `null` and `skin_evaluation` containing valid JSON
- WHEN the exploration is fetched
- THEN the system MUST parse `skin_evaluation` and `facial_analysis` as the data source

### Requirement: Write with template_id uses v2 path

When creating or updating an exploration with a `template_id`, the system MUST store data in `responses` and set legacy columns to `null`.

#### Scenario: Create exploration with template
- GIVEN a template with id `t1` and the professional provides responses
- WHEN they create an exploration with `template_id=t1` and `responses={...}`
- THEN `responses` SHALL be stored as JSON text
- AND `skin_evaluation` and `facial_analysis` SHALL be set to `null`

### Requirement: Write without template_id uses legacy path

When creating or updating an exploration without a `template_id`, the system MUST store data in `skin_evaluation` and/or `facial_analysis` (legacy behavior).

#### Scenario: Create legacy exploration without template
- GIVEN no template_id is provided
- WHEN they create an exploration with `skin_evaluation={...}`
- THEN `responses` SHALL be `null`
- AND `skin_evaluation` SHALL store the provided data as JSON text

### Requirement: Template_id is a foreign key

The system MUST enforce referential integrity on `template_id` pointing to `exploration_templates.id`.

#### Scenario: Create exploration with non-existent template
- GIVEN `template_id` references a non-existent template id
- WHEN the exploration is created
- THEN the database MUST reject the insert (FK constraint violation)
