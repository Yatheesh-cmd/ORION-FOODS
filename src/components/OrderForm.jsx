import { useState } from "react";
import API from "../services/api";

// Replace `icon` with an <img> by setting `img` (e.g. import breakfastImg from "../assets/breakfast.png")
const MEALS = [
  {
    key: "breakfast",
    label: "Breakfast",
    sub: "Start your day right",
    icon: "🍳",
    img: null,
    bg: "from-yellow-100 to-orange-100",
    ring: "ring-orange-300",
  },
  {
    key: "lunch",
    label: "Lunch",
    sub: "Hearty midday meal",
    icon: "🍛",
    img: null,
    bg: "from-green-100 to-emerald-100",
    ring: "ring-emerald-300",
  },
  {
    key: "dinner",
    label: "Dinner",
    sub: "Wind down with a good meal",
    icon: "🍽️",
    img: null,
    bg: "from-indigo-100 to-purple-100",
    ring: "ring-purple-300",
  },
];

const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD (local)

export default function OrderForm({ customer, onClose, onSuccess }) {
  const [date, setDate] = useState(today());
  const [counts, setCounts] = useState({ breakfast: 0, lunch: 0, dinner: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const change = (key, delta) =>
    setCounts((c) => ({ ...c, [key]: Math.max(0, c[key] + delta) }));

  const total = counts.breakfast + counts.lunch + counts.dinner;

  const handleSubmit = async () => {
    if (!date) return setError("Please select a date");
    if (total === 0) return setError("Add at least one meal");

    try {
      setLoading(true);
      setError("");
      // The logged-in customer is identified by the server (token),
      // so only date and meal counts are sent from here.
      await API.post("/orders", {
        date,
        breakfast: counts.breakfast,
        lunch: counts.lunch,
        dinner: counts.dinner,
      });
      onSuccess && (await onSuccess());
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-white">
          <div>
            <h2 className="text-xl font-bold">Add New Order</h2>
            <p className="text-sm text-orange-100">
              Choose a date and your meals
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

        <div className="space-y-5 p-6">
          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700">
              Order Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </div>

          {/* Meal cards */}
          <div className="space-y-3">
            {MEALS.map((m) => {
              const active = counts[m.key] > 0;
              return (
                <div
                  key={m.key}
                  className={`flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm transition ${
                    active
                      ? `ring-2 ${m.ring} border-transparent shadow-md`
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${m.bg}`}
                    >
                      {m.img ? (
                        <img
                          src={m.img}
                          alt={m.label}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">{m.icon}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.sub}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => change(m.key, -1)}
                      disabled={counts[m.key] === 0}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 text-lg font-bold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-lg font-bold text-gray-800">
                      {counts[m.key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => change(m.key, 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-lg font-bold text-white transition hover:bg-orange-600"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between rounded-lg bg-orange-50 px-4 py-3">
            <span className="text-sm font-semibold text-gray-700">
              Total meals
            </span>
            <span className="text-xl font-bold text-orange-600">{total}</span>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || total === 0}
              className="flex-1 rounded-lg bg-orange-500 py-2.5 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Placing..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
