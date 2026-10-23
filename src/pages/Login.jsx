import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import {
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaSpinner,
  FaUtensils,
  FaCreditCard,
  FaClock,
} from "react-icons/fa";
import { GiHotMeal } from "react-icons/gi";

const PERKS = [
  { icon: FaUtensils, title: "Easy ordering", text: "Set breakfast, lunch and dinner counts in a tap." },
  { icon: FaCreditCard, title: "UPI & GPay payments", text: "Pay instantly and track your balance." },
  { icon: FaClock, title: "Live order tracking", text: "Follow every order until it arrives." },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "staff") navigate("/staff");
      else navigate("/customer");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-52px)] items-center justify-center overflow-hidden bg-slate-100 px-4 py-10 sm:px-6">
      {/* page background */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/25 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-orange-400/25 blur-3xl" />

      {/* ONE card: brand panel + form sit flush together */}
      <div className="animate-rise relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 lg:grid-cols-[5fr_6fr]">
        {/* ===================== LEFT: BRAND PANEL ===================== */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-gradient p-10 lg:flex">
          <div className="bg-grid-dark absolute inset-0" />
          <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
          <div className="absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-orange-500/30 blur-3xl" />

          <Link to="/" className="relative z-10 flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 text-2xl shadow-lg shadow-orange-500/30">
              <GiHotMeal />
            </span>
            <span className="font-display text-xl font-bold">ORION FoodOrder</span>
          </Link>

          <div className="relative z-10 my-10">
            <h1 className="text-3xl font-extrabold leading-tight text-white xl:text-4xl">
              Your meals for the day, sorted in a few taps.
            </h1>
            <ul className="mt-8 space-y-3">
              {PERKS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="glass flex items-start gap-4 rounded-2xl p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/90 text-white shadow-lg shadow-orange-500/20">
                    <Icon />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-blue-100/75">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-blue-200/60">
            © {new Date().getFullYear()} ORION FoodOrder
          </p>
        </aside>

        {/* ===================== RIGHT: FORM ===================== */}
        <main className="flex items-center px-6 py-10 sm:px-12 sm:py-14">
          <div className="mx-auto w-full max-w-sm">
            {/* mobile brand */}
            <Link to="/" className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-xl text-white">
                <GiHotMeal />
              </span>
              <span className="font-display text-lg font-bold text-slate-900">ORION FoodOrder</span>
            </Link>

            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <FaLock className="text-[10px]" /> Secure sign in
            </span>
            <h2 className="mt-4 text-3xl font-extrabold">Welcome back</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Sign in and we'll take you straight to your customer, staff or admin dashboard.
            </p>

            <form onSubmit={submit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="field-label">
                  Email address
                </label>
                <div className="group relative">
                  <FaEnvelope className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600" />
                  <input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field bg-slate-50 pl-11 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                <div className="group relative">
                  <FaLock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition group-focus-within:text-blue-600" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input-field bg-slate-50 pl-11 pr-12 focus:bg-white"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:text-blue-700"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" /> Signing in…
                  </>
                ) : (
                  <>
                    Sign in <FaArrowRight className="text-xs" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              New here?
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Link to="/register" className="btn-outline w-full py-3">
              Create an account
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}