import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaWallet,
  FaUtensils,
  FaCreditCard,
  FaHistory,
  FaClipboardList,
  FaUserCircle,
  FaArrowRight,
  FaSyncAlt,
  FaTimes,
  FaPlus,
  FaMinus,
  FaCheck,
} from "react-icons/fa";
import API from "../services/api";
import CustomerDetailsCard from "../components/CustomerDetailsCard";

/* Ajinomoto-inspired palette (edit hex values here) */
const C = {
  blue: "#0b3a8c",
  blueDark: "#072a66",
  blueSoft: "#e8efff",
  red: "#d9262c",
  redSoft: "#fdecec",
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/* =====================================================================
   Auto order helpers
   schedule is an array of 7 entries indexed like JS getDay():
   0 = Sunday, 1 = Monday ... 6 = Saturday
===================================================================== */
const DAYS = [
  { idx: 1, label: "Monday" },
  { idx: 2, label: "Tuesday" },
  { idx: 3, label: "Wednesday" },
  { idx: 4, label: "Thursday" },
  { idx: 5, label: "Friday" },
  { idx: 6, label: "Saturday" },
  { idx: 0, label: "Sunday" },
];

const AUTO_MEALS = [
  { key: "breakfastCount", priceKey: "breakfast", label: "Breakfast", emoji: "🌅", cell: "bg-amber-50 ring-amber-200" },
  { key: "lunchCount", priceKey: "lunch", label: "Lunch", emoji: "☀️", cell: "bg-sky-50 ring-sky-200" },
  { key: "dinnerCount", priceKey: "dinner", label: "Dinner", emoji: "🌙", cell: "bg-indigo-50 ring-indigo-200" },
];

const DEFAULT_PRICES = { breakfast: 50, lunch: 70, dinner: 50 };
const blankDay = () => ({ breakfastCount: 0, lunchCount: 0, dinnerCount: 0 });
const blankWeek = () => Array.from({ length: 7 }, blankDay);
const clamp = (n) => Math.max(0, Math.min(99, Number.isFinite(n) ? n : 0));
const dayMeals = (d) => (d.breakfastCount || 0) + (d.lunchCount || 0) + (d.dinnerCount || 0);

const weekFromPlan = (plan) =>
  Array.from({ length: 7 }, (_, i) => ({
    breakfastCount: Number(plan?.schedule?.[i]?.breakfastCount || 0),
    lunchCount: Number(plan?.schedule?.[i]?.lunchCount || 0),
    dinnerCount: Number(plan?.schedule?.[i]?.dinnerCount || 0),
  }));

function Stepper({ value, onChange, label }) {
  return (
    <div className="inline-flex items-center gap-1.5" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 0}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3a8c]/40 disabled:opacity-40"
      >
        <FaMinus className="text-[10px]" />
      </button>
      <span className="w-6 text-center text-lg font-bold tabular-nums text-slate-900">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full text-white transition hover:opacity-90 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3a8c]/40"
        style={{ backgroundColor: C.blue }}
      >
        <FaPlus className="text-[10px]" />
      </button>
    </div>
  );
}

