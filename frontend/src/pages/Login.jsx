import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { loginWithPassword } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getDefaultRouteByRole } from "../utils/role";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, user } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDefaultRouteByRole(user?.role), { replace: true });
    }
  }, [isAuthenticated, navigate, user?.role]);

  function getFromPath() {
    const from = location.state?.from;
    if (typeof from === "string") {
      return from;
    }
    if (typeof from?.pathname === "string") {
      return from.pathname;
    }
    return "";
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginWithPassword({ username, password });
      const nextUser = res?.data?.user;
      login({ token: res?.data?.token, user: nextUser });

      const fromPath = getFromPath();
      const targetPath = fromPath && fromPath !== "/login"
        ? fromPath
        : getDefaultRouteByRole(nextUser?.role);

      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-6 py-12 text-slate-800">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-blue-100 opacity-60 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-100 opacity-60 blur-[120px]" />
      </div>

      <div className="mx-auto mt-20 max-w-md card-premium rounded-[24px] p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Đăng Nhập Hệ Thống</h1>
            <p className="text-sm text-slate-500">Phân quyền Admin / Issuer / Holder</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Tài khoản</label>
            <input
              className="input"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Nhập username"
            />
          </div>

          <div>
            <label className="label">Mật khẩu</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

       
      </div>
    </div>
  );
}
