import React, { useEffect, useState } from "react";
import { addIssuerAdmin, getIssuersAdmin, removeIssuerAdmin } from "../services/api";

export default function AdminIssuerManagement() {
  const [issuers, setIssuers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingWallet, setRemovingWallet] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    walletAddress: "",
    name: "",
    email: "",
    username: "",
    password: ""
  });

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function loadIssuers() {
    setLoading(true);
    setError("");
    try {
      const res = await getIssuersAdmin();
      setIssuers(res?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách issuer.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIssuers();
  }, []);

  async function onAddIssuer(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await addIssuerAdmin(form);
      setMessage(`${res?.message || "Thành công"} (tx: ${res?.data?.txHash || "n/a"})`);
      setForm({ walletAddress: "", name: "", email: "", username: "", password: "" });
      await loadIssuers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể thêm issuer.");
    } finally {
      setSaving(false);
    }
  }

  async function onRemoveIssuer(walletAddress) {
    setRemovingWallet(walletAddress);
    setMessage("");
    setError("");

    try {
      const res = await removeIssuerAdmin(walletAddress);
      setMessage(`${res?.message || "Thành công"} (tx: ${res?.data?.txHash || "n/a"})`);
      await loadIssuers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể gỡ issuer.");
    } finally {
      setRemovingWallet("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-premium rounded-[24px] p-8">
        <h2 className="text-2xl font-bold text-slate-900">Quản Lý Issuer (Người Cấp) </h2>
        <p className="mt-1 text-sm text-slate-500">
          Khi thêm/gỡ issuer từ đây, hệ thống sẽ cập nhật on-chain trước rồi đồng bộ DB.
        </p>

        <form onSubmit={onAddIssuer} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">WalletAddress</label>
            <input
              className="input"
              value={form.walletAddress}
              onChange={(event) => updateForm("walletAddress", event.target.value)}
              placeholder="0x..."
            />
          </div>

          <div>
            <label className="label">Tên đơn vị cấp</label>
            <input
              className="input"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Ví dụ: ĐH Bách khoa"
            />
          </div>

          <div>
            <label className="label">Email (không bắt buộc)</label>
            <input
              className="input"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
              placeholder="issuer@example.com"
            />
          </div>

          <div>
            <label className="label">Username đăng nhập</label>
            <input
              className="input"
              value={form.username}
              onChange={(event) => updateForm("username", event.target.value)}
              placeholder="issuer_new"
            />
          </div>

          <div className="md:col-span-2">
            <label className="label">Mật khẩu đăng nhập</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(event) => updateForm("password", event.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <div className="md:col-span-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Đang thêm issuer..." : "Thêm / kích hoạt issuer"}
            </button>
          </div>
        </form>

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="card-premium rounded-[24px] p-8">
        <h3 className="text-xl font-bold text-slate-900">Danh sách Issuer</h3>
        {loading ? <p className="mt-3 text-sm text-slate-500">Đang tải...</p> : null}

        {!loading ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3">IssuerID</th>
                  <th className="py-2 pr-3">Tên đơn vị</th>
                  <th className="py-2 pr-3">Username</th>
                  <th className="py-2 pr-3">Wallet</th>
                  <th className="py-2 pr-3">Trạng thái</th>
                  <th className="py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {issuers.map((issuer) => (
                  <tr key={`${issuer.issuerId}-${issuer.walletAddress}`} className="border-b border-slate-100">
                    <td className="py-3 pr-3">{issuer.issuerId}</td>
                    <td className="py-3 pr-3">{issuer.name || "-"}</td>
                    <td className="py-3 pr-3">{issuer.username || "-"}</td>
                    <td className="py-3 pr-3">{issuer.walletAddress}</td>
                    <td className="py-3 pr-3">
                      {issuer.isActive ? (
                        <span className="badge ok">ACTIVE</span>
                      ) : (
                        <span className="badge bad">INACTIVE</span>
                      )}
                    </td>
                    <td className="py-3">
                      {issuer.isActive ? (
                        <button
                          type="button"
                          className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          disabled={removingWallet === issuer.walletAddress}
                          onClick={() => onRemoveIssuer(issuer.walletAddress)}
                        >
                          {removingWallet === issuer.walletAddress ? "Đang gỡ..." : "Gỡ issuer"}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Đã gỡ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}