function MealCell({ meal, value, onChange }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 ring-1 ${meal.cell}`}>
      <span className="text-xs font-semibold text-slate-600">
        <span aria-hidden="true">{meal.emoji}</span> {meal.label}
      </span>
      <Stepper value={value} onChange={onChange} label={meal.label} />
    </div>
  );
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-7 w-12 flex-none items-center rounded-full transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0b3a8c]/20"
      style={{ backgroundColor: checked ? C.blue : "#cbd5e1" }}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}

/* =====================================================================
   Auto order modal
===================================================================== */
function AutoOrderModal({ open, plan, onClose, onSaved }) {
  const [enabled, setEnabled] = useState(false);
  const [week, setWeek] = useState(blankWeek);
  const [common, setCommon] = useState({ breakfastCount: 1, lunchCount: 1, dinnerCount: 1 });
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);

  const prices = plan?.prices || DEFAULT_PRICES;

  useEffect(() => {
    if (!open) return;
    setEnabled(Boolean(plan?.enabled));
    setWeek(weekFromPlan(plan));
    setCommon({ breakfastCount: 1, lunchCount: 1, dinnerCount: 1 });
  }, [open, plan]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const summary = useMemo(() => {
    let meals = 0;
    let cost = 0;
    let activeDays = 0;
    week.forEach((d) => {
      const n = dayMeals(d);
      if (n > 0) activeDays += 1;
      meals += n;
      cost +=
        d.breakfastCount * prices.breakfast + d.lunchCount * prices.lunch + d.dinnerCount * prices.dinner;
    });
    return { meals, cost, activeDays };
  }, [week, prices]);

  if (!open) return null;

  const setDay = (idx, key, value) =>
    setWeek((w) => w.map((d, i) => (i === idx ? { ...d, [key]: value } : d)));

  const applyCommonToAll = () => setWeek(Array.from({ length: 7 }, () => ({ ...common })));
  const clearAll = () => setWeek(blankWeek());

  const save = async () => {
    if (enabled && summary.meals === 0) {
      toast.error("Set at least one meal for at least one day");
      return;
    }
    setSaving(true);
    try {
      const { data } = await API.put("/auto-orders/me", { enabled, schedule: week });
      toast.success(enabled ? "Auto order is on. It starts from tomorrow." : "Auto order saved (turned off)");
      onSaved(data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't save auto order");
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape" && !saving) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" onKeyDown={onKeyDown}>
      <div
        aria-hidden="true"
        onClick={() => !saving && onClose()}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Set auto order"
        tabIndex={-1}
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl outline-none sm:max-w-3xl sm:rounded-3xl"
      >
        {/* Header */}
        <div
          className="flex items-start justify-between gap-4 px-5 py-5 text-white sm:px-6"
          style={{ background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueDark} 100%)` }}
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-white/15 text-lg ring-1 ring-white/25">
              <FaSyncAlt />
            </span>
            <div>
              <h2 className="text-xl font-bold leading-tight">Set auto order</h2>
              <p className="text-sm text-blue-100">Plan Monday to Sunday once. Orders are placed for you daily.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-xl p-2 text-blue-100 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-50"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {/* On / off */}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="font-bold text-slate-900">{enabled ? "Auto order is ON" : "Auto order is OFF"}</p>
              <p className="text-sm text-slate-500">
                When on, each day's order is added to your orders automatically and the amount is deducted from your balance.
              </p>
            </div>
            <Switch checked={enabled} onChange={setEnabled} label="Turn auto order on or off" />
          </div>

          {/* Common order */}
          <section aria-label="Same meals every day" className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900">Same order every day</h3>
                <p className="text-sm text-slate-500">e.g. B1 L1 D1, then apply it to all 7 days.</p>
              </div>
              <button
                type="button"
                onClick={applyCommonToAll}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0b3a8c]/25"
                style={{ backgroundColor: C.blue }}
              >
                <FaCheck className="text-xs" />
                Apply to all days
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {AUTO_MEALS.map((m) => (
                <MealCell
                  key={m.key}
                  meal={m}
                  value={common[m.key]}
                  onChange={(v) => setCommon((c) => ({ ...c, [m.key]: v }))}
                />
              ))}
            </div>
          </section>

          {/* Week */}
          <section aria-label="Weekly schedule">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900">Weekly schedule</h3>
              <button
                type="button"
                onClick={clearAll}
                className="text-sm font-semibold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3a8c]/40"
                style={{ color: C.red }}
              >
                Clear all
              </button>
            </div>

            <ul className="space-y-3">
              {DAYS.map((day) => {
                const d = week[day.idx];
                const n = dayMeals(d);
                return (
                  <li
                    key={day.idx}
                    className={`rounded-2xl border p-3 sm:p-4 ${n > 0 ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50"}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-bold text-slate-900">{day.label}</p>
                      {n > 0 ? (
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: C.blueSoft, color: C.blue }}>
                          {n} {n === 1 ? "meal" : "meals"}
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">No order</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {AUTO_MEALS.map((m) => (
                        <MealCell key={m.key} meal={m} value={d[m.key]} onChange={(v) => setDay(day.idx, m.key, v)} />
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 rounded-2xl p-4 text-center" style={{ backgroundColor: C.blueSoft }}>
            <div>
              <p className="text-xs text-slate-500">Days / week</p>
              <p className="text-2xl font-extrabold tabular-nums" style={{ color: C.blue }}>{summary.activeDays}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Meals / week</p>
              <p className="text-2xl font-extrabold tabular-nums" style={{ color: C.blue }}>{summary.meals}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Cost / week</p>
              <p className="text-2xl font-extrabold tabular-nums" style={{ color: C.blue }}>{formatINR(summary.cost)}</p>
            </div>
          </div>

          <p className="text-sm text-slate-500">
            Auto orders start from tomorrow. Days set to zero meals are skipped. You can edit or turn this off any time.
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300/60 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-white transition hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0b3a8c]/25 disabled:opacity-60"
            style={{ backgroundColor: C.blue }}
          >
            {saving ? "Saving…" : "Save auto order"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =====================================================================
   Dashboard pieces
===================================================================== */
function StatCard({ icon: Icon, label, value, hint, tone = "blue", negative = false }) {
  const tones = {
    blue: { bg: C.blueSoft, fg: C.blue },
    red: { bg: C.redSoft, fg: C.red },
  };
  const t = tones[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl text-lg"
          style={{ backgroundColor: t.bg, color: t.fg }}
        >
          <Icon />
        </span>
      </div>
      <p
        className="mt-3 truncate text-2xl font-extrabold tabular-nums sm:text-3xl"
        style={{ color: negative ? C.red : "#0f172a" }}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function ActionCard({ to, onClick, icon: Icon, title, text, primary = false, badge }) {
  const cls = `group flex w-full items-center gap-4 rounded-2xl p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus-visible:ring-4 sm:p-5 ${
    primary
      ? "text-white focus-visible:ring-[#d9262c]/30"
      : "border border-slate-200 bg-white text-slate-900 focus-visible:ring-[#0b3a8c]/20"
  }`;
  const style = primary ? { background: `linear-gradient(135deg, ${C.red} 0%, #b81c22 100%)` } : undefined;

  const inner = (
    <>
      <span
        className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl text-xl"
        style={primary ? { backgroundColor: "rgba(255,255,255,0.2)" } : { backgroundColor: C.blueSoft, color: C.blue }}
      >
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-base font-bold">
          {title}
          {badge && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">{badge}</span>
          )}
        </p>
        <p className={`text-sm ${primary ? "text-white/80" : "text-slate-500"}`}>{text}</p>
      </div>
      <FaArrowRight className="flex-none text-sm transition group-hover:translate-x-1" />
    </>
  );

  if (to) {
    return (
      <Link to={to} className={cls} style={style}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={style}>
      {inner}
    </button>
  );
}

function RecentOrders({ orders, loading }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <FaHistory style={{ color: C.blue }} />
          Recent orders
        </h3>
        <Link to="/services" className="text-sm font-semibold hover:underline" style={{ color: C.blue }}>
          View all
        </Link>
      </header>

      {loading ? (
        <div className="space-y-3 p-5 sm:p-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <span
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl"
            style={{ backgroundColor: C.blueSoft, color: C.blue }}
          >
            <FaUtensils />
          </span>
          <p className="mt-3 font-semibold text-slate-800">No orders yet</p>
          <p className="mt-1 text-sm text-slate-500">Place your first meal order to see it here.</p>
          <Link
            to="/services"
            className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: C.blue }}
          >
            Order now <FaArrowRight className="text-xs" />
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {orders.map((o) => (
            <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{o.serviceId}</p>
                <p className="text-sm text-slate-500">{formatDate(o.date)}</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="rounded-md bg-amber-100 px-2 py-1 text-amber-900">B {o.breakfastCount || 0}</span>
                <span className="rounded-md bg-sky-100 px-2 py-1 text-sky-900">L {o.lunchCount || 0}</span>
                <span className="rounded-md bg-indigo-100 px-2 py-1 text-indigo-900">D {o.dinnerCount || 0}</span>
              </div>
              <p className="w-full text-right text-base font-bold tabular-nums text-slate-900 sm:w-auto">
                {formatINR(o.totalCost)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CustomerDashboard() {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [autoPlan, setAutoPlan] = useState(null);
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const [c, o, a] = await Promise.allSettled([
        API.get("/customers/me"),
        API.get("/orders/my"),
        API.get("/auto-orders/me"),
      ]);

      if (c.status === "fulfilled") setCustomer(c.value.data);
      else {
        setFailed(true);
        toast.error(c.reason?.response?.data?.message || "Couldn't load your profile");
      }

      if (o.status === "fulfilled" && Array.isArray(o.value.data)) setOrders(o.value.data);
      setOrdersLoading(false);

      if (a.status === "fulfilled") setAutoPlan(a.value.data);
    })();
  }, []);

  if (failed) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-lg font-semibold text-slate-800">We couldn't load your dashboard.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl px-5 py-2.5 font-semibold text-white"
          style={{ backgroundColor: C.blue }}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        <div className="h-48 animate-pulse rounded-3xl bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const balance = Number(customer.currentBalance || 0);
  const firstName = customer.name?.split(" ")[0] || "there";
  const autoOn = Boolean(autoPlan?.enabled);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-10">
        {/* Greeting */}
        <header className="flex flex-col gap-1">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: C.red }}>
            Dashboard
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-4xl">
            Welcome back, <span style={{ color: C.blue }}>{firstName}</span>
          </h1>
          <p className="text-base text-slate-500">Here's a quick look at your account and meals.</p>
        </header>

        {/* Stats */}
        <section aria-label="Account summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            icon={FaWallet}
            label="Current balance"
            value={formatINR(balance)}
            hint={balance < 0 ? "Please add a payment" : "Available balance"}
            tone={balance < 0 ? "red" : "blue"}
            negative={balance < 0}
          />
          <StatCard icon={FaUtensils} label="Total meals" value={customer.totalMeals || 0} hint="Meals ordered so far" />
          <StatCard
            icon={FaCreditCard}
            label="Payments received"
            value={formatINR(customer.totalPaymentsReceived)}
            hint="Confirmed by admin"
          />
          <StatCard
            icon={FaClipboardList}
            label="Opening balance"
            value={formatINR(customer.openingBalance)}
            hint="Total amount added"
          />
        </section>

        {/* Quick actions */}
        <section aria-label="Quick actions" className="grid gap-3 sm:gap-4 md:grid-cols-3">
          <ActionCard to="/services" icon={FaUtensils} title="Orders / Services" text="Place or manage your meal orders" primary />
          <ActionCard
            onClick={() => setAutoOpen(true)}
            icon={FaSyncAlt}
            title="Set auto order"
            text={autoOn ? "Daily orders are placed automatically" : "Plan Monday to Sunday once"}
            badge={autoOn ? "ON" : undefined}
          />
          <ActionCard to="/customer/details" icon={FaUserCircle} title="Account details" text="Balance, payments and history" />
        </section>

        {/* Profile + recent orders */}
        <div className="grid items-start gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <CustomerDetailsCard customer={customer} />
          </div>
          <div className="lg:col-span-2">
            <RecentOrders orders={orders.slice(0, 5)} loading={ordersLoading} />
          </div>
        </div>
      </div>

      <AutoOrderModal
        open={autoOpen}
        plan={autoPlan}
        onClose={() => setAutoOpen(false)}
        onSaved={setAutoPlan}
      />
    </div>
  );
}