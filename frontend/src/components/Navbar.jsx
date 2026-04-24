// Purpose: Top navigation bar + MetaMask connect.

import React, { useState } from "react";
import { Wallet, Copy, Check, LogOut, UserRound } from "lucide-react";
import Button from "./Button";
import { connectWallet } from "../services/blockchain";
import { useAuth } from "../context/AuthContext";
import { getRoleLabel } from "../utils/role";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function onConnect() {
    setError("");
    try {
      const { address } = await connectWallet({ forceAccountSelection: true });
      setAddress(address);
    } catch (e) {
      setError(e.message || "Kết nối ví thất bại");
    }
  }

  async function onCopyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_e) {
      setError("Không thể sao chép địa chỉ ví");
    }
  }

  return (
    <div className="border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">CERTIFICATE VERIFICATION DAPP</p>
          <h1 className="text-2xl font-bold leading-tight text-slate-900">
            Hệ thống xác minh chứng chỉ số <span className="block lg:inline">trên Blockchain</span>
          </h1>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-start gap-3 lg:justify-end lg:gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 lg:flex">
              <UserRound className="h-3.5 w-3.5 text-slate-500" />
              <span>{user?.username || "-"}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600">
                {getRoleLabel(user?.role)}
              </span>
            </div>
            <div className="rounded-full bg-gradient-to-r from-blue-400/60 via-indigo-400/60 to-violet-400/60 p-[1px]">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm text-slate-700">
                <Wallet className="h-4 w-4 text-blue-600" />
                <span>Địa chỉ ví</span>
                <span className="text-slate-500">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Chưa kết nối"}
                </span>
                {address ? (
                  <button
                    type="button"
                    onClick={onCopyAddress}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                    title="Sao chép đầy đủ địa chỉ ví"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Đã chép" : "Sao chép"}
                  </button>
                ) : null}
              </div>
            </div>
            <Button onClick={onConnect}>Kết Nối MetaMask</Button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              title="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
        {error ? <div className="error-banner mt-3">{error}</div> : null}
      </div>
    </div>
  );
}
