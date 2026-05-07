const PDFDocument = require('pdfkit');

const generarFacturaPDF = (factura, res) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=factura-${factura.id}.pdf`);
  doc.pipe(res);

  const reparacion = factura.reparacion;
  const cliente = reparacion?.cliente;
  const nombreCliente = cliente?.usuario?.nombre || 'Cliente';

  // Encabezado
  doc.fontSize(20).font('Helvetica-Bold').text('TallerApp', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Servicio Técnico de Reparación de Celulares', { align: 'center' });
  doc.moveDown();

  // Línea separadora
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  // Datos de la factura
  doc.fontSize(14).font('Helvetica-Bold').text('FACTURA');
  doc.fontSize(11).font('Helvetica');
  doc.text(`N° Factura:   ${factura.id}`);
  doc.text(`Fecha:        ${factura.fecha}`);
  doc.text(`Estado pago:  ${factura.estado_pago.toUpperCase()}`);
  doc.moveDown();

  // Datos del cliente
  doc.fontSize(12).font('Helvetica-Bold').text('CLIENTE');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Nombre:   ${nombreCliente}`);
  if (cliente?.usuario?.email) doc.text(`Email:    ${cliente.usuario.email}`);
  if (cliente?.telefono) doc.text(`Teléfono: ${cliente.telefono}`);
  doc.moveDown();

  // Datos de la reparación
  doc.fontSize(12).font('Helvetica-Bold').text('DETALLE DE REPARACIÓN');
  doc.fontSize(11).font('Helvetica');
  doc.text(`Código:       ${reparacion?.codigo || '-'}`);
  doc.text(`Dispositivo:  ${reparacion?.dispositivo || '-'}`);
  doc.text(`Problema:     ${reparacion?.problema || '-'}`);
  doc.text(`Estado:       ${reparacion?.estado || '-'}`);
  doc.moveDown();

  // Repuestos usados
  const repuestos = reparacion?.repuestos || [];
  if (repuestos.length > 0) {
    doc.fontSize(12).font('Helvetica-Bold').text('REPUESTOS UTILIZADOS');
    doc.fontSize(11).font('Helvetica');
    repuestos.forEach((r) => {
      const cant = r.reparacion_repuesto?.cantidad || 1;
      const subtotal = (parseFloat(r.precio) * cant).toFixed(2);
      doc.text(`  - ${r.nombre}  x${cant}  $${subtotal}`);
    });
    doc.moveDown();
  }

  // Total
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').text(`TOTAL: $${parseFloat(factura.total).toFixed(2)}`, { align: 'right' });

  doc.end();
};

module.exports = { generarFacturaPDF };
