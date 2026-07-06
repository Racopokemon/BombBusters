export const BOARD = {
  width: 1600,
  height: 1000,
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
      text: definition.backText ?? "",
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
      width: 20,
      height: 80,
      frontFill: "#2d6cdf",
      frontTextColor: "#ffffff",
      fontSize: 10,
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
        group: "Kabel",
        name: "cable-half-yellow",
        labels: Array.from({ length: 11 }, (_, index) => `${index + 1}.1`),
        width: 20,
        height: 80,
        frontFill: "#2d6cdf",
        backFill: "#111111",
        frontTextColor: "#ffd84f",
        fontSize: 10,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 6,
        faceUpByDefault: false,
      }),
      ...createPiecesFromDefinition({
        group: "Kabel",
        name: "cable-half-red",
        labels: Array.from({ length: 11 }, (_, index) => `${index + 1}.5`),
        width: 20,
        height: 80,
        frontFill: "#2d6cdf",
        backFill: "#7d1d1d",
        frontTextColor: "#ff4b4b",
        fontSize: 10,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 6,
        faceUpByDefault: false,
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
        width: 20,
        height: 20,
        frontFill: "#2d6cdf",
        frontTextColor: "#ffffff",
        fontSize: 8,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 4,
      }),
      ...createPiecesFromDefinition({
        group: "Marker",
        name: "marker-y",
        labels: ["Y"],
        count: 2,
        width: 20,
        height: 20,
        frontFill: "#2d6cdf",
        backFill: "#111111",
        frontTextColor: "#ffd84f",
        fontSize: 8,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 4,
        faceUpByDefault: false,
      }),
      ...createPiecesFromDefinition({
        group: "Marker",
        name: "marker-r",
        labels: ["R"],
        count: 2,
        width: 20,
        height: 20,
        frontFill: "#2d6cdf",
        backFill: "#7d1d1d",
        frontTextColor: "#ff4b4b",
        fontSize: 8,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 4,
        faceUpByDefault: false,
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
        name: "green-circle",
        labels: Array.from({ length: 12 }, (_, index) => index + 1),
        width: 25,
        height: 25,
        frontFill: "rgba(167, 231, 151, 0.72)",
        frontText: "",
        frontTextColor: "#1b5e20",
        borderColor: "#1b5e20",
        borderWidth: 2,
        fontSize: 8,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 999,
      }),
      ...createPiecesFromDefinition({
        group: "Marker",
        name: "yellow-circle",
        labels: Array.from({ length: 2 }, (_, index) => index + 1),
        width: 15,
        height: 15,
        frontFill: "#f5d94b",
        frontText: "",
        radius: 999,
      }),
      ...createPiecesFromDefinition({
        group: "Marker",
        name: "yellow-circle-question",
        labels: Array.from({ length: 4 }, (_, index) => index + 1),
        width: 15,
        height: 15,
        frontFill: "#f5d94b",
        frontText: "?",
        frontTextColor: "#111111",
        fontSize: 8,
        radius: 999,
      }),
      ...createPiecesFromDefinition({
        group: "Marker",
        name: "red-pill",
        labels: Array.from({ length: 2 }, (_, index) => index + 1),
        width: 15,
        height: 15,
        frontFill: "#d44a4a",
        frontText: "",
        radius: 6,
      }),
      ...createPiecesFromDefinition({
        group: "Marker",
        name: "red-pill-question",
        labels: Array.from({ length: 4 }, (_, index) => index + 1),
        width: 15,
        height: 15,
        frontFill: "#d44a4a",
        frontText: "?",
        frontTextColor: "#111111",
        fontSize: 8,
        radius: 6,
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
        labels: Array.from({ length: 5 }, (_, index) => `Spieler${index + 1}`),
        width: 70,
        height: 20,
        frontFill: "#ffffff",
        frontTextColor: "#8a8a8a",
        fontSize: 12,
        fontFamily: '"Courier New", monospace',
        radius: 4,
      }),
      ...createPiecesFromDefinition({
        group: "Spielernamen",
        name: "bold-number",
        labels: Array.from({ length: 12 }, (_, index) => index + 1),
        width: 40,
        height: 40,
        frontFill: "rgba(255, 255, 255, 0)",
        frontTextColor: "#111111",
        fontSize: 25,
        fontFamily: '"Trebuchet MS", sans-serif',
        radius: 4,
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
      labels: Array.from({ length: 12 }, (_, index) => index + 1),
      width: 60,
      height: 90,
      frontFill: "#f08a24",
      frontTextColor: "#ffffff",
      fontSize: 20,
      fontFamily: '"Trebuchet MS", sans-serif',
      radius: 10,
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
