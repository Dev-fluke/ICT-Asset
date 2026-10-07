-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 07, 2026 at 12:52 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ay_inventory_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_rounds`
--

CREATE TABLE `audit_rounds` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `fiscal_year` int(11) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('ACTIVE','CLOSED') DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_rounds`
--

INSERT INTO `audit_rounds` (`id`, `title`, `fiscal_year`, `department_id`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(15, '2569', 2569, NULL, '2026-08-24', '2026-10-30', 'ACTIVE', '2026-08-28 10:07:34', '2026-10-07 10:40:46');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `created_at`) VALUES
(1, 'Computer (PC)', '2026-08-21 09:12:15'),
(2, 'Notebook', '2026-08-21 09:12:15'),
(4, 'Printer', '2026-08-21 09:12:15'),
(6, 'Computer (all-in-one)', '2026-08-22 14:44:18'),
(9, 'test', '2026-09-17 06:32:09');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `created_at`) VALUES
(1, 'บก.อย.', '2026-08-22 07:23:59'),
(2, 'ศทย.อย.', '2026-08-22 07:24:30'),
(3, 'กรม ทย.รอ.อย.', '2026-08-22 07:24:42'),
(4, 'กรม ตอ.อย.', '2026-08-22 07:24:46'),
(5, 'กรม ปพ.อย.', '2026-08-22 07:24:52'),
(6, 'ดย.ทอ.อย.', '2026-08-22 07:24:58');

-- --------------------------------------------------------

--
-- Table structure for table `equipments`
--

