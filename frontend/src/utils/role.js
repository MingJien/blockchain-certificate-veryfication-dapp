export function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase();
}

export function getRoleLabel(role) {
  const normalized = normalizeRole(role);

  if (normalized === "ADMIN") return "ADMIN";
  if (normalized === "ISSUER") return "ISSUER";
  if (normalized === "HOLDER" || normalized === "STUDENT") return "NGƯỜI SỞ HỮU";

  return normalized || "-";
}

export function getDefaultRouteByRole(role) {
  const normalized = normalizeRole(role);

  if (normalized === "ADMIN") return "/admin/issuers";
  if (normalized === "ISSUER") return "/issuer";
  if (normalized === "HOLDER" || normalized === "STUDENT") return "/student";

  return "/";
}
