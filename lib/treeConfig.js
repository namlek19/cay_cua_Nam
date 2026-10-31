export const STAGE_CONFIG = [
  {
    stage: 1,
    min: 0,
    max: 15,
    rangeLabel: "0 - 15",
    img: "/assets/stage_1.png",
    title: "Mầm non mới nhú",
    age: "0 - 2 tháng",
    branchY: [5, 11],
    branchScale: 0.35,
    scaleRange: [1.0, 1.06],
  },
  {
    stage: 2,
    min: 16,
    max: 45,
    rangeLabel: "16 - 45",
    img: "/assets/stage_2.png",
    title: "Cây mầm lá non",
    age: "2 - 6 tháng",
    branchY: [7, 20],
    branchScale: 0.58,
    scaleRange: [0.58, 0.65],
  },
  {
    stage: 3,
    min: 46,
    max: 90,
    rangeLabel: "46 - 90",
    img: "/assets/stage_3.png",
    title: "Cây con bám rễ",
    age: "Tròn 1 năm",
    branchY: [8, 24],
    branchScale: 0.62,
    scaleRange: [0.64, 0.72],
  },
  {
    stage: 4,
    min: 91,
    max: 180,
    rangeLabel: "91 - 180",
    img: "/assets/stage_4.png",
    title: "Vươn thân vững chãi",
    age: "Năm 1 - 2",
    branchY: [8, 26],
    branchScale: 0.65,
    scaleRange: [0.72, 0.8],
  },
  {
    stage: 5,
    min: 181,
    max: 270,
    rangeLabel: "181 - 270",
    img: "/assets/stage_5.png",
    title: "Phân cành đón nắng",
    age: "Năm 3",
    branchY: [9, 28],
    branchScale: 0.68,
    scaleRange: [0.82, 0.9],
  },
  {
    stage: 6,
    min: 271,
    max: 450,
    rangeLabel: "271 - 450",
    img: "/assets/stage_6.png",
    title: "Hoa bói đầu mùa",
    age: "Năm 3 - 5",
    branchY: [9, 29],
    branchScale: 0.7,
    scaleRange: [0.92, 1.0],
  },
  {
    stage: 7,
    min: 451,
    max: 650,
    rangeLabel: "451 - 650",
    img: "/assets/stage_7.png",
    title: "Mở rộng vòm tán",
    age: "Năm 5 - 7",
    branchY: [9, 30],
    branchScale: 0.72,
    scaleRange: [1.03, 1.12],
  },
  {
    stage: 8,
    min: 651,
    max: 900,
    rangeLabel: "651 - 900",
    img: "/assets/stage_8.png",
    title: "Định hình bóng mát",
    age: "Năm 7 - 10",
    branchY: [9, 31],
    branchScale: 0.74,
    scaleRange: [1.15, 1.24],
  },
  {
    stage: 9,
    min: 901,
    max: 1800,
    rangeLabel: "901 - 1800",
    img: "/assets/stage_9.png",
    title: "Phượng vĩ rực rỡ",
    age: "Năm 10 - 20",
    branchY: [10, 32],
    branchScale: 0.76,
    scaleRange: [1.27, 1.37],
  },
  {
    stage: 10,
    min: 1801,
    max: Infinity,
    rangeLabel: "1800+",
    img: "/assets/stage_10.png",
    title: "Cổ thụ trầm mặc",
    age: "Trên 20 năm",
    branchY: [10, 32],
    branchScale: 0.78,
    scaleRange: [1.4, 1.5],
  },
];

export function getTreeStageInfo(totalCount = 0) {
  const safeCount = Math.max(0, Number(totalCount) || 0);

  let current = STAGE_CONFIG[0];
  for (let i = 0; i < STAGE_CONFIG.length; i++) {
    const item = STAGE_CONFIG[i];
    if (safeCount >= item.min && safeCount <= item.max) {
      current = item;
      break;
    }
  }

  let progress = 0;
  let nextStageCount = null;

  if (current.max === Infinity) {
    const extraProgress = Math.min(1, (safeCount - current.min) / 1200);
    progress = Math.max(0, extraProgress);
    nextStageCount = null;
  } else {
    const span = Math.max(1, current.max - current.min);
    progress = Math.min(1, Math.max(0, (safeCount - current.min) / span));
    nextStageCount = current.max + 1;
  }

  const [minScale, maxScale] = current.scaleRange || [1.0, 1.12];
  const microScale = Number(
    (minScale + progress * (maxScale - minScale)).toFixed(4)
  );
  const progressPercent =
    current.max === Infinity ? 100 : Math.round(progress * 100);

  return {
    ...current,
    totalCount: safeCount,
    progress,
    progressPercent,
    microScale,
    nextStageCount,
    hasFallingPetals: safeCount >= 271,
  };
}
