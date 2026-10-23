import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import API from "../services/api";

const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
];

const MEALS = [
  { key: "breakfastCount", label: "Breakfast", short: "B", emoji: "🌅", card: "bg-amber-50", on: "bg-amber-100 text-amber-900" },
  { key: "lunchCount", label: "Lunch", short: "L", emoji: "☀️", card: "bg-sky-50", on: "bg-sky-100 text-sky-900" },
  { key: "dinnerCount", label: "Dinner", short: "D", emoji: "🌙", card: "bg-indigo-50", on: "bg-indigo-100 text-indigo-900" },
];

const emptyDay = () => ({ breakfastCount: 0, lunchCount: 0, dinnerCount: 0 });
const emptyWeek = () => Object.fromEntries(DAYS.map((d) => [d.key, emptyDay()]));
const clamp = (n) => Math.max(0, Math.min(999, Number.isFinite(n) ? n : 0));
const dayTotal = (d) => d.breakfastCount + d.lunchCount + d.dinnerCount;
const errMsg = (err) => err?.response?.data?.message || err?.message || "Something went wrong";

function Stepper({ value, onChange, label, size = "md" }) {
  const btn = size === "sm" ? "h-7 w-7 text-base" : "h-9 w-9 text-lg";
  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= 0}
        onClick={() => onChange(clamp(value - 1))}
        className={`${btn} flex items-center justify-center rounded-full bg-white font-bold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-50 active:scale-95 disabled:opacity-40`}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min="0"
        max="999"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10)))}
        className={`${size === "sm" ? "w-9 text-base" : "w-12 text-2xl"} rounded-md bg-transparent text-center font-bold tabular-nums text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/40 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
      />
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(clamp(value + 1))}
        className={`${btn} flex items-center justify-center rounded-full bg-teal-700 font-bold text-white transition hover:bg-teal-800 active:scale-95`}
      >
        +
      </button>
    </div>
  );
}

export default function AutoOrderModal({ open, onClose, customers: customersProp }) {
  const [customers, setCustomers] = useState(customersProp || []);
  const [customerId, setCustomerId] = useState("");
  const [week, setWeek] = useState(emptyWeek);
  const [common, setCommon] = useState({ breakfastCount: 1, lunchCount: 1, dinnerCount: 1 });
  const [active, setActive] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Customers: use the prop if given, otherwise fetch */
  useEffect(() => {
    if (!open) return;
    if (customersProp?.length) {
      setCustomers(customersProp);
      return;
    }
    API.get("/customers")
      .then(({ data }) => setCustomers(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(errMsg(err)));
  }, [open, customersProp]);

  /* Reset when closed */
  useEffect(() => {
    if (!open) {
      setCustomerId("");
      setWeek(emptyWeek());
      setActive(true);
    }
  }, [open]);

  /* Esc + scroll lock */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, saving, onClose]);

  /* Load the saved schedule when a customer is picked */
  useEffect(() => {
    if (!customerId) return;
    let cancelled = false;
    setLoadingSchedule(true);
    API.get(`/auto-orders/${customerId}`)
      .then(({ data }) => {
        if (cancelled) return;
        const next = emptyWeek();
        DAYS.forEach((d) => {
          next[d.key] = { ...emptyDay(), ...(data?.days?.[d.key] || {}) };
        });
        setWeek(next);
        setActive(data?.active ?? true);
      })
      .catch(() => {
        if (!cancelled) {
          setWeek(emptyWeek());
          setActive(true);
        }
      })
      .finally(() => !cancelled && setLoadingSchedule(false));
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const selected = customers.find((c) => c.customerId === customerId);
  const weekTotal = useMemo(() => DAYS.reduce((t, d) => t + dayTotal(week[d.key]), 0), [week]);
  const activeDays = useMemo(() => DAYS.filter((d) => dayTotal(week[d.key]) > 0).length, [week]);

  const applyCommon = (keys) =>
    setWeek((w) => {
      const next = { ...w };
      keys.forEach((k) => {
        next[k] = { ...common };
      });
      return next;
    });

  const setDayMeal = (day, meal, v) =>
    setWeek((w) => ({ ...w, [day]: { ...w[day], [meal]: v } }));

  const save = async () => {
    if (!selected) return toast.error("Select a customer first");
    if (weekTotal === 0) return toast.error("Set at least one meal for the week");
    setSaving(true);
    try {
      await API.put(`/auto-orders/${selected.customerId}`, {
        customer: selected._id,
        active,
        days: week,
      });
      toast.success(`Auto order saved for ${selected.name}`);
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        aria-hidden="true"
        onClick={() => !saving && onClose()}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Set auto order"
        className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 px-5 pb-5 pt-5 text-white sm:px-6">
          <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold leading-tight">Set auto order</h2>
              <p className="mt-0.5 text-base text-teal-100">
                Set Monday–Sunday meals once. The order is entered automatically every day.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              className="rounded-xl p-1.5 text-xl leading-none text-teal-100 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {/* How it works */}
          <div className="rounded-2xl bg-teal-50 p-4 text-sm text-teal-900 ring-1 ring-teal-100">
            <p className="font-semibold">How it works</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Pick a customer.</li>
              <li>Set the common order (e.g. B1 L1 D1) and apply it to all days, or to Mon–Fri.</li>
              <li>Change any single day if needed. A day with 0 meals is skipped.</li>
              <li>Each day, the system adds that weekday's order to the orders table by itself.</li>
            </ol>
          </div>

          {/* Customer */}
          <div>
            <label htmlFor="auto-customer" className="mb-1.5 block text-base font-medium text-slate-700">Customer</label>
            <select
              id="auto-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-teal-600 focus:outline-none focus:ring-4 focus:ring-teal-600/15"
            >
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c._id} value={c.customerId}>
                  {c.name} ({c.customerId})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <>
              {/* Common order */}
              <section className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <h3 className="text-base font-semibold text-slate-800">Common order</h3>
                <p className="text-sm text-slate-500">Set once, then apply to the days you want.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {MEALS.map((m) => (
                    <div key={m.key} className={`flex flex-col items-center rounded-2xl p-3 ${m.card}`}>
                      <p className="text-base font-semibold text-slate-800">
                        <span aria-hidden="true">{m.emoji}</span> {m.label}
                      </p>
                      <div className="mt-2">
                        <Stepper label={m.label} value={common[m.key]} onChange={(v) => setCommon((c) => ({ ...c, [m.key]: v }))} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyCommon(DAYS.map((d) => d.key))}
                    className="rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-800"
                  >
                    Apply to all 7 days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCommon(DAYS.slice(0, 5).map((d) => d.key))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Apply to Mon–Fri
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeek(emptyWeek())}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Clear all
                  </button>
                </div>
              </section>

              {/* Weekly schedule */}
              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800">Weekly schedule</h3>
                  {loadingSchedule && <span className="text-sm text-slate-500">Loading saved schedule…</span>}
                </div>
                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200">
                  {DAYS.map((d) => {
                    const day = week[d.key];
                    const total = dayTotal(day);
                    return (
                      <li key={d.key} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${total === 0 ? "bg-slate-50/60" : "bg-white"}`}>
                        <div className="w-28">
                          <p className="text-base font-semibold text-slate-900">{d.label}</p>
                          <p className={`text-xs ${total === 0 ? "text-slate-400" : "text-teal-700"}`}>
                            {total === 0 ? "No order" : `${total} meal${total > 1 ? "s" : ""}`}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          {MEALS.map((m) => (
                            <div key={m.key} className="flex items-center gap-1.5">
                              <span className={`rounded-md px-1.5 py-0.5 text-xs font-semibold ${day[m.key] > 0 ? m.on : "bg-slate-100 text-slate-400"}`}>{m.short}</span>
                              <Stepper size="sm" label={`${d.label} ${m.label}`} value={day[m.key]} onChange={(v) => setDayMeal(d.key, m.key, v)} />
                            </div>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* Summary + active toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                <div>
                  <p className="text-sm text-slate-500">Per week</p>
                  <p className="text-2xl font-bold tabular-nums text-slate-900">
                    {weekTotal} <span className="text-base font-medium text-slate-500">meals · {activeDays} days</span>
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-base font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
                  />
                  Auto order is {active ? "ON" : "OFF"}
                </label>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !selected || loadingSchedule}
            className="rounded-lg bg-teal-700 px-4 py-2 text-base font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save auto order"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}