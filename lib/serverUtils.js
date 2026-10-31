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

  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    ip = "127.0.0.1";
  }

  const clientId = request.headers.get("x-client-id")?.trim() || "";
  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  const salt = process.env.IP_HASH_SALT || "cay-phuong-cua-nam-2026";

  const identityBase = clientId
    ? `${clientId}|${ip}|${salt}`
    : `${ip}|${userAgent}|${salt}`;

  return crypto.createHash("sha256").update(identityBase).digest("hex");
}

export function getLegacyVisitorHash(request) {
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

// Tạo vị trí ngẫu nhiên trên sân cỏ (an toàn cho cả màn hình Mobile lẫn PC, tránh gốc cây ở giữa và nút tưới ở đáy)
export function generateRandomLawnPos(existingBranches = []) {
  let bestPos = { posX: 25, posY: 15 };
  let maxMinDist = -1;

  for (let attempt = 0; attempt < 18; attempt++) {
    const isLeftSide =
      existingBranches.length % 2 === 0
        ? Math.random() < 0.65
        : Math.random() < 0.35;

    const posX = isLeftSide
      ? Number((13 + Math.random() * 27).toFixed(2)) // 13% -> 40% (Sân bên trái cây)
      : Number((60 + Math.random() * 27).toFixed(2)); // 60% -> 87% (Sân bên phải cây)

    const posY = Number((11 + Math.random() * 11.5).toFixed(2)); // 11% -> 22.5% từ đáy lên (trên thảm cỏ)

    if (existingBranches.length === 0) {
      return { posX, posY };
    }

    let minDist = Infinity;
    for (const b of existingBranches) {
      if (typeof b.posX === "number" && typeof b.posY === "number") {
        const dx = b.posX - posX;
        const dy = (b.posY - posY) * 1.8;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) minDist = dist;
      }
    }

    if (minDist > maxMinDist) {
      maxMinDist = minDist;
      bestPos = { posX, posY };
    }
  }

  return bestPos;
}

// Vị trí cố định dựa trên ID cho các bản ghi cũ chưa có posX/posY
export function ensureFlowerPosition(rawBranch, index = 0) {
  if (
    typeof rawBranch.posX === "number" &&
    typeof rawBranch.posY === "number"
  ) {
    return { posX: rawBranch.posX, posY: rawBranch.posY };
  }

  const seedStr = `${rawBranch._id || index}_${rawBranch.visitorHash || ""}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }

  const isLeft = index % 2 === 0;
  const xOffset = (hash % 260) / 10; // 0..26
  const yOffset = ((hash >> 8) % 115) / 10; // 0..11.5

  const posX = isLeft
    ? Number((13 + xOffset).toFixed(2))
    : Number((60 + xOffset).toFixed(2));
  const posY = Number((11 + yOffset).toFixed(2));

  return { posX, posY };
}
