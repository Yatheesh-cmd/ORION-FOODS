import { useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

const UPI_ID = "foodorder@upi";
const PAYEE_NAME = "FoodOrder App";

export default function PaymentModal({ onClose, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState(null);
  const [showPay, setShowPay] = useState(true);
  const [loading, setLoading] = useState(false);

  const handlePay = () => {
    if (!amount || amount <= 0) return toast.error("Enter a valid amount");

    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
      PAYEE_NAME
    )}&am=${amount}&cu=INR`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = upiUrl;
      setTimeout(() => {
        setShowPay(false);
      }, 1500);
    } else {
      toast.info("On Laptop, please scan the QR code below using your phone to pay.", {
        autoClose: 5000,
      });
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(UPI_ID);
    toast.success("UPI ID Copied!");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Please upload payment screenshot");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("amount", amount);
      fd.append("screenshot", file);
      await API.post("/payments", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Payment submitted, awaiting confirmation");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
      <div className="flex max-h-[96dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-bold leading-tight">Make Payment</h2>
            <p className="text-xs text-orange-100">
              {showPay ? "Pay by UPI, then upload the screenshot" : "Upload your payment proof"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xl leading-none transition hover:bg-white/30"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {showPay ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4">
                <img
                  src="/imgs/qr.png"
                  alt="QR"
                  className="mb-2 h-44 w-44 rounded-xl bg-white object-contain p-2 shadow-sm"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/150?text=QR+Code";
                  }}
                />
                <p className="mb-2 text-center text-sm text-gray-600">Scan to Pay or use UPI ID</p>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-1.5 shadow-sm">
                  <span className="text-sm font-bold text-gray-900">{UPI_ID}</span>
                  <button
                    onClick={copyUpiId}
                    className="text-xs font-bold text-orange-600 hover:underline"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="pay-amount" className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Enter Amount (₹)
                </label>
                <input
                  id="pay-amount"
                  type="number"
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handlePay}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 font-semibold text-white transition hover:bg-orange-600"
                >
                  Pay with GPay / UPI
                </button>

                <button
                  onClick={() => setShowPay(false)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-3 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  I have already paid, Upload Screenshot
                </button>
              </div>

              <p className="text-center text-xs text-gray-500">
                If you are on a laptop, clicking "Pay" might not open GPay. Please scan the QR code instead.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                <p className="text-center text-sm text-green-800">
                  Paid amount: <b>₹{amount}</b>
                </p>
                <p className="mt-1 text-center text-xs text-green-600">
                  Please upload the screenshot of your payment.
                </p>
              </div>

              <div>
                <label htmlFor="pay-file" className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Upload Screenshot
                </label>
                <input
                  id="pay-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-orange-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-orange-600 hover:file:bg-orange-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Uploading..." : "Submit Payment Proof"}
              </button>
              <button
                type="button"
                onClick={() => setShowPay(true)}
                className="w-full text-sm font-medium text-gray-500 hover:underline"
              >
                ← Go Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
