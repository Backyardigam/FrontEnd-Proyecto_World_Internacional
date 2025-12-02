import React, { useState, useEffect } from "react";
import { apiGet, ApiError } from "../../../utils/apiClient";

export default function AuditoriaView() {
  const [auditData, setAuditData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuditData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<any>('/audit');
        setAuditData(data);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(`Error al cargar los datos de auditoría: ${err.message}`);
        } else {
          setError("Ocurrió un error inesperado.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAuditData();
  }, []);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Registro de Auditoría
      </h2>
      <p className="text-gray-600 mb-6">
        A continuación se muestra la respuesta cruda de la API desde <code>/manage/audit</code> para su inspección.
      </p>

      {loading && <p>Cargando datos de auditoría...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {auditData && (
        <pre className="bg-gray-900 text-white p-4 rounded-md overflow-x-auto text-sm">
          {JSON.stringify(auditData, null, 2)}
        </pre>
      )}
    </div>
  );
}
