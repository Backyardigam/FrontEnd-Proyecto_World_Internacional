import React, { useState, useEffect } from "react";
import { apiGet, apiPost, ApiError } from "../../../utils/apiClient";
import Boton from "../admin_utils/Boton";
import { useStore } from "@nanostores/react";
import { $auth } from "../../../utils/authStore";
import {type CreatePaymentOfficeRequest } from "../contracts/payment.contract";
import type { getSellerResponse } from "../contracts/sellerContracts";
import Mirabus from "../../formularios/servicio_mirabus/Mirabus"; // Ajustar ruta si es necesario
import { useSocketTrip } from "../../../hooks/useSocketTrip";

// Interfaces para los datos
interface ServiceOption {
  id: string;
  name: string;
  type: "tour" | "mirabus";
  cost: string;
}

interface TicketFormData {
  sellerObservation:string;
  sellerName: string;
  serviceId: string;
  date: string;
  time: string;
  peopleCount: number;
  // Datos Cliente
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  // Datos Mirabus (Opcionales para tours)
  seatIds: string; // Entrada de texto: "A1, A2"
  orderBus: string;
}

const INITIAL_FORM_STATE: TicketFormData = {
  sellerObservation:" ",
  sellerName: "",
  serviceId: "",
  date: new Date().toISOString().split("T")[0], // Fecha de hoy por defecto
  time: "10:00",
  peopleCount: 1,
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  seatIds: "",
  orderBus: "",
};

