/**
 * Backfill `treatmentTypeId` on appointments by matching the string
 * `treatmentType` → `treatmentTypes.name` for the same `professionalId`.
 *
 * Run: npx tsx scripts/backfill-treatment-type-id.ts
 */
import { db } from '../lib/db/client';
import { appointments, treatmentTypes } from '../lib/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  console.log('Starting treatmentTypeId backfill...');

  // Find all appointments that have a treatmentType string but no treatmentTypeId
  const rows = await db
    .select({
      id: appointments.id,
      treatmentType: appointments.treatmentType,
      professionalId: appointments.professionalId,
    })
    .from(appointments)
    .where(sql`${appointments.treatmentTypeId} IS NULL`);

  console.log(`Found ${rows.length} appointments without treatmentTypeId`);

  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.treatmentType) {
      skipped++;
      continue;
    }

    // Find matching treatment type by name + professionalId
    const [match] = await db
      .select({ id: treatmentTypes.id })
      .from(treatmentTypes)
      .where(
        sql`${treatmentTypes.name} = ${row.treatmentType} AND ${treatmentTypes.professionalId} = ${row.professionalId}`,
      )
      .limit(1);

    if (match) {
      await db
        .update(appointments)
        .set({ treatmentTypeId: match.id })
        .where(eq(appointments.id, row.id));
      updated++;
    } else {
      console.log(
        `  SKIP: appointment ${row.id} — no treatment type found for "${row.treatmentType}" (professional ${row.professionalId})`,
      );
      skipped++;
    }
  }

  console.log(`Done. Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
