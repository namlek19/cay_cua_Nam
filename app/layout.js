import "./globals.css";

export const metadata = {
  title: "Nam trồng cây",
  description: "Cùng tưới nước chăm sóc cây của Nam lớn lên mỗi ngày.",
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

