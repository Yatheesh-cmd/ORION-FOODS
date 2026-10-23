import { useEffect, useState } from "react";
import API from "../services/api";
import OrderForm from "../components/OrderForm";
import OrderTable from "../components/OrderTable";

const MIN_BALANCE = 500;

export default function Services() {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const c = await API.get("/customers/me");
    setCustomer(c.data);
    const o = await API.get("/orders/my");
    setOrders(o.data);
  };

  useEffect(() => {
    load();
  }, []);

  if (!customer) return <div className="p-8">Loading...</div>;

  const lowBalance = Number(customer.currentBalance) < MIN_BALANCE;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Orders (Services)</h1>
        <button
          onClick={() => !lowBalance && setShowForm(true)}
          disabled={lowBalance}
          title={
            lowBalance
              ? `Balance is below ₹${MIN_BALANCE}. Add a payment to order.`
              : "Add a new order"
          }
          className={`px-4 py-2 rounded text-white transition ${
            lowBalance
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-orange-600"
          }`}
        >
          + Add Order
        </button>
      </div>

      <div
        className={`bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-8 ${
          lowBalance ? "border border-red-300" : ""
        }`}
      >
        <div>
          <p className="text-xs text-gray-500">Current Balance</p>
          <p
            className={`font-bold text-lg ${
              lowBalance ? "text-red-600" : "text-primary"
            }`}
          >
            ₹{customer.currentBalance}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Total Meals</p>
          <p className="font-bold text-lg">{customer.totalMeals}</p>
        </div>
      </div>

      {lowBalance && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          <span className="text-lg leading-none">⚠️</span>
          <p className="text-sm font-semibold">
            Your balance is below ₹{MIN_BALANCE}. You cannot add new orders.
            Please add a payment first.
          </p>
        </div>
      )}

      <OrderTable orders={orders} />

      {showForm && !lowBalance && (
        <OrderForm
          customer={customer}
          onClose={() => setShowForm(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}