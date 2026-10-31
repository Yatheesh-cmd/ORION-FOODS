import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaPlus, FaUser, FaCreditCard, FaWallet, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import API from "../services/api";
import PaymentModal from "../components/PaymentModal";
import { MIN_BALANCE, formatINR } from "../assets/utils/pricing";

const STATUS_STYLE = {
  confirmed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  rejected: "bg-red-50 text-red-700 ring-1 ring-red-200",
  processing: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  pending: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
};

function Tile({ icon: Icon, label, children, tone = "bg-orange-50 text-orange-600", accent = "from-orange-400 to-amber-400" }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5">
      <span className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${tone}`}>
          <Icon />
        </span>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function CustomerDetails() {
  const [customer, setCustomer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([API.get("/customers/me"), API.get("/payments/my")]);
      setCustomer(c.data);
      setPayments(Array.isArray(p.data) ? p.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't load your wallet");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const afterPayment = async () => {
    await load();
    window.dispatchEvent(new Event("balance:refresh"));
  };

  if (!customer) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6">
        <div className="h-36 animate-pulse rounded-[2rem] bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  const balance = Number(customer.currentBalance || 0);
  const lowBalance = balance < MIN_BALANCE;
  const status = payments[0]?.status;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50">
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
        {/* ============ HEADER ============ */}
        <header className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-2xl shadow-slate-900/20 sm:p-8">
          <span className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-20 left-8 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
          <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:22px_22px]" />

          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-2xl text-white shadow-lg shadow-orange-500/30">
                <FaWallet />
              </span>
              <div>
                <h1 className="text-2xl font-extrabold text-white sm:text-3xl">My Wallet</h1>
                <p className="mt-0.5 text-sm font-medium text-slate-200">Your balance and payment status.</p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-600 hover:to-green-700 active:scale-95 sm:w-auto"
            >
              <FaPlus className="text-xs" />
              Add Payment
            </button>
          </div>
        </header>

        {lowBalance && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 px-5 py-4 text-red-700">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-red-100 text-red-600">
              <FaExclamationTriangle />
            </span>
            <p className="text-sm font-semibold leading-relaxed">
              Low balance! Your balance is below {formatINR(MIN_BALANCE)}. Please add a payment soon.
            </p>
          </div>
        )}

        {/* ============ TILES ============ */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Tile icon={FaUser} label="Name" tone="bg-blue-50 text-blue-600" accent="from-blue-400 to-sky-400">
            <p className="truncate text-xl font-extrabold text-slate-900">{customer.name}</p>
          </Tile>

          <Tile
            icon={FaCreditCard}
            label="Total Payments"
            tone="bg-emerald-50 text-emerald-600"
            accent="from-emerald-400 to-green-500"
          >
            <p className="text-xl font-extrabold tabular-nums text-slate-900">
              {formatINR(customer.totalPaymentsReceived)}
            </p>
          </Tile>

          <Tile
            icon={FaWallet}
            label="Current Bal."
            tone={lowBalance ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"}
            accent={lowBalance ? "from-red-400 to-rose-500" : "from-orange-400 to-amber-400"}
          >
            <p className={`text-2xl font-extrabold tabular-nums ${lowBalance ? "text-red-600" : "text-orange-600"}`}>
              {formatINR(balance)}
            </p>
            {lowBalance && (
              <p className="mt-1 text-xs font-semibold text-red-600">Below {formatINR(MIN_BALANCE)} – recharge needed</p>
            )}
          </Tile>

          <Tile
            icon={FaCheckCircle}
            label="Payment Status"
            tone="bg-indigo-50 text-indigo-600"
            accent="from-indigo-400 to-violet-500"
          >
            {status ? (
              <span
                className={`inline-block rounded-full px-3.5 py-1 text-sm font-bold capitalize ${
                  STATUS_STYLE[status] || "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                }`}
              >
                {status}
              </span>
            ) : (
              <p className="text-xl font-extrabold text-slate-400">—</p>
            )}
          </Tile>
        </section>
      </div>

      {showModal && <PaymentModal onClose={() => setShowModal(false)} onSuccess={afterPayment} />}
    </div>
  );
}
