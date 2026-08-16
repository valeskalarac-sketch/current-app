import React, { useState } from "react";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "./lib/supabaseClient";

const C = {
  bg: "#0A0A0F",
  surface: "#15151D",
  surfaceAlt: "#1C1C26",
  border: "rgba(255,255,255,0.08)",
  text: "#F3F3F6",
  textDim: "#9C9CAB",
  textFaint: "#65656F",
};
const GRAD_EXPENSE = "linear-gradient(135deg, #F472B6, #8B5CF6)";

export default function AuthScreen({ logo }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err?.message || "No se pudo enviar el enlace. Intenta de nuevo.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20, fontFamily: "'Inter', sans-serif"
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&display=swap" />
      <div style={{ width: "100%", maxWidth: 380, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 22, padding: "34px 26px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 26 }}>
          {logo}
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text, fontSize: 22, fontWeight: 700, margin: "14px 0 4px" }}>Current</h1>
          <p style={{ color: C.textDim, fontSize: 13, textAlign: "center", margin: 0 }}>Tu panel de finanzas personales</p>
        </div>

        {status === "sent" ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <CheckCircle2 size={34} color="#34D399" style={{ marginBottom: 10 }} />
            <div style={{ color: C.text, fontSize: 14.5, fontWeight: 600, marginBottom: 6 }}>Revisa tu correo</div>
            <div style={{ color: C.textDim, fontSize: 13, lineHeight: 1.5 }}>
              Te enviamos un enlace de acceso a <span style={{ color: C.text, fontWeight: 500 }}>{email}</span>. Ábrelo desde este mismo dispositivo para entrar.
            </div>
            <button onClick={() => setStatus("idle")} style={{ marginTop: 18, background: "transparent", border: "none", color: C.textFaint, fontSize: 12.5, textDecoration: "underline" }}>
              Usar otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 6 }}>
              Correo electrónico
            </label>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Mail size={16} color={C.textFaint} style={{ position: "absolute", left: 12, top: 13 }} />
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com" autoFocus
                style={{
                  width: "100%", padding: "12px 12px 12px 38px", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontSize: 14,
                  boxSizing: "border-box"
                }}
              />
            </div>

            {status === "error" && (
              <div style={{ background: "rgba(244,114,182,0.12)", color: "#F472B6", fontSize: 12.5, borderRadius: 8, padding: "8px 10px", marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            <button type="submit" disabled={status === "sending"} style={{
              width: "100%", background: GRAD_EXPENSE, color: "#fff", border: "none", borderRadius: 12,
              padding: "13px 0", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, opacity: status === "sending" ? 0.75 : 1
            }}>
              {status === "sending" ? (<><Loader2 size={16} className="spin" /> Enviando...</>) : "Enviar enlace de acceso"}
            </button>
            <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

            <p style={{ color: C.textFaint, fontSize: 11.5, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
              Sin contraseñas. Te enviamos un enlace de un solo uso para entrar de forma segura.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
