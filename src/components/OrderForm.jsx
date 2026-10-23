import { useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

const PRICE = { breakfast: 50, lunch: 70, dinner: 50 };

export default function OrderForm({ customer, onClose, onSuccess }) {
  const [date, setDate] = useState("");
  const [breakfastCount, setB] = useState(0);
  const [lunchCount, setL] = useState(0);
  const [dinnerCount, setD] = useState(0);

  const totalCost =
    breakfastCount * PRICE.breakfast +
    lunchCount * PRICE.lunch +
    dinnerCount * PRICE.dinner;

  const submit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/orders", {
        date,
        breakfastCount,
        lunchCount,
        dinnerCount,
      });
      toast.success("Order placed");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <form
        onSubmit={submit}
        className="bg-white rounded-xl p-6 w-full max-w-md space-y-3"
      >
        <div className="flex justify-between">
          <h2 className="text-xl font-bold">Add Order</h2>
          <button type="button" onClick={onClose}>✕</button>
        </div>
        <div>
          <label className="text-sm text-gray-600">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Customer ID</label>
          <input
            disabled
            value={customer.customerId}
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input
            disabled
            value={customer.email}
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Service ID (auto)</label>
          <input
            disabled
            value="Auto-generated on save"
            className="w-full border rounded px-3 py-2 bg-gray-100"
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-gray-600">Breakfast (₹50)</label>
            <input
              type="number"
              min="0"
              value={breakfastCount}
              onChange={(e) => setB(+e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Lunch (₹70)</label>
            <input
              type="number"
              min="0"
              value={lunchCount}
              onChange={(e) => setL(+e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600">Dinner (₹50)</label>
            <input
              type="number"
              min="0"
              value={dinnerCount}
              onChange={(e) => setD(+e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
        </div>
        <div className="text-right font-semibold">
          Total: ₹{totalCost}
        </div>
        <button className="w-full bg-primary text-white py-2 rounded hover:bg-orange-600">
          Enter
        </button>
      </form>
    </div>
  );
}