import { BASE_PRICE, EQUAL_BID_AMOUNT, SQUAD_TARGET } from "./constants";
import { minNextBid, teamsWithEqualBid, validateBid } from "./rules";
import { newBidId, newPlayerId } from "./seed";
import type { AuctionState, Player, PlayerHand, PlayingRole, SkillLevel } from "./types";

function availableQueue(state: AuctionState): Player[] {
  return state.players.filter((p) => !p.isCaptain && p.status === "AVAILABLE");
}

function livePlayer(state: AuctionState): Player | undefined {
  return state.players.find((p) => p.id === state.auction.currentPlayerId);
}

function clearLot(state: AuctionState) {
  state.auction.currentPlayerId = null;
  state.auction.currentBid = null;
  state.auction.currentBidTeamId = null;
  state.auction.draw = null;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sellToTeam(
  state: AuctionState,
  player: Player,
  teamId: string,
  price: number
): AuctionState | string {
  const team = state.teams.find((t) => t.id === teamId);
  if (!team) return "Winning team not found";
  if (team.purseRemaining < price) return "Winning team cannot afford bid";
  if (team.squadCount >= SQUAD_TARGET) return "Team squad is full";

  team.purseRemaining -= price;
  team.squadCount += 1;
  player.status = "SOLD";
  player.teamId = team.id;
  player.soldPrice = price;

  state.auction.status = "SOLD";
  clearLot(state);

  const remaining = availableQueue(state);
  if (remaining.length === 0) {
    const allDone = state.players
      .filter((p) => !p.isCaptain)
      .every((p) => p.status === "SOLD" || p.status === "UNSOLD");
    if (allDone) state.auction.status = "ENDED";
  }

  return state;
}

export function startAuction(state: AuctionState): AuctionState | string {
  if (state.auction.status !== "SETUP" && state.auction.status !== "READY") {
    return "Auction already started";
  }
  state.auction.status = "READY";
  state.auction.draw = null;
  return state;
}

export function putPlayerUp(
  state: AuctionState,
  playerId?: string
): AuctionState | string {
  if (
    state.auction.status !== "READY" &&
    state.auction.status !== "SOLD" &&
    state.auction.status !== "UNSOLD" &&
    state.auction.status !== "PLAYER_UP"
  ) {
    if (state.auction.status === "BIDDING") {
      return "Finish current lot first";
    }
    if (state.auction.status === "DRAW") {
      return "Finish the ₹500 draw first";
    }
    if (state.auction.status === "ENDED") return "Auction ended";
    if (state.auction.status === "SETUP") return "Start auction first";
  }

  const current = livePlayer(state);
  if (current && current.status === "LIVE") {
    return "A player is already live";
  }

  let player: Player | undefined;
  if (playerId) {
    player = state.players.find((p) => p.id === playerId);
    if (!player || player.isCaptain) return "Invalid player";
    if (player.status !== "AVAILABLE" && player.status !== "UNSOLD") {
      return "Player not available";
    }
  } else {
    player = availableQueue(state)[0];
  }

  if (!player) {
    state.auction.status = "ENDED";
    clearLot(state);
    return state;
  }

  for (const p of state.players) {
    if (p.id === player!.id) {
      p.status = "LIVE";
    }
  }

  state.auction.currentPlayerId = player.id;
  state.auction.currentBid = null;
  state.auction.currentBidTeamId = null;
  state.auction.draw = null;
  state.auction.status = "PLAYER_UP";
  return state;
}

export function placeBid(
  state: AuctionState,
  teamId: string,
  amount: number
): AuctionState | string {
  if (state.auction.status === "DRAW") {
    return "Draw in progress — waiting for scratch card";
  }
  if (state.auction.status === "PLAYER_UP") {
    state.auction.status = "BIDDING";
  }

  const err = validateBid(state, teamId, amount);
  if (err) return err;

  const bid = {
    id: newBidId(),
    auctionId: state.auction.id,
    playerId: state.auction.currentPlayerId!,
    teamId,
    amount,
    createdAt: new Date().toISOString(),
  };

  state.bids.push(bid);
  state.auction.currentBid = amount;
  state.auction.currentBidTeamId = teamId;
  state.auction.status = "BIDDING";
  return state;
}

export function placeQuickBid(
  state: AuctionState,
  teamId: string
): AuctionState | string {
  const amount = minNextBid(state);
  return placeBid(state, teamId, amount);
}

export function markSold(state: AuctionState): AuctionState | string {
  if (state.auction.status === "DRAW") {
    return "Complete the scratch draw first";
  }
  if (state.auction.status !== "BIDDING" && state.auction.status !== "PLAYER_UP") {
    return "No live lot to sell";
  }

  const player = livePlayer(state);
  if (!player) return "No live player";

  if (state.auction.currentBid == null || !state.auction.currentBidTeamId) {
    return "No bids — mark unsold instead";
  }

  if (state.auction.currentBid === EQUAL_BID_AMOUNT) {
    const contenders = teamsWithEqualBid(
      state,
      player.id,
      EQUAL_BID_AMOUNT
    );
    if (contenders.length > 1) {
      state.auction.status = "DRAW";
      state.auction.draw = {
        playerId: player.id,
        contenderTeamIds: contenders,
        cardOrder: shuffle(contenders),
        pickerTeamId: null,
        revealedIndex: null,
        winnerTeamId: null,
      };
      return state;
    }
  }

  return sellToTeam(
    state,
    player,
    state.auction.currentBidTeamId,
    state.auction.currentBid
  );
}

export function assignDrawPicker(
  state: AuctionState,
  pickerTeamId: string
): AuctionState | string {
  if (state.auction.status !== "DRAW" || !state.auction.draw) {
    return "No draw in progress";
  }
  if (state.auction.draw.revealedIndex != null) {
    return "Draw already revealed";
  }
  if (state.auction.draw.contenderTeamIds.includes(pickerTeamId)) {
    return "Picker must be a team that did not bid ₹500";
  }
  const team = state.teams.find((t) => t.id === pickerTeamId);
  if (!team) return "Team not found";

  state.auction.draw.pickerTeamId = pickerTeamId;
  return state;
}

export function revealDrawCard(
  state: AuctionState,
  cardIndex: number,
  actorTeamId?: string | null,
  asAdmin = false
): AuctionState | string {
  if (state.auction.status !== "DRAW" || !state.auction.draw) {
    return "No draw in progress";
  }
  const draw = state.auction.draw;
  if (!draw.pickerTeamId) return "Admin must assign a picker team first";
  if (draw.revealedIndex != null) return "Card already revealed";

  if (!asAdmin && actorTeamId !== draw.pickerTeamId) {
    return "Only the assigned picker team can scratch";
  }

  if (cardIndex < 0 || cardIndex >= draw.cardOrder.length) {
    return "Invalid card";
  }

  const winnerTeamId = draw.cardOrder[cardIndex];
  draw.revealedIndex = cardIndex;
  draw.winnerTeamId = winnerTeamId;

  const player = state.players.find((p) => p.id === draw.playerId);
  if (!player || player.status !== "LIVE") return "Player not live";

  return sellToTeam(state, player, winnerTeamId, EQUAL_BID_AMOUNT);
}

export function markUnsold(state: AuctionState): AuctionState | string {
  if (
    state.auction.status !== "BIDDING" &&
    state.auction.status !== "PLAYER_UP" &&
    state.auction.status !== "DRAW"
  ) {
    return "No live lot";
  }

  const player =
    livePlayer(state) ??
    state.players.find((p) => p.id === state.auction.draw?.playerId);
  if (!player) return "No live player";

  player.status = "UNSOLD";
  player.teamId = null;
  player.soldPrice = null;

  state.auction.status = "UNSOLD";
  clearLot(state);
  return state;
}

export function pauseAuction(state: AuctionState): AuctionState | string {
  if (state.auction.status !== "BIDDING" && state.auction.status !== "PLAYER_UP") {
    return "Nothing to pause";
  }
  state.auction.status = "PAUSED";
  return state;
}

export function resumeAuction(state: AuctionState): AuctionState | string {
  if (state.auction.status !== "PAUSED") return "Auction is not paused";
  state.auction.status =
    state.auction.currentBid != null ? "BIDDING" : "PLAYER_UP";
  return state;
}

export function endAuction(state: AuctionState): AuctionState | string {
  state.auction.status = "ENDED";
  clearLot(state);
  return state;
}

export function updatePlayerProfile(
  state: AuctionState,
  playerId: string,
  patch: {
    name?: string;
    playingRole?: PlayingRole | null;
    skillLevel?: SkillLevel | null;
    hand?: PlayerHand | null;
    basePrice?: number;
  }
): AuctionState | string {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return "Player not found";
  if (patch.name !== undefined) {
    const name = patch.name.trim();
    if (!name) return "Name required";
    player.name = name;
  }
  if (patch.playingRole !== undefined) {
    player.playingRole = patch.playingRole;
  }
  if (patch.skillLevel !== undefined) {
    player.skillLevel = patch.skillLevel;
  }
  if (patch.hand !== undefined) {
    player.hand = patch.hand;
  }
  if (patch.basePrice !== undefined) {
    if (patch.basePrice < BASE_PRICE) return `Base price min ₹${BASE_PRICE}`;
    player.basePrice = patch.basePrice;
  }
  return state;
}

export function addPlayer(
  state: AuctionState,
  input: {
    name: string;
    playingRole?: PlayingRole | null;
    skillLevel?: SkillLevel | null;
    hand?: PlayerHand | null;
    basePrice?: number;
  }
): AuctionState | string {
  const name = input.name.trim();
  if (!name) return "Name required";
  if (state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return "Player name already exists";
  }

  const player: Player = {
    id: newPlayerId(),
    name,
    basePrice: input.basePrice ?? BASE_PRICE,
    status: "AVAILABLE",
    teamId: null,
    soldPrice: null,
    isCaptain: false,
    playingRole: input.playingRole ?? "BAT",
    skillLevel: input.skillLevel ?? "INTERMEDIATE",
    hand: input.hand ?? "RIGHT",
  };

  if (player.basePrice < BASE_PRICE) return `Base price min ₹${BASE_PRICE}`;

  state.players.push(player);
  return state;
}

export function assignCaptain(
  state: AuctionState,
  playerId: string,
  teamId: string
): AuctionState | string {
  const team = state.teams.find((t) => t.id === teamId);
  if (!team) return "Team not found";

  const player = state.players.find((p) => p.id === playerId);
  if (!player) return "Player not found";
  if (player.isCaptain && player.teamId === teamId) {
    return "Already captain of this team";
  }
  if (player.status === "LIVE") return "Finish the live lot first";
  if (state.auction.draw?.playerId === playerId) {
    return "Player is in a draw";
  }
  if (player.teamId && player.teamId !== teamId && !player.isCaptain) {
    return "Player already sold to another team";
  }

  const previous = state.players.find(
    (p) => p.isCaptain && p.teamId === teamId && p.id !== playerId
  );

  const wasOnThisTeam = player.teamId === teamId;
  const joiningFromPool =
    !player.teamId ||
    player.status === "AVAILABLE" ||
    player.status === "UNSOLD";

  if (joiningFromPool && !previous && !wasOnThisTeam && team.squadCount >= SQUAD_TARGET) {
    return "Team squad is full";
  }

  if (previous) {
    previous.isCaptain = false;
    previous.status = "AVAILABLE";
    previous.teamId = null;
    previous.soldPrice = null;
  }

  if (player.isCaptain && player.teamId && player.teamId !== teamId) {
    const oldTeam = state.teams.find((t) => t.id === player.teamId);
    if (oldTeam) {
      oldTeam.captainName = "TBD";
      if (oldTeam.squadCount > 0) oldTeam.squadCount -= 1;
    }
  }

  if (joiningFromPool && !wasOnThisTeam) {
    if (!previous) team.squadCount += 1;
  }

  player.isCaptain = true;
  player.teamId = teamId;
  player.status = "SOLD";
  player.soldPrice = 0;
  team.captainName = player.name;

  const captainUser = state.users.find(
    (u) => u.role === "CAPTAIN" && u.teamId === teamId
  );
  if (captainUser) {
    captainUser.displayName = player.name;
  }

  return state;
}
