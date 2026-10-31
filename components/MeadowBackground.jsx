"use client";

import React from "react";

export default function MeadowBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* 1. Bầu trời xanh trong trẻo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #2596ff 0%, #58b8ff 42%, #9be7ff 72%, #d9f8ff 100%)",
        }}
      />

      {/* Ánh nắng mặt trời dịu nhẹ góc trên */}
      <div
        className="absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-75 blur-2xl sm:h-96 sm:w-96"
        style={{
          background:
            "radial-gradient(circle, rgba(255,250,200,0.95) 0%, rgba(255,230,130,0.35) 55%, rgba(255,255,255,0) 75%)",
        }}
      />

      {/* 2. Các cụm mây trắng trôi nhẹ trên bầu trời */}
      <div className=" cloud-drift-slow absolute left-[6%] top-[9%] opacity-90">
        <CloudSvg className="h-14 w-32 sm:h-20 sm:w-48" />
      </div>

      <div className="cloud-drift-medium absolute right-[12%] top-[14%] opacity-85">
        <CloudSvg className="h-12 w-28 sm:h-16 sm:w-40" />
      </div>

      <div className="cloud-drift-fast absolute left-[38%] top-[6%] hidden opacity-80 sm:block">
        <CloudSvg className="h-14 w-36" />
      </div>

      <div className="cloud-drift-slow absolute left-[68%] top-[24%] opacity-75">
        <CloudSvg className="h-10 w-24 sm:h-14 sm:w-32" />
      </div>

      <div className="cloud-drift-medium absolute left-[15%] top-[27%] opacity-70">
        <CloudSvg className="h-10 w-24 sm:h-12 sm:w-28" />
      </div>

      {/* 3. Đồi cỏ xa phía chân trời */}
      <div
        className="absolute bottom-[19%] -left-[10%] h-[16dvh] w-[75%] rounded-[100%]"
        style={{
          background: "linear-gradient(180deg, #74d14c 0%, #4ead33 100%)",
        }}
      />
      <div
        className="absolute bottom-[18%] -right-[12%] h-[18dvh] w-[80%] rounded-[100%]"
        style={{
          background: "linear-gradient(180deg, #68c743 0%, #459e2c 100%)",
        }}
      />

      {/* 4. Sân cỏ chính (Chiếm ~28dvh phía dưới, đồng nhất trên cả PC và Mobile) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[27dvh]"
        style={{
          background:
            "linear-gradient(180deg, #8be053 0%, #63bf36 38%, #479c24 78%, #347a18 100%)",
          borderTopLeftRadius: "40% 18px",
          borderTopRightRadius: "40% 18px",
          boxShadow: "inset 0 8px 20px rgba(255, 255, 200, 0.35)",
        }}
      >
        {/* Vệt nắng vàng chiếu trên thảm cỏ gần gốc cây */}
        <div
          className="absolute left-1/2 top-2 h-24 w-[80%] -translate-x-1/2 rounded-full opacity-55 blur-xl"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(235, 255, 130, 0.85) 0%, rgba(139, 224, 83, 0) 70%)",
          }}
        />
      </div>
    </div>
  );
}

function CloudSvg({ className = "" }) {
  return (
    <svg
      viewBox="0 0 200 85"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M46 75H162C179.673 75 194 60.6731 194 43C194 26.868 182.062 13.5262 166.529 11.3186C160.343 -0.141918 148.209 -8 134.2 -8C116.809 -8 102.273 4.02705 98.4143 20.2314C92.8114 16.912 86.2752 15 79.2857 15C59.9883 15 44.1795 29.5914 42.0695 48.3292C28.5305 50.2564 18 61.8977 18 76C18 75.6649 30.536 75 46 75Z"
        fill="white"
        fillOpacity="0.92"
      />
    </svg>
  );
}

