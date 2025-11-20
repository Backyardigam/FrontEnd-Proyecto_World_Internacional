import React, { useState, useCallback, useEffect } from "react";

export interface PassengerFormData {
  nombreCompleto: string;
  celular: string;
  dni: string;
  correo: string;
}

interface FormularioProps {
  onFormDataChange: (data: PassengerFormData) => void;
}

export default function Formulario({ onFormDataChange }: FormularioProps) {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [celular, setCelular] = useState("");
  const [dni, setDni] = useState("");
  const [correo, setCorreo] = useState("");

  useEffect(() => {
    onFormDataChange({
      nombreCompleto,
      celular,
      dni,
      correo,
    });
  }, [nombreCompleto, celular, dni, correo, onFormDataChange]);

  return (
    <div className="space-y-4 font-redhat m-1.5 md:w-auto">
      <div className="font-bold text-lg mt-5 mb-5">
        Ingrese su informacion para la reserva
      </div>
      <div>
        <label
          htmlFor="nombreCompleto"
          className="block text-gray-700"
        >
          Nombre Completo
        </label>
        <input
          type="text"
          id="nombreCompleto"
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="celular" className="block text-gray-700">Celular</label>
          <input type="tel" id="celular" value={celular} onChange={(e) => setCelular(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white" />
        </div>
        <div>
          <label htmlFor="dni" className="block text-gray-700">DNI</label>
          <input type="text" id="dni" value={dni} onChange={(e) => setDni(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white" />
        </div>
      </div>

      <div>
        <label htmlFor="correo" className="block text-gray-700">
          Correo Electrónico
        </label>
        <input
          type="email"
          id="correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
        />
      </div>
    </div>
  );
}
