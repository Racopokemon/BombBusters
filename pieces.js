export const BOARD = {
  width: 1600,
  height: 800,
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function expandLabels(definition) {
  if (definition.labels) {
    return definition.labels;
  }

  const labels = [];
  for (let value = definition.from; value <= definition.to; value += definition.step ?? 1) {
    labels.push(definition.labelFormatter ? definition.labelFormatter(value) : value);
  }
  return labels;
}

function buildPiece(definition, label, index) {
  const normalizedLabel = String(label).replace(/\./g, "p");
  return {
    id: `${slugify(definition.group)}-${slugify(definition.name)}-${slugify(normalizedLabel)}-${index + 1}`,
    group: definition.group,
    name: definition.name,
    label: String(label),
    kind: definition.kind ?? "rect",
    width: definition.width,
    height: definition.height,
    x: 0,
    y: 0,
    zIndex: definition.zIndex ?? 1,
    front: {
      fill: definition.frontFill,
      text: definition.frontText ?? String(label),
      textColor: definition.frontTextColor,
      fontSize: definition.fontSize,
      fontFamily: definition.fontFamily,
      radius: definition.radius,
      borderColor: definition.borderColor,
      borderWidth: definition.borderWidth,
      imageUrl: definition.frontImageUrl,
    },
    back: {
      fill: definition.backFill ?? definition.frontFill,
      text: definition.backText !== undefined ? definition.backText : definition.backTextUsesLabel ? String(label) : "",
      textColor: definition.backTextColor ?? definition.frontTextColor,
      fontSize: definition.fontSize,
      fontFamily: definition.fontFamily,
      radius: definition.backRadius ?? definition.radius,
      borderColor: definition.backBorderColor ?? definition.borderColor,
      borderWidth: definition.backBorderWidth ?? definition.borderWidth,
      imageUrl: definition.backImageUrl,
    },
    faceUpByDefault: definition.faceUpByDefault ?? true,
  };
}

function createPiecesFromDefinition(definition) {
  const labels = expandLabels(definition);
  return labels.flatMap((label) => {
    const count = definition.count ?? 1;
    return Array.from({ length: count }, (_, index) => buildPiece(definition, label, index));
  });
}

function layoutGrid(pieces, options) {
  const columns = options.columns ?? 8;
  const gapX = options.gapX ?? 10;
  const gapY = options.gapY ?? 10;
  const startX = options.startX ?? 20;
  const startY = options.startY ?? 20;

  pieces.forEach((piece, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    piece.x = startX + column * (piece.width + gapX);
    piece.y = startY + row * (piece.height + gapY);
  });
}

const playerNames = ["Birte", "Tobi", "Robin", "Jonas", "Ramin"];
const ItemNames = [
  "1\n\n!= Label",
  "2\n\nWalkie-\nTalkies",
  "3\n\n3x\nDetektor",
  "4\n\nPost it",
  "5\n\nSuper-\nDetektor",
  "6\n\n+1 Leben",
  "7\n\nNotfall-\nAkkus",
  "8\n\nRadar\n",
  "9\n\nStabili-\nsator",
  "10\n\nDoppel-\nStrahl",
  "11\n\nThermo",
  "12\n\n= Label",
  "Gelb\n\n+2 Equip\nKarten"
];

const sections = [
  {
    startX: 30,
    startY: 30,
    columns: 10,
    gapX: 8,
    gapY: 8,
    pieces: createPiecesFromDefinition({
      group: "Kabel",
      name: "cable",
      labels: Array.from({ length: 12 }, (_, index) => index + 1),
      count: 4,
      width: 30,
      height: 85,
      frontFill: "#2d6cdf",
      frontTextColor: "#ffffff",
      fontSize: 14,
      fontFamily: '"Trebuchet MS", sans-serif',
      radius: 6,
    }),
  },
  {
    startX: 380,
    startY: 30,
    columns: 10,
    gapX: 8,
    gapY: 8,
    pieces: [
      ...createPiecesFromDefinition({
        group: "Kabel-Gelb",
        name: "cable-half-yellow",
        labels: Array.from({ length: 11 }, (_, index) => `${index + 1}.1`),
        width: 30,
        height: 85,
        frontFill: "#c18308",
        backFill: "#2d6cdf",
        frontTextColor: "#ffd84f",
        fontSize: 12,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 6,
        faceUpByDefault: true,
      }),
      ...createPiecesFromDefinition({
        group: "Kabel-Rot",
        name: "cable-half-red",
        labels: Array.from({ length: 11 }, (_, index) => `${index + 1}.5`),
        width: 30,
        height: 85,
        frontFill: "#7d1d1d",
        backFill: "#2d6cdf",
        frontTextColor: "#ff4b4b",
        fontSize: 12,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 6,
        faceUpByDefault: true,
      }),
    ],
  },
  {
    startX: 720,
    startY: 30,
    columns: 12,
    gapX: 6,
    gapY: 6,
    pieces: [
      ...createPiecesFromDefinition({
        group: "Marker",
        name: "marker-number",
        labels: Array.from({ length: 12 }, (_, index) => index + 1),
        count: 2,
        width: 30,
        height: 30,
        frontFill: "#2d6cdf",
        frontTextColor: "#ffffff",
        fontSize: 10,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 4,
      }),
      ...createPiecesFromDefinition({
        group: "Marker-gelb",
        name: "marker-y",
        labels: [""],
        count: 2,
        width: 30,
        height: 30,
        frontFill: "#c18308",
        backFill: "#2d6cdf",
        frontTextColor: "#ffd84f",
        fontSize: 10,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 4,
      }),
      ...createPiecesFromDefinition({
        group: "Marker-rot",
        name: "marker-r",
        labels: [""],
        count: 2,
        width: 30,
        height: 30,
        frontFill: "#7d1d1d",
        backFill: "#2d6cdf",
        frontTextColor: "#ff4b4b",
        fontSize: 10,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 4,
      }),
    ],
  },
  {
    startX: 980,
    startY: 30,
    columns: 8,
    gapX: 8,
    gapY: 8,
    pieces: [
      ...createPiecesFromDefinition({
        group: "Marker",
        name: "yellow-circle-question",
        labels: Array.from({ length: 4 }, (_, index) => index + 1),
        width: 24,
        height: 24,
        frontFill: "#f5d94b",
        frontText: "?",
        frontTextColor: " #c18308",
        fontSize: 10,
        radius: 999,
      }),
      ...createPiecesFromDefinition({
        group: "Marker",
        name: "red-pill-question",
        labels: Array.from({ length: 4 }, (_, index) => index + 1),
        width: 24,
        height: 24,
        frontFill: "#d44a4a",
        frontText: "?",
        frontTextColor: "#111111",
        fontSize: 10,
        radius: 6,
      }),
    ],
  },
  {
    startX: 1400,
    startY: 800,
    columns: 3,
    gapX: 6,
    gapY: 6,
    pieces: [
      ...createPiecesFromDefinition({
        group: "Leben",
        name: "lives",
        labels: Array.from({ length: 6 }, (_, index) => index + 1),
        width: 32,
        height: 32,
        frontFill: "#41de82",
        frontBorderColor: "#b6c52b",
        frontBorderWidth: 2,
        frontText: "",
        backFill: "#701d44",
        backBorderColor: "#540c37",
        backBorderWidth: 2,
        radius: 2,
      }),
    ],
  },
  {
    startX: 30,
    startY: 520,
    columns: 5,
    gapX: 12,
    gapY: 10,
    pieces: [
      ...createPiecesFromDefinition({
        group: "Spielernamen",
        name: "player-label",
        labels: playerNames,
        width: 70,
        height: 20,
        frontFill: "#ffffff",
        frontTextColor: "#8a8a8a",
        fontSize: 12,
        fontFamily: '"Courier New", monospace',
        radius: 4,
      }),
      ...createPiecesFromDefinition({
        group: "Zahlenfelder",
        name: "bold-number",
        labels: Array.from({ length: 12 }, (_, index) => index + 1),
        width: 44,
        height: 44,
        frontFill: "rgba(255, 255, 255, 0.84)",
        backFill: "rgba(123, 252, 59, 0.84)",
        backBorderColor: "rgba(106, 188, 67, 0.96)",
        backBorderWidth: 4,
        backTextUsesLabel: true,
        frontTextColor: "#111111",
        backTextColor: "#111111",
        fontSize: 30,
        fontFamily: '"Courier New", monospace',
        radius: 30,
      }),
    ],
  },
  {
    startX: 380,
    startY: 520,
    columns: 4,
    gapX: 12,
    gapY: 12,
    pieces: createPiecesFromDefinition({
      group: "Itemkarten",
      name: "item-card",
      labels: ItemNames,
      width: 68,
      height: 100,
      frontFill: "#f08a24",
      frontTextColor: "#ffffff",
      fontSize: 15,
      fontFamily: '"Trebuchet MS", sans-serif',
      radius: 10,
    }),
  },
  {
    startX: 830,
    startY: 520,
    columns: 5,
    gapX: 12,
    gapY: 12,
    pieces: [
      ...createPiecesFromDefinition({
        group: "Doppeldetektor",
        name: "double-detector",
        labels: ["Doppel\nDetektor"],
        count: 4,
        width: 68,
        height: 100,
        frontFill: "#f08a24",
        frontTextColor: "#ffffff",
        fontSize: 14,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 10,
      }),
      ...createPiecesFromDefinition({
        group: "Doppeldetektor",
        name: "double-detector-chef",
        labels: ["Doppel\nDetektor\n\n(Chef)"],
        width: 68,
        height: 100,
        frontFill: "#f08a24",
        frontTextColor: "#ffffff",
        fontSize: 14,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 10,
      }),
    ],
  },
  {
    startX: 1300,
    startY: 50,
    columns: 6,
    gapX: -4,
    gapY: 3,
    pieces: createPiecesFromDefinition({
      group: "Zahlenkarten",
      name: "number-card",
      labels: Array.from({ length: 12 }, (_, index) => index + 1),
      width: 45,
      height: 70,
      frontFill: "#24b3f0",
      frontTextColor: "#ffffff",
      fontSize: 22,
      fontFamily: '"Trebuchet MS", sans-serif',
      radius: 8,
    }),
  },
];

for (const section of sections) {
  layoutGrid(section.pieces, section);
}

export function createInitialPieces() {
  return sections.flatMap((section) =>
    section.pieces.map((piece) => ({
      ...piece,
      front: { ...piece.front },
      back: { ...piece.back },
    })),
  );
}
