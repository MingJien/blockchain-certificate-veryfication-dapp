// Purpose: QR-based verification (minimal): paste a QR URL and navigate to it.

import React, { useState } from "react";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

export default function QRVerifyPage() {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function onGo() {
    setError("");
    try {
      // Expect something like http://localhost:5173/verify/123
      const url = new URL(text.trim());
      const parts = url.pathname.split("/").filter(Boolean);
      const verifyIndex = parts.indexOf("verify");
      if (verifyIndex === -1 || !parts[verifyIndex + 1]) {
        throw new Error("URL QR phải chứa /verify/:id");
      }
      const id = parts[verifyIndex + 1];
      navigate(`/verify/${id}`);
    } catch (e) {
      setError(e.message || "Nội dung QR không hợp lệ");
    }
  }

  return (
    <div className="flex justify-center">
      <div className="card-premium w-full max-w-4xl rounded-[24px] p-8">
        <h3 className="text-2xl font-bold text-slate-900" style={{ marginTop: 0 }}>Xác Minh Bằng QR</h3>

        <textarea
          className="input"
          style={{ minHeight: 90 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dán URL QR vào đây để xác minh..."
        />

        <div style={{ marginTop: 10 }}>
          <Button onClick={onGo}>Mở</Button>
        </div>

        {error ? <div className="error-banner" style={{ marginTop: 10 }}>{error}</div> : null}
      </div>
    </div>
  );
}
