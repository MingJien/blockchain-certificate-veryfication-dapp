// Purpose: Display a certificate summary.

import React from "react";

export default function CertificateCard({ certificate }) {
  if (!certificate) return null;

  const status = String(certificate.status || "").toUpperCase();
  const isActive = status === "ACTIVE";
  const statusLabel = {
    ACTIVE: "HIỆU LỰC",
    REVOKED: "ĐÃ THU HỒI",
    PENDING: "ĐANG CHỜ",
    FAILED: "THẤT BẠI"
  }[status] || "KHÔNG XÁC ĐỊNH";

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>Chứng Chỉ #{certificate.id || certificate.certificateId}</strong>
        {isActive ? <span className="badge ok">{statusLabel}</span> : <span className="badge bad">{statusLabel}</span>}
      </div>
      <div className="small" style={{ marginTop: 8 }}>Người Sở Hữu: {certificate.ownerName || certificate.studentName} ({certificate.ownerWallet || certificate.studentWallet})</div>
      <div className="small">Khóa Học: {certificate.courseName}</div>
      <div className="small">Đơn Vị Cấp: {certificate.issuerName}</div>
      <div className="small">Ngày Cấp: {String(certificate.issueDate || "")}</div>
      {certificate.blockchainTxHash ? (
        <div className="small">
          Giao Dịch Cấp (Tx): {import.meta.env.VITE_NETWORK === "local" ? (
            <span>{certificate.blockchainTxHash}</span>
          ) : (
            <a
              href={`https://sepolia.etherscan.io/tx/${certificate.blockchainTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#3b82f6" }}
            >
              {certificate.blockchainTxHash.slice(0, 10)}...{certificate.blockchainTxHash.slice(-6)}
            </a>
          )}
        </div>
      ) : null}
      {certificate.dataHash ? <div className="small">Mã Băm Dữ Liệu: {certificate.dataHash}</div> : null}
    </div>
  );
}
