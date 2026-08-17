import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "./lib/supabaseClient";
import AuthScreen from "./AuthScreen";
import * as db from "./lib/db";
import { isPushSupported, getCurrentPushSubscription, subscribeToPush, unsubscribeFromPush } from "./lib/push";
import {
  Wallet, Briefcase, PlusCircle, Home, UtensilsCrossed, Car, Zap,
  Film, HeartPulse, MoreHorizontal, ChevronLeft, ChevronRight, Plus,
  X, Check, Trash2, TrendingUp, TrendingDown, ClipboardList,
  CalendarClock, Loader2, PiggyBank, Target, ArrowDownCircle, ArrowUpCircle, LogOut, Bell, BellOff
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid
} from "recharts";

/* ---------------------------------------------------------------
   Paleta / tipografía — dashboard oscuro con anillos y gradientes
   Inspirado en tableros de control tipo "control room" nocturno
---------------------------------------------------------------- */
const FONT_LINK = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap";

const COLORS = {
  bg: "#0A0A0F",
  surface: "#15151D",
  surfaceAlt: "#1C1C26",
  surfaceHi: "#22222E",
  border: "rgba(255,255,255,0.08)",
  text: "#F3F3F6",
  textDim: "#9C9CAB",
  textFaint: "#65656F",
  income: "#34D399",
  incomeAlt: "#3B82F6",
  expense: "#F472B6",
  expenseAlt: "#8B5CF6",
  gold: "#FBBF24",
  goldAlt: "#FB923C",
};

const GRAD = {
  income: `linear-gradient(135deg, ${COLORS.income}, ${COLORS.incomeAlt})`,
  expense: `linear-gradient(135deg, ${COLORS.expense}, ${COLORS.expenseAlt})`,
  gold: `linear-gradient(135deg, ${COLORS.gold}, ${COLORS.goldAlt})`,
};

const CATEGORIES = {
  ingreso: [
    { id: "salario", label: "Salario", icon: Wallet },
    { id: "freelance", label: "Freelance", icon: Briefcase },
    { id: "otro_ingreso", label: "Otro ingreso", icon: PlusCircle },
  ],
  egreso: [
    { id: "vivienda", label: "Vivienda", icon: Home },
    { id: "comida", label: "Comida", icon: UtensilsCrossed },
    { id: "transporte", label: "Transporte", icon: Car },
    { id: "servicios", label: "Servicios", icon: Zap },
    { id: "ocio", label: "Ocio", icon: Film },
    { id: "salud", label: "Salud", icon: HeartPulse },
    { id: "pago_fijo", label: "Pago fijo", icon: CalendarClock },
    { id: "ahorro", label: "Ahorro", icon: PiggyBank },
    { id: "otro_egreso", label: "Otro gasto", icon: MoreHorizontal },
  ],
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function monthKeyOf(dateStr) { return dateStr.slice(0, 7); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).replace("USD", "$").replace("US$", "$");
}
function labelMonth(key) {
  const [y, m] = key.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}
function shiftMonth(key, delta) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function categoryMeta(type, catId) {
  return (CATEGORIES[type] || []).find(c => c.id === catId) || CATEGORIES.egreso[CATEGORIES.egreso.length - 1];
}
function chipGradient(type, catId) {
  if (type === "ingreso") return GRAD.income;
  if (catId === "ahorro") return GRAD.gold;
  return GRAD.expense;
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------------------------------------------------------------
   Anillo de progreso con gradiente (elemento firma del diseño)
---------------------------------------------------------------- */
function GradientRing({ percent, size = 84, stroke = 9, colorFrom, colorTo, label, value, sublabel }) {
  const idRef = useRef(`ring-${uid()}`);
  const id = idRef.current;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent || 0));
  const offset = c - (pct / 100) * c;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <defs>
            <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorFrom} />
              <stop offset="100%" stopColor={colorTo} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={`url(#${id})`} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset .5s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span className="disp" style={{ fontSize: size * 0.22, fontWeight: 700, color: COLORS.text }}>{Math.round(pct)}%</span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 600 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 10.5, color: COLORS.textFaint, marginTop: 1 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Logo — tres arcos en degradado que forman un anillo continuo
   (mismo lenguaje visual que los anillos de progreso de la app)
