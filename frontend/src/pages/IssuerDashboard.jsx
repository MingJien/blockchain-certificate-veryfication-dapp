// Purpose: Issue a certificate (calls backend POST /api/certificates).

import React, { useEffect, useState } from "react";
import Button from "../components/Button";
import QRCodeComponent from "../components/QRCodeComponent";
import NumericComboBox from "../components/NumericComboBox";
import { issueCertificateHybridFlow } from "../services/blockchain";
import { getHolders, getIssuers } from "../services/api";
import { useAuth } from "../context/AuthContext";

const DEFAULT_HOLDER_ID_OPTIONS = [];
const DEFAULT_ISSUER_ID_OPTIONS = [];

function shortenWallet(walletAddress) {
  const wallet = String(walletAddress || "").trim();
  if (!wallet.startsWith("0x") || wallet.length < 14) {
    return wallet || "N/A";
  }
  return `${wallet.slice(0, 8)}...${wallet.slice(-6)}`;
}

function toOption(value, name) {
  const numeric = Number(value);
  const safeName = String(name || "").trim();
  return {
    value: numeric,
    label: safeName ? `${numeric} - ${safeName}` : String(numeric)
  };
}

function toIssuerOption(item) {
  const issuerId = Number(item?.issuerId);
  if (!Number.isFinite(issuerId)) return null;

  const issuerName = String(item?.name || item?.username || "Issuer").trim();
  const walletShort = shortenWallet(item?.walletAddress);
  return {
    value: issuerId,
    label: `ID ${issuerId} - ${issuerName} - ${walletShort}`
  };
}

