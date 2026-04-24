import React, { useEffect, useState } from "react";
import { addHolderAdmin, getHoldersAdmin, removeHolderAdmin } from "../services/api";

export default function AdminHolderManagement() {
  const [holders, setHolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingUserId, setRemovingUserId] = useState(0);
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

  async function loadHolders() {
    setLoading(true);
    setError("");
    try {
      const res = await getHoldersAdmin();
      setHolders(res?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể tải danh sách holder.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHolders();
  }, []);

  async function onAddHolder(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const res = await addHolderAdmin(form);
      setMessage(res?.message || "Thanh cong");
      setForm({ walletAddress: "", name: "", email: "", username: "", password: "" });
      await loadHolders();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể thêm holder.");
    } finally {
      setSaving(false);
    }
  }

  async function onRemoveHolder(userId) {
    setRemovingUserId(userId);
    setMessage("");
    setError("");

    try {
      const res = await removeHolderAdmin(userId);
      setMessage(res?.message || "Thanh cong");
      await loadHolders();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Không thể gỡ holder.");
    } finally {
      setRemovingUserId(0);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-premium rounded-[24px] p-8">
        <h2 className="text-2xl font-bold text-slate-900">Quản Lý Holder (Người Sở Hữu)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tạo tài khoản HOLDER để cấp chứng chỉ.
        </p>

        <form onSubmit={onAddHolder} className="mt-6 grid gap-4 md:grid-cols-2">
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
            <label className="label">Tên Holder</label>
            <input
              className="input"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Vi du: Phan Thằng Vinh"
            />
          </div>

          <div>
            <label className="label">Email (không bắt buộc)</label>
            <input
              className="input"
              value={form.email}
              onChange={(event) => updateForm("email", event.target.value)}
              placeholder="holder@example.com"
            />
          </div>

          <div>
            <label className="label">Username đăng nhập</label>
            <input
              className="input"
              value={form.username}
              onChange={(event) => updateForm("username", event.target.value)}
              placeholder="holder_new"
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
              {saving ? "Đang thêm holder..." : "Thêm / kích hoạt holder"}
            </button>
          </div>
        </form>

        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="card-premium rounded-[24px] p-8">
        <h3 className="text-xl font-bold text-slate-900">Danh sách Holder</h3>
        {loading ? <p className="mt-3 text-sm text-slate-500">Đang tải...</p> : null}

        {!loading ? (!holders || holders.length === 0 ? (
          <div className="mt-4 text-sm text-slate-500">No data</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-3">UserID</th>
                  <th className="py-2 pr-3">Ten</th>
                  <th className="py-2 pr-3">Username</th>
                  <th className="py-2 pr-3">Wallet</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {holders.map((holder) => (
                  <tr key={holder.userId} className="border-b border-slate-100">
                    <td className="py-3 pr-3">{holder.userId}</td>
                    <td className="py-3 pr-3">{holder.name || "-"}</td>
                    <td className="py-3 pr-3">{holder.username || "-"}</td>
                    <td className="py-3 pr-3">{holder.walletAddress}</td>
                    <td className="py-3 pr-3">
                      {holder.role === "HOLDER" ? (
                        <span className="badge ok">HOLDER</span>
                      ) : (
                        <span className="badge">STUDENT</span>
                      )}
                    </td>
                    <td className="py-3">
                      {holder.role === "HOLDER" ? (
                        <button
                          type="button"
                          className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          disabled={removingUserId === holder.userId}
                          onClick={() => onRemoveHolder(holder.userId)}
                        >
                          {removingUserId === holder.userId ? "Đang gỡ..." : "Gỡ holder"}
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
        )) : null}
      </div>
    </div>
  );
}
