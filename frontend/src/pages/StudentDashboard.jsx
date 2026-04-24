// Purpose: View a certificate by ID (calls backend GET /api/certificates/:id).

import React, { useEffect, useState } from "react";
import Button from "../components/Button";
import CertificateCard from "../components/CertificateCard";
import NumericComboBox from "../components/NumericComboBox";
import { getCertificate, getCertificateOptions } from "../services/api";

export default function StudentDashboard() {
  const [id, setId] = useState("");
  const [idOptions, setIdOptions] = useState([]);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");

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

  async function onFetch() {
    setError("");
    setCertificate(null);
    try {
      const res = await getCertificate(id);
      setCertificate(res?.data || null);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Không tìm thấy chứng chỉ.");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Bảng Điều Khiển Người Sở Hữu</h3>
        <label className="label">ID Chứng Chỉ</label>
        <div className="row">
          <NumericComboBox
            value={id}
            onChange={setId}
            options={idOptions}
            placeholder="Nhập hoặc chọn ID chứng chỉ"
          />
          <Button onClick={onFetch}>Tra Cứu</Button>
        </div>
        {error ? <div className="small" style={{ color: "#b00020", marginTop: 8 }}>{error}</div> : null}
      </div>

      <CertificateCard certificate={certificate} />
    </div>
  );
}
