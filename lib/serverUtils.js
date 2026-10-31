import crypto from "crypto";

export function getTodayVN() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
}

export function getDaysDifference(dateStrA, dateStrB) {
  if (!dateStrA || !dateStrB) return null;
  const [y1, m1, d1] = dateStrA.split("-").map(Number);
  const [y2, m2, d2] = dateStrB.split("-").map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return null;

  const utcA = Date.UTC(y1, m1 - 1, d1);
  const utcB = Date.UTC(y2, m2 - 1, d2);
  const diffMs = Math.abs(utcA - utcB);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getVisitorHash(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  let ip = "127.0.0.1";
  if (forwardedFor) {
    ip = forwardedFor.split(",")[0].trim();
  } else if (realIp) {
    ip = realIp.trim();
  } else if (cfIp) {
    ip = cfIp.trim();
  }

  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  const salt = process.env.IP_HASH_SALT || "cay-phuong-cua-nam-2026";

  return crypto
    .createHash("sha256")
    .update(`${ip}|${userAgent}|${salt}`)
    .digest("hex");
}

