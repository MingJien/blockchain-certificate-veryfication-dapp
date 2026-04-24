import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  FileCheck,
  ShieldCheck,
  ShieldX,
  QrCode,
  Search,
  CheckCircle2
} from "lucide-react";
import NumericComboBox from "../components/NumericComboBox";
import QRCodeComponent from "../components/QRCodeComponent";
import CompactCopyField from "../components/CompactCopyField";
import { issueCertificateHybridFlow } from "../services/blockchain";
import { getCertificateOptions, getCertificateStats, getHolders, getIssuers, revokeCertificate, verifyCertificate } from "../services/api";
import { useAuth } from "../context/AuthContext";

const DEFAULT_HOLDER_ID_OPTIONS = [];
const DEFAULT_ISSUER_ID_OPTIONS = [];

function toOption(value, name) {
  const numeric = Number(value);
  const safeName = String(name || "").trim();
  return {
    value: numeric,
    label: safeName ? `${numeric} - ${safeName}` : String(numeric)
  };
}

export default function Home() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    holderId: "1",
    issuerId: "1",
    courseName: "",
    issueDate: new Date().toISOString().slice(0, 10),
    metadataURI: ""
  });
  const [holderIdOptions, setHolderIdOptions] = useState(DEFAULT_HOLDER_ID_OPTIONS);
  const [issuerIdOptions, setIssuerIdOptions] = useState(DEFAULT_ISSUER_ID_OPTIONS);
  const [issueResult, setIssueResult] = useState(null);
  const [issueError, setIssueError] = useState("");
  const [issuing, setIssuing] = useState(false);

  const [verifyId, setVerifyId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifyResult, setVerifyResult] = useState(null);

  const [stats, setStats] = useState({ total: 0, active: 0, revoked: 0 });
  const [certificateIdOptions, setCertificateIdOptions] = useState([]);

  const [revokeId, setRevokeId] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeMessage, setRevokeMessage] = useState("");
  const [revokeMessageType, setRevokeMessageType] = useState("info");
  const role = String(user?.role || "").toUpperCase();
  const canManageCertificates = role === "ADMIN" || role === "ISSUER";

  const previewData = useMemo(() => {
    const data = issueResult?.create?.data || verifyResult?.data || null;
    const statusFromData = String(data?.status || "").toUpperCase();
    const isStatusActive = data?.isStatusActive !== undefined
      ? Boolean(data.isStatusActive)
      : (!statusFromData || statusFromData === "ACTIVE");
    const onChainValid = data?.onChainValid !== undefined
      ? Boolean(data.onChainValid)
      : Boolean(data?.valid || issueResult?.txHash);
    const isIntegrityValid = data?.isIntegrityValid !== undefined
      ? Boolean(data.isIntegrityValid)
      : Boolean(data);
    const valid = onChainValid && isIntegrityValid && isStatusActive;

    return {
      certificateId: data?.certificateId || data?.id || "—",
      holderId: data?.holderId || data?.studentId || form.holderId || "—",
      holderName: data?.holderName || data?.studentName || "—",
      issuerId: data?.issuerId || form.issuerId || "—",
      issuerName: data?.issuerName || "—",
      courseName: data?.courseName || form.courseName || "Chương Trình Chứng Chỉ Blockchain",
      issueDate: data?.issueDate || form.issueDate || "—",
      verified: Boolean(data),
      valid,
      onChainValid,
      isIntegrityValid,
      isStatusActive,
      dataHash: data?.dataHash || "",
      txHash: data?.blockchainTxHash || issueResult?.txHash || "",
      verificationURL: data?.verificationURL || "",
      status: data?.status || (verifyResult ? (verifyStatus || "UNKNOWN") : "")
    };
  }, [issueResult, verifyResult, verifyStatus, form]);

  const verificationUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    if (!previewData.dataHash) return "";
    return `${window.location.origin}/verify/${previewData.dataHash}`;
  }, [previewData.dataHash]);

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleIssue(event) {
    event.preventDefault();

    if (!canManageCertificates) {
      setIssueError("Chỉ Admin hoặc Issuer mới được cấp chứng chỉ.");
      return;
    }

    setIssuing(true);
    setIssueError("");
    setIssueResult(null);

    try {
      const result = await issueCertificateHybridFlow({
        holderId: Number(form.holderId),
        issuerId: Number(form.issuerId),
        courseName: form.courseName,
        issueDate: form.issueDate,
        metadataURI: form.metadataURI,
        requesterWallet: user?.walletAddress || ""
      });
      setIssueResult(result);
      await loadStats();
      await loadCertificateOptions();
    } catch (error) {
      setIssueError(error.response?.data?.message || error.message || "Không thể cấp chứng chỉ");
    } finally {
      setIssuing(false);
    }
  }

  async function handleVerify() {
    if (!verifyId) return;
    setVerifying(true);
    setVerifyStatus("");
    setVerifyResult(null);
    try {
      const res = await verifyCertificate(verifyId);
      const payload = res?.data || null;
      setVerifyResult(res || null);

      const onChainValid = payload?.onChainValid !== undefined
        ? Boolean(payload.onChainValid)
        : Boolean(payload?.valid);
      const isIntegrityValid = payload?.isIntegrityValid !== undefined
        ? Boolean(payload.isIntegrityValid)
        : Boolean(payload?.valid);
      const isStatusActive = payload?.isStatusActive !== undefined
        ? Boolean(payload.isStatusActive)
        : String(payload?.status || "ACTIVE").toUpperCase() === "ACTIVE";

      if (onChainValid && isIntegrityValid && isStatusActive) {
        setVerifyStatus("Hợp lệ");
      } else if (isIntegrityValid && isStatusActive && !onChainValid) {
        setVerifyStatus(payload?.invalidReason || "Chưa đồng bộ on-chain");
      } else if (!isStatusActive) {
        setVerifyStatus(payload?.invalidReason || "Đã thu hồi");
      } else {
        setVerifyStatus(payload?.invalidReason || "Không hợp lệ");
      }
    } catch (error) {
      setVerifyStatus(error.response?.data?.message || error.message || "Không thể xác minh");
    } finally {
      setVerifying(false);
    }
  }

  async function handleRevoke() {
    if (!revokeId) return;

    if (!canManageCertificates) {
      setRevokeMessage("Chỉ Admin hoặc Issuer mới được thu hồi chứng chỉ.");
      setRevokeMessageType("error");
      return;
    }

    setRevoking(true);
    setRevokeMessage("");
    setRevokeMessageType("info");
    try {
      const res = await revokeCertificate(revokeId, user?.walletAddress || "");
      setRevokeMessage(res?.message || "Thu hồi thành công");
      setRevokeMessageType("success");
      await loadStats();
      await loadCertificateOptions();
    } catch (error) {
      setRevokeMessage(error.response?.data?.message || error.message || "Không thể thu hồi");
      setRevokeMessageType("error");
    } finally {
      setRevoking(false);
    }
  }

  async function loadStats() {
    try {
      const res = await getCertificateStats();
      setStats(res?.data || { total: 0, active: 0, revoked: 0 });
    } catch {
      setStats({ total: 0, active: 0, revoked: 0 });
    }
  }

  async function loadCertificateOptions() {
    try {
      const res = await getCertificateOptions();
      const options = (res?.data || [])
        .map((item) => Number(item.certificateId))
        .filter((value) => Number.isFinite(value));
      setCertificateIdOptions(options);
    } catch {
      setCertificateIdOptions([]);
    }
  }

  async function loadIssueOptions() {
    try {
      const [holdersRes, issuersRes] = await Promise.all([getHolders(), getIssuers()]);
      const holders = (holdersRes?.data || [])
        .map((item) => toOption(item.userId, item.name))
        .filter((item) => Number.isFinite(item.value));
      const issuers = (issuersRes?.data || [])
        .map((item) => toOption(item.issuerId, item.name))
        .filter((item) => Number.isFinite(item.value));

      if (holders.length) {
        setHolderIdOptions(holders);
        setForm((prev) => ({ ...prev, holderId: String(holders[0].value) }));
      } else {
        setHolderIdOptions([]);
        setIssueError("DB chưa có Người sở hữu. Hãy thêm tài khoản HOLDER trong bảng Users.");
      }

      if (issuers.length) {
        setIssuerIdOptions(issuers);
        setForm((prev) => ({ ...prev, issuerId: String(issuers[0].value) }));
      } else {
        setIssuerIdOptions([]);
        setIssueError("DB chưa có Issuer hoạt động. Hãy thêm issuer bằng tài khoản ADMIN.");
      }
    } catch {
      setHolderIdOptions(DEFAULT_HOLDER_ID_OPTIONS);
      setIssuerIdOptions(DEFAULT_ISSUER_ID_OPTIONS);
      setIssueError("Không tải được danh sách Người sở hữu/Issuer từ DB. Kiểm tra backend hoặc đăng nhập lại.");
    }
  }

  useEffect(() => {
    loadStats();
    loadIssueOptions();
    loadCertificateOptions();
  }, []);

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="grid gap-5 md:grid-cols-3"
      >
        {[
          { title: "Tổng Số", value: stats.total, icon: ShieldCheck, color: "text-blue-600" },
          { title: "Đã Cấp", value: stats.active, icon: FileCheck, color: "text-emerald-600" },
          { title: "Đã Thu Hồi", value: stats.revoked, icon: ShieldX, color: "text-rose-600" }
        ].map((item) => (
          <div key={item.title} className="card-premium rounded-[24px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.title}</p>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">{item.value}</p>
              </div>
              <item.icon className={`h-10 w-10 ${item.color}`} />
            </div>
            <p className="mt-5 text-xs text-slate-500">Thống kê sẽ cập nhật khi có dữ liệu từ hệ thống.</p>
          </div>
        ))}
      </motion.section>

      {canManageCertificates ? (
        <>
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="card-premium rounded-[24px] p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">Cấp Chứng Chỉ</h2>
                <p className="mt-2 text-sm text-slate-500">Phát hành chứng chỉ và đồng bộ dữ liệu lên blockchain.</p>
              </div>

              <form onSubmit={handleIssue} className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">ID Người Sở Hữu</label>
                    <NumericComboBox
                      value={form.holderId}
                      onChange={(value) => updateForm("holderId", value)}
                      options={holderIdOptions}
                      placeholder="Nhập hoặc chọn ID người sở hữu"
                    />
                   
                  </div>
                  <div>
                    <label className="label">ID Đơn Vị Cấp</label>
                    <NumericComboBox
                      value={form.issuerId}
                      onChange={(value) => updateForm("issuerId", value)}
                      options={issuerIdOptions}
                      placeholder="Nhập hoặc chọn ID"
                    />
                  </div>
                </div>

                <FloatingInput
                  label="Tên Chứng Chỉ "
                  value={form.courseName}
                  onChange={(value) => updateForm("courseName", value)}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Ngày cấp</label>
                    <input
                      type="date"
                      className="input h-12"
                      value={form.issueDate}
                      onChange={(event) => updateForm("issueDate", event.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Metadata URI</label>
                    <input
                      type="text"
                      className="input h-12"
                      placeholder="https://... hoặc ipfs://..."
                      value={form.metadataURI}
                      onChange={(event) => updateForm("metadataURI", event.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <button type="submit" className="btn-primary" disabled={issuing}>
                    {issuing ? "Đang cấp..." : "Cấp chứng chỉ"}
                  </button>
                  {issueError ? <div className="error-banner sm:flex-1">{issueError}</div> : null}
                </div>
              </form>
            </div>

            <div className="card-premium holo-card rounded-[24px] p-8">
              {verifying ? <div className="scan-overlay" /> : null}
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">Văn Bằng Số</h3>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${previewData.valid ? "badge-verified" : "badge-revoked"}`}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> {previewData.valid ? "Đã xác thực trên Blockchain" : "Chưa hợp lệ hoàn toàn"}
                </span>
              </div>

              {previewData.verified ? (
                <div className="mt-6 rounded-[20px] border border-amber-200 bg-[linear-gradient(120deg,#fffaf0,#fff)] p-6 shadow-inner">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-amber-700">Chứng Chỉ</p>
                      <h4 className="mt-2 text-xl font-bold text-slate-900">
                        {previewData.courseName} <span className="text-base text-slate-500">#{previewData.certificateId}</span>
                      </h4>
                      <p className="mt-1 text-xs text-slate-600">Mã chứng chỉ #{previewData.certificateId}</p>
                    </div>
                    <div className="rounded-full border border-amber-300 bg-gradient-to-b from-amber-100 to-amber-200 p-3 shadow-sm">
                      <BadgeCheck className="h-6 w-6 text-amber-700" />
                    </div>
                  </div>

                  <div className="mt-6 grid gap-2 text-sm text-slate-700">
                    <p>
                      Người sở hữu: {previewData.holderName && previewData.holderName !== "—"
                        ? `${previewData.holderName} (ID: ${previewData.holderId})`
                        : `ID ${previewData.holderId}`}
                    </p>
                    <p>
                      Đơn vị cấp: {previewData.issuerName && previewData.issuerName !== "—"
                        ? `${previewData.issuerName} (ID: ${previewData.issuerId})`
                        : `ID ${previewData.issuerId}`}
                    </p>
                    <p>Ngày cấp: {previewData.issueDate}</p>
                    {previewData.status ? <p>Trạng thái: {previewData.status}</p> : null}
                  </div>

                  <div className="mt-4 grid gap-2">
                    <CompactCopyField label="Mã băm" value={previewData.dataHash} />
                    <div className="small">
                      Giao dịch: {import.meta.env.VITE_NETWORK === "local" ? (
                        <span>{previewData.txHash}</span>
                      ) : (
                        previewData.txHash ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${previewData.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#3b82f6" }}
                          >
                            {previewData.txHash.slice(0, 10)}...{previewData.txHash.slice(-6)}
                          </a>
                        ) : null
                      )}
                    </div>
                    <CompactCopyField label="Link xác minh" value={previewData.verificationURL || verificationUrl} />
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-semibold ${previewData.valid ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-rose-200 bg-rose-50 text-rose-700"}`}>
                      {previewData.valid ? "Đã xác thực" : (verifyResult ? verifyStatus : "Đang chờ")}
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-2">
                      <QrCode className="h-8 w-8 text-slate-700" />
                    </div>
                  </div>

                  {verificationUrl ? (
                    <div className="mt-6">
                      <QRCodeComponent text={verificationUrl} />
                      <p className="mt-2 text-xs text-slate-500">Quét QR để mở trang xác minh chứng chỉ.</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-8 flex min-h-[290px] flex-col items-center justify-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50/60 text-center">
                  <ShieldIllustration />
                  <p className="mt-4 text-sm text-slate-500">Chưa có dữ liệu. Hãy cấp chứng chỉ hoặc kiểm tra một ID ở phần dưới để xem văn bằng số.</p>
                </div>
              )}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="flex justify-center"
          >
            <div className="card-premium w-full max-w-4xl rounded-[24px] px-8 py-8">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Quản Lý</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">Thu Hồi Chứng Chỉ</h3>
                  <p className="mt-1 text-sm text-slate-500">Chỉ Admin hoặc Issuer được phép thu hồi.</p>
                </div>
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-[220px]">
                    <NumericComboBox
                      value={revokeId}
                      onChange={setRevokeId}
                      options={certificateIdOptions}
                      placeholder="Nhập ID cần thu hồi"
                    />
                  </div>
                  <button type="button" className="btn-primary" onClick={handleRevoke} disabled={revoking}>
                    {revoking ? "Đang thu hồi..." : "Thu hồi"}
                  </button>
                </div>
              </div>
              {revokeMessage ? (
                <div className={`action-banner mt-3 ${revokeMessageType === "error" ? "action-banner-error" : "action-banner-success"}`}>
                  {revokeMessage}
                </div>
              ) : null}
            </div>
          </motion.section>
        </>
      ) : (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="flex justify-center"
        >
          <div className="card-premium w-full max-w-4xl rounded-[24px] px-8 py-8">
            <h3 className="text-2xl font-bold text-slate-900">Chế Độ Người Sở Hữu</h3>
            <p className="mt-2 text-sm text-slate-500">
              Tài khoản NGƯỜI SỞ HỮU chỉ có quyền xem, tra cứu và xác minh. Chức năng cấp/thu hồi thuộc ADMIN hoặc ISSUER.
            </p>
          </div>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="flex justify-center"
      >
        <div className="card-premium w-full max-w-4xl rounded-[24px] px-8 py-10 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Tìm Kiếm Xác Minh</p>
          <h3 className="mt-3 text-4xl font-extrabold text-slate-900">Kiểm Tra Tính Xác Thực</h3>

          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-4 md:flex-row">
            <div className="relative w-full rounded-2xl border border-white/60 bg-white/80 p-1 shadow-[0_10px_30px_rgba(148,163,184,0.22)] backdrop-blur-xl">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-xl border-0 bg-transparent py-4 pl-12 pr-4 text-slate-700 placeholder:text-slate-400 focus:outline-none"
                placeholder="Nhập ID chứng chỉ"
                value={verifyId}
                onChange={(event) => setVerifyId(event.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
            <button
              type="button"
              onClick={handleVerify}
              className="btn-primary inline-flex min-h-[88px] min-w-[132px] flex-col items-center justify-center gap-0.5 px-4 py-4 leading-tight text-center"
            >
              {verifying ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" /> : null}
              <span className="whitespace-nowrap">Kiểm tra</span>
              <span className="whitespace-nowrap">Xác thực</span>
            </button>
          </div>

          {verifyStatus ? (
            <p className={`mt-4 text-sm ${verifyStatus === "Hợp lệ" ? "text-emerald-700" : "text-rose-600"}`}>
              {verifyStatus}
            </p>
          ) : null}
        </div>
      </motion.section>
    </div>
  );
}

function FloatingInput({ label, value, onChange, type = "text" }) {
  return (
    <div className="relative">
      <input
        type={type}
        className="peer w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
        placeholder=" "
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <label className="pointer-events-none absolute left-4 top-2 text-xs text-slate-500 transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-xs">
        {label}
      </label>
    </div>
  );
}

function ShieldIllustration() {
  return (
    <svg width="150" height="150" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M100 20L35 45V95C35 132 61 167 100 180C139 167 165 132 165 95V45L100 20Z"
        stroke="rgba(100, 116, 139, 0.45)"
        strokeWidth="4"
      />
      <path
        d="M70 100L90 120L130 80"
        stroke="rgba(100, 116, 139, 0.45)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
