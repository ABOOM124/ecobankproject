CREATE DATABASE IF NOT EXISTS ecobank
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ecobank;

CREATE TABLE IF NOT EXISTS waste_types (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(80) NOT NULL,
    category ENUM('Plastik', 'Kertas', 'Logam', 'Kaca') NOT NULL,
    price INT UNSIGNED NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_waste_category_name (category, name),
    KEY idx_waste_active_category (is_active, category)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    transaction_code VARCHAR(24) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    waste_type_id INT UNSIGNED NOT NULL,
    weight_kg DECIMAL(10, 2) NOT NULL,
    total_value BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'approved', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_transaction_code (transaction_code),
    KEY idx_transaction_status_created (status, created_at),
    CONSTRAINT fk_transaction_waste_type
        FOREIGN KEY (waste_type_id) REFERENCES waste_types (id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT chk_transaction_weight CHECK (weight_kg > 0)
) ENGINE=InnoDB;

INSERT IGNORE INTO waste_types (id, name, category, price) VALUES
    (1, 'Botol plastik', 'Plastik', 6500),
    (2, 'Tutup botol', 'Plastik', 7200),
    (3, 'Gelas plastik', 'Plastik', 4800),
    (4, 'Plastik kemasan', 'Plastik', 3800),
    (5, 'Kantong plastik', 'Plastik', 2800),
    (6, 'Kardus', 'Kertas', 3800),
    (7, 'Kertas HVS', 'Kertas', 3500),
    (8, 'Koran', 'Kertas', 2900),
    (9, 'Majalah', 'Kertas', 2600),
    (10, 'Buku bekas', 'Kertas', 3000),
    (11, 'Kaleng aluminium', 'Logam', 8500),
    (12, 'Besi bekas', 'Logam', 4200),
    (13, 'Tembaga', 'Logam', 56000),
    (14, 'Baja ringan', 'Logam', 3500),
    (15, 'Botol kaca bening', 'Kaca', 1800),
    (16, 'Botol kaca warna', 'Kaca', 1500),
    (17, 'Toples kaca', 'Kaca', 2000),
    (18, 'Pecahan kaca', 'Kaca', 800);

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    district ENUM(
        'Batam Kota', 'Batu Aji', 'Batu Ampar', 'Belakang Padang',
        'Bengkong', 'Bulang', 'Galang', 'Lubuk Baja', 'Nongsa',
        'Sagulung', 'Sei Beduk', 'Sekupang'
    ) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

INSERT IGNORE INTO transactions
    (transaction_code, customer_name, waste_type_id, weight_kg, total_value, status, created_at)
VALUES
    ('EB-DEMO-001', 'Arya Pramudia', 1, 2.50, 16250, 'pending', '2026-09-29 09:00:00'),
    ('EB-DEMO-002', 'Nadia Putri', 6, 4.00, 15200, 'pending', '2026-09-29 08:30:00'),
    ('EB-DEMO-003', 'Rizky Aditya', 7, 3.00, 10500, 'pending', '2026-09-28 15:00:00'),
    ('EB-DEMO-004', 'Dina Maharani', 3, 1.50, 7200, 'approved', '2026-09-27 10:00:00'),
    ('EB-DEMO-005', 'Bima Saputra', 15, 5.00, 9000, 'cancelled', '2026-09-25 11:00:00');
