const board = document.getElementById("board");
const joinOverlay = document.getElementById("joinOverlay");
const joinForm = document.getElementById("joinForm");
const nameInput = document.getElementById("nameInput");

//must also be changed in pieces.js
const BOARD = {
  width: 1600,
  height: 800,
};

const state = {
  selfId: null,
  pieces: new Map(),
  holders: new Map(),
  players: new Map(),
  privateReveals: new Set(),
  hoveredPieceId: null,
  drag: null,
  socket: null,
  cursorThrottle: 0,
  dragSyncThrottle: 0,
  elements: {
    holders: new Map(),
    pieces: new Map(),
    cursors: new Map(),
  },
};

function boardPointFromEvent(event) {
  const rect = board.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * BOARD.width,
    y: ((event.clientY - rect.top) / rect.height) * BOARD.height,
  };
}

function percentX(value) {
  return `${(value / BOARD.width) * 100}%`;
}

function percentY(value) {
  return `${(value / BOARD.height) * 100}%`;
}

function send(message) {
  if (state.socket && state.socket.readyState === WebSocket.OPEN) {
    state.socket.send(JSON.stringify(message));
  }
}

function isPieceVisibleForMe(piece) {
  return piece.faceUpByDefault || state.privateReveals.has(piece.id);
}

function createPieceElement(piece) {
  const element = document.createElement("div");
  element.className = "piece";
  element.innerHTML = '<img class="piece-image" alt="" /><div class="piece-text"></div>';
  element.dataset.pieceId = piece.id;
  element.addEventListener("pointerdown", onPiecePointerDown);
  element.addEventListener("pointerenter", onPiecePointerEnter);
  element.addEventListener("pointerleave", onPiecePointerLeave);
  element.addEventListener("contextmenu", onPieceContextMenu);
  state.elements.pieces.set(piece.id, element);
  board.appendChild(element);
  return element;
}

function createHolderElement(holder) {
  const element = document.createElement("div");
  element.className = "holder";
  element.innerHTML = '<div class="holder-label"></div>';
  element.dataset.holderId = holder.id;
  state.elements.holders.set(holder.id, element);
  board.appendChild(element);
  return element;
}

function renderHolder(holder) {
  const element = state.elements.holders.get(holder.id) ?? createHolderElement(holder);
  element.style.left = percentX(holder.x);
  element.style.top = percentY(holder.y);
  element.style.width = percentX(holder.width);
  element.style.height = percentY(holder.height);
  element.querySelector(".holder-label").textContent = holder.label ?? "";
}

function renderHolders() {
  const existingIds = new Set(state.holders.keys());

  for (const [holderId, element] of state.elements.holders.entries()) {
    if (!existingIds.has(holderId)) {
      element.remove();
      state.elements.holders.delete(holderId);
    }
  }

  for (const holder of state.holders.values()) {
    renderHolder(holder);
  }
}

function renderPiece(piece) {
  if (piece.faceUpByDefault && state.privateReveals.has(piece.id)) {
    state.privateReveals.delete(piece.id);
  }
  const element = state.elements.pieces.get(piece.id) ?? createPieceElement(piece);
  const visible = isPieceVisibleForMe(piece);
  const activeX = state.drag?.pieceId === piece.id ? state.drag.x : piece.x;
  const activeY = state.drag?.pieceId === piece.id ? state.drag.y : piece.y;
  const front = visible ? piece.front : piece.back;

  element.style.left = percentX(activeX);
  element.style.top = percentY(activeY);
  element.style.width = percentX(piece.width);
  element.style.height = percentY(piece.height);
  element.style.zIndex = state.drag?.pieceId === piece.id ? "9999" : String(piece.zIndex ?? 1);
  element.style.borderRadius = `${front.radius ?? 0}px`;
  element.style.background = front.fill ?? "transparent";
  element.style.border = `${front.borderWidth ?? 0}px solid ${front.borderColor ?? "transparent"}`;
  element.style.color = front.textColor ?? "#ffffff";
  element.style.fontSize = `${front.fontSize ?? 14}px`;
  element.style.fontFamily = front.fontFamily ?? '"Trebuchet MS", sans-serif';
  element.classList.toggle("private-reveal", state.privateReveals.has(piece.id));
  element.classList.toggle("round", (front.radius ?? 0) >= 999);

  const textNode = element.querySelector(".piece-text");
  const imageNode = element.querySelector(".piece-image");
  textNode.textContent = front.imageUrl ? "" : front.text ?? piece.label ?? "";
  textNode.style.display = front.imageUrl ? "none" : "block";
  if (front.imageUrl) {
    imageNode.src = front.imageUrl;
    imageNode.style.display = "block";
  } else {
    imageNode.removeAttribute("src");
    imageNode.style.display = "none";
  }
}

