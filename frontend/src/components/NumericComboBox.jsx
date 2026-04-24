import React, { useMemo, useState } from "react";

export default function NumericComboBox({ value, onChange, options = [], placeholder = "Nhập số", disabled = false }) {
  const [open, setOpen] = useState(false);

  const displayOptions = useMemo(() => {
    const normalized = options
      .map((item) => {
        if (item && typeof item === "object") {
          const rawValue = Number(item.value);
          if (!Number.isFinite(rawValue)) return null;
          const valueText = String(rawValue);
          return {
            value: valueText,
            label: item.label ? String(item.label) : valueText
          };
        }

        const rawValue = Number(item);
        if (!Number.isFinite(rawValue)) return null;
        const valueText = String(rawValue);
        return { value: valueText, label: valueText };
      })
      .filter(Boolean)
      .sort((a, b) => Number(a.value) - Number(b.value));

    const query = String(value || "").trim();
    if (!query) return normalized;

    const hasExactMatch = normalized.some((item) => item.value === query);
    if (hasExactMatch) {
      return normalized;
    }

    return normalized.filter((item) => item.value.startsWith(query) || item.label.toLowerCase().includes(query.toLowerCase()));
  }, [options, value]);

  function handleInputChange(event) {
    if (disabled) return;
    const nextValue = event.target.value.replace(/[^0-9]/g, "");
    onChange(nextValue);
    setOpen(true);
  }

  function chooseOption(nextValue) {
    if (disabled) return;
    onChange(String(nextValue));
    setOpen(false);
  }

  return (
    <div className="combo" onBlur={() => setOpen(false)}>
      <div className="combo-control">
        <input
          className="combo-input w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="combo-toggle text-slate-500"
          aria-label="Mở danh sách gợi ý"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            if (!disabled) setOpen((prev) => !prev);
          }}
        >
          ▾
        </button>
      </div>

      {open ? (
        <div className="combo-menu">
          {displayOptions.length > 0 ? (
            displayOptions.map((item) => (
              <button
                key={item.value}
                type="button"
                className="combo-item"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseOption(item.value)}
              >
                {item.label}
              </button>
            ))
          ) : (
            <div className="combo-empty">Không có gợi ý phù hợp</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
