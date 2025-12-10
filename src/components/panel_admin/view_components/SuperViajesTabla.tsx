import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { filtersAtom, setPage } from './SuperViajesStore';
import { apiGet } from "../../../utils/apiClient";
import type { PaginatedResult, IMirabusItem } from './SupervisarViajes.utils';

interface Props {
    onReserve: (data: { serviceId: string, serviceName: string, date: string, schedule: string }) => void;
    onAssign: (mirabusId: string) => void;
}

export const MirabusTable: React.FC<Props> = ({ onReserve, onAssign }) => {
    // Suscribirse al store de filtros
    const filters = useStore(filtersAtom);

    const [data, setData] = useState<IMirabusItem[]>([]);
    const [meta, setMeta] = useState<PaginatedResult<any>['meta'] | null>(null);
    const [loading, setLoading] = useState(false);

    // Función para construir la URL Query
    const buildQuery = () => {
        const params = new URLSearchParams();
        params.append('page', filters.page.toString());
        params.append('limit', filters.limit.toString());

        if (filters.serviceId) params.append('serviceId', filters.serviceId);
        // Nota: El backend espera 'schedule' en formato HH:MM AM/PM, URLSearchParams lo codifica autom.
        if (filters.schedule) params.append('schedule', filters.schedule);
        if (filters.date) params.append('date', filters.date);

        return params.toString();
    };

    // Fetch de datos cuando cambian los filtros (incluyendo paginación)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const query = buildQuery();
                const result = await apiGet<PaginatedResult<IMirabusItem>>(`/manage/mirabus/list?${query}`);

                if (result) {
                    setData(result.data);
                    setMeta(result.meta);
                } else {
                    setData([]); // Manejo de 204 No Content
                }
            } catch (error) {
                console.error("Error fetch tabla:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filters]); // Se ejecuta cada vez que el atom cambia

    // Helper: Calcular si mostrar botones (Fecha >= Hoy)
    const shouldShowActions = (dateString: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Resetear hora para comparar solo fecha

        // Asumimos que dateString viene "YYYY-MM-DD". 
        // Truco: añadir "T00:00:00" para evitar problemas de timezone UTC vs Local
        const rowDate = new Date(`${dateString}T00:00:00`);

        return rowDate >= today;
    };

    // Helper: Formato Buses-Asientos (B-01 : 8 | B-02 : 5)
    const formatBusSeats = (seats: IMirabusItem['mirabusSeat']) => {
        if (!seats || seats.length === 0) return '-';
        return seats
            .map(s => `${s.busOrder} : ${s.seatsReserved}`)
            .join(' | ');
    };

    return (
        <div className="bg-gray-200 p-4 rounded-md min-h-[400px]">
            {loading ? (
                <div className="text-center p-10 text-gray-500">Cargando datos...</div>
            ) : (
                <>
                    <div className="overflow-x-auto rounded shadow-sm">
                        <table className="w-full text-sm text-left text-gray-600 bg-white">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-300">
                                <tr>
                                    <th scope="col" className="px-4 py-3 border-r border-gray-400">N°</th>
                                    <th scope="col" className="px-4 py-3 border-r border-gray-400">SERVICIOS</th>
                                    <th scope="col" className="px-4 py-3 border-r border-gray-400">FECHA</th>
                                    <th scope="col" className="px-4 py-3 border-r border-gray-400">HORARIO</th>
                                    <th scope="col" className="px-4 py-3 border-r border-gray-400">BUSES - ASIENTOS</th>
                                    <th scope="col" className="px-4 py-3 text-center">ACCIONES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? (
                                    data.map((item, index) => {
                                        // Cálculo del N° de registro
                                        const rowNumber = index + 1 + ((filters.page - 1) * filters.limit);
                                        const showButtons = shouldShowActions(item.date);

                                        return (
                                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-3 border-r">{rowNumber}</td>
                                                <td className="px-4 py-3 border-r font-medium text-gray-900">{item.serviceName}</td>
                                                <td className="px-4 py-3 border-r">{item.date}</td>
                                                <td className="px-4 py-3 border-r">{item.schedule}</td>
                                                <td className="px-4 py-3 border-r">{formatBusSeats(item.mirabusSeat)}</td>
                                                <td className="px-4 py-3 flex justify-center gap-2">
                                                    {showButtons && (
                                                        <>
                                                            <button
                                                                onClick={() => onReserve({
                                                                    serviceId: item.serviceId,
                                                                    serviceName: item.serviceName,
                                                                    date: item.date,
                                                                    schedule: item.schedule
                                                                })}
                                                                className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 uppercase"
                                                            >
                                                                Reservar
                                                            </button>
                                                            <button
                                                                onClick={() => onAssign(item.id)}
                                                                className="px-3 py-1 bg-amber-500 text-white rounded text-xs font-semibold hover:bg-amber-600 uppercase"
                                                            >
                                                                Asignar
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-6">No se encontraron registros.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación simple */}
                    {meta && meta.totalPaginas > 1 && (
                        <div className="flex justify-between items-center mt-4">
                            <span className="text-sm text-gray-600">
                                Página {meta.paginaActual} de {meta.totalPaginas} (Total: {meta.totalRegistros})
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={meta.paginaActual === 1}
                                    onClick={() => setPage(meta.paginaActual - 1)}
                                    className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                                >
                                    Anterior
                                </button>
                                <button
                                    disabled={meta.paginaActual === meta.totalPaginas}
                                    onClick={() => setPage(meta.paginaActual + 1)}
                                    className="px-3 py-1 border rounded bg-white disabled:opacity-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};