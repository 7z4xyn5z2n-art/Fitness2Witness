CREATE TABLE `bodyMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`groupId` int NOT NULL,
	`challengeId` int NOT NULL,
	`date` timestamp NOT NULL,
	`weight` float,
	`bodyFatPercent` float,
	`muscleMass` float,
	`visceralFat` int,
	`bmr` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bodyMetrics_id` PRIMARY KEY(`id`)
);