function renderPieces() {
  const existingIds = new Set(state.pieces.keys());

  for (const [pieceId, element] of state.elements.pieces.entries()) {
    if (!existingIds.has(pieceId)) {
      element.remove();
      state.elements.pieces.delete(pieceId);
    }
  }

  for (const piece of state.pieces.values()) {
    renderPiece(piece);
  }
}

function createCursorElement(player) {
  const element = document.createElement("div");
  element.className = "cursor";
  element.innerHTML = '<div class="cursor-dot"></div><div class="cursor-label"></div>';
  element.dataset.playerId = player.id;
  state.elements.cursors.set(player.id, element);
  board.appendChild(element);
  return element;
}

function renderCursors() {
  const existingPlayerIds = new Set(state.players.keys());

  for (const [playerId, element] of state.elements.cursors.entries()) {
    if (!existingPlayerIds.has(playerId)) {
      element.remove();
      state.elements.cursors.delete(playerId);
    }
  }

  for (const player of state.players.values()) {
    if (player.id === state.selfId || !player.cursor?.active) {
      const element = state.elements.cursors.get(player.id);
      if (element) {
        element.style.display = "none";
      }
      continue;
    }

    const element = state.elements.cursors.get(player.id) ?? createCursorElement(player);
    element.style.display = "block";
    element.style.left = percentX(player.cursor.x);
    element.style.top = percentY(player.cursor.y);
    element.querySelector(".cursor-dot").style.background = player.color;
    element.querySelector(".cursor-label").textContent = player.name;
  }
}

function renderAll() {
  renderHolders();
  renderPieces();
  renderCursors();
}

function updatePlayers(players) {
  state.players = new Map(players.map((player) => [player.id, player]));
}

function connect(name) {
  const socket = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  state.socket = socket;

  socket.addEventListener("open", () => {
    send({ type: "join", name });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);

    if (message.type === "hello") {
      state.selfId = message.playerId;
      return;
    }

    if (message.type === "welcome") {
      state.selfId = message.selfId;
      BOARD.width = message.board.width;
      BOARD.height = message.board.height;
      state.pieces = new Map(message.pieces.map((piece) => [piece.id, piece]));
      state.holders = new Map((message.holders ?? []).map((holder) => [holder.id, holder]));
      updatePlayers(message.players);
      joinOverlay.style.display = "none";
      renderAll();
      return;
    }
    
    if (message.type === "state") {
      state.pieces = new Map(message.pieces.map((piece) => [piece.id, piece]));
      state.holders = new Map((message.holders ?? []).map((holder) => [holder.id, holder]));
      updatePlayers(message.players);
      renderAll();
      return;
    }

    if (message.type === "piece") {
      const updatedPiece = message.piece;
      const piece = state.pieces.get(updatedPiece.id);
      if (!piece) {
        return;
      }

      Object.assign(piece, updatedPiece);
      renderPiece(piece);
      return;
    }

    if (message.type === "cursor") {
      const player = state.players.get(message.playerId);
      if (player) {
        state.players.set(message.playerId, {
          ...player,
          cursor: message.cursor,
        });
        renderCursors();
      }
    }
  });

  socket.addEventListener("close", () => {
    joinOverlay.style.display = "grid";
  });
}

