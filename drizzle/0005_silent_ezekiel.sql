CREATE TABLE `challengeParticipants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challengeParticipants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `challengeProgress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`challengeId` int NOT NULL,
	`userId` int NOT NULL,
	`currentValue` float NOT NULL DEFAULT 0,
	`notes` text,
	`loggedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `challengeProgress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`createdByUserId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`challengeType` enum('running','steps','workouts','custom') NOT NULL,
	`goalValue` float,
	`goalUnit` varchar(50),
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `groupChallenges_id` PRIMARY KEY(`id`)
);
