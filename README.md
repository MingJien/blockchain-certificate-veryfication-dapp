# 🎓 Blockchain Certificate Verification DApp

Hệ thống xác minh chứng chỉ số hóa sử dụng công nghệ Blockchain để đảm bảo tính minh bạch và chống giả mạo .

---

## 📌 Overview

Hệ thống cung cấp giải pháp xác thực chứng chỉ hiện đại:
- **Lưu trữ an toàn:** Chỉ lưu mã băm (**Certificate Hash**) lên Blockchain để tiết kiệm chi phí và bảo mật thông tin cá nhân.
- **Tính toàn vẹn:** Đảm bảo chứng chỉ một khi đã cấp thì **không thể sửa đổi**.
- **Tính năng chính:**
    - `Issue`: Cấp mới chứng chỉ.
    - `Verify`: Kiểm tra thật giả tức thì.
    - `Revoke`: Thu hồi chứng chỉ khi cần thiết.

---

## 🏗 Architecture

Sự kết hợp giữa Web2 (tốc độ) và Web3 (minh bạch):

* **Frontend:** React.js (Giao diện người dùng)
* **Backend:** Node.js / Express (Xử lý logic & Bridge)
* **Database:** SQL Server (Lưu Metadata off-chain)
* **Blockchain:** Ethereum / Polygon (Lưu bằng chứng on-chain)

---

## 🔄 Core Flow

### 1. Issue Certificate
1. Hệ thống tạo thông tin chứng chỉ.
2. Sinh mã **Hash** từ dữ liệu chứng chỉ.
3. Ghi mã Hash lên **Blockchain**.
4. Lưu metadata và mã giao dịch (`txHash`) vào Database.

### 2. Verify Certificate
1. Người dùng nhập `certificateId` hoặc mã Hash.
2. Hệ thống truy vấn mã Hash tương ứng trên Blockchain.
3. So sánh dữ liệu giữa Database và Blockchain.
4. **Kết quả:** `VALID` (Khớp) hoặc `INVALID / REVOKED` (Không khớp/Đã thu hồi).

### 3. Revoke Certificate
1. Admin gọi hàm thu hồi trên Smart Contract.
2. Cập nhật trạng thái trong Database.
3. Sau khi thu hồi, lệnh `Verify` sẽ luôn trả về kết quả **INVALID**.

---

## 🔐 Authorization Mode

Hệ thống hỗ trợ 2 chế độ phân quyền linh hoạt:

* **✅ Strict Mode (Khuyến nghị):**
    * Cấu hình: `STRICT_ONCHAIN_REQUESTER_CHECK=true`
    * Kiểm tra: Role trong DB + Quyền ví trên ví Metamask.
    * Yêu cầu: Địa chỉ ví phải khớp với ID người cấp (Issuer).
* **⚠️ Relaxed Mode (Dùng để Demo):**
    * Cấu hình: `STRICT_ONCHAIN_REQUESTER_CHECK=false`
    * Chỉ kiểm tra quyền qua Database, không bắt buộc ký giao dịch ví.

---

## 🎬 How to Demo

1.  **Cấp bằng:** Thực hiện `Issue certificate` -> Copy lấy mã `txHash`.
2.  **Kiểm tra:** Thực hiện `Verify` -> Kết quả trả về **VALID**.
3.  **Thu hồi:** Thực hiện `Revoke certificate`.
4.  **Kiểm tra lại:** Thực hiện `Verify` lần nữa -> Kết quả trả về **INVALID**.

---

## ⚙️ Setup & Installation

### 1. Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```

### 3. Database
```sql
-- Thao tác:
-- 1. Mở SQL Server Management Studio (SSMS).
-- 2. Tạo một Database mới.
-- 3. Mở và thực thi (Execute) file: Certificate.sql
```

---

## 📂 Project Structure
```text
├── backend/          # API & Logic xử lý (Node.js)
├── frontend/         # Giao diện người dùng (React.js)
├── smart-contract/   # Mã nguồn Smart Contract (Solidity)
├── postman/          # Bộ sưu tập API testing
├── Certificate.sql   # Script khởi tạo Database
└── README.md         # Tài liệu hướng dẫn dự án
```

---

## 📎 Technical Notes
```text
- On-chain: Chỉ lưu trữ mã Hash để tối ưu Gas fee (Tiết kiệm chi phí).
- Off-chain: Lưu trữ thông tin chi tiết (Tên, ngày sinh...) trong SQL Database.
- Backend role: Đóng vai trò là Layer xác thực và cầu nối (Bridge) giữa Web2 và Web3.
```
