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

export interface Bus {
  ordenBus: string; //codigo de bus
  seats: Seat[];
}

// export interface BusList {
//   servicio: string;
//   buses: Bus[];
// }

// const buses: Bus[] = [
//   {
//     ordenBus: "asas1",
//     seats: [
//       { id: "01", x: 1, y: 1, status: "occupied" },
//       { id: "02", x: 2, y: 1, status: "available" },
//       { id: "03", x: 3, y: 1, status: "available" },
//       { id: "04", x: 4, y: 1, status: "available" },
//       { id: "05", x: 5, y: 1, status: "available" },
//       { id: "06", x: 6, y: 1, status: "available" },
//       { id: "07", x: 7, y: 1, status: "reserved" },
//       { id: "08", x: 8, y: 1, status: "reserved" },
//       { id: "09", x: 9, y: 1, status: "available" },
//     ],
//   },
//   {
//     ordenBus: "asas2",
//     seats: [
//       { id: "01", x: 1, y: 1, status: "occupied" },
//       { id: "02", x: 2, y: 1, status: "available" },
//       { id: "03", x: 3, y: 1, status: "available" },
//       { id: "04", x: 4, y: 1, status: "available" },
//       { id: "05", x: 5, y: 1, status: "available" },
//       { id: "06", x: 6, y: 1, status: "available" },
//       { id: "07", x: 7, y: 1, status: "reserved" },
//       { id: "08", x: 8, y: 1, status: "reserved" },
//       { id: "09", x: 9, y: 1, status: "available" },
//     ],
//   },
// ];