export default function IssuerDashboard() {
  const { user } = useAuth();
  const userRole = String(user?.role || "").toUpperCase();
  const isIssuerRole = userRole === "ISSUER";
  const [form, setForm] = useState({
    holderId: "1",
    courseName: "",
    issuerId: "1",
    issueDate: new Date().toISOString().slice(0, 10),
    metadataURI: ""
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [holderIdOptions, setHolderIdOptions] = useState(DEFAULT_HOLDER_ID_OPTIONS);
  const [issuerIdOptions, setIssuerIdOptions] = useState(DEFAULT_ISSUER_ID_OPTIONS);
  const hasIssuerId = Number.isFinite(Number(form.issuerId)) && Number(form.issuerId) > 0;
  const canSubmit = Boolean(form.holderId && form.courseName.trim() && form.issueDate && hasIssuerId);

  function update(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!canSubmit) {
      setError("Không thể cấp chứng chỉ: thiếu thông tin bắt buộc hoặc tài khoản chưa được ánh xạ issuer hợp lệ.");
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const data = await issueCertificateHybridFlow({
        holderId: Number(form.holderId),
        courseName: form.courseName,
        issuerId: Number(form.issuerId),
        issueDate: form.issueDate,
        metadataURI: form.metadataURI,
        requesterWallet: user?.walletAddress || ""
      });
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Thất bại");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadOptions() {
      try {
        const [holdersRes, issuersRes] = await Promise.all([getHolders(), getIssuers()]);
        const holders = (holdersRes?.data || [])
          .map((item) => toOption(item.userId, item.name))
          .filter((item) => Number.isFinite(item.value));
        const issuers = (issuersRes?.data || [])
          .map((item) => toIssuerOption(item))
          .filter((item) => Number.isFinite(item.value));

        const issuerByWallet = (issuersRes?.data || []).find(
          (item) => String(item.walletAddress || "").toLowerCase() === String(user?.walletAddress || "").toLowerCase()
        );

        if (holders.length) {
          setHolderIdOptions(holders);
          setForm((prev) => ({ ...prev, holderId: String(holders[0].value) }));
        } else {
          setHolderIdOptions([]);
          setError("DB chưa có Người sở hữu. Hãy thêm tài khoản HOLDER trong bảng Users.");
        }

        if (issuers.length) {
          const visibleIssuerOptions = isIssuerRole
            ? (issuerByWallet
              ? [toIssuerOption(issuerByWallet)].filter(Boolean)
              : [])
            : issuers;

          setIssuerIdOptions(visibleIssuerOptions);
          setForm((prev) => {
            if (isIssuerRole) {
              return {
                ...prev,
                issuerId: issuerByWallet ? String(issuerByWallet.issuerId) : ""
              };
            }

            return { ...prev, issuerId: String(visibleIssuerOptions[0]?.value || "") };
          });

          if (isIssuerRole && !issuerByWallet) {
            setError("Tài khoản ISSUER chưa được ánh xạ issuerId trong DB. Liên hệ ADMIN để thêm/kích hoạt issuer đúng ví này.");
          }
        } else {
          setIssuerIdOptions([]);
          setError("DB chưa có Issuer hoạt động. Hãy thêm issuer bằng tài khoản ADMIN.");
        }
      } catch {
        setHolderIdOptions(DEFAULT_HOLDER_ID_OPTIONS);
        setIssuerIdOptions(DEFAULT_ISSUER_ID_OPTIONS);
        setError("Không tải được danh sách Người sở hữu/Issuer từ DB. Kiểm tra backend hoặc đăng nhập lại.");
      }
    }

    loadOptions();
  }, [isIssuerRole, user?.walletAddress]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Bảng Điều Khiển của Issuer (Đơn Vị Cấp)</h3>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
          <div>
            <label className="label">ID Người Sở Hữu</label>
            <NumericComboBox
              value={form.holderId}
              onChange={(value) => update("holderId", value)}
              options={holderIdOptions}
              placeholder="Nhập hoặc chọn ID người sở hữu"
            />
            <p className="small" style={{ marginTop: 6 }}>
              Chỉ hiển thị user có role HOLDER nên ID ADMIN hoặc ISSUER sẽ không nằm trong danh sách này.
            </p>
          </div>
          <div>
            <label className="label">ID Đơn Vị Cấp</label>
            <NumericComboBox
              value={form.issuerId}
              onChange={(value) => update("issuerId", value)}
              options={issuerIdOptions}
              placeholder="Nhập hoặc chọn ID đơn vị cấp"
              disabled={isIssuerRole}
            />
            {isIssuerRole ? (
              <p className="small" style={{ marginTop: 6 }}>
                Với quyền ISSUER, hệ thống chỉ hiển thị issuerId thuộc đúng ví đăng nhập để tránh cấp nhầm tổ chức.
              </p>
            ) : null}
          </div>
          <div>
            <label className="label">Tên Khóa Học</label>
            <input className="input" value={form.courseName} onChange={(e) => update("courseName", e.target.value)} />
          </div>
          <div>
            <label className="label">Ngày Cấp</label>
            <input className="input" value={form.issueDate} onChange={(e) => update("issueDate", e.target.value)} />
          </div>
          <div>
            <label className="label">Metadata URI (không bắt buộc)</label>
            <input className="input" value={form.metadataURI} onChange={(e) => update("metadataURI", e.target.value)} placeholder="ipfs://... hoặc https://..." />
          </div>

          <Button disabled={loading || !canSubmit} type="submit">
            {loading ? "Đang cấp..." : "Cấp Chứng Chỉ"}
          </Button>
          {error ? <div className="error-banner">{error}</div> : null}
        </form>
      </div>

      {result ? (
        <div className="grid">
          <div className="card">
            <strong>Cấp Thành Công</strong>
            <div className="small">ID Chứng Chỉ: {result?.create?.data?.id}</div>
            <div className="small">
              Giao Dịch Cấp (Tx): {result?.create?.data?.blockchainTxHash ? (
                <a
                  href={`https://sepolia.etherscan.io/tx/${result.create.data.blockchainTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6" }}
                >
                  {result.create.data.blockchainTxHash.slice(0, 10)}...{result.create.data.blockchainTxHash.slice(-6)}
                </a>
              ) : null}
            </div>
            <div className="small">
              Giao dịch: {import.meta.env.VITE_NETWORK === "local" ? (
                <span>{result.txHash}</span>
              ) : (
                result.txHash ? (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#3b82f6" }}
                  >
                    {result.txHash.slice(0, 10)}...{result.txHash.slice(-6)}
                  </a>
                ) : null
              )}
            </div>
            <div className="small">Mã Băm (hash) (SHA-256): {result?.create?.data?.dataHash}</div>
            <div className="small">Link Xác Minh: {result?.create?.data?.verificationURL}</div>
          </div>
          <QRCodeComponent text={result?.create?.data?.verificationURL} />
        </div>
      ) : null}
    </div>
  );
}
