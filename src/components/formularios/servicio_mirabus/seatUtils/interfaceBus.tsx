export type SeatStatus =
  | "available"
  | "pending"
  | "selected"
  | "occupied"
  | "reserved"
  | "blocked";

export interface Seat {
  id: string;
  x: number;
  y: number;
  status: SeatStatus;
}