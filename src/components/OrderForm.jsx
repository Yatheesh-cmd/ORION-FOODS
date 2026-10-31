import { useState } from "react";
import { toast } from "react-toastify";
import API from "../services/api";
import { PRICE, formatINR, normalCost } from "../assets/utils/pricing";
import { pincodeMessage } from "../assets/utils/delivery";
import { DeliveryLocationCard, useCustomerDelivery } from "../components/DeliveryLocation";
import {
  MEAL_KEYS,
  MEAL_LABEL,
  addDays,
  todayIST,
  isMealOpen,
  closedMessage,
  dateKey,
  openUntil,
  useNow,
} from "../assets/utils/cutoff";

const MEALS = [
  { key: "breakfast", icon: "🍳", tile: "from-amber-100 to-orange-100", ring: "ring-orange-300" },
  { key: "lunch", icon: "🍛", tile: "from-green-100 to-emerald-100", ring: "ring-emerald-300" },
  { key: "dinner", icon: "🍽️", tile: "from-indigo-100 to-purple-100", ring: "ring-purple-300" },
];

const COMBOS = [
  { label: "Breakfast + Lunch", meals: ["breakfast", "lunch"] },
  { label: "Breakfast + Dinner", meals: ["breakfast", "dinner"] },
  { label: "Lunch + Dinner", meals: ["lunch", "dinner"] },
];

const defaultDate = () => {
  const tomorrow = addDays(todayIST(), 1);
  return isMealOpen(tomorrow, "dinner") ? tomorrow : addDays(tomorrow, 1);
};

export default function OrderForm({ customer, order, onClose, onSuccess }) {
  const editing = Boolean(order);
  const now = useNow();
  const delivery = useCustomerDelivery(true);
  const blocked = !editing && !delivery.loading && !delivery.deliverable;
  const original = editing
    ? { breakfast: order.breakfastCount, lunch: order.lunchCount, dinner: order.dinnerCount }
    : { breakfast: 0, lunch: 0, dinner: 0 };

  const [date, setDate] = useState(editing ? dateKey(order.date) : defaultDate());
  const [counts, setCounts] = useState(original);
  const [loading, setLoading] = useState(false);

  const open = (meal, d = date) => isMealOpen(d, meal, now);

  const change = (meal, delta) => {
    if (!open(meal)) return toast.error(closedMessage(date, meal));
    setCounts((c) => ({ ...c, [meal]: Math.max(0, Math.min(20, c[meal] + delta)) }));
  };

  const pickCombo = (meals) => {
    const blockedMeal = meals.find((m) => !open(m));
    if (blockedMeal) return toast.error(closedMessage(date, blockedMeal));
    setCounts((c) => {
      const next = { ...c };
      MEAL_KEYS.forEach((k) => {
        if (open(k)) next[k] = meals.includes(k) ? 1 : 0;
      });
      return next;
    });
  };

  const changeDate = (value) => {
    setDate(value);
    setCounts((c) => {
      const next = { ...c };
      MEAL_KEYS.forEach((k) => {
        if (!isMealOpen(value, k, now)) next[k] = 0;
      });
      return next;
    });
  };

  const totalMeals = counts.breakfast + counts.lunch + counts.dinner;
  const totalAmount = normalCost(counts.breakfast, counts.lunch, counts.dinner);
  const extra = totalAmount - (editing ? Number(order.totalCost || 0) : 0);

  const handleSubmit = async () => {
    if (blocked) return toast.error(pincodeMessage(delivery.pincode));
    if (!date) return toast.error("Please select a date");
    if (totalMeals === 0) return toast.error("Add at least one meal");

    const touched = MEAL_KEYS.find((m) => counts[m] !== original[m] && !open(m));
    if (touched) return toast.error(closedMessage(date, touched));

    if (extra > 0 && Number(customer.currentBalance) - extra <= 0) {
      return toast.error("Not enough balance. Your balance must stay above ₹0. Please add a payment first.");
    }

    const body = {
      date,
      breakfastCount: counts.breakfast,
      lunchCount: counts.lunch,
      dinnerCount: counts.dinner,
    };

    try {
      setLoading(true);
      if (editing) await API.put(`/orders/${order._id}/mine`, body);
      else await API.post("/orders", body);
      toast.success(editing ? "Order updated" : "Order placed");
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
      <div className="flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3.5 text-white">
          <div>
            <h2 className="text-lg font-bold leading-tight">{editing ? "Edit Order" : "Add New Order"}</h2>
            <p className="text-xs text-orange-100">
              {editing ? `Service ${order.serviceId}` : "Choose a date and your meals"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xl leading-none transition hover:bg-white/30"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto p-4">
          <div>
            <label htmlFor="order-date" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">
              Order Date
            </label>
            <input
              id="order-date"
              type="date"
              value={date}
              min={addDays(todayIST(), 1)}
              disabled={editing}
              onChange={(e) => changeDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <DeliveryLocationCard delivery={delivery} showAlert={!editing} />

          <div className="grid grid-cols-3 gap-2">
            {COMBOS.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => pickCombo(c.meals)}
                className="rounded-xl border border-orange-300 bg-orange-50 px-1.5 py-2 text-[11px] font-bold leading-tight text-orange-700 transition hover:bg-orange-100 active:scale-95"
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {MEALS.map((m) => {
              const isOpen = open(m.key);
              const active = counts[m.key] > 0;
              return (
                <div
                  key={m.key}
                  className={`flex items-center justify-between rounded-xl border bg-white px-3 py-2 shadow-sm transition ${
                    active ? `ring-2 ${m.ring} border-transparent shadow-md` : "border-gray-200"
                  } ${isOpen ? "" : "opacity-60"}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br text-2xl ${m.tile}`}>
                      {m.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800">{MEAL_LABEL[m.key]}</p>
                      <p className="truncate text-[11px] text-gray-500">
                        <span className="font-semibold text-orange-600">{formatINR(PRICE[m.key])} each</span> ·{" "}
                        {isOpen ? (
                          <>closes {openUntil(date, m.key)}</>
                        ) : (
                          <span className="font-semibold text-red-600">Closed</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => change(m.key, -1)}
                      disabled={counts[m.key] === 0}
                      aria-label={`Remove ${MEAL_LABEL[m.key]}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-base font-bold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-base font-bold tabular-nums text-gray-800">
                      {counts[m.key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => change(m.key, 1)}
                      aria-label={`Add ${MEAL_LABEL[m.key]}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-base font-bold text-white transition hover:bg-orange-600 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-orange-50 px-4 py-2.5">
            <div>
              <p className="text-[11px] text-gray-500">
                {totalMeals} {totalMeals === 1 ? "meal" : "meals"} · Normal order, no combo offer
              </p>
              <p className="text-sm font-semibold text-gray-700">Total Amount</p>
            </div>
            <span className="text-2xl font-bold text-orange-600">{formatINR(totalAmount)}</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || totalMeals === 0 || blocked}
              className="flex-1 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : editing ? "Save Changes" : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
