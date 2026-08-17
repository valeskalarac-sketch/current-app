// Se ejecuta automáticamente una vez al día (ver vercel.json -> crons).
// Revisa los pagos pendientes de cada usuario y envía una notificación push
// a quienes tengan un pago venciendo dentro de los próximos DIAS_AVISO días.

import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const DIAS_AVISO = 3;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(dateStr, days) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function daysUntil(fromISO, toISO) {
  const a = new Date(fromISO + "T00:00:00Z");
  const b = new Date(toISO + "T00:00:00Z");
  return Math.round((b - a) / 86400000);
}

export default async function handler(req, res) {
  // Verifica que la llamada venga del cron de Vercel (o de una prueba manual autorizada)
  const authHeader = req.headers["authorization"] || "";
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (process.env.CRON_SECRET && authHeader !== expected) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:soporte@current.app";

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return res.status(500).json({ error: "Faltan variables de entorno en el servidor." });
  }

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const today = todayISO();
  const todayDay = new Date(today + "T00:00:00Z").getUTCDate();
  const monthKey = today.slice(0, 7);

  const { data: pending, error: pendingError } = await supabase
    .from("pending_payments")
    .select("*");
  if (pendingError) {
    return res.status(500).json({ error: pendingError.message });
  }

  // Determina qué pagos están por vencer y aún no se han pagado este período
  const dueSoon = [];
  for (const p of pending || []) {
    if (p.recurring) {
      const paidThisMonth = !!(p.paid_months && p.paid_months[monthKey]);
      if (paidThisMonth) continue;
      const dueDay = p.due_day || 1;
      const diff = dueDay - todayDay;
      if (diff >= 0 && diff <= DIAS_AVISO) {
        dueSoon.push({ ...p, diasRestantes: diff });
      }
    } else {
      if (p.paid) continue;
      if (!p.due_date) continue;
      const diff = daysUntil(today, p.due_date);
      if (diff >= 0 && diff <= DIAS_AVISO) {
        dueSoon.push({ ...p, diasRestantes: diff });
      }
    }
  }

  if (dueSoon.length === 0) {
    return res.status(200).json({ ok: true, enviados: 0, mensaje: "No hay pagos próximos a vencer hoy." });
  }

  // Agrupa por usuario
  const porUsuario = {};
  for (const p of dueSoon) {
    if (!porUsuario[p.user_id]) porUsuario[p.user_id] = [];
    porUsuario[p.user_id].push(p);
  }

  let enviados = 0;
  let errores = 0;

  for (const userId of Object.keys(porUsuario)) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", userId);
    if (!subs || subs.length === 0) continue;

    const pagos = porUsuario[userId];
    const primero = pagos[0];
    const title = pagos.length === 1 ? "Pago próximo a vencer" : `${pagos.length} pagos próximos a vencer`;
    const cuando = primero.diasRestantes === 0 ? "vence hoy" : primero.diasRestantes === 1 ? "vence mañana" : `vence en ${primero.diasRestantes} días`;
    const body = pagos.length === 1
      ? `${primero.description} (${cuando})`
      : `${primero.description} y ${pagos.length - 1} más`;

    const payload = JSON.stringify({ title, body, url: "/", tag: "current-pagos" });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payload
        );
        enviados++;
      } catch (err) {
        errores++;
        // Si la suscripción ya no es válida (410/404), la eliminamos
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
  }

  return res.status(200).json({ ok: true, enviados, errores, usuariosNotificados: Object.keys(porUsuario).length });
}