export default function FormularioTicketView() {
  const { user } = useStore($auth);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [sellers, setSellers] = useState<getSellerResponse[]>([]);
  const [formData, setFormData] = useState<TicketFormData>(INITIAL_FORM_STATE);
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isManualSeller, setIsManualSeller] = useState(false);

  // --- NUEVOS ESTADOS Y HOOKS PARA MIRABUS ---
  const [uiStatus, setUiStatus] = useState<{ status: "idle" | "loading" | "connecting" | "error"; message?: string; }>({ status: "idle" });
  const [selectedBusOrden, setSelectedBusOrden] = useState<string | null>(null);

  const { buses, isConnected, connectToTrip, disconnectFromTrip, adminToggleSeat } = useSocketTrip();

  // --- EFECTOS PARA MIRABUS ---
  // 1. Desconectar si el usuario cambia el servicio, fecha o la hora
  useEffect(() => {
    if (isConnected) {
      disconnectFromTrip();
      setUiStatus({ status: "idle" });
      setSelectedBusOrden(null);
    }
  }, [formData.serviceId, formData.date, formData.time]);

  // 2. Auto-seleccionar primer bus al conectar y sincronizar con formData
  useEffect(() => {
    if (buses.length > 0 && !selectedBusOrden) {
      const firstBus = buses[0].ordenBus;
      setSelectedBusOrden(firstBus);
      setFormData(prev => ({ ...prev, orderBus: firstBus }));
    }
  }, [buses, selectedBusOrden]);

  // 3. Desconectar al desmontar
  useEffect(() => {
    return () => {
      if (isConnected) disconnectFromTrip();
    };
  }, [isConnected]);

  // --- FUNCIONES PARA MIRABUS ---
  const handleConnect = () => {
    if (formData.serviceId && formData.date && formData.time) {
      setUiStatus({ status: "connecting", message: "Sincronizando con el bus..." });
      const tripToConnect = {
        servicio: formData.serviceId,
        fecha: formData.date,
        horario: formData.time, 
      };

      connectToTrip(tripToConnect, (result) => {
        if (!result.success) {
          setUiStatus({ status: "error", message: result.error });
        } else {
          setUiStatus({ status: "idle" });
        }
      });
    }
  };

  const handleAdminSeatToggle = (seatId: string, busOrden: string) => {
    adminToggleSeat(seatId, busOrden);
    // Nota: El backend de sockets actualiza los asientos. Si necesitas 
    // mapearlos a formData.seatIds, se haría aquí.
  };

  const busToDisplay = buses.find((b) => b.ordenBus === selectedBusOrden);

  // Cargar servicios al montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargamos servicios y vendedores en paralelo
        const [servicesData, sellersData] = await Promise.all([
          apiGet<ServiceOption[]>("/manage/service/"),
          //traer solo los que esten activos
          apiGet<getSellerResponse[]>("/users/sellers?active=true")
        ]);
        setServices(servicesData);
        setSellers(sellersData.filter(s => s.active)); // Solo vendedores activos
      } catch (error) {
        console.error("Error cargando datos:", error);
        setMessage({ type: 'error', text: "No se pudieron cargar los datos iniciales (servicios o vendedores)." });
      } finally {
        setLoadingServices(false);
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'peopleCount' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!formData.sellerName) throw new Error("Debes seleccionar un vendedor.");
      if (!formData.serviceId) throw new Error("Debes seleccionar un servicio.");
      if (!formData.clientName) throw new Error("El nombre del cliente es obligatorio.");

      const seatArray = formData.seatIds 
        ? formData.seatIds.split(',').map(s => s.trim()).filter(s => s !== "") 
        : [];

      const phoneFormatted = formData.clientPhone.includes('?') 
        ? formData.clientPhone 
        : `+51?${formData.clientPhone.replace(/\D/g, '')}`;

      const finalEmail = formData.clientEmail.trim() || "ventas@oficina.com";

      const [hoursStr, minutesStr] = formData.time.split(':');
      let hours = parseInt(hoursStr, 10);
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12 || 12;
      const formattedSchedule = `${hours}:${minutesStr} ${ampm}:00`;

      const payload: CreatePaymentOfficeRequest & { seller?: string } = {
        sellerObservation:formData.sellerObservation,
        seller: formData.sellerName,
        buyerInfo: {
          firstName: formData.clientName,
          lastName: "(Venta Oficina)",
          email: finalEmail,
          phoneNumber: phoneFormatted,
          documentType: 'DNI',
          documentNumber: '00000000'
        },
        tickets: [
          {
            serviceId: formData.serviceId,
            name: formData.clientName,
            email: finalEmail,
            phoneNumber: phoneFormatted,
            peopleCount: formData.peopleCount,
            date: formData.date,
            schedule: formattedSchedule,
            seatID: seatArray,
            orderBus: formData.orderBus || undefined,
            // El precio se recalcula en el backend, enviamos 0 o el costo base referencial
            price: 0 
          }
        ]
      };

      // 3. Enviar Petición
      await apiPost('/boletos/admin_create', payload);

      // 4. Éxito
      setMessage({ type: 'success', text: "¡Venta registrada exitosamente! El ticket ha sido generado." });
      setFormData(INITIAL_FORM_STATE); // Limpiar formulario
      
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : (err.message || "Error desconocido al procesar la venta.");
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const selectedServiceInfo = services.find(s => s.id === formData.serviceId);
  // Variable de validación rápida
  const isMirabus = selectedServiceInfo?.type === "mirabus";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="border-b pb-4 mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Venta en Oficina</h2>
            <p className="text-gray-500 text-sm">Registra una venta manual directa.</p>
          </div>
          <div className="text-right text-sm text-gray-600 bg-gray-100 p-2 rounded">
            <p>Vendedor:</p>
            <p className="font-semibold text-blue-600">{user?.name || "Administrador"}</p>
          </div>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.type === 'success' ? '✅' : '⚠️'} {message.text}
          </div>
        )}

        {loadingServices ? (
          <p className="text-center py-10 text-gray-500">Cargando servicios disponibles...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECCIÓN 1: DATOS DEL VENDEDOR */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">1. Datos del Vendedor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Vendedor Asignado <span className="text-red-500">*</span></label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManualSeller(!isManualSeller);
                        setFormData(prev => ({ ...prev, sellerName: "" })); // Limpiamos el campo al cambiar de modo
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {isManualSeller ? "Seleccionar de la lista" : "Ingresar manualmente"}
                    </button>
                  </div>
                  
                  {isManualSeller ? (
                    <input
                      type="text"
                      name="sellerName"
                      value={formData.sellerName}
                      onChange={handleChange}
                      placeholder="Nombre del vendedor"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  ) : (
                    <select
                      name="sellerName"
                      value={formData.sellerName}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="">-- Seleccione el vendedor --</option>
                      {sellers.map(seller => (
                        <option key={seller.code} value={seller.name}>
                          {seller.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones de Venta (Opcional)</label>
                  <textarea
                    name="sellerObservation"
                    value={formData.sellerObservation}
                    onChange={handleChange}
                    placeholder="Anotaciones adicionales sobre la venta..."
                    rows={2}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: DETALLES DEL SERVICIO */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">2. Detalles del Servicio</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Servicio Turístico</label>
                  <select
                    name="serviceId"
                    value={formData.serviceId}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="">-- Seleccione un servicio --</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name} ({service.type === 'mirabus' ? 'Mirabus' : 'Tour Tradicional'}) - S/ {service.cost}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Viaje</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora de Salida</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: DATOS DEL CLIENTE */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">3. Datos del Cliente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    placeholder="cliente@ejemplo.com (Opcional)"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / Celular</label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    placeholder="987654321"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* --- RENDERIZADO CONDICIONAL DEL COMPONENTE MIRABUS --- */}
            {isMirabus && (
              <div className="md:col-span-3 mt-6 border-t pt-4">
                <h4 className="text-md font-semibold text-gray-700 mb-4">Selección de Asientos y Estado de Mirabus</h4>
                
                {uiStatus.status === "error" && !isConnected && (
                  <div className="text-red-500 font-medium bg-red-50 p-4 rounded text-center mb-4">
                    <p>⚠️ {uiStatus.message}</p>
                  </div>
                )}

                {!isConnected ? (
                  <div className="text-center bg-white p-6 rounded border border-gray-200">
                    {formData.serviceId && formData.date && formData.time ? (
                      <>
                        <p className="text-gray-500 mb-4 text-sm">Conéctate para ver la disponibilidad de los asientos en tiempo real.</p>
                        <Boton
                          text={uiStatus.status === 'connecting' ? "Conectando..." : "Cargar Estado del Bus"}
                          styleClass={`mx-auto px-6 py-2 ${uiStatus.status === 'connecting' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                          onPress={handleConnect}
                          disabled={uiStatus.status === 'connecting'}
                          type="button"
                        />
                      </>
                    ) : (
                      <p className="text-gray-400 text-sm">Completa el Servicio, Fecha y Hora (Sección 2) para cargar el bus.</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded border border-gray-200 flex flex-col justify-center overflow-auto min-h-[300px]">
                    {busToDisplay ? (
                      <Mirabus
                        key={busToDisplay.ordenBus}
                        initialSeatsData={busToDisplay.seats}
                        busOrden={busToDisplay.ordenBus}
                        mode="admin"
                        onAdminSeatToggle={handleAdminSeatToggle}
                      />
                    ) : (
                      <p className="text-center text-gray-500">Cargando datos del bus...</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SECCIÓN 4: DETALLES DEL TICKET */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">4. Asignación</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Personas</label>
                  <input
                    type="number"
                    min="1"
                    name="peopleCount"
                    value={formData.peopleCount}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                    required={!isMirabus}
                    disabled={isMirabus} // Se deshabilita si es mirabus
                  />
                </div>

                {/* Campos específicos si es Mirabus o si se requiere asignación manual */}
                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asientos <span className="text-gray-400 text-xs">(Separados por coma)</span>
                    </label>
                    <input
                      type="text"
                      name="seatIds"
                      value={formData.seatIds}
                      onChange={handleChange}
                      placeholder="Ej: A1, A2, B1"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={isMirabus || selectedServiceInfo?.type === 'tour'} // Opcional: deshabilitar para tours si no usan asientos
                    />
                    {selectedServiceInfo?.type === 'tour' && (
                      <p className="text-xs text-gray-500 mt-1">Generalmente no requerido para Tours.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orden de Bus</label>
                    {isMirabus ? (
                    <select
                      name="orderBus"
                      value={selectedBusOrden || ""}
                      onChange={(e) => {
                        setSelectedBusOrden(e.target.value);
                        handleChange(e); // Actualiza el formData.orderBus también
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                      disabled={!isConnected} // Se bloquea si no está conectado al socket
                    >
                      <option value="">-- Seleccione Bus --</option>
                      {buses.map(b => (
                        <option key={b.ordenBus} value={b.ordenBus}>
                          Bus {b.ordenBus}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="orderBus"
                      value={formData.orderBus}
                      onChange={handleChange}
                      placeholder="Ej: A, B, 1"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÓN DE ACCIÓN */}
            <div className="flex justify-end pt-4">
              <Boton 
                text={loading ? "Procesando Venta..." : "Registrar Venta"} 
                styleClass={`w-full md:w-auto px-8 py-3 text-lg ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                onPress={() => {}} // El submit lo maneja el formulario
                type="submit"
                disabled={loading}
              />
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
