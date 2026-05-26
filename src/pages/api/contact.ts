import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

const DESTINATION_EMAIL = (import.meta.env.CONTACT_DESTINATION_EMAIL as string) || 'maggy_flowers@yahoo.com';

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'El cuerpo de la petición debe ser JSON.' }, 400);
  }

  const { name, email, message } = body as Record<string, string>;

  if (!name?.trim()) {
    return json({ ok: false, field: 'name', error: 'El nombre es requerido.' }, 400);
  }
  if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, field: 'email', error: 'Correo electrónico no válido.' }, 400);
  }
  if (!message?.trim()) {
    return json({ ok: false, field: 'message', error: 'El mensaje es requerido.' }, 400);
  }
  if (message.length > 500) {
    return json({ ok: false, field: 'message', error: 'El mensaje no puede superar los 500 caracteres.' }, 400);
  }

  const smtpHost = import.meta.env.SMTP_HOST as string;
  const smtpPort = parseInt(import.meta.env.SMTP_PORT ?? '587', 10);
  const smtpUser = import.meta.env.SMTP_USER as string;
  const smtpPass = import.meta.env.SMTP_PASS as string;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"${name}" <${smtpUser}>`,
        replyTo: email,
        to: 'mauro211+mg01@gmail.com',
        subject: `Nuevo mensaje de contacto — ${name}`,
        text: `Nombre: ${name}\nEmail: ${email}\n\nMensaje:\n${message}`,
        html: `<p><strong>Nombre:</strong> ${name}</p>
               <p><strong>Email:</strong> ${email}</p>
               <hr/>
               <p><strong>Mensaje:</strong></p>
               <p>${message.replace(/\n/g, '<br/>')}</p>`,
      });
    } catch (err) {
      console.error('[Contact] Error al enviar email:', err);
      return json({ ok: false, error: 'No se pudo enviar el mensaje. Intenta de nuevo.' }, 500);
    }
  } else {
    console.log('[Contact] SMTP no configurado. Mensaje recibido:', { name, email, message });
  }

  return json({ ok: true }, 200);
};
