// Purpose: Display certificate details + verify status.

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import CertificateCard from "../components/CertificateCard";
import QRCodeComponent from "../components/QRCodeComponent";
import { getCertificate, verifyCertificate } from "../services/api";
import { verifyOnChain } from "../services/blockchain";

export default function CertificateDetail() {
  const { id } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [onChainValid, setOnChainValid] = useState(null);
  const [error, setError] = useState("");
  const verificationHash = verifyResult?.dataHash || certificate?.dataHash || "";
  const verificationUrl =
    typeof window !== "undefined" && verificationHash
      ? `${window.location.origin}/verify/${verificationHash}`
      : "";
  const statusLabel = {
    ACTIVE: "HIỆU LỰC",
    REVOKED: "ĐÃ THU HỒI",
    PENDING: "ĐANG CHỜ",
    FAILED: "THẤT BẠI"
  }[String(verifyResult?.status || "").toUpperCase()] || String(verifyResult?.status || "");
  const verifyStatusClass = {
    ACTIVE: "status-pill status-pill-active",
    REVOKED: "status-pill status-pill-revoked",
    PENDING: "status-pill status-pill-pending",
    FAILED: "status-pill status-pill-failed"
  }[String(verifyResult?.status || "").toUpperCase()] || "status-pill";

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setError("");
      try {
        const verify = await verifyCertificate(id);
        if (!cancelled) setVerifyResult(verify?.data || null);

        if (verify?.data?.id && verify?.data?.dataHash) {
          try {
            const valid = await verifyOnChain({
              id: verify.data.id,
              expectedHashHex: verify.data.dataHash
            });
            if (!cancelled) setOnChainValid(valid);
          } catch {
            if (!cancelled) setOnChainValid(null);
          }
        } else if (!cancelled) {
          setOnChainValid(null);
        }

        const certificateId = verify?.data?.id || (String(id).match(/^\d+$/) ? Number(id) : null);
        if (certificateId) {
          const cert = await getCertificate(certificateId);
          if (!cancelled) setCertificate(cert?.data || null);
        } else if (!cancelled) {
          setCertificate(verify?.data || null);
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.message || e.message || "Thất bại");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="verify-detail-shell">
      <div className="verify-detail-frame">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Chi Tiết Chứng Chỉ</h3>
          <div className="small">Mã ID: {id}</div>
          {error ? <div className="small" style={{ color: "#b00020", marginTop: 8 }}>{error}</div> : null}
        </div>

        <CertificateCard certificate={certificate} />

        {verifyResult ? (
          <div className="card">
            <strong>Kết Quả Xác Minh</strong>
            <div style={{ marginTop: 8 }}>
              {verifyResult.isIntegrityValid ? <span className="badge ok">Hợp Lệ</span> : <span className="badge bad">Không Hợp Lệ</span>}
            </div>
            <div className="small" style={{ marginTop: 10 }}>
              Trạng Thái: <span className={verifyStatusClass}>{statusLabel || "KHÔNG XÁC ĐỊNH"}</span>
            </div>
            <div className="small">Mã Băm: {verifyResult.dataHash}</div>
            <div className="small">Mã Băm Tính Lại: {verifyResult.recalculatedHash}</div>
            <div className="small">Trên Chuỗi: {onChainValid === null ? "Không có" : String(onChainValid)}</div>
          </div>
        ) : null}

        {verificationUrl ? (
          <QRCodeComponent text={verificationUrl} />
        ) : null}
      </div>
    </div>
  );
}
