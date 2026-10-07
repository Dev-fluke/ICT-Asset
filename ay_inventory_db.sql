-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 28, 2026 at 02:04 PM
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_rounds`
--

INSERT INTO `audit_rounds` (`id`, `title`, `fiscal_year`, `department_id`, `start_date`, `end_date`, `status`, `created_at`, `updated_at`) VALUES
(15, '2569', 2569, NULL, '2026-08-28', '2026-09-03', 'ACTIVE', '2026-08-28 10:07:34', '2026-08-28 10:07:34');

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
(6, 'Computer (all-in-one)', '2026-08-22 14:44:18');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`details`)),
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
(12, 'AB0005', 'ACER', NULL, NULL, '', 1, 3, 6, '', 5, '[{\"title\":\"Serial Number\",\"value\":\"a\"},{\"title\":\"CPU\",\"value\":\"a\"},{\"title\":\"RAM\",\"value\":\"a\"},{\"title\":\"Storage / Harddisk\",\"value\":\"a\"},{\"title\":\"OS /ระบบปฏิบัติการ\",\"value\":\"a\"}]', 'ใช้งานปกติ', NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAACkCAYAAAAZtYVBAAAAAklEQVR4AewaftIAAAX5SURBVO3BQY4cORDAQFLo/3+Z66NOAgrVM5YXGWF/MMYlFmNcZDHGRRZjXGQxxkUWY1xkMcZFFmNcZDHGRRZjXGQxxkUWY1xkMcZFFmNcZDHGRRZjXOTDSyq/qWKnclJxorKreEJlV7FTOanYqewqdiq7ihOV31TxxmKMiyzGuMhijIt8+LKKb1J5ouKbVHYVu4qdyq7iRGVX8ZMqvknlmxZjXGQxxkUWY1zkww9TeaLiiYoTlZOKncqJyq5iV7FTOak4UdlVfJPKExU/aTHGRRZjXGQxxkU+/ONUTipOVHYVP6niRGVXsVPZVfyfLMa4yGKMiyzGuMiHf1zFTuVE5URlV3Gisqv4TSq7in/ZYoyLLMa4yGKMi3z4YRW/qWKnsqvYqTyhcqLykyq+qeImizEushjjIosxLvLhy1R+k8qu4o2KncquYqeyq9ipnKjsKnYqu4qdyq7iROVmizEushjjIosxLmJ/8A9TOal4Q+UnVZyonFT8nyzGuMhijIssxrjIh5dUdhU7lZOKncoTFScqu4q/qWKnclLxhsqu4kRlV7FTOal4YzHGRRZjXGQxxkU+vFTxRMVOZVdxovJExU7ljYoTlV3FTmVXcaJyUvGTVH7TYoyLLMa4yGKMi3y4nMquYqdyUrGr2KmcVDxRsVPZVexUvkllV7FTeaLiROWbFmNcZDHGRRZjXOTDSyonFU+o7Cp2Kk+oPFFxovJExU5lV7FTOanYqewqnqjYqZyo7Cq+aTHGRRZjXGQxxkXsD36Qyq7iROWJihOVXcUTKk9UPKHykypOVE4qdionFW8sxrjIYoyLLMa4yIeXVE4qdiq7ipOKncpOZVdxovJGxYnKruKJihOVXcWJyq5iV3GiclLxTYsxLrIY4yKLMS7y4aWKE5VdxU5lV7FT2VWcqDxR8ZtUTlROKt5QeaPiJy3GuMhijIssxrjIhy9TOVHZVexUdhU7ld+kclKxq9ip7CpOVJ5Q2VXsKp5Q+ZsWY1xkMcZFFmNc5MOXVZyo7FR2FTuVk4qdyq5ip3KiclKxU9lV/CSVXcVO5aRip3KTxRgXWYxxkcUYF7E/+CKVk4qdyknFicqu4gmVk4qdyq7iN6m8UbFTOanYqZxUvLEY4yKLMS6yGOMi9gcvqOwqTlTeqNipfFPFTuWJip3KruJEZVfxk1R2FTuVk4pvWoxxkcUYF1mMcZEPv6ziDZVdxU7lDZWTihOVJ1R2FTuVk4qdyjdV7FR2KruKNxZjXGQxxkUWY1zkw5epvFGxU3miYqeyq9ip7Cp2KjuVk4oTlV3FExU7lV3FGyonFTuVb1qMcZHFGBdZjHGRDz+sYqfyRMUbFTuVv6lip3KTip3Kb1qMcZHFGBdZjHER+4O/SOWJihOVk4o3VHYVO5U3KnYqJxU7lV3FGypPVLyxGOMiizEushjjIh++TGVX8UTFEypvqJxUPFGxU9lV7FSeqDip2Km8UfGbFmNcZDHGRRZjXOTDSyq7ip3KScVO5aTimyqeqDhR2VXsVJ6oOFH5poonVHYVbyzGuMhijIssxriI/cE/TOWNip3KGxU7ld9U8YTKScVvWoxxkcUYF1mMcZEPL6n8poqTip3KGxVPqHxTxU7lCZVdxUnF37QY4yKLMS6yGOMiH76s4ptUnlDZVexUdiq7ihOVXcUbFT+p4g2VXcVPWoxxkcUYF1mMcZEPP0zliYonKnYqT1ScqOwqdipPVDyh8oTKT1I5qXhjMcZFFmNcZDHGRT7841ROVHYVJypvVJyo7Cp2Km9UvKHyNy3GuMhijIssxrjIh/+Zip3KTuUNlSdUdhU7lV3FEyonKicVJxW/aTHGRRZjXGQxxkU+/LCKn1SxUzmp2KnsKt5Q2VX8pIonKnYqu4onVHYVbyzGuMhijIssxriI/cELKr+pYqeyq3hDZVdxovKbKk5UTiqeUNlV/KTFGBdZjHGRxRgXsT8Y4xKLMS6yGOMiizEushjjIosxLrIY4yKLMS6yGOMiizEushjjIosxLrIY4yKLMS6yGOMiizEu8h8oWdRiKXZ+ogAAAABJRU5ErkJggg==', '2026-08-22 06:15:54', NULL, NULL, '2026-08-28 10:08:04'),
(15, 'desktop004', 'น่าน', 'หหห', 'fluke@gmail.com', '000', 2, 3, NULL, NULL, NULL, '[]', 'กำลังซ่อม', '2026-08-26 15:53:07', 'data:image/png;base64,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', '2026-08-22 06:20:25', NULL, NULL, '2026-08-28 11:30:17'),
(16, 'ICT0015', 'พ.อ.ท.กิตติภณ กล่ำเอม', 'สมน.ผสส.อย.', 'kittipon_kl', '2-6366', 1, 1, NULL, 'นทสส.อย.', NULL, '[{\"title\":\"Serial Number\",\"value\":\"175545\"},{\"title\":\"RAM\",\"value\":\"4\"},{\"title\":\"Storage / Harddisk\",\"value\":\"500\"},{\"title\":\"MAC Address\",\"value\":\"11122211\"},{\"title\":\"HDD\",\"value\":\"500\"}]', 'ใช้งานปกติ', NULL, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKQAAACkCAYAAAAZtYVBAAAAAklEQVR4AewaftIAAAYoSURBVO3BQY4kRxLAQDLQ//8yV0c/JZCo6pmQ1s3sH6x1icNaFzmsdZHDWhc5rHWRw1oXOax1kcNaFzmsdZHDWhc5rHWRw1oXOax1kcNaFzmsdZHDWhf54UMqf1LFGypTxROVqeKJyicqJpWpYlKZKp6o/EkVnzisdZHDWhc5rHWRH76s4ptU3lCZKiaVqeKJypOKSWWq+KaKSWWqeFLxTSrfdFjrIoe1LnJY6yI//DKVNyreUJkqJpUnKk8qnqg8UZkq3lCZKr5J5Y2K33RY6yKHtS5yWOsiP/yfqZhUpopJZap4UvGGyhsq/2WHtS5yWOsih7Uu8sP/uYpJZaqYVKaKSeVJxVTxRGWqmFT+Sw5rXeSw1kUOa13kh19W8TdVPFGZKt5QeVLxRGWq+JMqbnJY6yKHtS5yWOsiP3yZyk1Upoo3VKaKSWWqmFSmir9J5WaHtS5yWOsih7Uu8sOHKv5NVKaKJxWTylTxpOJJxaTyTRX/Joe1LnJY6yKHtS7yw4dUpopJ5Zsqpoo3KiaVb1KZKp6oTBWTyidUvqniNx3WushhrYsc1rqI/YM/SOVJxSdUnlS8oTJVfEJlqphU3qh4ojJVPFH5RMUnDmtd5LDWRQ5rXeSHD6m8UTGpPFF5o+INlaliqphUpoonKlPFGxVPVD6hMlVMKlPFbzqsdZHDWhc5rHWRHz5U8ZsqJpWpYlKZKiaVN1SmijcqflPFpDJVvKHyNx3WushhrYsc1rrIDx9SmSqeqEwVk8onKr6pYlKZKp6oTBWfUJkqflPFpPKk4hOHtS5yWOsih7Uu8sOHKp6oTBWTylTxCZWpYqp4ovKGylQxVTxReaNiUpkqnqhMFZPK33RY6yKHtS5yWOsiP3xIZaqYKiaVqWJSeaNiqphU3qj4hMobFd+k8qTimyq+6bDWRQ5rXeSw1kXsH3yRylTxRGWqeENlqnii8qTiDZWpYlL5popJZar4hMqTit90WOsih7UucljrIj98WcWkMlW8oTJVPFGZKv4klaliUnlSMam8oTJVTCpPKt5QmSo+cVjrIoe1LnJY6yI/fEhlqpgqJpWpYlKZKp5UfJPKVPEJlScVb6hMFU9UnlRMKk8qftNhrYsc1rrIYa2L/PChiicqU8WTiknljYpJZaqYVKaKJypvVHxTxScqJpWpYlKZVKaKbzqsdZHDWhc5rHUR+wcfUPlNFZPKGxVPVJ5UTCpTxaTypOKbVJ5UPFH5RMU3Hda6yGGtixzWusgPH6qYVJ5UTCpTxaTyJ1U8qZhUpoo3VN6omComlScqb1RMKpPKVPGJw1oXOax1kcNaF/nhQypTxTdVPFF5ojJVvKHypOKJylQxVUwqU8UTlaniScUbKlPFpPJNh7UucljrIoe1LvLDZVTeqPibVKaKqeKJyhOVqeKJyhsVk8pUMalMFd90WOsih7UucljrIvYPPqAyVfybqbxR8U0qU8UbKk8qnqg8qZhUpopPHNa6yGGtixzWusgPf5jKVDGpfFPFJyomlScqU8UTlaniDZU3VJ5U/E2HtS5yWOsih7Uu8sOHKt6oeFLxhspU8UTlScWkMlVMKlPFE5WpYlJ5UvGk4g2VJypTxW86rHWRw1oXOax1kR8+pPInVUwVk8pUMVU8UXmi8obKVDGpPKmYVN5QmSo+oTJVfNNhrYsc1rrIYa2L/PBlFd+k8kTlEyqfqHhSMalMFZPKpPKJim+q+E2HtS5yWOsih7Uu8sMvU3mj4hMVT1SeVDxReUNlqnij4onKpPIJlaliUpkqvumw1kUOa13ksNZFfviPU5kqJpVPqEwVU8UTlaliUnlSMalMFZPKJyomlaniE4e1LnJY6yKHtS7yw/8ZlU9UvKHypOJJxROVqWJSeVIxqbxR8U2HtS5yWOsih7Uu8sMvq/hNFU8qJpWp4onKVDGpTBVvqDypmFTeqJhUJpUnKlPFbzqsdZHDWhc5rHWRH75M5U9SmSo+ofJGxaQyVUwqTyo+ofKJiicqU8U3Hda6yGGtixzWuoj9g7UucVjrIoe1LnJY6yKHtS5yWOsih7UucljrIoe1LnJY6yKHtS5yWOsih7UucljrIoe1LnJY6yL/A+rKDVNgI9rpAAAAAElFTkSuQmCC', '2026-08-22 06:20:30', NULL, NULL, '2026-08-28 11:18:36'),
(27, 'ปป', NULL, 'ฟฟฟฟ', NULL, NULL, 1, 1, NULL, NULL, NULL, '[{\"title\":\"55\",\"value\":\"55\"}]', 'ใช้งานปกติ', NULL, 'data:image/png;base64,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', '2026-08-28 09:34:44', NULL, NULL, '2026-08-28 11:34:52');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(5, 27, 'test', 'test', 'รอดำเนินการ', '2026-08-28 11:27:32');

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(11, 27, 'ใช้งานปกติ', 'ซ่อมแซมเสร็จสิ้น ใช้งานได้ปกติ', 'ช่างเทคนิค', '2026-08-28 11:34:52');

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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `fullname`, `position`, `email`, `role`, `department_id`, `avatar`, `created_at`) VALUES
(1, 'admin', '1111', '555', NULL, NULL, 'Staff', 1, 'avatar-1787646866301-281354540.jpg', '2026-08-25 08:34:26'),
(3, 'kittipon_kl', '1111', 'พ.อ.ท.กิตติภณ  กล่ำเอม', NULL, NULL, 'Admin', 2, 'avatar-1787823999335-169283825.jpg', '2026-08-26 08:33:46');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_rounds`
--
ALTER TABLE `audit_rounds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_id` (`department_id`);

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
  ADD KEY `fk_equipments_department` (`department_id`);

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
  ADD KEY `equipment_id` (`equipment_id`);

--
-- Indexes for table `repair_history`
--
ALTER TABLE `repair_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `equipment_id` (`equipment_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `department_id` (`department_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `equipments`
--
ALTER TABLE `equipments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `repairs`
--
ALTER TABLE `repairs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `repair_history`
--
ALTER TABLE `repair_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

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
  ADD CONSTRAINT `fk_equipments_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

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
