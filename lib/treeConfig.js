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
  },
  {
    stage: 2,
    min: 16,
    max: 45,
    rangeLabel: "16 - 45",
    img: "/assets/stage_2.png",
    title: "Cây mầm lá non",
    age: "2 - 6 tháng",
    branchY: [7, 22],
    branchScale: 0.48,
  },
  {
    stage: 3,
    min: 46,
    max: 90,
    rangeLabel: "46 - 90",
    img: "/assets/stage_3.png",
    title: "Cây con bám rễ",
    age: "Tròn 1 năm",
    branchY: [8, 30],
    branchScale: 0.6,
  },
  {
    stage: 4,
    min: 91,
    max: 180,
    rangeLabel: "91 - 180",
    img: "/assets/stage_4.png",
    title: "Vươn thân vững chãi",
    age: "Năm 1 - 2",
    branchY: [9, 36],
    branchScale: 0.72,
  },
  {
    stage: 5,
    min: 181,
    max: 270,
    rangeLabel: "181 - 270",
    img: "/assets/stage_5.png",
    title: "Phân cành đón nắng",
    age: "Năm 3",
    branchY: [10, 42],
    branchScale: 0.82,
  },
  {
    stage: 6,
    min: 271,
    max: 450,
    rangeLabel: "271 - 450",
    img: "/assets/stage_6.png",
    title: "Hoa bói đầu mùa",
    age: "Năm 3 - 5",
    branchY: [10, 44],
    branchScale: 0.88,
  },
  {
    stage: 7,
    min: 451,
    max: 650,
    rangeLabel: "451 - 650",
    img: "/assets/stage_7.png",
    title: "Mở rộng vòm tán",
    age: "Năm 5 - 7",
    branchY: [10, 45],
    branchScale: 0.94,
  },
  {
    stage: 8,
    min: 651,
    max: 900,
    rangeLabel: "651 - 900",
    img: "/assets/stage_8.png",
    title: "Định hình bóng mát",
    age: "Năm 7 - 10",
    branchY: [10, 46],
    branchScale: 1.0,
  },
  {
    stage: 9,
    min: 901,
    max: 1800,
    rangeLabel: "901 - 1800",
    img: "/assets/stage_9.png",
    title: "Phượng vĩ rực rỡ",
    age: "Năm 10 - 20",
    branchY: [11, 48],
    branchScale: 1.06,
  },
  {
    stage: 10,
    min: 1801,
    max: Infinity,
    rangeLabel: "1800+",
    img: "/assets/stage_10.png",
    title: "Cổ thụ trầm mặc",
    age: "Trên 20 năm",
    branchY: [12, 48],
    branchScale: 1.12,
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

  const microScale = Number((1.0 + progress * 0.12).toFixed(4));
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

