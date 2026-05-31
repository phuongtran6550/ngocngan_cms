# Ngọc Châu CMS

Frontend quản lý bạn hàng cho hệ thống Ngọc Châu, xây dựng bằng Vue 3, Vite và Pinia.

## Cấu hình môi trường

Tạo file `.env` từ `.env.example` khi chạy local hoặc deploy:

```bash
VITE_APP_NAME=Ngọc Châu
VITE_API_BASE_URL=http://localhost:4000/api
```

## Lệnh chạy

```bash
npm install
npm run dev
npm run build
npm run test:branding
```

`VITE_API_BASE_URL` cần trỏ tới backend Node.js trong thư mục `API`.
