-- Student Community Club — MySQL/MariaDB dump for phpMyAdmin
-- Compatible with XAMPP MariaDB/MySQL (InnoDB, utf8mb4)

SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS `student_community_club`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `student_community_club`;

-- ---------------------------------------------------------------------------
-- Drop tables (clean reinstall)
-- ---------------------------------------------------------------------------

DROP TABLE IF EXISTS `failed_jobs`;
DROP TABLE IF EXISTS `job_batches`;
DROP TABLE IF EXISTS `jobs`;
DROP TABLE IF EXISTS `cache_locks`;
DROP TABLE IF EXISTS `cache`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `platform_announcements`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `leader_requests`;
DROP TABLE IF EXISTS `membership_requests`;
DROP TABLE IF EXISTS `event_registrations`;
DROP TABLE IF EXISTS `events`;
DROP TABLE IF EXISTS `club_members`;
DROP TABLE IF EXISTS `club_activities`;
DROP TABLE IF EXISTS `clubs`;
DROP TABLE IF EXISTS `users`;

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'student',
  `phone` varchar(50) NOT NULL DEFAULT '',
  `avatar` varchar(10) NOT NULL DEFAULT '',
  `member_since` varchar(50) DEFAULT NULL,
  `banned` tinyint(1) NOT NULL DEFAULT 0,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `clubs` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `description` text,
  `tagline` varchar(255) DEFAULT NULL,
  `image` text,
  `cover` text,
  `leader_id` int unsigned DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `founded` varchar(255) DEFAULT NULL,
  `meeting_time` varchar(255) DEFAULT NULL,
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `club_activities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `club_id` varchar(50) NOT NULL,
  `activity` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `club_activities_club_id_index` (`club_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `club_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `club_id` varchar(50) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `club_members_club_id_user_id_unique` (`club_id`, `user_id`),
  KEY `club_members_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `events` (
  `id` varchar(50) NOT NULL,
  `club_id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `event_date` date DEFAULT NULL,
  `event_time` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `image` text,
  `capacity` int unsigned NOT NULL DEFAULT 30,
  `registration_deadline` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `events_club_id_index` (`club_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `event_registrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` varchar(50) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `attended` tinyint(1) NOT NULL DEFAULT 0,
  `registered_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_registrations_event_id_user_id_unique` (`event_id`, `user_id`),
  KEY `event_registrations_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `membership_requests` (
  `id` varchar(50) NOT NULL,
  `club_id` varchar(50) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `membership_requests_club_id_index` (`club_id`),
  KEY `membership_requests_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `leader_requests` (
  `id` varchar(50) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `club_name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `reason` text,
  `document_name` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `leader_requests_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `announcements` (
  `id` varchar(50) NOT NULL,
  `club_id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `announcements_club_id_index` (`club_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `platform_announcements` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body` text,
  `created_by` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `platform_announcements_created_by_index` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` varchar(50) NOT NULL,
  `user_id` int unsigned NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reports` (
  `id` varchar(50) NOT NULL,
  `reporter_id` int unsigned NOT NULL,
  `target_type` varchar(255) NOT NULL,
  `target_id` varchar(255) NOT NULL,
  `reason` text,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reports_reporter_id_index` (`reporter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `payload` longtext NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------------

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `phone`, `avatar`, `member_since`, `banned`, `featured`, `email_verified_at`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Alex Carter', 'alex@example.com', '$2y$10$63QQTcHZ5K7iC8Uet8Nyt.vkTj9pkib4d5ejIRprKx7yd8f77bud.', 'student', '+60 12 345 6789', 'AC', 'May 2025', 0, 0, NULL, NULL, '2025-05-01 10:00:00', '2025-05-01 10:00:00'),
(2, 'Sarah Johnson', 'sarah@example.com', '$2y$10$dMbOQ.XDNszLLiKJFWpDXOOCzhV1k7BQzbtC2ACFvtzYMM.arCPUW', 'leader', '+60 13 222 1100', 'SJ', 'Jan 2024', 0, 1, NULL, NULL, '2024-01-15 09:00:00', '2025-04-01 09:00:00'),
(3, 'Maya Tan', 'admin@example.com', '$2y$10$dk9hFcvMSlq0tqQIkATg4.8e0XdZalZK/gkFgrt52MrCCsB25cjai', 'admin', '+60 11 888 0000', 'MT', 'Jan 2023', 0, 0, NULL, NULL, '2023-01-10 08:00:00', '2025-04-01 08:00:00'),
(4, 'Liam Chen', 'liam@example.com', '$2y$10$63QQTcHZ5K7iC8Uet8Nyt.vkTj9pkib4d5ejIRprKx7yd8f77bud.', 'student', '+60 16 444 2211', 'LC', 'Mar 2025', 0, 0, NULL, NULL, '2025-03-12 11:00:00', '2025-03-12 11:00:00'),
(5, 'Nina Patel', 'nina@example.com', '$2y$10$63QQTcHZ5K7iC8Uet8Nyt.vkTj9pkib4d5ejIRprKx7yd8f77bud.', 'student', '+60 17 555 3344', 'NP', 'Feb 2025', 0, 0, NULL, NULL, '2025-02-08 14:00:00', '2025-02-08 14:00:00');

INSERT INTO `clubs` (`id`, `name`, `category`, `description`, `tagline`, `image`, `cover`, `leader_id`, `location`, `founded`, `meeting_time`, `featured`, `created_at`, `updated_at`) VALUES
('c-photo', 'Photography Club', 'Arts & Design', 'We are a community of photo enthusiasts who love exploring the world through our lenses. From beginners to seasoned shooters, we learn composition, lighting, and storytelling together on campus and beyond.', 'Capture moments, share stories.', 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', 'https://images.unsplash.com/photo-1452587925148-ce544e77a403?w=1400&q=80', 2, 'Main Campus', 'Jan 2024', 'Every Tuesday, 16:00', 1, '2024-01-20 12:00:00', '2025-04-10 12:00:00'),
('c-tech', 'Tech & Coding Club', 'Technology', 'Learn programming, ship projects, and collaborate with other builders on campus. We run hack nights, workshops, and demo days for every skill level.', 'Build. Learn. Create.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&q=80', 2, 'Innovation Lab', 'Sep 2023', 'Every Thursday, 17:00', 1, '2023-09-05 10:00:00', '2025-04-10 10:00:00'),
('c-sports', 'Sports Club', 'Sports', 'Friendly matches, training sessions, and campus tournaments. Stay active with football, basketball, fitness programs, and seasonal competitions.', 'Stay active, stay healthy.', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80', 'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=1400&q=80', 2, 'Sports Complex', 'Mar 2022', 'Weekends, 09:00', 0, '2022-03-01 08:00:00', '2025-04-10 08:00:00'),
('c-music', 'Music Club', 'Music', 'Jam sessions, open mics, and music production workshops. Whether you sing, play, or produce, there is a spot for you in our collective.', 'Play. Share. Enjoy.', 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1400&q=80', 2, 'Arts Hall', 'Jun 2023', 'Every Friday, 18:00', 0, '2023-06-15 16:00:00', '2025-04-10 16:00:00'),
('c-env', 'Environmental Club', 'Environment', 'Campus clean-ups, recycling drives, and sustainability talks. We work together to make our campus greener and educate peers on environmental responsibility.', 'A cleaner planet, a brighter future.', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1400&q=80', 2, 'Green Quad', 'Apr 2024', 'Every Wednesday, 15:00', 0, '2024-04-10 13:00:00', '2025-04-10 13:00:00');

INSERT INTO `club_activities` (`id`, `club_id`, `activity`) VALUES
(1, 'c-photo', 'Photography workshops'),
(2, 'c-photo', 'Photo walks'),
(3, 'c-photo', 'Photo editing sessions'),
(4, 'c-photo', 'Exhibitions'),
(5, 'c-tech', 'Hack nights'),
(6, 'c-tech', 'Workshops'),
(7, 'c-tech', 'Mentorship'),
(8, 'c-tech', 'Demo days'),
(9, 'c-sports', 'Football'),
(10, 'c-sports', 'Basketball'),
(11, 'c-sports', 'Fitness'),
(12, 'c-sports', 'Tournaments'),
(13, 'c-music', 'Jam nights'),
(14, 'c-music', 'Open mic'),
(15, 'c-music', 'Choir'),
(16, 'c-music', 'Recording'),
(17, 'c-env', 'Clean-ups'),
(18, 'c-env', 'Tree planting'),
(19, 'c-env', 'Talks'),
(20, 'c-env', 'Recycling');

INSERT INTO `club_members` (`id`, `club_id`, `user_id`, `created_at`, `updated_at`) VALUES
(1, 'c-photo', 1, '2025-04-05 10:00:00', '2025-04-05 10:00:00'),
(2, 'c-photo', 2, '2024-01-25 10:00:00', '2024-01-25 10:00:00'),
(3, 'c-photo', 5, '2025-03-01 11:00:00', '2025-03-01 11:00:00'),
(4, 'c-tech', 2, '2023-09-10 10:00:00', '2023-09-10 10:00:00'),
(5, 'c-sports', 1, '2025-02-15 09:00:00', '2025-02-15 09:00:00'),
(6, 'c-sports', 2, '2022-03-05 09:00:00', '2022-03-05 09:00:00'),
(7, 'c-music', 2, '2023-06-20 18:00:00', '2023-06-20 18:00:00'),
(8, 'c-music', 5, '2025-02-20 18:00:00', '2025-02-20 18:00:00'),
(9, 'c-env', 2, '2024-04-15 15:00:00', '2024-04-15 15:00:00');

INSERT INTO `events` (`id`, `club_id`, `title`, `description`, `event_date`, `event_time`, `location`, `image`, `capacity`, `registration_deadline`, `status`, `created_at`, `updated_at`) VALUES
('e-photo-basics', 'c-photo', 'Photography Basics Workshop', 'Learn the basics of photography, including camera settings, composition, and lighting. Perfect for beginners!', '2025-04-26', '10:00 AM - 12:00 PM', 'Learning Center, Main Campus', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80', 30, '2025-04-24', 'active', '2025-04-01 09:00:00', '2025-04-01 09:00:00'),
('e-tech-talk', 'c-tech', 'Tech Talk: Building Your First App', 'A beginner-friendly session on shipping your first campus app with modern tools and team collaboration tips.', '2025-04-28', '2:00 PM - 4:00 PM', 'Innovation Lab', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200&q=80', 40, '2025-04-27', 'active', '2025-04-02 10:00:00', '2025-04-02 10:00:00'),
('e-bball', 'c-sports', 'Basketball Friendly Match', 'Casual 5v5 games. All skill levels welcome. Bring indoor shoes and a water bottle.', '2025-04-30', '4:00 PM - 6:00 PM', 'Sports Complex', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&q=80', 24, '2025-04-29', 'active', '2025-04-03 11:00:00', '2025-04-03 11:00:00');

INSERT INTO `event_registrations` (`id`, `event_id`, `user_id`, `attended`, `registered_at`) VALUES
(1, 'e-photo-basics', 1, 0, '2025-04-10 14:30:00'),
(2, 'e-bball', 1, 0, '2025-04-12 16:00:00');

INSERT INTO `membership_requests` (`id`, `club_id`, `user_id`, `status`, `created_at`) VALUES
('mr-1', 'c-photo', 4, 'pending', '2025-04-20 09:00:00');

INSERT INTO `leader_requests` (`id`, `user_id`, `club_name`, `category`, `reason`, `document_name`, `status`, `created_at`, `reviewed_at`) VALUES
('lr-1', 4, 'Debate Society', 'Academic', 'I want to build a space for structured debate and public speaking on campus. I have prior experience in high school debate competitions and would like to mentor newcomers.', NULL, 'pending', '2025-04-20 09:00:00', NULL);

INSERT INTO `announcements` (`id`, `club_id`, `title`, `body`, `created_at`, `updated_at`) VALUES
('a-1', 'c-photo', 'Bring your camera on Tuesday', 'We will run a hands-on composition drill during our next meetup. Phones are welcome too — we will cover basics that apply to any camera.', '2025-04-20 09:00:00', NULL);

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `is_read`, `created_at`) VALUES
('n-1', 1, 'Event reminder', 'Photography Basics Workshop is on Saturday, 26 April at 10:00 AM at the Learning Center.', 0, '2025-04-20 09:00:00'),
('n-2', 1, 'Welcome to Photography Club', 'Your membership was confirmed. See you at the next meetup on Tuesday.', 0, '2025-04-18 09:00:00'),
('n-3', 2, 'New membership request', 'Liam Chen requested to join Photography Club.', 0, '2025-04-20 09:00:00'),
('n-4', 3, 'Leader request pending', 'Liam Chen applied to lead Debate Society.', 0, '2025-04-20 09:00:00');

INSERT INTO `reports` (`id`, `reporter_id`, `target_type`, `target_id`, `reason`, `status`, `created_at`) VALUES
('r-1', 5, 'event', 'e-bball', 'Event time may be incorrect — the listing says 4:00 PM but the club poster shows 5:00 PM.', 'open', '2025-04-20 09:00:00');

SET FOREIGN_KEY_CHECKS = 1;