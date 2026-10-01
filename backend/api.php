<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

require_once __DIR__ . '/config.php';

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || strlen($raw) > 16384) {
        respond(['error' => 'Isi request tidak valid atau terlalu besar.'], 400);
    }

    try {
        $body = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
    } catch (\JsonException) {
        respond(['error' => 'Format JSON tidak valid.'], 400);
    }

    if (!is_array($body)) {
        respond(['error' => 'Isi request harus berupa objek JSON.'], 400);
    }

    return $body;
}

function requireText(array $body, string $field, int $maxLength): string
{
    $value = $body[$field] ?? null;
    if (!is_string($value)) {
        respond(['error' => "Field {$field} wajib berupa teks."], 422);
    }

    $value = trim($value);
    if ($value === '' || mb_strlen($value) > $maxLength) {
        respond(['error' => "Field {$field} wajib diisi (maksimal {$maxLength} karakter)."], 422);
    }

    return $value;
}

function startUserSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

try {
    $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $exception) {
    error_log('EcoBank database connection failed: ' . $exception->getMessage());
    respond(['error' => 'Tidak dapat terhubung ke database. Periksa MySQL XAMPP dan backend/config.php.'], 503);
}

$resource = $_GET['resource'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);

try {
    if ($resource === 'auth') {
        if ($method === 'GET' && ($_GET['action'] ?? '') === 'me') {
            startUserSession();
            if (!isset($_SESSION['ecobank_user'])) {
                respond(['error' => 'Silakan masuk ke akun EcoBank terlebih dahulu.'], 401);
            }
            respond(['data' => $_SESSION['ecobank_user']]);
        }

        if ($method !== 'POST') {
            header('Allow: GET, POST');
            respond(['error' => 'Metode HTTP tidak didukung.'], 405);
        }

        $body = requestBody();
        $action = $body['action'] ?? '';

        if ($action === 'logout') {
            startUserSession();
            $_SESSION = [];
            $cookie = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $cookie['path'],
                'domain' => $cookie['domain'],
                'secure' => $cookie['secure'],
                'httponly' => $cookie['httponly'],
                'samesite' => 'Lax',
            ]);
            session_destroy();
            respond(['data' => ['loggedOut' => true]]);
        }

        if ($action === 'login') {
            $email = mb_strtolower(requireText($body, 'email', 254), 'UTF-8');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                respond(['error' => 'Format email tidak valid.'], 422);
            }
            $password = $body['password'] ?? null;
            if (!is_string($password) || $password === '') {
                respond(['error' => 'Password wajib diisi.'], 422);
            }

            $statement = $pdo->prepare(
                'SELECT id, name, email, phone, district, password_hash
                 FROM users WHERE email = :email LIMIT 1'
            );
            $statement->execute(['email' => $email]);
            $user = $statement->fetch();
            if (!$user || !password_verify($password, $user['password_hash'])) {
                respond(['error' => 'Email atau password tidak sesuai.'], 401);
            }

            startUserSession();
            session_regenerate_id(true);
            $_SESSION['ecobank_user'] = [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'phone' => $user['phone'],
                'district' => $user['district'],
            ];
            respond(['data' => $_SESSION['ecobank_user']]);
        }

        if ($action !== 'register') {
            respond(['error' => 'Aksi autentikasi tidak valid.'], 422);
        }

        $name = requireText($body, 'name', 100);
        $email = mb_strtolower(requireText($body, 'email', 254), 'UTF-8');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            respond(['error' => 'Format email tidak valid.'], 422);
        }

        $phone = requireText($body, 'phone', 20);
        if (!preg_match('/^[0-9+() -]{8,20}$/D', $phone)) {
            respond(['error' => 'Nomor telepon tidak valid.'], 422);
        }

        $district = requireText($body, 'district', 30);
        $batamDistricts = [
            'Batam Kota',
            'Batu Aji',
            'Batu Ampar',
            'Belakang Padang',
            'Bengkong',
            'Bulang',
            'Galang',
            'Lubuk Baja',
            'Nongsa',
            'Sagulung',
            'Sei Beduk',
            'Sekupang',
        ];
        if (!in_array($district, $batamDistricts, true)) {
            respond(['error' => 'Pilih kecamatan yang tersedia di Kota Batam.'], 422);
        }

        $password = $body['password'] ?? null;
        if (!is_string($password) || mb_strlen($password, 'UTF-8') < 8 || strlen($password) > 72) {
            respond(['error' => 'Password harus memiliki minimal 8 karakter dan maksimal 72 byte.'], 422);
        }

        $statement = $pdo->prepare(
            'INSERT INTO users (name, email, phone, district, password_hash)
             VALUES (:name, :email, :phone, :district, :password_hash)'
        );
        try {
            $statement->execute([
                'name' => $name,
                'email' => $email,
                'phone' => $phone,
                'district' => $district,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            ]);
        } catch (PDOException $exception) {
            if ($exception->getCode() === '23000') {
                respond(['error' => 'Email tersebut sudah terdaftar. Silakan gunakan email lain.'], 409);
            }
            throw $exception;
        }

        respond(['data' => [
            'id' => (int) $pdo->lastInsertId(),
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'district' => $district,
        ]], 201);
    }

    if ($resource === 'prices') {
        if ($method === 'GET') {
            $statement = $pdo->query(
                'SELECT id, name, category, price FROM waste_types WHERE is_active = 1 ORDER BY category, name'
            );
            respond(['data' => $statement->fetchAll()]);
        }

        if ($method === 'POST') {
            $body = requestBody();
            $name = requireText($body, 'name', 80);
            $category = requireText($body, 'category', 20);
            $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_INT);
            if (!in_array($category, ['Plastik', 'Kertas', 'Logam', 'Kaca'], true) || $price === false || $price < 1) {
                respond(['error' => 'Kategori atau harga tidak valid.'], 422);
            }

            $statement = $pdo->prepare(
                'INSERT INTO waste_types (name, category, price) VALUES (:name, :category, :price)'
            );
            $statement->execute(['name' => $name, 'category' => $category, 'price' => $price]);
            respond(['data' => [
                'id' => (int) $pdo->lastInsertId(),
                'name' => $name,
                'category' => $category,
                'price' => $price,
            ]], 201);
        }

        if ($method === 'PUT') {
            if ($id === false || $id === null) {
                respond(['error' => 'ID jenis sampah tidak valid.'], 400);
            }
            $body = requestBody();
            $name = requireText($body, 'name', 80);
            $category = requireText($body, 'category', 20);
            $price = filter_var($body['price'] ?? null, FILTER_VALIDATE_INT);
            if (!in_array($category, ['Plastik', 'Kertas', 'Logam', 'Kaca'], true) || $price === false || $price < 1) {
                respond(['error' => 'Kategori atau harga tidak valid.'], 422);
            }

            $statement = $pdo->prepare(
                'UPDATE waste_types SET name = :name, category = :category, price = :price WHERE id = :id AND is_active = 1'
            );
            $statement->execute(['name' => $name, 'category' => $category, 'price' => $price, 'id' => $id]);
            if ($statement->rowCount() === 0) {
                $check = $pdo->prepare('SELECT id FROM waste_types WHERE id = :id AND is_active = 1');
                $check->execute(['id' => $id]);
                if (!$check->fetch()) {
                    respond(['error' => 'Jenis sampah tidak ditemukan.'], 404);
                }
            }
            respond(['data' => ['id' => $id, 'name' => $name, 'category' => $category, 'price' => $price]]);
        }

        if ($method === 'DELETE') {
            if ($id === false || $id === null) {
                respond(['error' => 'ID jenis sampah tidak valid.'], 400);
            }
            $statement = $pdo->prepare('UPDATE waste_types SET is_active = 0 WHERE id = :id AND is_active = 1');
            $statement->execute(['id' => $id]);
            if ($statement->rowCount() === 0) {
                respond(['error' => 'Jenis sampah tidak ditemukan.'], 404);
            }
            respond(['data' => ['id' => $id, 'deleted' => true]]);
        }
    }

    if ($resource === 'transactions') {
        if ($method === 'GET') {
            $statement = $pdo->query(
                'SELECT t.id AS dbId, t.transaction_code AS code, t.customer_name AS name,
                        w.category AS waste, w.name AS detail, t.weight_kg AS weight,
                        t.total_value AS value, DATE_FORMAT(t.created_at, "%d %b %Y") AS date,
                        t.status, "♻" AS avatar
                 FROM transactions t
                 INNER JOIN waste_types w ON w.id = t.waste_type_id
                 ORDER BY t.created_at DESC, t.id DESC'
            );
            $rows = $statement->fetchAll();
            foreach ($rows as &$row) {
                $row['id'] = (string) $row['code'];
                $row['dbId'] = (int) $row['dbId'];
                $row['weight'] = (float) $row['weight'];
                $row['value'] = (int) $row['value'];
            }
            unset($row);
            respond(['data' => $rows]);
        }

        if ($method === 'POST') {
            $body = requestBody();
            $name = requireText($body, 'name', 100);
            $wasteTypeId = filter_var($body['wasteTypeId'] ?? null, FILTER_VALIDATE_INT);
            $weight = filter_var($body['weight'] ?? null, FILTER_VALIDATE_FLOAT);
            if ($wasteTypeId === false || $wasteTypeId < 1 || $weight === false || $weight <= 0 || $weight > 10000) {
                respond(['error' => 'Jenis sampah atau berat tidak valid.'], 422);
            }

            $pdo->beginTransaction();
            $priceQuery = $pdo->prepare(
                'SELECT id, name, category, price
                 FROM waste_types
                 WHERE id = :id AND is_active = 1
                 FOR UPDATE'
            );
            $priceQuery->execute(['id' => $wasteTypeId]);
            $wasteType = $priceQuery->fetch();
            if (!$wasteType) {
                $pdo->rollBack();
                respond(['error' => 'Jenis sampah tidak ditemukan atau sudah tidak aktif.'], 422);
            }

            $totalValue = (int) round((float) $weight * (int) $wasteType['price']);
            $code = 'EB-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));
            $insert = $pdo->prepare(
                'INSERT INTO transactions (transaction_code, customer_name, waste_type_id, weight_kg, total_value)
                 VALUES (:code, :name, :waste_type_id, :weight, :total_value)'
            );
            $insert->execute([
                'code' => $code,
                'name' => $name,
                'waste_type_id' => $wasteTypeId,
                'weight' => $weight,
                'total_value' => $totalValue,
            ]);
            $newId = (int) $pdo->lastInsertId();
            $pdo->commit();
            respond(['data' => [
                'id' => $code,
                'dbId' => $newId,
                'name' => $name,
                'waste' => $wasteType['category'],
                'detail' => $wasteType['name'],
                'weight' => (float) $weight,
                'value' => $totalValue,
                'date' => date('d M Y'),
                'status' => 'pending',
                'avatar' => '♻',
            ]], 201);
        }

        if ($method === 'PUT') {
            if ($id === false || $id === null) {
                respond(['error' => 'ID transaksi tidak valid.'], 400);
            }
            $body = requestBody();
            $status = $body['status'] ?? null;
            if (!in_array($status, ['approved', 'cancelled'], true)) {
                respond(['error' => 'Status transaksi tidak valid.'], 422);
            }

            $statement = $pdo->prepare(
                'UPDATE transactions SET status = :status
                 WHERE id = :id AND status = "pending"'
            );
            $statement->execute(['status' => $status, 'id' => $id]);
            if ($statement->rowCount() === 0) {
                $check = $pdo->prepare('SELECT status FROM transactions WHERE id = :id');
                $check->execute(['id' => $id]);
                $existing = $check->fetch();
                if (!$existing) {
                    respond(['error' => 'Transaksi tidak ditemukan.'], 404);
                }
                respond(['error' => 'Transaksi ini sudah diproses. Muat ulang daftar transaksi.'], 409);
            }
            respond(['data' => ['id' => $id, 'status' => $status]]);
        }
    }

    if (!in_array($resource, ['prices', 'transactions'], true)) {
        respond(['error' => 'Endpoint tidak ditemukan.'], 404);
    }

    header('Allow: ' . ($resource === 'prices' ? 'GET, POST, PUT, DELETE' : 'GET, POST, PUT'));
    respond(['error' => 'Metode HTTP tidak didukung.'], 405);
} catch (PDOException $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('EcoBank database request failed: ' . $exception->getMessage());
    respond(['error' => 'Database gagal memproses request. Periksa log PHP/MySQL XAMPP.'], 500);
} catch (Throwable $exception) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('EcoBank API request failed: ' . $exception->getMessage());
    respond(['error' => 'Terjadi kesalahan pada server. Periksa log PHP XAMPP.'], 500);
}
