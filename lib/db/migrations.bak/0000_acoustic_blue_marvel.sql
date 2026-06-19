CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`professional_id` text NOT NULL,
	`treatment_type` text NOT NULL,
	`date` text NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`status` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`professional_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `availability` (
	`id` text PRIMARY KEY NOT NULL,
	`professional_id` text NOT NULL,
	`day_of_week` integer,
	`specific_date` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`is_available` integer NOT NULL,
	`type` text DEFAULT 'regular' NOT NULL,
	`label` text,
	FOREIGN KEY (`professional_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exploration_photos` (
	`id` text PRIMARY KEY NOT NULL,
	`exploration_id` text NOT NULL,
	`url` text NOT NULL,
	`angle` text NOT NULL,
	`original_name` text,
	`mime_type` text,
	`file_size` integer,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`exploration_id`) REFERENCES `explorations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `explorations` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`professional_id` text NOT NULL,
	`skin_evaluation` text,
	`facial_analysis` text,
	`notes` text,
	`date` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`professional_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `treatment_types` (
	`id` text PRIMARY KEY NOT NULL,
	`professional_id` text NOT NULL,
	`name` text NOT NULL,
	`duration` integer NOT NULL,
	`description` text,
	`price` integer,
	FOREIGN KEY (`professional_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`role` text NOT NULL,
	`avatar` text,
	`date_of_birth` text,
	`gender` text,
	`address` text,
	`notes` text,
	`title` text,
	`clinic_name` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);