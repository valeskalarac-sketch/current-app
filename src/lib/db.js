import { supabase } from "./supabaseClient";

/* ---------- Mapeo de filas (snake_case en la BD) <-> objetos de la app (camelCase) ---------- */

function rowToTx(row) {
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    description: row.description || "",
    amount: Number(row.amount),
    date: row.date,
  };
}
function txToRow(userId, tx) {
  return {
    user_id: userId,
    type: tx.type,
    category: tx.category,
    description: tx.description || "",
    amount: tx.amount,
    date: tx.date,
  };
}

function rowToPending(row) {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    recurring: row.recurring,
    dueDay: row.due_day,
    dueDate: row.due_date,
    paidMonths: row.paid_months || {},
    paid: !!row.paid,
    paidTxId: row.paid_tx_id,
  };
}
function pendingToRow(userId, p) {
  return {
    user_id: userId,
    description: p.description,
    amount: p.amount,
    recurring: p.recurring,
    due_day: p.dueDay ?? null,
    due_date: p.dueDate ?? null,
    paid_months: p.paidMonths ?? {},
    paid: p.paid ?? false,
    paid_tx_id: p.paidTxId ?? null,
  };
}

function rowToGoal(row) {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    targetDate: row.target_date,
    currentAmount: Number(row.current_amount),
  };
}
function goalToRow(userId, g) {
  return {
    user_id: userId,
    name: g.name,
    target_amount: g.targetAmount,
    target_date: g.targetDate ?? null,
    current_amount: g.currentAmount ?? 0,
  };
}

/* ---------------------------------- Movimientos ---------------------------------- */

export async function fetchTransactions(userId) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToTx);
}

export async function insertTransaction(userId, tx) {
  const { data, error } = await supabase
    .from("transactions")
    .insert(txToRow(userId, tx))
    .select()
    .single();
  if (error) throw error;
  return rowToTx(data);
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
}

/* -------------------------------- Pagos pendientes -------------------------------- */

export async function fetchPending(userId) {
  const { data, error } = await supabase
    .from("pending_payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToPending);
}

export async function insertPending(userId, p) {
  const { data, error } = await supabase
    .from("pending_payments")
    .insert(pendingToRow(userId, p))
    .select()
    .single();
  if (error) throw error;
  return rowToPending(data);
}

export async function updatePending(id, patch) {
  const row = {};
  if ("paidMonths" in patch) row.paid_months = patch.paidMonths;
  if ("paid" in patch) row.paid = patch.paid;
  if ("paidTxId" in patch) row.paid_tx_id = patch.paidTxId;
  const { data, error } = await supabase
    .from("pending_payments")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToPending(data);
}

export async function deletePending(id) {
  const { error } = await supabase.from("pending_payments").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------------------------- Metas de ahorro ---------------------------------- */

export async function fetchGoals(userId) {
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToGoal);
}

export async function insertGoal(userId, g) {
  const { data, error } = await supabase
    .from("savings_goals")
    .insert(goalToRow(userId, g))
    .select()
    .single();
  if (error) throw error;
  return rowToGoal(data);
}

export async function updateGoalAmount(id, currentAmount) {
  const { data, error } = await supabase
    .from("savings_goals")
    .update({ current_amount: currentAmount })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return rowToGoal(data);
}

export async function deleteGoal(id) {
  const { error } = await supabase.from("savings_goals").delete().eq("id", id);
  if (error) throw error;
}
