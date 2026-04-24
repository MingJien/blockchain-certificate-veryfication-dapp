# HOW TO DEMO SYSTEM

1. Cấp chứng chỉ từ màn Issuer/Admin.
2. Sao chép `txHash` sau khi cấp thành công.
3. Xác minh chứng chỉ bằng ID hoặc hash.
4. Thu hồi chứng chỉ.
5. Xác minh lại, kết quả phải chuyển sang không hợp lệ.

---

Tài liệu chi tiết kiến trúc và luồng hệ thống nằm trong thư mục `docs/`.

## Authorization Mode (Issue/Revoke)

Backend hỗ trợ 2 chế độ kiểm soát quyền khi cấp/thu hồi chứng chỉ:

- Strict (khuyến nghị): `STRICT_ONCHAIN_REQUESTER_CHECK=true`
	- Requester phải đăng nhập role `ADMIN` hoặc `ISSUER` trong DB.
	- Ví requester phải có quyền issuer/admin trên smart contract.
	- Nếu role là `ISSUER`, ví requester còn phải khớp ví của `issuerId` đang thao tác.

- Relaxed (chỉ dùng fallback demo): `STRICT_ONCHAIN_REQUESTER_CHECK=false`
	- Dựa vào role DB + mapping ví issuer trong DB, không bắt buộc requester đang là issuer on-chain.

Lưu ý: Khi bật Strict mode, cần đảm bảo tài khoản issuer đã được thêm quyền on-chain (qua trang quản trị issuer bằng admin on-chain), nếu không sẽ bị từ chối cấp/thu hồi.