---------------------------------------------------------------- */
function CurrentLogo({ size = 28 }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const seg = c / 3 - 10;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <linearGradient id="currentIncome" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.income} /><stop offset="100%" stopColor={COLORS.incomeAlt} />
        </linearGradient>
        <linearGradient id="currentGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.gold} /><stop offset="100%" stopColor={COLORS.goldAlt} />
        </linearGradient>
        <linearGradient id="currentExpense" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={COLORS.expense} /><stop offset="100%" stopColor={COLORS.expenseAlt} />
        </linearGradient>
      </defs>
      <g transform="rotate(-90 50 50)">
        <circle cx="50" cy="50" r={r} fill="none" stroke="url(#currentIncome)" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${seg} ${c}`} transform="rotate(0 50 50)" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="url(#currentGold)" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${seg} ${c}`} transform="rotate(120 50 50)" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="url(#currentExpense)" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${seg} ${c}`} transform="rotate(240 50 50)" />
      </g>
    </svg>
  );
}

export default function FinanzasApp() {
  const [session, setSession] = useState(undefined); // undefined = verificando, null = sin sesión
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [pending, setPending] = useState([]);
  const [goals, setGoals] = useState([]);
  const [monthKey, setMonthKey] = useState(todayISO().slice(0, 7));
  const [tab, setTab] = useState("resumen");
  const [showForm, setShowForm] = useState(false);
  const [showPendingForm, setShowPendingForm] = useState(false);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [contribGoal, setContribGoal] = useState(null);

  // Sesión de Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;
  const userDisplayName = useMemo(() => {
    const meta = session?.user?.user_metadata || {};
    const full = meta.full_name || meta.name || "";
    if (full) return full.split(" ")[0];
    const email = session?.user?.email || "";
    return email ? email.split("@")[0] : "";
  }, [session]);

  // Carga de datos del usuario autenticado
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const [tx, pd, gl] = await Promise.all([
          db.fetchTransactions(userId),
          db.fetchPending(userId),
          db.fetchGoals(userId),
        ]);
        if (cancelled) return;
        setTransactions(tx);
        setPending(pd);
        setGoals(gl);
        setSaveError("");
      } catch (e) {
        if (!cancelled) setSaveError("No se pudo cargar tu información desde la base de datos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const signOut = () => supabase.auth.signOut();

  // Notificaciones push
  const [notifStatus, setNotifStatus] = useState("off"); // off | on | unsupported
  useEffect(() => {
    if (!userId) return;
    if (!isPushSupported()) { setNotifStatus("unsupported"); return; }
    getCurrentPushSubscription().then(sub => setNotifStatus(sub ? "on" : "off")).catch(() => setNotifStatus("off"));
  }, [userId]);

  const handleToggleNotifications = async () => {
    if (notifStatus === "unsupported") {
      setSaveError("Este navegador no soporta notificaciones push (prueba con Chrome o Safari en tu celular, con la app instalada).");
      return;
    }
    try {
      if (notifStatus === "on") {
        await unsubscribeFromPush();
        setNotifStatus("off");
      } else {
        await subscribeToPush(userId);
        setNotifStatus("on");
      }
      setSaveError("");
    } catch (e) {
      setSaveError(e?.message || "No se pudieron activar las notificaciones.");
    }
  };

  const monthTx = useMemo(
    () => transactions.filter(t => monthKeyOf(t.date) === monthKey).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, monthKey]
  );
  const totalIngresos = useMemo(() => monthTx.filter(t => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0), [monthTx]);
  const totalEgresos = useMemo(() => monthTx.filter(t => t.type === "egreso").reduce((s, t) => s + Number(t.amount), 0), [monthTx]);
  const balance = totalIngresos - totalEgresos;

  const pendingForMonth = useMemo(() => pending
    .filter(p => p.recurring ? true : monthKeyOf(p.dueDate || "") === monthKey)
    .map(p => ({ ...p, paid: p.recurring ? !!p.paidMonths?.[monthKey] : !!p.paid }))
    .sort((a, b) => (a.paid === b.paid) ? 0 : (a.paid ? 1 : -1)),
  [pending, monthKey]);
  const totalPendiente = pendingForMonth.filter(p => !p.paid).reduce((s, p) => s + Number(p.amount), 0);
  const pagosRatio = pendingForMonth.length > 0 ? (pendingForMonth.filter(p => p.paid).length / pendingForMonth.length) * 100 : 100;

  const totalAhorrado = useMemo(() => goals.reduce((s, g) => s + Number(g.currentAmount || 0), 0), [goals]);
  const aportesDelMes = useMemo(
    () => monthTx.filter(t => t.type === "egreso" && t.category === "ahorro").reduce((s, t) => s + Number(t.amount), 0),
    [monthTx]
  );
  const gastoRatio = totalIngresos > 0 ? (totalEgresos / totalIngresos) * 100 : (totalEgresos > 0 ? 100 : 0);
  const ahorroRatio = totalIngresos > 0 ? (aportesDelMes / totalIngresos) * 100 : 0;

  const categoryBreakdown = useMemo(() => {
    const map = {};
    monthTx.filter(t => t.type === "egreso").forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return Object.entries(map)
      .map(([cat, amount]) => ({ cat, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [monthTx]);

  const chartData = useMemo(() => {
    const keys = [];
    for (let i = 5; i >= 0; i--) keys.push(shiftMonth(monthKey, -i));
    return keys.map(key => {
      const tx = transactions.filter(t => monthKeyOf(t.date) === key);
      return {
        mes: labelMonth(key).slice(0, 3),
        Ingresos: tx.filter(t => t.type === "ingreso").reduce((s, t) => s + Number(t.amount), 0),
        Egresos: tx.filter(t => t.type === "egreso").reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }, [transactions, monthKey]);

  const addTransaction = async (data) => {
    try {
      const row = await db.insertTransaction(userId, data);
      setTransactions(prev => [row, ...prev]);
      setSaveError("");
      setShowForm(false);
    } catch (e) { setSaveError("No se pudo guardar el movimiento."); }
  };
  const removeTransaction = async (id) => {
    try {
      await db.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      setSaveError("");
    } catch (e) { setSaveError("No se pudo eliminar el movimiento."); }
  };
  const addPending = async (data) => {
    const base = data.recurring ? { paidMonths: {} } : { paid: false, paidTxId: null };
    try {
      const row = await db.insertPending(userId, { ...base, ...data });
      setPending(prev => [...prev, row]);
      setSaveError("");
      setShowPendingForm(false);
    } catch (e) { setSaveError("No se pudo guardar el pago."); }
  };
  const removePending = async (id) => {
    const item = pending.find(p => p.id === id);
    try {
      if (item?.recurring && item.paidMonths) {
        const txIds = Object.values(item.paidMonths).filter(Boolean);
        await Promise.all(txIds.map(txId => db.deleteTransaction(txId)));
        setTransactions(prev => prev.filter(t => !txIds.includes(t.id)));
      } else if (item && !item.recurring && item.paidTxId) {
        await db.deleteTransaction(item.paidTxId);
        setTransactions(prev => prev.filter(t => t.id !== item.paidTxId));
      }
      await db.deletePending(id);
      setPending(prev => prev.filter(p => p.id !== id));
      setSaveError("");
    } catch (e) { setSaveError("No se pudo eliminar el pago."); }
  };
  const togglePaid = async (id) => {
    const item = pending.find(p => p.id === id);
    if (!item) return;
    try {
      if (item.recurring) {
        const isPaid = !!item.paidMonths?.[monthKey];
        if (isPaid) {
          const txId = item.paidMonths[monthKey];
          await db.deleteTransaction(txId);
          setTransactions(prev => prev.filter(t => t.id !== txId));
          const nextPaidMonths = { ...item.paidMonths };
          delete nextPaidMonths[monthKey];
          const updated = await db.updatePending(id, { paidMonths: nextPaidMonths });
          setPending(prev => prev.map(p => p.id === id ? updated : p));
        } else {
          const newTx = await db.insertTransaction(userId, { type: "egreso", description: item.description, category: "pago_fijo", amount: Number(item.amount), date: `${monthKey}-${String(item.dueDay || 1).padStart(2, "0")}` });
          setTransactions(prev => [newTx, ...prev]);
          const updated = await db.updatePending(id, { paidMonths: { ...item.paidMonths, [monthKey]: newTx.id } });
          setPending(prev => prev.map(p => p.id === id ? updated : p));
        }
      } else {
        if (item.paid) {
          await db.deleteTransaction(item.paidTxId);
          setTransactions(prev => prev.filter(t => t.id !== item.paidTxId));
          const updated = await db.updatePending(id, { paid: false, paidTxId: null });
          setPending(prev => prev.map(p => p.id === id ? updated : p));
        } else {
          const newTx = await db.insertTransaction(userId, { type: "egreso", description: item.description, category: "pago_fijo", amount: Number(item.amount), date: item.dueDate || todayISO() });
          setTransactions(prev => [newTx, ...prev]);
          const updated = await db.updatePending(id, { paid: true, paidTxId: newTx.id });
          setPending(prev => prev.map(p => p.id === id ? updated : p));
        }
      }
      setSaveError("");
    } catch (e) { setSaveError("No se pudo actualizar el pago."); }
  };
  const addGoal = async (data) => {
    try {
      const row = await db.insertGoal(userId, { currentAmount: 0, ...data });
      setGoals(prev => [...prev, row]);
      setSaveError("");
      setShowGoalForm(false);
    } catch (e) { setSaveError("No se pudo crear la meta de ahorro."); }
  };
  const removeGoal = async (id) => {
    try {
      await db.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      setSaveError("");
    } catch (e) { setSaveError("No se pudo eliminar la meta de ahorro."); }
  };
  const contributeToGoal = async (goalId, mode, amount) => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const delta = mode === "aporte" ? value : -value;
    const nextAmount = Math.max(0, Number(goal.currentAmount || 0) + delta);
    try {
      const updatedGoal = await db.updateGoalAmount(goalId, nextAmount);
      setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
      const newTx = await db.insertTransaction(userId, {
        type: mode === "aporte" ? "egreso" : "ingreso",
        category: mode === "aporte" ? "ahorro" : "otro_ingreso",
        description: `${mode === "aporte" ? "Aporte a" : "Retiro de"} ahorro: ${goal.name}`,
        amount: value,
        date: todayISO(),
      });
      setTransactions(prev => [newTx, ...prev]);
      setSaveError("");
      setContribGoal(null);
    } catch (e) { setSaveError("No se pudo registrar el aporte."); }
  };

  if (session === undefined) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} color={COLORS.gold} className="spin" />
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (session === null) {
    return <AuthScreen logo={<CurrentLogo size={40} />} />;
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={28} color={COLORS.gold} className="spin" />
        <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', sans-serif" }}>
      <link rel="stylesheet" href={FONT_LINK} />
      <style>{`
        * { box-sizing: border-box; }
        .amt { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
        .disp { font-family: 'Space Grotesk', sans-serif; }
        button { font-family: inherit; cursor: pointer; }
        input, select { font-family: inherit; }
        ::selection { background: ${COLORS.expenseAlt}; color: #fff; }
        .tab-btn { transition: all .15s ease; }
        .row-hover:hover { background: ${COLORS.surfaceAlt}; }
        input:focus, select:focus { outline: 2px solid ${COLORS.incomeAlt}; outline-offset: 1px; }
        button:focus-visible { outline: 2px solid ${COLORS.incomeAlt}; outline-offset: 2px; }
        input[type="date"], input[type="month"] { color-scheme: dark; }
      `}</style>

      {/* Encabezado */}
      <header style={{ padding: "26px 18px 4px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <CurrentLogo size={24} />
            <span className="disp" style={{ color: COLORS.text, fontSize: 15, fontWeight: 700, letterSpacing: "0.01em" }}>Current</span>
            <span style={{ color: COLORS.textFaint, fontSize: 12 }}>
              {userDisplayName ? `· Hola, ${userDisplayName} 👋` : "· Finanzas personales"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={handleToggleNotifications} title={notifStatus === "on" ? "Notificaciones activadas" : "Activar notificaciones de pagos"}
              aria-label="Notificaciones" style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", color: notifStatus === "on" ? COLORS.gold : COLORS.textFaint, padding: 4 }}>
              {notifStatus === "on" ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
            <button onClick={signOut} title={session?.user?.email} aria-label="Cerrar sesión"
              style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", color: COLORS.textFaint, fontSize: 11.5, padding: 4 }}>
              <LogOut size={13} /> Salir
            </button>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => setMonthKey(shiftMonth(monthKey, -1))} aria-label="Mes anterior"
            style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, padding: 8 }}>
            <ChevronLeft size={18} />
          </button>
          <h1 className="disp" style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, margin: 0 }}>{labelMonth(monthKey)}</h1>
          <button onClick={() => setMonthKey(shiftMonth(monthKey, 1))} aria-label="Mes siguiente"
            style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, padding: 8 }}>
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "18px 14px 40px" }}>

        {saveError && (
          <div style={{ marginBottom: 12, padding: "8px 12px", background: "rgba(244,114,182,0.12)", color: COLORS.expense, borderRadius: 10, fontSize: 13, border: `1px solid ${COLORS.expense}33` }}>
            {saveError}
          </div>
        )}

        {/* Tarjeta hero: balance + anillos de gradiente */}
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "18px 16px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>Balance del mes</div>
              <div className="amt disp" style={{ fontSize: 30, fontWeight: 700, color: balance >= 0 ? COLORS.income : COLORS.expense, marginTop: 4 }}>
                {fmtMoney(balance)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 2 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10.5, color: COLORS.textFaint, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}><TrendingUp size={11} color={COLORS.income} /> Ingresos</div>
                <div className="amt" style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{fmtMoney(totalIngresos)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10.5, color: COLORS.textFaint, display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end" }}><TrendingDown size={11} color={COLORS.expense} /> Egresos</div>
                <div className="amt" style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{fmtMoney(totalEgresos)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 6, borderTop: `1px solid ${COLORS.border}` }}>
            <GradientRing percent={gastoRatio} colorFrom={COLORS.expense} colorTo={COLORS.expenseAlt} label="Tasa de gasto" sublabel="vs. ingresos" />
            <GradientRing percent={ahorroRatio} colorFrom={COLORS.gold} colorTo={COLORS.goldAlt} label="Tasa de ahorro" sublabel="vs. ingresos" />
            <GradientRing percent={pagosRatio} colorFrom={COLORS.income} colorTo={COLORS.incomeAlt} label="Pagos al día" sublabel={`${pendingForMonth.filter(p=>p.paid).length}/${pendingForMonth.length || 0}`} />
          </div>
        </div>

        {/* Pestañas */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 5 }}>
          {[
            { id: "resumen", label: "Resumen" },
            { id: "movimientos", label: "Movs" },
            { id: "pagos", label: "Pagos" },
            { id: "ahorro", label: "Ahorro" },
          ].map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
              style={{
                flex: 1, border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 600,
                background: tab === t.id ? GRAD.expense : "transparent",
                color: tab === t.id ? "#fff" : COLORS.textDim,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "resumen" && (
          <ResumenTab chartData={chartData} totalPendiente={totalPendiente} totalAhorrado={totalAhorrado} categoryBreakdown={categoryBreakdown} />
        )}
        {tab === "movimientos" && (
          <MovimientosTab monthTx={monthTx} onRemove={removeTransaction} onAdd={() => setShowForm(true)} />
        )}
        {tab === "pagos" && (
          <PagosTab items={pendingForMonth} onToggle={togglePaid} onRemove={removePending} onAdd={() => setShowPendingForm(true)} totalPendiente={totalPendiente} />
        )}
        {tab === "ahorro" && (
          <AhorroTab goals={goals} monthKey={monthKey} onAdd={() => setShowGoalForm(true)} onRemove={removeGoal} onContribute={(goal, mode) => setContribGoal({ goal, mode })} />
        )}
      </main>

      {showForm && (
        <TransactionForm defaultDate={monthKey === todayISO().slice(0,7) ? todayISO() : `${monthKey}-01`} onCancel={() => setShowForm(false)} onSubmit={addTransaction} />
      )}
      {showPendingForm && <PendingForm onCancel={() => setShowPendingForm(false)} onSubmit={addPending} />}
      {showGoalForm && <GoalForm onCancel={() => setShowGoalForm(false)} onSubmit={addGoal} />}
      {contribGoal && (
        <ContributeForm goal={contribGoal.goal} mode={contribGoal.mode} onCancel={() => setContribGoal(null)} onSubmit={(amount) => contributeToGoal(contribGoal.goal.id, contribGoal.mode, amount)} />
      )}
    </div>
  );
}

/* ------------------------- Sub-componentes ------------------------- */

function SectionCard({ children, style }) {
  return <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: 16, marginBottom: 12, ...style }}>{children}</div>;
}

function ResumenTab({ chartData, totalPendiente, totalAhorrado, categoryBreakdown }) {
  return (
    <div>
      <SectionCard>
        <div className="disp" style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 10 }}>Últimos 6 meses</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.income} stopOpacity={0.55} />
                <stop offset="100%" stopColor={COLORS.income} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gEgresos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.expense} stopOpacity={0.5} />
                <stop offset="100%" stopColor={COLORS.expense} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={COLORS.border} />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: COLORS.textFaint }} axisLine={{ stroke: COLORS.border }} tickLine={false} />
            <Tooltip formatter={(v) => fmtMoney(v)} contentStyle={{ background: COLORS.surfaceHi, borderRadius: 10, border: `1px solid ${COLORS.border}`, fontSize: 12, color: COLORS.text }} labelStyle={{ color: COLORS.text }} />
            <Area type="monotone" dataKey="Ingresos" stroke={COLORS.income} strokeWidth={2} fill="url(#gIngresos)" />
            <Area type="monotone" dataKey="Egresos" stroke={COLORS.expense} strokeWidth={2} fill="url(#gEgresos)" />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 14 }}>
          <ClipboardList size={17} color={COLORS.expense} />
          <div style={{ fontSize: 10.5, color: COLORS.textFaint, marginTop: 8 }}>Pagos pendientes</div>
          <div className="amt" style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{fmtMoney(totalPendiente)}</div>
        </div>
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 14 }}>
          <PiggyBank size={17} color={COLORS.gold} />
          <div style={{ fontSize: 10.5, color: COLORS.textFaint, marginTop: 8 }}>Ahorrado en total</div>
          <div className="amt" style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>{fmtMoney(totalAhorrado)}</div>
        </div>
      </div>

      {categoryBreakdown.length > 0 && (
        <SectionCard>
          <div className="disp" style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Gasto por categoría</div>
          {categoryBreakdown.map(c => {
            const meta = categoryMeta("egreso", c.cat);
            const Icon = meta.icon;
            return (
              <div key={c.cat} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={13} color={COLORS.textDim} />
                    <span style={{ fontSize: 12.5, color: COLORS.text }}>{meta.label}</span>
                  </div>
                  <span className="amt" style={{ fontSize: 12, color: COLORS.textDim }}>{fmtMoney(c.amount)} · {c.pct.toFixed(0)}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${c.pct}%`, background: GRAD.expense, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </SectionCard>
      )}
    </div>
  );
}

