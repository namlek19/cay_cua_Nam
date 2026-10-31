import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

if (!global._memoryTreeFallback) {
  global._memoryTreeFallback = {
    treeState: {
      key: "main_tree",
      ownerWaterCount: 0,
      guestWaterCount: 0,
      streak: 0,
      lastOwnerWaterDate: null,
    },
    branches: [],
  };
}

export class DatabaseConfigError extends Error {
  constructor(message, guide) {
    super(message);
    this.name = "DatabaseConfigError";
    this.code = "DB_CONFIG_ERROR";
    this.guide = guide;
  }
}

export function checkMongoUriStatus() {
  if (!MONGODB_URI) {
    return {
      valid: false,
      error: "Thiếu biến môi trường MONGODB_URI trong file .env.local.",
      guide:
        "Vui lòng tạo file .env.local ở thư mục gốc và khai báo MONGODB_URI với mật khẩu thực tế của bạn.",
    };
  }

  if (MONGODB_URI.includes("<db_password>")) {
    return {
      valid: false,
      error:
        "Chuỗi kết nối MONGODB_URI trong .env.local vẫn đang chứa <db_password>.",
      guide:
        "Hướng dẫn chủ vườn: Hãy mở file .env.local, thay thế cụm <db_password> bằng mật khẩu thật của tài khoản MongoDB Atlas (ducnamle432_db_user), lưu file và khởi động lại ứng dụng.",
    };
  }

  return { valid: true, error: null, guide: null };
}

export async function connectDB() {
  const uriStatus = checkMongoUriStatus();
  if (!uriStatus.valid) {
    throw new DatabaseConfigError(uriStatus.error, uriStatus.guide);
  }

  const cached = global._mongooseCache;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 6000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        throw new DatabaseConfigError(
          `Không thể kết nối tới MongoDB: ${err.message}`,
          "Vui lòng kiểm tra lại mật khẩu trong file .env.local và đảm bảo đã cho phép IP (0.0.0.0/0) trong mục Network Access trên MongoDB Atlas."
        );
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export function getMemoryFallback() {
  return global._memoryTreeFallback;
}

