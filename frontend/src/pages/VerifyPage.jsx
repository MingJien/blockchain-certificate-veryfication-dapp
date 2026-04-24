// Purpose: Verify a certificate by ID (calls backend GET /api/verify/:id).

import React, { useEffect, useState } from "react";
import Button from "../components/Button";
import NumericComboBox from "../components/NumericComboBox";
import { getCertificateOptions, verifyCertificate } from "../services/api";

export default function VerifyPage() {
  const [id, setId] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [idOptions, setIdOptions] = useState([]);

  useEffect(() => {
    async function loadCertificateOptions() {
      try {
        const res = await getCertificateOptions();
        const options = (res?.data || [])
          .map((item) => Number(item.certificateId))
          .filter((value) => Number.isFinite(value));

        setIdOptions(options);
      } catch (e) {
        setIdOptions([]);
        setError(e.response?.data?.message || e.message || "Không tải được danh sách ID chứng chỉ.");
      }
    }

    loadCertificateOptions();
  }, []);

  async function onVerify() {
    setError("");
    setResult(null);
    try {
      const data = await verifyCertificate(id);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Xác minh thất bại.");
    }
  }

  return (
    <div className="flex justify-center">
      <div className="card-premium w-full max-w-4xl rounded-[24px] p-8">
        <h3 className="text-2xl font-bold text-slate-900" style={{ marginTop: 0 }}>Xác Minh Chứng Chỉ</h3>
        <label className="label">ID Chứng Chỉ</label>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="w-full">
            <NumericComboBox
              value={id}
              onChange={setId}
              options={idOptions}
              placeholder="Nhập hoặc chọn ID chứng chỉ"
            />
          </div>
          <Button onClick={onVerify}>Xác Minh</Button>
        </div>

        {error ? <div className="error-banner" style={{ marginTop: 10 }}>{error}</div> : null}

        {result ? (
          <div style={{ marginTop: 12 }}>
            <div className="small">ID Chứng Chỉ: {result?.data?.certificateId}</div>
            <div className="small" style={{ marginTop: 8 }}>Link Xác Minh: {result?.data?.verificationURL}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
