// import ExcelJS from "exceljs";

// async function generarExcel(datos: any) {
//   const workbook = new ExcelJS.Workbook();

//   await workbook.xlsx.readFile("./template.xlsx");

//   const worksheet = workbook.getWorksheet(1);

//   worksheet.getCell("B2").value = datos.vendedor;
//   worksheet.getCell("B3").value = new Date();

//   // O puedes agregar filas al final de una tabla ya estilizada
//   // Si la fila 5 ya tiene bordes y colores, las nuevas filas pueden heredarlo
//   datos.productos.forEach((prod, index) => {
//     worksheet.addRow([prod.nombre, prod.cantidad, prod.precio]);
//   });

//   // 3. Guardas el resultado como un nuevo archivo
//   await workbook.xlsx.writeFile("./salida/reporte_final.xlsx");
// }
