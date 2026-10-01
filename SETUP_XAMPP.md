# Menjalankan EcoBank dengan XAMPP

Backend ini memakai PHP, PDO MySQL, dan database MySQL/MariaDB bawaan XAMPP.

## 1. Salin proyek ke htdocs

Salin seluruh folder proyek ke:

```text
C:\xampp\htdocs\ecobank
```

Pastikan file/folder berikut berada langsung di dalam folder itu:

```text
C:\xampp\htdocs\ecobank\index.html
C:\xampp\htdocs\ecobank\app.js
C:\xampp\htdocs\ecobank\backend\api.php
C:\xampp\htdocs\ecobank\backend\config.php
C:\xampp\htdocs\ecobank\database.sql
```

Jangan membuka `index.html` dengan klik ganda (`file:///...`). Jalankan halaman dari Apache:

```text
http://localhost/ecobank/
```

## 2. Nyalakan XAMPP

1. Buka XAMPP Control Panel.
2. Klik **Start** pada **Apache** dan **MySQL**.
3. Pastikan keduanya menunjukkan status berjalan.

## 3. Buat database dan tabel

1. Buka `http://localhost/phpmyadmin`.
2. Pilih tab **Import**.
3. Pilih file `C:\xampp\htdocs\ecobank\database.sql`.
4. Klik **Import** / **Go**.
5. Pastikan database `ecobank` muncul bersama tabel `transactions`, `waste_types`, dan `users`.

SQL tersebut membuat data harga awal dan beberapa transaksi contoh. `INSERT IGNORE` membuat impor ulang tidak menggandakan data contoh.
Jika database sudah pernah dibuat, impor ulang file ini untuk menambahkan tabel `users`; tabel dan data lain yang sudah ada tidak dihapus.

## 4. Cocokkan kredensial database

Buka `backend/config.php`. Konfigurasi bawaan XAMPP biasanya:

```php
const DB_HOST = '127.0.0.1';
const DB_PORT = '3306';
const DB_NAME = 'ecobank';
const DB_USER = 'root';
const DB_PASS = '';
```

Jika MySQL Anda memakai password atau port berbeda, sesuaikan nilainya di file ini.

## 5. Coba API

Buka endpoint berikut setelah Apache dan MySQL berjalan:

```text
http://localhost/ecobank/backend/api.php?resource=prices
http://localhost/ecobank/backend/api.php?resource=transactions
```

Keduanya harus menampilkan JSON. Setelah itu buka halaman aplikasi melalui URL localhost yang sama. Perubahan harga, request setoran, dan keputusan setujui/batalkan akan disimpan ke database.

Di halaman **Transaksi**, gunakan tombol **Buat request contoh** untuk memasukkan setoran uji. Request baru memakai harga aktif dari database dan langsung muncul dengan status **Menunggu**.

## API singkat

| Metode | URL                                          | Fungsi                     |
| ------ | -------------------------------------------- | -------------------------- |
| GET    | `backend/api.php?resource=prices`            | Daftar harga aktif         |
| POST   | `backend/api.php?resource=prices`            | Tambah harga               |
| PUT    | `backend/api.php?resource=prices&id=1`       | Ubah harga                 |
| DELETE | `backend/api.php?resource=prices&id=1`       | Nonaktifkan jenis sampah   |
| GET    | `backend/api.php?resource=transactions`      | Daftar transaksi           |
| POST   | `backend/api.php?resource=transactions`      | Buat request setoran       |
| PUT    | `backend/api.php?resource=transactions&id=1` | Setujui/batalkan transaksi |
| POST   | `backend/api.php?resource=auth`              | Daftar, masuk, atau keluar |
| GET    | `backend/api.php?resource=auth&action=me`    | Memeriksa sesi akun        |

Endpoint POST transaksi menerima `name`, `wasteTypeId`, dan `weight`; server menghitung nilai setoran dari harga aktif saat request dibuat.
Endpoint akun menerima `action` `register`, `login`, atau `logout`. Pendaftaran memakai `name`, `email`, `phone`, `district`, dan `password`. Password disimpan sebagai hash, bukan teks biasa; email hanya dapat digunakan sekali. Login membuat sesi PHP untuk beranda pengguna.

## Jika menemui kendala

- **Tidak dapat terhubung ke database**: pastikan MySQL berjalan dan nilai di `backend/config.php` benar.
- **404 di API**: pastikan folder berada di `C:\xampp\htdocs\ecobank` dan URL memakai `/ecobank/backend/api.php`.
- **PDO driver tidak tersedia**: di XAMPP, pastikan ekstensi `pdo_mysql` aktif pada `C:\xampp\php\php.ini`, lalu restart Apache.
- **Perubahan tidak muncul dari `file:///`**: buka lewat `http://localhost/ecobank/`, bukan file langsung.

> Ini backend prototipe untuk dijalankan secara lokal. Halaman admin belum memiliki login/otorisasi, jadi jangan buka API ke internet sebelum menambahkan autentikasi, perlindungan CSRF, dan pengamanan konfigurasi database.