CREATE TABLE `equipments` (
  `id` int(11) NOT NULL,
  `computer_name` varchar(100) NOT NULL,
  `user_name` varchar(150) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `organization_id` int(11) DEFAULT NULL,
  `organization_name` varchar(255) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `details` longtext DEFAULT NULL CHECK (json_valid(`details`)),
  `status` varchar(100) DEFAULT 'ใช้งานปกติ',
  `last_audited_at` datetime DEFAULT NULL,
  `qr_code` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status_name` varchar(100) DEFAULT NULL,
  `repair_note` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `equipments`
--

INSERT INTO `equipments` (`id`, `computer_name`, `user_name`, `position`, `email`, `phone`, `category_id`, `department_id`, `organization_id`, `organization_name`, `location_id`, `details`, `status`, `last_audited_at`, `qr_code`, `created_at`, `status_name`, `repair_note`, `updated_at`) VALUES
(12, 'AB0005', 'ACER', NULL, NULL, NULL, 1, 3, 6, NULL, 5, '[{\"title\":\"Serial Number\",\"value\":\"a\"},{\"title\":\"CPU\",\"value\":\"a\"},{\"title\":\"RAM\",\"value\":\"a\"},{\"title\":\"Storage / Harddisk\",\"value\":\"a\"},{\"title\":\"OS /ระบบปฏิบัติการ\",\"value\":\"a\"}]', 'ใช้งานปกติ', '2026-09-17 13:36:04', 'data:image/png;base64,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', '2026-08-22 06:15:54', NULL, NULL, '2026-09-17 06:36:04'),
(15, 'desktop004', 'น่าน', 'หหห', 'fluke@gmail.com', '000', 2, 1, 1, NULL, NULL, '[]', 'ใช้งานปกติ', NULL, 'data:image/png;base64,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', '2026-08-22 06:20:25', NULL, NULL, '2026-09-17 06:35:21'),
(16, 'ICT0015', 'พ.อ.ท.กิตติภณ กล่ำเอม', 'สมน.ผสส.อย.', 'kittipon_kl', '2-6366', 1, 1, NULL, NULL, NULL, '[{\"title\":\"Serial Number\",\"value\":\"175545\"},{\"title\":\"RAM\",\"value\":\"4\"},{\"title\":\"Storage / Harddisk\",\"value\":\"500\"},{\"title\":\"MAC Address\",\"value\":\"11122211\"},{\"title\":\"HDD\",\"value\":\"500\"}]', 'ใช้งานปกติ', NULL, 'data:image/png;base64,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', '2026-08-22 06:20:30', NULL, NULL, '2026-09-17 06:35:18'),
(27, 'ปป', NULL, 'ฟฟฟฟ', NULL, NULL, 1, 1, NULL, NULL, NULL, '[{\"title\":\"55\",\"value\":\"55\"}]', 'ใช้งานปกติ', NULL, 'data:image/png;base64,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', '2026-08-28 09:34:44', NULL, NULL, '2026-09-17 06:35:14'),
(28, '55555', '55555555', '5555', '55', '55555', 1, 4, NULL, NULL, NULL, '[{\"title\":\"Serial Number\",\"value\":\"44444\"},{\"title\":\"RAM\",\"value\":\"4\"}]', 'ใช้งานปกติ', '2026-09-02 14:58:11', 'data:image/png;base64,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', '2026-09-02 05:57:05', NULL, NULL, '2026-09-16 09:41:29'),
(29, 'sss', NULL, NULL, NULL, NULL, 2, 2, NULL, NULL, NULL, '[]', 'ใช้งานปกติ', NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJQAAACUCAYAAAB1PADUAAAAAklEQVR4AewaftIAAAS9SURBVO3BQY4cSRIEQdNA/f/Lun30UwCJ9GqSsyaCP1K15KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkUnVYtOqhadVC06qVr0yUtAfpOaCcikZgIyqdkEZFJzA+RGzQTkN6l546Rq0UnVopOqRZ8sU7MJyH+JmjfUbAKy6aRq0UnVopOqRZ98GZAn1DyhZgLyBJAbNROQSc0bQCY1TwB5Qs03nVQtOqladFK16JN/HJBvAjKpuQEyqZmATGr+S06qFp1ULTqpWvTJP07NDZAn1ExAJiCbgExq/mUnVYtOqhadVC365MvU/CYgk5oJyA2QGzVPAPkmNX+Tk6pFJ1WLTqoWfbIMyG8CMqmZgExqJiCTmgnIDZBJzY2aCcgTQP5mJ1WLTqoWnVQt+uQlNX8zNW+omYBMaiYgT6i5UfMvOaladFK16KRqEf7IC0AmNROQGzUTkCfU3ACZ1GwC8oaaGyCTmhsgk5oJyI2aN06qFp1ULTqpWvTJl6l5Q80NkBs1E5A31NyouQEyAZnU3AC5UXOjZgKy6aRq0UnVopOqRZ+8pGYCMqm5ATKpmYDcqJmAvKHmDSCTmknNBORGzQ2QGyA3ajadVC06qVp0UrXoky8DMqmZ1ExAJjUTkBs1T6iZgDyh5gkgbwC5ATKpuQEyqXnjpGrRSdWik6pF+CMvAJnU3ACZ1ExAbtR8E5AbNROQGzU3QCY1bwC5UfNNJ1WLTqoWnVQtwh9ZBOQJNW8AmdR8E5BJzQRkUjMBmdRMQG7UvAHkRs0bJ1WLTqoWnVQt+uQlIE+ouQHyhJoJyKRmAnKj5kbNBGRS8wSQSc0NkEnNBORPOqladFK16KRq0ScvqXkCyBNqJiATkEnNBGRS8wSQTWq+Sc0NkEnNppOqRSdVi06qFn2yDMgmIG+omYBMaiYgk5oJyKTmBsgbam6ATGr+pJOqRSdVi06qFuGPfBGQGzWbgExqboC8oWYCMqm5ATKp2QTkRs2mk6pFJ1WLTqoWffISkEnNpOYGyBNqJiCTmifUTEAmNROQCcikZgIyqXkCyKRmAvKEmm86qVp0UrXopGoR/sgXAXlDzQRkUnMDZFKzCchvUvMEkEnNN51ULTqpWnRSteiTZUAmNROQSc0EZAIyqZmATGo2AfmbAPmbnVQtOqladFK16JNlam7U3Kj5TUAmNTdqJiCTmhsgN2qeAPIEkBs1b5xULTqpWnRSteiTl4D8JjU3QN4A8oSabwIyqXlCzQRkUrPppGrRSdWik6pFnyxTswnIG2omIJOaCcg3qZmA3Kh5Qs2Nmm86qVp0UrXopGrRJ18G5Ak1T6iZgExAJjU3am6AvKHmBsgmIE+oeeOkatFJ1aKTqkWf/OOAfBOQJ9Q8oWYCMqm5AXKj5gbIppOqRSdVi06qFn3yfwbIpOZGzQ2QCciNmgnIE0AmNX+Tk6pFJ1WLTqoWffJlar5JzQ2QN4DcqLkB8puATGomIJOaTSdVi06qFp1ULfpkGZDfBGRS8wSQSc2fpGYC8oSaP+mkatFJ1aKTqkX4I1VLTqoWnVQtOqladFK16KRq0UnVopOqRSdVi06qFp1ULTqpWnRSteikatFJ1aKTqkX/Axu9IUXn/Lp7AAAAAElFTkSuQmCC', '2026-09-02 08:35:47', NULL, NULL, '2026-09-16 09:39:09');

-- --------------------------------------------------------

--
-- Table structure for table `equipment_attributes`
--

CREATE TABLE `equipment_attributes` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `equipment_attributes`
--

INSERT INTO `equipment_attributes` (`id`, `name`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'CPU', 4, '2026-08-21 16:30:50', '2026-08-22 14:50:45'),
(2, 'RAM', 2, '2026-08-21 16:30:50', '2026-08-22 14:50:47'),
(3, 'Storage / Harddisk', 3, '2026-08-21 16:30:50', '2026-08-22 14:50:47'),
(4, 'OS /ระบบปฏิบัติการ', 5, '2026-08-21 16:30:50', '2026-08-21 17:12:34'),
(5, 'Serial Number', 1, '2026-08-21 16:30:50', '2026-08-22 14:50:47'),
(7, 'MAC Address', 6, '2026-08-24 04:06:17', '2026-08-24 04:06:17');

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `name`, `created_at`) VALUES
(5, 'บก.อย.', '2026-08-21 13:45:31'),
(7, 'ศทย.อย.', '2026-08-21 15:51:53'),
(10, 'กรม ทย.รอ.อย.', '2026-08-21 15:55:01'),
(13, 'กรม ตอ.อย.', '2026-08-21 15:55:35'),
(16, 'ดย.ทอ.อย.', '2026-08-21 15:55:51');

-- --------------------------------------------------------

--
-- Table structure for table `organizations`
--

CREATE TABLE `organizations` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `department_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `organizations`
--

INSERT INTO `organizations` (`id`, `name`, `department_id`) VALUES
(1, 'กกพ.บก.อย.', 1),
(3, 'กขว.บก.อย.', 1),
(4, 'นทสส.อย.', 1),
(6, 'กบบ.กรม ทย.รอ.อย.', 3),
(8, 'กพ.ศทย.อย.', 2);

-- --------------------------------------------------------

--
-- Table structure for table `repairs`
--

CREATE TABLE `repairs` (
  `id` int(11) NOT NULL,
  `equipment_id` int(11) NOT NULL,
  `reporter_name` varchar(100) NOT NULL,
  `symptom` text NOT NULL,
  `status` enum('รอดำเนินการ','กำลังดำเนินการ','ซ่อมเสร็จสิ้น','ยกเลิก') DEFAULT 'รอดำเนินการ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `repairs`
--

INSERT INTO `repairs` (`id`, `equipment_id`, `reporter_name`, `symptom`, `status`, `created_at`) VALUES
(4, 27, 'ฟลุ๊คสุดหล่อ', 'เปิดไม่ติด', 'รอดำเนินการ', '2026-08-28 10:03:25'),
(5, 27, 'test', 'test', 'รอดำเนินการ', '2026-08-28 11:27:32'),
(6, 16, 'เท่', 'เปิดไม่ติด', '', '2026-09-02 09:01:52');

-- --------------------------------------------------------

--
-- Table structure for table `repair_history`
--

CREATE TABLE `repair_history` (
  `id` int(11) NOT NULL,
  `equipment_id` int(11) NOT NULL,
  `repair_status` varchar(50) NOT NULL,
  `repair_note` text DEFAULT NULL,
  `repaired_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `repair_history`
--

INSERT INTO `repair_history` (`id`, `equipment_id`, `repair_status`, `repair_note`, `repaired_by`, `created_at`) VALUES
(3, 16, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-08-25 07:10:05'),
(4, 16, 'ใช้งานปกติ', 'ซ่อมแซมเสร็จสิ้น ใช้งานได้ปกติ', 'ช่างเทคนิค', '2026-08-25 07:10:07'),
(7, 27, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-08-28 10:03:49'),
(8, 27, 'ใช้งานปกติ', 'ซ่อมแซมเสร็จสิ้น ใช้งานได้ปกติ', 'ช่างเทคนิค', '2026-08-28 10:03:56'),
(9, 27, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-08-28 11:28:42'),
(10, 15, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-08-28 11:30:17'),
(11, 27, 'ใช้งานปกติ', 'ซ่อมแซมเสร็จสิ้น ใช้งานได้ปกติ', 'ช่างเทคนิค', '2026-08-28 11:34:52'),
(12, 15, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-09-02 07:22:18'),
(13, 12, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-09-02 07:22:23'),
(14, 28, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-09-02 08:19:25'),
(15, 28, 'ใช้งานปกติ', 'ซ่อมแซมเสร็จสิ้น ใช้งานได้ปกติ', 'ช่างเทคนิค', '2026-09-02 08:19:27'),
(16, 15, 'ใช้งานปกติ', 'ซ่อมแซมเสร็จสิ้น ใช้งานได้ปกติ', 'ช่างเทคนิค', '2026-09-02 08:19:57'),
(17, 12, 'ใช้งานปกติ', 'ซ่อมแซมเสร็จสิ้น ใช้งานได้ปกติ', 'ช่างเทคนิค', '2026-09-02 08:19:59'),
(18, 29, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-09-03 06:25:32'),
(19, 29, 'ใช้งานปกติ', 'ซ่อมแซมเสร็จสิ้น ใช้งานได้ปกติ', 'ช่างเทคนิค', '2026-09-03 06:25:34'),
(20, 27, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-09-10 15:12:42'),
(21, 27, 'ใช้งานปกติ', 'ซ่อมแซมเสร็จสิ้น ใช้งานได้ปกติ', 'ช่างเทคนิค', '2026-09-10 15:12:54'),
(22, 16, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'ช่างเทคนิค', '2026-09-10 15:13:24'),
(23, 16, 'จำหน่าย', 'ซ่อมไม่สำเร็จ: เมนบอร์ดเสีย', 'kittipon_kl', '2026-09-10 15:18:45'),
(24, 28, 'กำลังซ่อม', 'เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ', 'kittipon_kl', '2026-09-10 15:19:33');

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('auto_logout_enabled', 'true', '2026-09-24 15:52:49'),
('auto_logout_minutes', '15', '2026-09-24 16:06:51'),
('repair_portal_enabled', 'false', '2026-09-24 16:09:12'),
('repair_portal_message', '', '2026-09-24 16:07:56'),
('theme_color', '#0891b2', '2026-09-24 16:00:29'),
('theme_preset', 'cyan', '2026-09-24 16:00:29');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `fullname` varchar(100) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role` enum('Admin','Staff') NOT NULL DEFAULT 'Staff',
  `department_id` int(11) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `last_active_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fullname`, `position`, `email`, `role`, `department_id`, `avatar`, `created_at`, `last_active_at`) VALUES
(1, 'admin', '1111', 'TEST', NULL, NULL, 'Admin', 1, 'avatar-1787646866301-281354540.jpg', '2026-08-25 08:34:26', '2026-10-07 17:44:07'),
(3, 'kittipon_kl', '1111', 'พ.อ.ท.กิตติภณ  กล่ำเอม', NULL, NULL, 'Admin', 1, 'avatar-1787823999335-169283825.jpg', '2026-08-26 08:33:46', '2026-10-07 17:40:11'),
(5, 'Akkrachai_p', '1111', 'ร.อ.อัครชัย  พึ่งฉิ่ง', NULL, NULL, 'Admin', 1, 'avatar-1788337696374-218056115.jpg', '2026-09-02 08:27:30', '2026-09-04 10:23:37'),
(6, 'peeranat_na', '1111', 'จ.ต.พีรณัฐ นาวิชา', NULL, NULL, 'Admin', 1, 'avatar-1788337773581-261866922.jpg', '2026-09-02 08:29:33', '2026-09-02 15:43:57'),
(7, 'staff', '1111', 'staff', NULL, NULL, 'Staff', NULL, NULL, '2026-09-24 08:03:04', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_activity_logs`
--

CREATE TABLE `user_activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `target_type` varchar(50) DEFAULT NULL,
  `target_id` varchar(50) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_activity_logs`
--

INSERT INTO `user_activity_logs` (`id`, `user_id`, `username`, `action`, `description`, `target_type`, `target_id`, `ip_address`, `created_at`) VALUES
(2, 0, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (Super Admin)', 'AUTH', NULL, '::1', '2026-09-02 15:10:53'),
(3, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ', 'AUTH', NULL, '127.0.0.1', '2026-09-02 08:30:00'),
(4, 3, 'kittipon_kl', 'AUDIT_EQUIPMENT', 'ยืนยันผลการสำรวจครุภัณฑ์ประจำปี', 'AUDIT', '16', '127.0.0.1', '2026-09-02 09:15:20'),
(5, 3, 'kittipon_kl', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลรายละเอียดครุภัณฑ์คอมพิวเตอร์', 'EQUIPMENT', '16', '127.0.0.1', '2026-09-02 09:20:45'),
(6, 1, 'admin', 'CREATE_EQUIPMENT', 'เพิ่มข้อมูลครุภัณฑ์ใหม่ในระบบ', 'EQUIPMENT', '28', '127.0.0.1', '2026-09-01 14:10:00'),
(7, 1, 'admin', 'REPORT_REPAIR', 'แจ้งซ่อมครุภัณฑ์ อาการ: เปิดเครื่องไม่ติด', 'REPAIR', '27', '127.0.0.1', '2026-09-01 15:45:10'),
(8, NULL, 'ช่างเทคนิค', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ID: 28 -> กำลังซ่อม', 'REPAIR', '28', '::1', '2026-09-02 15:19:25'),
(9, NULL, 'ช่างเทคนิค', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ID: 28 -> ใช้งานปกติ', 'REPAIR', '28', '::1', '2026-09-02 15:19:27'),
(10, NULL, 'ช่างเทคนิค', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ID: 15 -> ใช้งานปกติ', 'REPAIR', '15', '::1', '2026-09-02 15:19:57'),
(11, NULL, 'ช่างเทคนิค', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ID: 12 -> ใช้งานปกติ', 'REPAIR', '12', '::1', '2026-09-02 15:19:59'),
(12, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: 55555 (สถานะ: ส่งซ่อม)', 'EQUIPMENT', '28', '::1', '2026-09-02 15:21:34'),
(13, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-02 15:21:52'),
(14, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (555)', 'AUTH', NULL, '::1', '2026-09-02 15:21:57'),
(15, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (555)', 'AUTH', NULL, '::1', '2026-09-02 15:22:00'),
(16, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-02 15:22:11'),
(17, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (555)', 'AUTH', NULL, '::1', '2026-09-02 15:25:45'),
(18, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (555)', 'AUTH', NULL, '::1', '2026-09-02 15:26:02'),
(19, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-02 15:26:45'),
(20, NULL, 'Admin', 'EDIT_USER', 'แก้ไขข้อมูลผู้ใช้งาน: admin (ID: 1)', 'USER', '1', '::1', '2026-09-02 15:27:02'),
(21, NULL, 'Admin', 'CREATE_USER', 'ลงทะเบียนผู้ใช้งานใหม่: Akkrachai_p (ร.อ.อัครชัย  พึ่งฉิ่ง) [สิทธิ์: Admin]', 'USER', '5', '::1', '2026-09-02 15:27:30'),
(22, NULL, 'Admin', 'EDIT_USER', 'แก้ไขข้อมูลผู้ใช้งาน: Akkrachai_p (ID: 5)', 'USER', '5', '::1', '2026-09-02 15:28:16'),
(23, NULL, 'Admin', 'CREATE_USER', 'ลงทะเบียนผู้ใช้งานใหม่: peeranat_na (จ.ต.พีรณัฐ นาวิชา) [สิทธิ์: Admin]', 'USER', '6', '::1', '2026-09-02 15:29:33'),
(24, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-02 15:29:39'),
(25, 6, 'peeranat_na', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (จ.ต.พีรณัฐ นาวิชา)', 'AUTH', NULL, '::1', '2026-09-02 15:29:42'),
(26, 6, 'peeranat_na', 'LOGOUT', 'ออกจากระบบ (จ.ต.พีรณัฐ นาวิชา)', 'AUTH', NULL, '::1', '2026-09-02 15:29:45'),
(27, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::ffff:10.107.36.121', '2026-09-02 15:30:36'),
(28, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::ffff:10.107.36.121', '2026-09-02 15:34:48'),
(29, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::ffff:10.107.36.121', '2026-09-02 15:34:55'),
(30, NULL, 'User', 'CREATE_EQUIPMENT', 'เพิ่มครุภัณฑ์ใหม่: sss (-)', 'EQUIPMENT', '29', '::ffff:10.107.36.121', '2026-09-02 15:35:47'),
(31, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::ffff:10.107.36.121', '2026-09-02 15:41:19'),
(32, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::ffff:10.107.36.121', '2026-09-02 15:41:22'),
(33, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::ffff:10.107.36.121', '2026-09-02 15:42:48'),
(34, 6, 'peeranat_na', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (จ.ต.พีรณัฐ นาวิชา)', 'AUTH', NULL, '::ffff:10.233.81.111', '2026-09-02 15:43:11'),
(35, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: sss (สถานะ: ใช้งานปกติ)', 'EQUIPMENT', '29', '::ffff:10.107.36.121', '2026-09-02 15:52:35'),
(36, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::ffff:10.107.36.93', '2026-09-02 15:57:55'),
(37, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: sss (สถานะ: ส่งซ่อม)', 'EQUIPMENT', '29', '::ffff:10.107.36.121', '2026-09-02 15:59:00'),
(38, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: ปป (สถานะ: ส่งซ่อม)', 'EQUIPMENT', '27', '::ffff:10.107.36.121', '2026-09-02 15:59:35'),
(39, NULL, 'เท่', 'REPORT_REPAIR', 'แจ้งซ่อมครุภัณฑ์ 16 อาการ: เปิดไม่ติด', 'REPAIR', '16', '::ffff:10.233.81.123', '2026-09-02 16:01:52'),
(40, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::ffff:10.107.36.121', '2026-09-02 16:02:59'),
(41, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::ffff:10.107.36.121', '2026-09-02 16:03:04'),
(42, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-03 13:24:40'),
(43, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-03 13:24:54'),
(44, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-03 13:25:03'),
(45, NULL, 'ช่างเทคนิค', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ID: 29 -> กำลังซ่อม', 'REPAIR', '29', '::1', '2026-09-03 13:25:32'),
(46, NULL, 'ช่างเทคนิค', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ID: 29 -> ใช้งานปกติ', 'REPAIR', '29', '::1', '2026-09-03 13:25:34'),
(47, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-03 14:28:49'),
(48, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::ffff:192.168.100.17', '2026-09-03 15:22:22'),
(49, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-03 15:22:49'),
(50, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-03 15:22:55'),
(51, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-03 15:22:59'),
(52, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::ffff:192.168.100.17', '2026-09-03 15:23:55'),
(53, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::ffff:192.168.100.17', '2026-09-03 15:24:33'),
(54, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::ffff:192.168.100.17', '2026-09-03 15:25:51'),
(55, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::ffff:192.168.100.17', '2026-09-03 15:25:55'),
(56, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::ffff:192.168.100.17', '2026-09-03 15:26:08'),
(57, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-04 09:44:40'),
(58, 5, 'Akkrachai_p', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (ร.อ.อัครชัย  พึ่งฉิ่ง)', 'AUTH', NULL, '::ffff:10.233.95.194', '2026-09-04 09:48:17'),
(59, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-04 10:03:15'),
(60, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-04 10:05:15'),
(61, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-04 10:09:03'),
(62, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::ffff:10.233.95.194', '2026-09-04 10:10:36'),
(63, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:00:38'),
(64, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:00:43'),
(65, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:00:49'),
(66, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:01:17'),
(67, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:02:43'),
(68, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:04:36'),
(69, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:04:40'),
(70, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:04:55'),
(71, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:05:01'),
(72, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:14:51'),
(73, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:14:55'),
(74, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:15:13'),
(75, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:15:16'),
(76, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:15:55'),
(77, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:15:58'),
(78, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:16:15'),
(79, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:16:17'),
(80, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:16:33'),
(81, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:16:35'),
(82, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:17:03'),
(83, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:17:08'),
(84, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:17:52'),
(85, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:18:07'),
(86, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:18:37'),
(87, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:18:39'),
(88, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:19:05'),
(89, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:19:07'),
(90, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:19:36'),
(91, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:19:39'),
(92, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:20:19'),
(93, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:20:22'),
(94, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:20:46'),
(95, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:20:49'),
(96, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:21:02'),
(97, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:21:05'),
(98, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:22:56'),
(99, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:22:59'),
(100, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:23:14'),
(101, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:23:17'),
(102, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:37:51'),
(103, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 21:38:15'),
(104, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:38:25'),
(105, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:40:01'),
(106, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:40:10'),
(107, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:46:27'),
(108, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:46:37'),
(109, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:49:45'),
(110, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 21:49:55'),
(111, NULL, 'ช่างเทคนิค', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ID: 27 -> กำลังซ่อม', 'REPAIR', '27', '::1', '2026-09-10 22:12:42'),
(112, NULL, 'ช่างเทคนิค', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ID: 27 -> ใช้งานปกติ', 'REPAIR', '27', '::1', '2026-09-10 22:12:54'),
(113, NULL, 'ช่างเทคนิค', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ID: 16 -> กำลังซ่อม', 'REPAIR', '16', '::1', '2026-09-10 22:13:24'),
(114, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 22:17:41'),
(115, 3, 'kittipon_kl', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ ICT0015: -> จำหน่าย (ซ่อมไม่สำเร็จ: เมนบอร์ดเสีย)', 'REPAIR', '16', '::1', '2026-09-10 22:18:45'),
(116, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: ICT0015 (สถานะ: ใช้งานปกติ)', 'EQUIPMENT', '16', '::1', '2026-09-10 22:19:24'),
(117, 3, 'kittipon_kl', 'UPDATE_REPAIR_STATUS', 'อัปเดตสถานะงานซ่อมครุภัณฑ์ 55555: -> กำลังซ่อม (เจ้าหน้าที่รับเรื่องและกำลังดำเนินการตรวจสอบ)', 'REPAIR', '28', '::1', '2026-09-10 22:19:33'),
(118, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 22:19:46'),
(119, NULL, 'Admin', 'EDIT_USER', 'แก้ไขข้อมูลผู้ใช้งาน: admin (ID: 1)', 'USER', '1', '::1', '2026-09-10 22:25:15'),
(120, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 22:25:20'),
(121, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 22:25:24'),
(122, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 22:25:38'),
(123, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 22:25:42'),
(124, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 22:25:45'),
(125, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 22:25:51'),
(126, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 22:39:14'),
(127, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 22:39:20'),
(128, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 22:46:45'),
(129, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 22:47:31'),
(130, NULL, 'Admin', 'EDIT_USER', 'แก้ไขข้อมูลผู้ใช้งาน: admin (ID: 1)', 'USER', '1', '::1', '2026-09-10 22:49:37'),
(131, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 22:49:42'),
(132, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 22:49:46'),
(133, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-10 22:50:24'),
(134, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-10 22:50:31'),
(135, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::ffff:127.0.0.1', '2026-09-11 12:52:04'),
(136, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '::1', '2026-09-11 12:52:07'),
(137, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-11 12:52:09'),
(138, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-11 12:53:07'),
(139, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '::1', '2026-09-15 08:50:40'),
(140, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '1.46.136.81', '2026-09-16 16:30:11'),
(141, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '180.183.37.144', '2026-09-16 16:30:25'),
(142, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '180.183.37.144', '2026-09-16 16:35:46'),
(143, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '180.183.37.144', '2026-09-16 16:36:16'),
(144, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: sss (สถานะ: ใช้งานปกติ)', 'EQUIPMENT', '29', '180.183.37.144', '2026-09-16 16:39:09'),
(145, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '1.46.136.81', '2026-09-16 16:40:57'),
(146, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: 55555 (สถานะ: ใช้งานปกติ)', 'EQUIPMENT', '28', '180.183.37.144', '2026-09-16 16:41:29'),
(147, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '122.155.138.34', '2026-09-17 08:47:38'),
(148, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-17 13:29:36'),
(149, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-17 13:30:25'),
(150, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '122.155.138.34', '2026-09-17 13:30:32'),
(151, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '122.155.138.34', '2026-09-17 13:33:21'),
(152, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '122.155.138.34', '2026-09-17 13:33:37'),
(153, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: ปป (สถานะ: ใช้งานปกติ)', 'EQUIPMENT', '27', '122.155.138.34', '2026-09-17 13:35:14'),
(154, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: ICT0015 (สถานะ: ใช้งานปกติ)', 'EQUIPMENT', '16', '122.155.138.34', '2026-09-17 13:35:18'),
(155, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: desktop004 (สถานะ: ใช้งานปกติ)', 'EQUIPMENT', '15', '122.155.138.34', '2026-09-17 13:35:21'),
(156, NULL, 'User', 'EDIT_EQUIPMENT', 'แก้ไขข้อมูลครุภัณฑ์: AB0005 (สถานะ: ใช้งานปกติ)', 'EQUIPMENT', '12', '122.155.138.34', '2026-09-17 13:35:25'),
(157, NULL, 'User', 'AUDIT_EQUIPMENT', 'บันทึกยืนยันผลการสำรวจครุภัณฑ์: 12', 'AUDIT', '12', '171.6.136.233', '2026-09-17 13:36:04'),
(158, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 14:17:58'),
(159, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 14:18:06'),
(160, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 14:18:15'),
(161, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:02:17'),
(162, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:02:22'),
(163, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:02:30'),
(164, NULL, 'Admin', 'EDIT_USER', 'แก้ไขข้อมูลผู้ใช้งาน: admin (ID: 1)', 'USER', '1', '122.155.138.34', '2026-09-24 15:02:48'),
(165, NULL, 'Admin', 'CREATE_USER', 'ลงทะเบียนผู้ใช้งานใหม่: staff (staff) [สิทธิ์: Staff]', 'USER', '7', '122.155.138.34', '2026-09-24 15:03:04'),
(166, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:03:14'),
(167, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:03:21'),
(168, NULL, 'Admin', 'EDIT_USER', 'แก้ไขข้อมูลผู้ใช้งาน: admin (ID: 1)', 'USER', '1', '122.155.138.34', '2026-09-24 15:03:31'),
(169, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:03:35'),
(170, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:03:38'),
(171, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:20:22'),
(172, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:39:24'),
(173, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:39:28'),
(174, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:44:18'),
(175, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 15:44:24'),
(176, NULL, 'Admin Test', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 30 นาที, แจ้งซ่อมภายนอก: เปิด, ธีมสี: #0891b2)', 'SYSTEM', 'SETTINGS', '::1', '2026-09-24 15:53:15'),
(177, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 30 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: #e11d48)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 15:56:01'),
(178, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 30 นาที, แจ้งซ่อมภายนอก: เปิด, ธีมสี: #e11d48)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 15:57:22'),
(179, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 30 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: #e11d48)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 15:57:29'),
(180, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 5 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: #e11d48)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 15:57:46'),
(181, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 5 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: #0d6efd)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 15:57:59'),
(182, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 5 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: #0891b2)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 15:58:55'),
(183, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 5 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: #7c3aed)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 15:59:05'),
(184, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 5 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: #059669)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 15:59:23'),
(185, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 16:00:18'),
(186, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 16:00:21'),
(187, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 5 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: #0891b2)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 16:00:29'),
(188, NULL, 'Admin', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 15 นาที, แจ้งซ่อมภายนอก: เปิด, ธีมสี: undefined)', 'SYSTEM', 'SETTINGS', '::1', '2026-09-24 16:06:51'),
(189, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 15 นาที, แจ้งซ่อมภายนอก: เปิด, ธีมสี: undefined)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 16:07:56'),
(190, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 15 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: undefined)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 16:07:59'),
(191, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 15 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: undefined)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 16:08:00'),
(192, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 15 นาที, แจ้งซ่อมภายนอก: เปิด, ธีมสี: undefined)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 16:08:05'),
(193, NULL, 'TEST', 'UPDATE_SYSTEM_SETTINGS', 'อัปเดตการตั้งค่าระบบ (Auto-Logout: 15 นาที, แจ้งซ่อมภายนอก: ปิด, ธีมสี: undefined)', 'SYSTEM', 'SETTINGS', '122.155.138.34', '2026-09-24 16:09:12'),
(194, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 16:09:22'),
(195, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 16:11:07'),
(196, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 16:11:17'),
(197, 3, 'kittipon_kl', 'LOGOUT', 'ออกจากระบบ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 16:11:33'),
(198, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 16:12:33'),
(199, 1, 'admin', 'LOGOUT', 'ออกจากระบบ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 16:12:50'),
(200, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-09-24 16:12:53'),
(201, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '1.47.75.209', '2026-09-25 10:58:44'),
(202, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-09-25 11:07:16'),
(203, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-10-06 14:38:12'),
(204, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '::1', '2026-10-07 17:34:08'),
(205, 1, 'admin', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (TEST)', 'AUTH', NULL, '122.155.138.34', '2026-10-07 17:38:24'),
(206, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '1.47.83.30', '2026-10-07 17:39:12'),
(207, 3, 'kittipon_kl', 'LOGIN', 'เข้าสู่ระบบสำเร็จ (พ.อ.ท.กิตติภณ  กล่ำเอม)', 'AUTH', NULL, '1.47.83.30', '2026-10-07 17:40:11');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_rounds`
--
ALTER TABLE `audit_rounds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `idx_audit_status` (`status`),
  ADD KEY `idx_audit_dept` (`department_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `equipments`
--
ALTER TABLE `equipments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`computer_name`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `location_id` (`location_id`),
  ADD KEY `fk_equipments_department` (`department_id`),
  ADD KEY `idx_equipments_org` (`organization_id`),
  ADD KEY `idx_equipments_status` (`status`),
  ADD KEY `idx_equipments_last_audited` (`last_audited_at`);

--
-- Indexes for table `equipment_attributes`
--
ALTER TABLE `equipment_attributes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `organizations`
--
ALTER TABLE `organizations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `repairs`
--
ALTER TABLE `repairs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `equipment_id` (`equipment_id`),
  ADD KEY `idx_repairs_status` (`status`),
  ADD KEY `idx_repairs_created` (`created_at`);

--
-- Indexes for table `repair_history`
--
ALTER TABLE `repair_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `equipment_id` (`equipment_id`),
  ADD KEY `idx_rh_status` (`repair_status`),
  ADD KEY `idx_rh_created` (`created_at`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `department_id` (`department_id`);

--
-- Indexes for table `user_activity_logs`
--
ALTER TABLE `user_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_rounds`
--
ALTER TABLE `audit_rounds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `equipments`
--
ALTER TABLE `equipments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `equipment_attributes`
--
ALTER TABLE `equipment_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `organizations`
--
ALTER TABLE `organizations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `repairs`
--
ALTER TABLE `repairs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `repair_history`
--
ALTER TABLE `repair_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `user_activity_logs`
--
ALTER TABLE `user_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=208;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_rounds`
--
ALTER TABLE `audit_rounds`
  ADD CONSTRAINT `audit_rounds_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `equipments`
--
ALTER TABLE `equipments`
  ADD CONSTRAINT `equipments_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `equipments_ibfk_2` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_equipments_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_equipments_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `organizations`
--
ALTER TABLE `organizations`
  ADD CONSTRAINT `organizations_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `repairs`
--
ALTER TABLE `repairs`
  ADD CONSTRAINT `repairs_ibfk_1` FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `repair_history`
--
ALTER TABLE `repair_history`
  ADD CONSTRAINT `repair_history_ibfk_1` FOREIGN KEY (`equipment_id`) REFERENCES `equipments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