function MovimientosTab({ monthTx, onRemove, onAdd }) {
  return (
    <div>
      <AddButton onClick={onAdd} icon={Plus} label="Registrar movimiento" />
      {monthTx.length === 0 ? (
        <EmptyState text="Aún no hay movimientos registrados este mes." />
      ) : (
        <SectionCard style={{ padding: 6 }}>
          {monthTx.map(t => {
            const meta = categoryMeta(t.type, t.category);
            const Icon = meta.icon;
            const isIncome = t.type === "ingreso";
            return (
              <div key={t.id} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: chipGradient(t.type, t.category), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={16} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: COLORS.text, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.description || meta.label}</div>
                  <div style={{ fontSize: 11, color: COLORS.textFaint }}>{meta.label} · {t.date}</div>
                </div>
                <div className="amt" style={{ fontSize: 13.5, fontWeight: 600, color: isIncome ? COLORS.income : COLORS.expense, whiteSpace: "nowrap" }}>
                  {isIncome ? "+" : "−"}{fmtMoney(t.amount)}
                </div>
                <button onClick={() => onRemove(t.id)} aria-label="Eliminar" style={{ background: "transparent", border: "none", color: COLORS.textFaint, padding: 4 }}>
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </SectionCard>
      )}
    </div>
  );
}

function PagosTab({ items, onToggle, onRemove, onAdd, totalPendiente }) {
  return (
    <div>
      <AddButton onClick={onAdd} icon={Plus} label="Agregar pago recurrente" />
      {items.length === 0 ? (
        <EmptyState text="No tienes pagos recurrentes configurados." />
      ) : (
        <SectionCard style={{ padding: 6 }}>
          {items.map(p => (
            <div key={p.id} className="row-hover" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", borderRadius: 12 }}>
              <button onClick={() => onToggle(p.id)} aria-label={p.paid ? "Marcar como pendiente" : "Marcar como pagado"}
                style={{
                  width: 28, height: 28, borderRadius: 9, flexShrink: 0, border: "none",
                  background: p.paid ? GRAD.income : "rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                {p.paid && <Check size={15} color="#fff" />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: COLORS.text, fontWeight: 500, textDecoration: p.paid ? "line-through" : "none", opacity: p.paid ? 0.6 : 1 }}>{p.description}</div>
                <div style={{ fontSize: 11, color: COLORS.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{
                    fontSize: 9.5, fontWeight: 600, padding: "1px 6px", borderRadius: 5, textTransform: "uppercase", letterSpacing: "0.03em",
                    background: p.recurring ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.08)",
                    color: p.recurring ? COLORS.incomeAlt : COLORS.textDim,
                  }}>
                    {p.recurring ? "Recurrente" : "Único"}
                  </span>
                  {p.recurring ? `Vence el día ${p.dueDay || 1}` : `Vence ${p.dueDate}`}
                </div>
              </div>
              <div className="amt" style={{ fontSize: 13.5, fontWeight: 600, color: p.paid ? COLORS.textFaint : COLORS.expense }}>{fmtMoney(p.amount)}</div>
              <button onClick={() => onRemove(p.id)} aria-label="Eliminar" style={{ background: "transparent", border: "none", color: COLORS.textFaint, padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 10px 6px", fontSize: 12.5, color: COLORS.textDim }}>
            <span>Total pendiente por pagar</span>
            <span className="amt" style={{ color: COLORS.expense, fontWeight: 700 }}>{fmtMoney(totalPendiente)}</span>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function AhorroTab({ goals, monthKey, onAdd, onRemove, onContribute }) {
  return (
    <div>
      <AddButton onClick={onAdd} icon={Target} label="Crear meta de ahorro" />
      {goals.length === 0 ? (
        <EmptyState text="Aún no tienes metas de ahorro. Crea una para empezar a planear." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {goals.map(g => {
            const pct = g.targetAmount > 0 ? Math.min(100, (Number(g.currentAmount) / Number(g.targetAmount)) * 100) : 0;
            let monthsLeft = null;
            if (g.targetDate) {
              const [ty, tm] = g.targetDate.split("-").map(Number);
              const [cy, cm] = monthKey.split("-").map(Number);
              monthsLeft = Math.max(1, (ty - cy) * 12 + (tm - cm));
            }
            const remaining = Math.max(0, Number(g.targetAmount) - Number(g.currentAmount));
            const suggestion = monthsLeft ? remaining / monthsLeft : null;

            return (
              <SectionCard key={g.id} style={{ marginBottom: 0 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <GradientRing percent={pct} size={68} stroke={7} colorFrom={COLORS.gold} colorTo={COLORS.goldAlt} label="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: COLORS.text }}>{g.name}</div>
                      <button onClick={() => onRemove(g.id)} aria-label="Eliminar meta" style={{ background: "transparent", border: "none", color: COLORS.textFaint, padding: 2 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.textFaint, marginBottom: 4 }}>
                      {g.targetDate ? `Meta para ${labelMonth(g.targetDate)}` : "Sin fecha límite"}
                    </div>
                    <div className="amt" style={{ fontSize: 12.5, color: COLORS.textDim }}>{fmtMoney(g.currentAmount)} de {fmtMoney(g.targetAmount)}</div>
                  </div>
                </div>

                {suggestion !== null && remaining > 0 && (
                  <div style={{ fontSize: 11.5, color: COLORS.textDim, margin: "10px 0 4px", padding: "8px 10px", background: "rgba(251,191,36,0.08)", borderRadius: 10 }}>
                    Sugerido: ahorra <span className="amt" style={{ color: COLORS.gold, fontWeight: 600 }}>{fmtMoney(suggestion)}</span> / mes durante {monthsLeft} {monthsLeft === 1 ? "mes" : "meses"}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => onContribute(g, "aporte")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "rgba(52,211,153,0.12)", color: COLORS.income, border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 600 }}>
                    <ArrowUpCircle size={14} /> Aportar
                  </button>
                  <button onClick={() => onContribute(g, "retiro")} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "rgba(244,114,182,0.12)", color: COLORS.expense, border: "none", borderRadius: 10, padding: "9px 0", fontSize: 12.5, fontWeight: 600 }}>
                    <ArrowDownCircle size={14} /> Retirar
                  </button>
                </div>
              </SectionCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddButton({ onClick, icon: Icon, label }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, justifyContent: "center", width: "100%",
      background: COLORS.surfaceAlt, color: COLORS.text, border: `1px dashed ${COLORS.border}`,
      borderRadius: 14, padding: "12px 14px", fontSize: 13.5, fontWeight: 500, marginBottom: 14
    }}>
      <Icon size={16} /> {label}
    </button>
  );
}

function EmptyState({ text }) {
  return <div style={{ textAlign: "center", padding: "34px 10px", color: COLORS.textFaint, fontSize: 13 }}>{text}</div>;
}

function TransactionForm({ onCancel, onSubmit, defaultDate }) {
  const [type, setType] = useState("egreso");
  const [category, setCategory] = useState(CATEGORIES.egreso[0].id);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate);

  const switchType = (t) => { setType(t); setCategory(CATEGORIES[t][0].id); };
  const submit = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0 || !date) return;
    onSubmit({ type, category, description: description.trim(), amount: value, date });
  };

  return (
    <Modal onCancel={onCancel} title="Nuevo movimiento">
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["ingreso", "egreso"].map(t => (
          <button key={t} onClick={() => switchType(t)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none",
            background: type === t ? (t === "ingreso" ? GRAD.income : GRAD.expense) : COLORS.surfaceAlt,
            color: type === t ? "#fff" : COLORS.textDim,
          }}>
            {t === "ingreso" ? "Ingreso" : "Egreso"}
          </button>
        ))}
      </div>

      <FieldLabel>Categoría</FieldLabel>
      <select value={category} onChange={e => setCategory(e.target.value)} style={selectStyle}>
        {CATEGORIES[type].map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>

      <FieldLabel>Descripción (opcional)</FieldLabel>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej. Mercado de la semana" style={inputStyle} />

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Monto</FieldLabel>
          <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>Fecha</FieldLabel>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <SubmitButton onClick={submit} label="Guardar movimiento" />
    </Modal>
  );
}

function PendingForm({ onCancel, onSubmit }) {
  const [recurring, setRecurring] = useState(true);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");
  const [dueDate, setDueDate] = useState(todayISO());

  const submit = () => {
    const value = parseFloat(amount);
    if (!description.trim() || !value || value <= 0) return;
    if (recurring) {
      const day = parseInt(dueDay, 10);
      onSubmit({ recurring: true, description: description.trim(), amount: value, dueDay: day >= 1 && day <= 31 ? day : 1 });
    } else {
      if (!dueDate) return;
      onSubmit({ recurring: false, description: description.trim(), amount: value, dueDate });
    }
  };

  return (
    <Modal onCancel={onCancel} title="Nuevo pago">
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[{ v: true, l: "Recurrente" }, { v: false, l: "Único" }].map(opt => (
          <button key={opt.l} onClick={() => setRecurring(opt.v)} style={{
            flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none",
            background: recurring === opt.v ? GRAD.expense : COLORS.surfaceAlt,
            color: recurring === opt.v ? "#fff" : COLORS.textDim,
          }}>
            {opt.l}
          </button>
        ))}
      </div>
      <div style={{ fontSize: 11.5, color: COLORS.textFaint, marginBottom: 4 }}>
        {recurring ? "Se repite cada mes hasta que lo elimines." : "Aparece solo en el mes de su fecha de vencimiento."}
      </div>

      <FieldLabel>Descripción</FieldLabel>
      <input value={description} onChange={e => setDescription(e.target.value)} placeholder={recurring ? "Ej. Arriendo, Internet, Tarjeta" : "Ej. Matrícula, Seguro anual"} style={inputStyle} />

      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel>Monto</FieldLabel>
          <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          {recurring ? (
            <>
              <FieldLabel>Día de vencimiento</FieldLabel>
              <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} style={inputStyle} />
            </>
          ) : (
            <>
              <FieldLabel>Fecha de vencimiento</FieldLabel>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={inputStyle} />
            </>
          )}
        </div>
      </div>
      <SubmitButton onClick={submit} label="Guardar pago" />
    </Modal>
  );
}

function GoalForm({ onCancel, onSubmit }) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  const submit = () => {
    const value = parseFloat(targetAmount);
    if (!name.trim() || !value || value <= 0) return;
    onSubmit({ name: name.trim(), targetAmount: value, targetDate: targetDate ? `${targetDate}-01` : null });
  };

  return (
    <Modal onCancel={onCancel} title="Nueva meta de ahorro">
      <FieldLabel>Nombre de la meta</FieldLabel>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej. Fondo de emergencia, Viaje" style={inputStyle} />
      <FieldLabel>Monto objetivo</FieldLabel>
      <input type="number" min="0" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="0" style={inputStyle} />
      <FieldLabel>Fecha límite (opcional)</FieldLabel>
      <input type="month" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={inputStyle} />
      <SubmitButton onClick={submit} label="Crear meta" />
    </Modal>
  );
}

function ContributeForm({ goal, mode, onCancel, onSubmit }) {
  const [amount, setAmount] = useState("");
  const isAporte = mode === "aporte";
  const submit = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return;
    onSubmit(value);
  };
  return (
    <Modal onCancel={onCancel} title={`${isAporte ? "Aportar a" : "Retirar de"} "${goal.name}"`}>
      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: 4 }}>
        {isAporte ? "Este monto se registrará como un egreso en tus movimientos." : "Este monto se registrará como un ingreso en tus movimientos."}
      </div>
      <FieldLabel>Monto</FieldLabel>
      <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={inputStyle} autoFocus />
      <SubmitButton onClick={submit} label={isAporte ? "Confirmar aporte" : "Confirmar retiro"} />
    </Modal>
  );
}

function Modal({ title, children, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderTopLeftRadius: 22, borderTopRightRadius: 22, width: "100%", maxWidth: 480, padding: "18px 18px 26px", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 className="disp" style={{ margin: 0, fontSize: 17, color: COLORS.text }}>{title}</h3>
          <button onClick={onCancel} aria-label="Cerrar" style={{ background: COLORS.surfaceAlt, border: "none", borderRadius: 8, color: COLORS.textDim, padding: 6 }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, color: COLORS.textFaint, marginBottom: 5, marginTop: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>{children}</div>;
}
function SubmitButton({ onClick, label }) {
  return (
    <button onClick={onClick} style={{ width: "100%", marginTop: 20, background: GRAD.expense, color: "#fff", border: "none", borderRadius: 12, padding: "13px 0", fontSize: 14, fontWeight: 600 }}>
      {label}
    </button>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
  background: COLORS.surfaceAlt, fontSize: 14, color: COLORS.text,
};
const selectStyle = { ...inputStyle, marginBottom: 4 };