function onPiecePointerDown(event) {
  const pieceId = event.currentTarget.dataset.pieceId;
  const piece = state.pieces.get(pieceId);
  if (!piece || event.button !== 0) {
    return;
  }

  event.currentTarget.setPointerCapture(event.pointerId);
  const point = boardPointFromEvent(event);
  state.drag = {
    pieceId,
    offsetX: point.x - piece.x,
    offsetY: point.y - piece.y,
    x: piece.x,
    y: piece.y,
  };
  event.currentTarget.classList.add("dragging");
  send({ type: "move-piece", id: piece.id, x: state.drag.x, y: state.drag.y, commit: true });
}

function onPiecePointerEnter(event) {
  state.hoveredPieceId = event.currentTarget.dataset.pieceId;
}

function onPiecePointerLeave(event) {
  if (state.hoveredPieceId === event.currentTarget.dataset.pieceId) {
    state.hoveredPieceId = null;
  }
}

function onPiecePointerMove(event) {
  if (!state.drag) {
    return;
  }

  const piece = state.pieces.get(state.drag.pieceId);
  if (!piece) {
    return;
  }

  const point = boardPointFromEvent(event);
  state.drag.x = Math.max(0, Math.min(BOARD.width - piece.width, point.x - state.drag.offsetX));
  state.drag.y = Math.max(0, Math.min(BOARD.height - piece.height, point.y - state.drag.offsetY));
  renderPiece(piece);

  const now = performance.now();
  if (now - state.dragSyncThrottle >= 35) {
    state.dragSyncThrottle = now;
    send({ type: "move-piece", id: piece.id, x: state.drag.x, y: state.drag.y });
  }
}

function finishDrag() {
  if (!state.drag) {
    return;
  }

  const piece = state.pieces.get(state.drag.pieceId);
  if (piece) {
    send({ type: "move-piece", id: piece.id, x: state.drag.x, y: state.drag.y, drop: true });
  }

  const activeElement = state.elements.pieces.get(state.drag.pieceId);
  if (activeElement) {
    activeElement.classList.remove("dragging");
  }

  state.drag = null;
}

function onPieceContextMenu(event) {
  event.preventDefault();
  //togglePrivateReveal(event.currentTarget.dataset.pieceId);
  send({ type: "toggle-face", id: event.currentTarget.dataset.pieceId });
}

function togglePrivateReveal(pieceId) {
  const piece = state.pieces.get(pieceId);
  if (!piece || piece.faceUpByDefault) {
    return;
  }

  if (state.privateReveals.has(pieceId)) {
    state.privateReveals.delete(pieceId);
  } else {
    state.privateReveals.add(pieceId);
  }

  renderPiece(piece);
}

board.addEventListener("pointermove", (event) => {
  if (state.drag) {
    onPiecePointerMove(event);
  }

  const now = performance.now();
  if (now - state.cursorThrottle < 25) {
    return;
  }

  state.cursorThrottle = now;
  const point = boardPointFromEvent(event);
  send({ type: "cursor", x: point.x, y: point.y, active: true });
});

window.addEventListener("pointerup", () => {
  finishDrag();
});

board.addEventListener("pointerleave", () => {
  send({ type: "cursor", x: 0, y: 0, active: false });
});

window.addEventListener("keydown", (event) => {
  if (event.repeat) {
    return;
  }

  const pieceId = state.hoveredPieceId;
  if (!pieceId) {
    return;
  }

  const piece = state.pieces.get(pieceId);
  if (!piece) {
    return;
  }

  const key = event.key.toLowerCase();
  if (key === "p" || key === " ") { //I added the space bar, please keep it and don't revert it :)
    event.stopPropagation();
    event.preventDefault();
    togglePrivateReveal(pieceId);
    return;
  }
  
  if (key === "s") {
    event.stopPropagation();
    event.preventDefault();
    send({ type: "shuffle-group", group: piece.group });
    return;
  }

  if (key === "v") {
    event.stopPropagation();
    event.preventDefault();
    send({ type: "toggle-group-visibility", group: piece.group, visible: isPieceVisibleForMe(piece) });
    return false;
  }
});

const footerHint = document.createElement("div");
footerHint.className = "board-hint";
footerHint.textContent = "Rechtsklick: auf/verdecken, P: privat aufdecken, S: mischen, V: auf/verdecken (Gruppen)";
document.body.appendChild(footerHint);

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }

  connect(name);
});

nameInput.focus();
