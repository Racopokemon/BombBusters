import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { WebSocketServer, WebSocket } from "ws";
import { BOARD, createInitialPieces } from "./pieces.js";

const rootDir = resolve(".");
const publicDir = join(rootDir, "public");
const indexHtmlPath = join(publicDir, "index.html");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

function clonePiece(piece) {
  return {
    ...piece,
    front: { ...piece.front },
    back: { ...piece.back },
  };
}

function clonePieces(pieces) {
  return pieces.map(clonePiece);
}

function shuffleInPlace(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

function snapshotPlayers(players) {
  return Array.from(players.values()).map((player) => ({
    id: player.id,
    name: player.name,
    color: player.color,
    cursor: player.cursor,
  }));
}

function colorForIndex(index) {
  const palette = [
    "#ff6b6b",
    "#4dabf7",
    "#51cf66",
    "#ffd43b",
    "#b197fc",
    "#ff922b",
    "#f783ac",
    "#63e6be",
  ];
  return palette[index % palette.length];
}

const state = {
  pieces: new Map(createInitialPieces().map((piece) => [piece.id, piece])),
  players: new Map(),
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = join(publicDir, requestedPath);

  if (!filePath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(content);
  } catch {
    if (requestedPath === "/index.html") {
      const content = await readFile(indexHtmlPath);
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(content);
      return;
    }

    response.writeHead(404);
    response.end("Not found");
  }
});

const wss = new WebSocketServer({ server, path: "/ws" });

function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function broadcast(payload) {
  const message = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function sendState() {
  broadcast({
    type: "state",
    pieces: clonePieces(Array.from(state.pieces.values())),
    players: snapshotPlayers(state.players),
  });
}

function clampPiece(piece) {
  piece.x = Math.max(0, Math.min(BOARD.width - piece.width, piece.x));
  piece.y = Math.max(0, Math.min(BOARD.height - piece.height, piece.y));
}

function getNormalCablePieces() {
  return Array.from(state.pieces.values()).filter((piece) => piece.group === "Kabel" && piece.name === "cable");
}

function shuffleNormalCables() {
  const normalCables = getNormalCablePieces();
  const shuffled = normalCables.map(clonePiece);
  shuffleInPlace(shuffled);

  normalCables.forEach((piece, index) => {
    const source = shuffled[index];
    piece.label = source.label;
    piece.front = { ...source.front };
    piece.back = { ...source.back };
    piece.faceUpByDefault = source.faceUpByDefault;
  });
}

function coverNormalCables() {
  for (const piece of getNormalCablePieces()) {
    piece.faceUpByDefault = false;
  }
}

wss.on("connection", (socket) => {
  const playerId = randomUUID();
  const color = colorForIndex(state.players.size + Math.floor(Math.random() * 1000));
  let player = {
    id: playerId,
    name: "",
    color,
    cursor: {
      x: BOARD.width / 2,
      y: BOARD.height / 2,
      active: false,
    },
  };

  socket.on("message", (rawMessage) => {
    let message;
    try {
      message = JSON.parse(rawMessage.toString());
    } catch {
      return;
    }

    if (message.type === "join") {
      player = {
        ...player,
        name: String(message.name ?? "").trim().slice(0, 40) || "Spieler",
      };
      state.players.set(playerId, player);
      send(socket, {
        type: "welcome",
        selfId: playerId,
        board: BOARD,
        pieces: clonePieces(Array.from(state.pieces.values())),
        players: snapshotPlayers(state.players),
      });
      sendState();
      return;
    }

    if (!state.players.has(playerId)) {
      return;
    }

    if (message.type === "cursor") {
      const current = state.players.get(playerId);
      if (!current) {
        return;
      }

      current.cursor = {
        x: Number.isFinite(message.x) ? Math.max(0, Math.min(BOARD.width, message.x)) : current.cursor.x,
        y: Number.isFinite(message.y) ? Math.max(0, Math.min(BOARD.height, message.y)) : current.cursor.y,
        active: Boolean(message.active),
      };

      broadcast({
        type: "cursor",
        playerId,
        cursor: current.cursor,
      });
      return;
    }

    if (message.type === "move-piece") {
      const piece = state.pieces.get(message.id);
      if (!piece) {
        return;
      }

      piece.x = Number.isFinite(message.x) ? message.x : piece.x;
      piece.y = Number.isFinite(message.y) ? message.y : piece.y;
      clampPiece(piece);
      sendState();
      return;
    }

    if (message.type === "toggle-face") {
      const piece = state.pieces.get(message.id);
      if (!piece) {
        return;
      }

      piece.faceUpByDefault = !piece.faceUpByDefault;
      sendState();
      return;
    }

    if (message.type === "shuffle-wires") {
      shuffleNormalCables();
      sendState();
      return;
    }

    if (message.type === "cover-wires") {
      coverNormalCables();
      sendState();
    }
  });

  socket.on("close", () => {
    state.players.delete(playerId);
    sendState();
  });

  socket.send(
    JSON.stringify({
      type: "hello",
      playerId,
    }),
  );
});

const port = Number(process.env.PORT) || 3000;

server.listen(port, "0.0.0.0", () => {
  console.log(`Bomb Busters prototype running on http://0.0.0.0:${port}`);
});
