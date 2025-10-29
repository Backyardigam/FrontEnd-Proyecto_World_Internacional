export type SeatStatus =
  | "available"
  | "pending" // Ideal para cuando otro usuario está en proceso de selección
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