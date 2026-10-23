import { useEffect, useState } from "react";
import API from "../services/api";
import PaymentModal from "../components/PaymentModal";

const MIN_BALANCE = 500;

export default function CustomerDetails() {
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    const c = await API.get("/customers/me");
    setCustomer(c.data);
    const p = await API.get("/payments/my");
    setPayments(p.data);
  };

  useEffect(() => {
    load();
  }, []);

  if (!customer) return <div className="p-8">Loading...</div>;

  const lowBalance = Number(customer.currentBalance) < MIN_BALANCE;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Account Details</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-orange-600"
        >
          + Add Payment
        </button>
      </div>

      {lowBalance && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          <span className="text-lg leading-none">⚠️</span>
          <p className="text-sm font-semibold">
            Low balance! Your balance is below ₹{MIN_BALANCE}. You cannot add
            new orders until you add a payment.
          </p>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Customer ID</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Address</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Opening Bal.</th>
              <th className="p-2 text-left">Total Meals</th>
              <th className="p-2 text-left">Total Payments</th>
              <th className="p-2 text-left">Current Bal.</th>
              <th className="p-2 text-left">Payment Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className={`border-t ${lowBalance ? "bg-red-50/60" : ""}`}>
              <td className="p-2">{customer.customerId}</td>
              <td className="p-2">{customer.name}</td>
              <td className="p-2">{customer.address}</td>
              <td className="p-2">{customer.phone}</td>
              <td className="p-2">{customer.email}</td>
              <td className="p-2">₹{customer.openingBalance}</td>
              <td className="p-2">{customer.totalMeals}</td>
              <td className="p-2">₹{customer.totalPaymentsReceived}</td>
              <td className="p-2">
                <span
                  className={`font-semibold ${
                    lowBalance ? "text-red-600" : ""
                  }`}
                >
                  ₹{customer.currentBalance}
                </span>
                {lowBalance && (
                  <p className="mt-1 text-xs font-semibold text-red-600">
                    ⚠️ Below ₹{MIN_BALANCE} – recharge needed
                  </p>
                )}
              </td>
              <td className="p-2">
                {payments.length === 0 ? (
                  "—"
                ) : (
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      payments[0].status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : payments[0].status === "rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {payments[0].status}
                  </span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {showModal && (
        <PaymentModal
          onClose={() => setShowModal(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}