import ExcelJS from "exceljs";

export interface DatosReporte {
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  registros: any[];
}

export async function generarExcel(datos: DatosReporte) {
  const workbook = new ExcelJS.Workbook();

  try {
    // En el navegador cargamos el archivo mediante un ArrayBuffer (debe estar en tu carpeta 'public/')
    const response = await fetch("/template.xlsx");
    if (!response.ok) throw new Error("No se pudo encontrar el template.xlsx en la carpeta pública.");
    
    const arrayBuffer = await response.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new Error("El archivo Excel no tiene una hoja válida.");

    // 1. Asignamos los filtros a las celdas correspondientes
    worksheet.getCell("B4").value = datos.fechaInicio || "---";
    worksheet.getCell("C4").value = datos.fechaFin || "---";
    worksheet.getCell("D4").value = datos.horaInicio || "---";
    worksheet.getCell("E4").value = datos.horaFin || "---";

    // 2. Insertamos los registros empezando desde la fila 6 (A6 - J6)
    let currentRow = 6;
    datos.registros.forEach((ticket) => {
      const row = worksheet.getRow(currentRow);
      row.getCell("A").value = ticket.ticketCode;
      row.getCell("B").value = ticket.name;
      row.getCell("C").value = ticket.email;
      row.getCell("D").value = ticket.service;
      row.getCell("E").value = ticket.date;
      row.getCell("F").value = ticket.schedule;
      row.getCell("G").value = ticket.peopleCount;
      row.getCell("H").value = ticket.seller;
      row.getCell("I").value = ticket.sellerObservation;
      row.getCell("J").value = ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("es-PE") : "";
      
      row.commit();
      currentRow++;
    });

    // 3. Generamos el archivo para descarga en el navegador
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `Reporte_Boletos_${new Date().toISOString().split("T")[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error al generar el Excel:", error);
    alert("Hubo un error al procesar o descargar el reporte en Excel. Verifica la consola.");
  }
}
