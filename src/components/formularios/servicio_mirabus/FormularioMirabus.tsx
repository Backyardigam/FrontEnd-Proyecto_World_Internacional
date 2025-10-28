import React from "react";
import { useState, useEffect } from "react";
//componente encargado de cargar con todo el formulario normal y la seleccion de asientos
export default function FormularioMirabus() {
  interface Asiento {
    cod_asiento: Array<string>;
    cod_bus: string;
  }

  interface FormData {
    servicio: string;
    nombre: string;
    DNI: string;
    correo: string;
    celular: string;
    cantidad: number;
    horario: Date;
    fecha: Date;
    asientos: Asiento;
  }

  const [formData, setFormData] = useState<FormData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Asiento | null>(null);

  

  return;
  <>
  </>;
}
