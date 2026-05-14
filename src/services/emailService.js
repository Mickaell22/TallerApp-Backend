const nodemailer = require('nodemailer');

const crearTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const plantillas = {
  recibido: (datos) => ({
    subject: `TallerApp — Reparación recibida (${datos.codigo})`,
    html: `
      <h2>Hemos recibido tu dispositivo</h2>
      <p>Hola <strong>${datos.nombre}</strong>,</p>
      <p>Tu reparación ha sido registrada con el siguiente código de seguimiento:</p>
      <h3 style="color:#2563eb">${datos.codigo}</h3>
      <p><strong>Dispositivo:</strong> ${datos.dispositivo}</p>
      <p><strong>Problema reportado:</strong> ${datos.problema}</p>
      <p>Puedes consultar el estado de tu reparación en cualquier momento desde nuestra plataforma usando ese código.</p>
      <p>Te notificaremos cuando haya cambios.</p>
      <br><p>— Equipo TallerApp</p>
    `,
  }),

  en_diagnostico: (datos) => ({
    subject: `TallerApp — En diagnóstico (${datos.codigo})`,
    html: `
      <h2>Tu dispositivo está en diagnóstico</h2>
      <p>Hola <strong>${datos.nombre}</strong>,</p>
      <p>Estamos analizando tu <strong>${datos.dispositivo}</strong> (${datos.codigo}).</p>
      <p>Te informaremos cuando tengamos un diagnóstico completo.</p>
      <br><p>— Equipo TallerApp</p>
    `,
  }),

  en_reparacion: (datos) => ({
    subject: `TallerApp — En reparación (${datos.codigo})`,
    html: `
      <h2>Tu dispositivo está siendo reparado</h2>
      <p>Hola <strong>${datos.nombre}</strong>,</p>
      <p>Ya comenzamos a trabajar en tu <strong>${datos.dispositivo}</strong> (${datos.codigo}).</p>
      <p>Te avisaremos cuando esté listo para recoger.</p>
      <br><p>— Equipo TallerApp</p>
    `,
  }),

  listo: (datos) => ({
    subject: `TallerApp — Listo para recoger (${datos.codigo})`,
    html: `
      <h2>Tu dispositivo está listo</h2>
      <p>Hola <strong>${datos.nombre}</strong>,</p>
      <p>Tu <strong>${datos.dispositivo}</strong> (${datos.codigo}) ya está reparado y listo para recoger.</p>
      <p>Pasa por el taller en horario de atención.</p>
      <br><p>— Equipo TallerApp</p>
    `,
  }),

  entregado: (datos) => ({
    subject: `TallerApp — Entregado (${datos.codigo})`,
    html: `
      <h2>¡Reparación completada!</h2>
      <p>Hola <strong>${datos.nombre}</strong>,</p>
      <p>Tu <strong>${datos.dispositivo}</strong> (${datos.codigo}) ha sido entregado.</p>
      <p>Gracias por confiar en TallerApp. ¡Hasta pronto!</p>
      <br><p>— Equipo TallerApp</p>
    `,
  }),

  stock_bajo: (datos) => ({
    subject: `TallerApp — Alerta de stock bajo: ${datos.nombre}`,
    html: `
      <h2>Alerta de stock bajo</h2>
      <p>El repuesto <strong>${datos.nombre}</strong> ha caído por debajo del nivel mínimo:</p>
      <ul>
        <li>Stock actual: <strong>${datos.stock}</strong></li>
        <li>Stock mínimo configurado: <strong>${datos.stock_minimo}</strong></li>
      </ul>
      <p>Por favor realiza un pedido de reabastecimiento a la brevedad.</p>
      <br><p>— Sistema TallerApp</p>
    `,
  }),

  recuperar_password: (datos) => ({
    subject: 'TallerApp — Recuperación de contraseña',
    html: `
      <h2>Recuperación de contraseña</h2>
      <p>Hola <strong>${datos.nombre}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente enlace:</p>
      <p><a href="${datos.enlace}" style="color:#2563eb">${datos.enlace}</a></p>
      <p>Este enlace expira en <strong>1 hora</strong>. Si no solicitaste esto, ignora este correo.</p>
      <br><p>— Equipo TallerApp</p>
    `,
  }),
};

const enviarCorreo = async (destinatario, tipo, datos) => {
  if (!process.env.SMTP_PASS) {
    console.log(`[EMAIL] Sin SMTP configurado — correo "${tipo}" para ${destinatario} no enviado`);
    return;
  }

  try {
    const transporter = crearTransporter();
    const { subject, html } = plantillas[tipo](datos);

    await transporter.sendMail({
      from: `"TallerApp" <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject,
      html,
    });

    console.log(`[EMAIL] Correo "${tipo}" enviado a ${destinatario}`);
  } catch (err) {
    console.error(`[EMAIL] Error al enviar correo "${tipo}":`, err.message);
  }
};

module.exports = { enviarCorreo };
