import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const settings = sqliteTable("clinic_settings", {
  ownerId: text("owner_id").primaryKey(), data: text("data").notNull(), createdAt: text("created_at").notNull(),
});
export const records = sqliteTable("clinic_records", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), kind: text("kind").notNull(),
  patientId: text("patient_id"), visitId: text("visit_id"), data: text("data").notNull(),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
}, t => [index("records_owner_kind").on(t.ownerId, t.kind),index("records_patient").on(t.ownerId,t.patientId)]);
export const intakes = sqliteTable("clinic_intakes", {
  tokenHash: text("token_hash").primaryKey(), ownerId: text("owner_id").notNull(),
  patientId: text("patient_id").notNull(), visitId: text("visit_id").notNull(), draft: text("draft").notNull(),
  expiresAt: text("expires_at").notNull(), submittedAt: text("submitted_at"), revoked: integer("revoked").notNull().default(0),
}, t=>[index("intakes_visit").on(t.ownerId,t.visitId)]);
