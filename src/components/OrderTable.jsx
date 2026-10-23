import { useEffect, useState } from "react";

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return isNaN(dt)
    ? d
    : dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

function MealCard({ emoji, label, count, tile }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${tile} p-4 text-center shadow-sm`}
    >
      <div className="text-3xl">{emoji}</div>
      <p className="mt-1 text-xs font-medium text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{count ?? 0}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <p className="break-words text-sm font-semibold text-gray-800">
        {value || "-"}
      </p>
    </div>
  );
}

function OrderDetailModal({ order, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const totalMeals =
    (order.breakfastCount || 0) +
    (order.lunchCount || 0) +
    (order.dinnerCount || 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between rounded-t-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-5 text-white">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">
              Order Details
            </p>
            <h2 className="mt-1 text-xl font-bold">{order.serviceId}</h2>
            <p className="mt-1 text-sm opacity-90">{formatDate(order.date)}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-lg leading-none hover:bg-white/30"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Meals */}
          <div>
            <h3 className="mb-2 text-sm font-bold text-gray-700">Meals</h3>
            <div className="grid grid-cols-3 gap-3">
              <MealCard
                emoji="☕"
                label="Breakfast"
                count={order.breakfastCount}
                tile="from-amber-50 to-orange-100"
              />
              <MealCard
                emoji="🍛"
                label="Lunch"
                count={order.lunchCount}
                tile="from-orange-50 to-rose-100"
              />
              <MealCard
                emoji="🍲"
                label="Dinner"
                count={order.dinnerCount}
                tile="from-blue-50 to-indigo-100"
              />
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Service ID" value={order.serviceId} />
            <InfoRow label="Customer ID" value={order.customerId} />
            <InfoRow label="Date" value={formatDate(order.date)} />
            <InfoRow label="Total Meals" value={totalMeals} />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-orange-50 p-4">
            <span className="text-sm text-gray-600">Total Cost</span>
            <span className="text-2xl font-bold text-orange-600">
              ₹{order.totalCost}
            </span>
          </div>
        </div>

        <div className="p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-gray-100 py-2.5 font-semibold text-gray-700 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrderTable({ orders }) {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">Service ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Customer ID</th>
                <th className="px-4 py-3 text-center">Breakfast</th>
                <th className="px-4 py-3 text-center">Lunch</th>
                <th className="px-4 py-3 text-center">Dinner</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o._id} className="transition hover:bg-orange-50/50">
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {o.serviceId}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(o.date)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{o.customerId}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-semibold text-amber-700">
                        {o.breakfastCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-orange-100 px-2.5 py-0.5 font-semibold text-orange-700">
                        {o.lunchCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 font-semibold text-blue-700">
                        {o.dinnerCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-800">
                      ₹{o.totalCost}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelected(o)}
                        className="rounded-lg border border-orange-500 px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-500 hover:text-white"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <OrderDetailModal order={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}