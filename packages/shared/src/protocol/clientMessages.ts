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

export interface SubmitVoteMessage {
  type: "submit_vote";
  roundId: string;
  votedForPlayerId: string;
}

export interface LeaveRoomMessage {
  type: "leave_room";
}

/** Sent only over a player connection. */
export type PlayerClientMessage =
  | JoinRoomMessage
  | SubmitTraitsMessage
  | SubmitVoteMessage
  | LeaveRoomMessage;

/** Sent only over a host connection. */
export type HostClientMessage =
  | HostJoinMessage
  | HostStartGameMessage
  | HostAdvanceMessage
  | LeaveRoomMessage;

export type ClientMessage = PlayerClientMessage | HostClientMessage;
