CREATE TABLE `clinic_intakes` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`visit_id` text NOT NULL,
	`draft` text NOT NULL,
	`expires_at` text NOT NULL,
	`submitted_at` text,
	`revoked` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `intakes_visit` ON `clinic_intakes` (`owner_id`,`visit_id`);--> statement-breakpoint
CREATE TABLE `clinic_records` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`patient_id` text,
	`visit_id` text,
	`data` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `records_owner_kind` ON `clinic_records` (`owner_id`,`kind`);--> statement-breakpoint
CREATE INDEX `records_patient` ON `clinic_records` (`owner_id`,`patient_id`);--> statement-breakpoint
CREATE TABLE `clinic_settings` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`created_at` text NOT NULL
);
