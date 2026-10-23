import { useState } from "react";
import API from "../services/api";
import { toast } from "react-toastify";

const UPI_ID = "foodorder@upi"; // നിങ്ങളുടെ യഥാർത്ഥ UPI ID കൊടുക്കുക
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
      // മൊബൈൽ ആണെങ്കിൽ നേരിട്ട് ആപ്പ് തുറക്കാൻ ശ്രമിക്കുന്നു
      window.location.href = upiUrl;
      // സ്ക്രീൻഷോട്ട് അപ്‌ലോഡ് ചെയ്യാനുള്ള ഫോം കാണിക്കുന്നു
      setTimeout(() => {
        setShowPay(false);
      }, 1500);
    } else {
      // ലാപ്ടോപ്പ് ആണെങ്കിൽ എറർ വരാതിരിക്കാൻ QR സ്കാൻ ചെയ്യാൻ ആവശ്യപ്പെടുന്നു
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between mb-4 items-center">
          <h2 className="text-xl font-bold text-gray-800">Make Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-xl font-bold">
            ✕
          </button>
        </div>

        {showPay ? (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center border relative">
              <img
                src="/imgs/qr.png"
                alt="QR"
                className="w-48 h-48 object-contain mb-2"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150?text=QR+Code";
                }}
              />
              <p className="text-center text-sm text-gray-600 mb-1">
                Scan to Pay or use UPI ID:
              </p>
              <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border shadow-sm">
                <span className="font-bold text-gray-900 text-sm">{UPI_ID}</span>
                <button 
                  onClick={copyUpiId}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enter Amount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handlePay}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex justify-center items-center gap-2"
              >
                <span>Pay with GPay / UPI</span>
              </button>
              
              <button
                onClick={() => setShowPay(false)}
                className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                I have already paid, Upload Screenshot
              </button>
            </div>
            
            <p className="text-xs text-center text-gray-500">
              If you are on a laptop, clicking "Pay" might not open GPay. Please scan the QR code instead.
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 text-center">
                Paid amount: <b>₹{amount}</b>
              </p>
              <p className="text-xs text-green-600 text-center mt-1">
                Please upload the screenshot of your payment.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Screenshot</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Submit Payment Proof"}
            </button>
            <button
              type="button"
              onClick={() => setShowPay(true)}
              className="w-full text-gray-500 text-sm hover:underline mt-2"
            >
              ← Go Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}