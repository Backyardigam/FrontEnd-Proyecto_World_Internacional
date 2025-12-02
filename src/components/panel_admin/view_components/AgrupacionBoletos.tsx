import React from "react";
import type { ISeatDistributionItem } from "../admin_utils/mirabusAdmin";

interface BusService{
  //Como esto pueden llegar en array, cada uno es un bus en el que pueden ir multiples asientos
  distribution:ISeatDistributionItem[];
  orderBus:string;//B-01
}

interface BoletosService { //Boletos que hay reservados para ese servicio
  //en caso sea mirabus necesitamos saber que asientos corresponden al boleto
  idSeat?:string[];
  //parametro que puede llegar nulo o nisiquiera llegar, nos sirve para identificar a que bus iria el boleto
  orderBus?:string; //B-01
  nombre:string;
  peopleCount:number;//aunque es un dato redundante para mirabus, para los servicios normales, nos ayudara a saber cuantas personas 
  // vienen en el boleto
}

interface ServiceSearch{ //Respuesta de la API, solo llegaran en base al servicio, fecha y horario que se escoja
  // Si es un servicio mirabus este campo vendra y sabremos como armar el bus que contiene los boletos
  buses?:BusService[]; //Lista de los buses que corresponden a la lista de Buses que van a salir
  boletos:BoletosService[];//Si no viene la lista de buses entonces, no es mirabus y agrupamos por defecto
}

export default function AgrupacionBoletos() {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        Agrupación de Boletos
      </h3>
      <p className="text-gray-600">
        Aquí se mostrarán los boletos agrupados por viaje, fecha u otro criterio.
      </p>
    </div>
  );
}