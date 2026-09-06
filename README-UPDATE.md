# Panduan Konfigurasi Auto-Update & GitHub Releases (Tauri v2)

Fitur Auto-Update pada aplikasi **Tracker Budget** menggunakan sistem resmi `@tauri-apps/plugin-updater` yang aman dan terverifikasi secara kriptografis (minisign).

---

## 1. Konfigurasi Kunci Kriptografi (Signing Keys)

Untuk memastikan file pembaruan tidak dapat dimanipulasi oleh pihak ketiga, Tauri menggunakan pasangan kunci digital:

### A. Kunci Publik (Public Key) - Sudah Terpasang
Kunci publik sudah otomatis terkonfigurasi di file [`src-tauri/tauri.conf.json`](./src-tauri/tauri.conf.json):
```json
"plugins": {
  "updater": {
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDkyRTU2OEUwQjEyMTk5REMKUldUY21TR3g0R2psa3NtYk4zWXdVYWd3UkZVQTB2MFdWK0hlM2kvYjY4dEVqRnlUVXRkczlxa2wK",
    "endpoints": [
      "https://github.com/yorr-amd/tracker-budget/releases/latest/download/latest.json"
    ]
  }
}
```

### B. Kunci Rahasia (Private Key) - Simpan di GitHub Secrets
Kunci rahasia digunakan oleh **GitHub Actions** untuk menandatangani rilis binary baru.
Lakukan langkah berikut sekali saja di GitHub:

1. Buka repositori Anda di browser: [https://github.com/yorr-amd/tracker-budget](https://github.com/yorr-amd/tracker-budget).
2. Klik tab **Settings** > di menu kiri pilih **Secrets and variables** > **Actions**.
3. Klik tombol hijau **New repository secret**.
4. Masukkan:
   - **Name**: `TAURI_SIGNING_PRIVATE_KEY`
   - **Secret**:
```text
dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5VC9YN2l5bk9sWXl3SFpSWndrQ1R5YU9ZdHNqWVNFWW9PcTAwSWUyRXBrTUFBQkFBQUFBQUFBQUFBQUlBQUFBQTlEdzF6cFFKVXVSSk1mTTFtZzBSSS9KbFZWVm0vb01pcjNGTHIxSDlLaU8zWU51YXNBa0FNT2FBOEVyemRCcU9EUlpEVHlndi9sWjhlZWJ3UncraFRsTmdCMjRDbnNzUDArckx1cGxYS1RjZVdTMDd5M3hRS0VnWU42bmdwRlowNkQwZlZRRENvbXc9Cg==
```
5. Klik **Add secret**.

---

## 2. Cara Membuat Rilis Baru ke GitHub (Otomatis via GitHub Actions)

Setiap kali Anda ingin merilis versi baru ke pengguna:

1. **Naikkan Nomor Versi**:
   Ubah `"version"` di dua file:
   - [`package.json`](./package.json): `"version": "0.1.1"`
   - [`src-tauri/tauri.conf.json`](./src-tauri/tauri.conf.json): `"version": "0.1.1"`
   - [`src-tauri/Cargo.toml`](./src-tauri/Cargo.toml): `version = "0.1.1"`

2. **Commit dan Push Tag Git**:
   Jalankan perintah berikut di terminal:
   ```bash
   git add .
   git commit -m "chore: release v0.1.1"
   git tag v0.1.1
   git push origin main --tags
   ```

3. **GitHub Actions Berjalan Otomatis**:
   - Workflow [`.github/workflows/release.yml`](./.github/workflows/release.yml) akan otomatis aktif di tab **Actions**.
   - Server GitHub akan mengompilasi binary Windows (`.msi` dan `.exe`), menandatanganinya dengan `TAURI_SIGNING_PRIVATE_KEY`, dan membuat file `latest.json`.
   - Rilis baru langsung terpublikasi di halaman **GitHub Releases** Anda.

4. **Pengguna Menerima Update Otomatis**:
   - Semua pengguna aplikasi desktop akan menerima notifikasi update secara otomatis saat membuka aplikasi atau saat mengklik **"Periksa Pembaruan"** di menu **Pengaturan > Tentang & Pembaruan**.
   - Pengguna cukup mengklik **"Unduh & Pasang Sekarang"** dan aplikasi akan ter-update seketika tanpa perlu instalasi ulang manual.
