import type { DancerTraits } from "../domain/traits.js";

export interface JoinRoomMessage {
  type: "join_room";
  roomCode: string;
  playerName?: string;
  rejoinToken?: string;
}

export interface HostJoinMessage {
  type: "host_join";
  roomCode?: string;
}

export interface SubmitTraitsMessage {
  type: "submit_traits";
  traits: DancerTraits;
  name: string;
}

export interface HostStartGameMessage {
  type: "host_start_game";
  maxRounds?: number;
}

export interface HostAdvanceMessage {
  type: "host_advance";
}

/** Sent by the room's leader (first player to join, see PublicPlayerSummary.isLeader)
 * over their own player connection — the TV has no clickable controls, so game
 * control lives on the leader's phone instead of (or in addition to) the host's. */
export interface PlayerStartGameMessage {
  type: "player_start_game";
  maxRounds?: number;
}

export interface PlayerAdvanceMessage {
  type: "player_advance";
}

/** Leader-only — abandons the current game and returns the room to LOBBY so
 * everyone lands back on the "add players" screen. Players/traits/leader are kept
 * (no need to rejoin or redraw a character), only scores and round history reset. */
export interface PlayerResetGameMessage {
  type: "player_reset_game";
}

export interface SubmitVoteMessage {
  type: "submit_vote";
  roundId: string;
  votedForPlayerId: string;
}

export interface LeaveRoomMessage {
  type: "leave_room";
}

/** Reply to the server's `heartbeat` — see that message's doc comment. */
export interface HeartbeatAckMessage {
  type: "heartbeat_ack";
}

/** Sent only over a player connection. */
export type PlayerClientMessage =
  | JoinRoomMessage
  | SubmitTraitsMessage
  | SubmitVoteMessage
  | PlayerStartGameMessage
  | PlayerAdvanceMessage
  | PlayerResetGameMessage
  | LeaveRoomMessage
  | HeartbeatAckMessage;

/** Sent only over a host connection. */
export type HostClientMessage =
  | HostJoinMessage
  | HostStartGameMessage
  | HostAdvanceMessage
  | LeaveRoomMessage
  | HeartbeatAckMessage;

export type ClientMessage = PlayerClientMessage | HostClientMessage;
