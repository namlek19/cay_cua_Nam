import "./globals.css";

export const metadata = {
  title: "Cây Phượng Đỏ | Khu Vườn Kỷ Niệm & Lời Nhắn Cành Vàng",
  description:
    "Cùng tưới nước chăm sóc Cây Phượng Đỏ lớn lên qua 10 giai đoạn trưởng thành và gửi gắm những cuộn thư kỷ niệm trên cành vàng.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="antialiased">{children}</body>
    </html>
  );
}

