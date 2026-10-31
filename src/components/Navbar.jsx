import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaTachometerAlt,
  FaUserShield,
  FaUserTie,
  FaArrowRight,
  FaWallet,
  FaUser,
  FaUtensils,
} from "react-icons/fa";
import { logo } from "../assets";
import { MIN_BALANCE, formatINR } from "../assets/utils/pricing";

const ROLE_LINK = {
  admin: { to: "/admin", label: "Admin", icon: FaUserShield },
  staff: { to: "/staff", label: "Staff", icon: FaUserTie },
};

const CUSTOMER_LINKS = [
  { to: "/customer", label: "Dashboard", icon: FaTachometerAlt, end: true },
  { to: "/services", label: "Orders", icon: FaUtensils },
  { to: "/customer/details", label: "Wallet", icon: FaWallet },
  { to: "/customer/profile", label: "Profile", icon: FaUser },
];

const ROLE_BADGE = {
  customer: "bg-emerald-100 text-emerald-800",
  staff: "bg-sky-100 text-sky-800",
  admin: "bg-violet-100 text-violet-800",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);

  const isCustomer = user?.role === "customer";

  const loadProfile = useCallback(async () => {
    if (!isCustomer) {
      setProfile(null);
      return;
    }
    try {
      const { data } = await API.get("/customers/me");
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, [isCustomer]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile, location.pathname]);

  useEffect(() => {
    window.addEventListener("balance:refresh", loadProfile);
    window.addEventListener("profile:updated", loadProfile);
    return () => {
      window.removeEventListener("balance:refresh", loadProfile);
      window.removeEventListener("profile:updated", loadProfile);
    };
  }, [loadProfile]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  const roleLink = user ? ROLE_LINK[user.role] : null;
  const displayName = profile?.name || user?.name || "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";
  const balance = Number(profile?.currentBalance || 0);
  const lowBalance = Boolean(profile) && balance < MIN_BALANCE;

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
      isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-800 via-blue-500 to-sky-400" />

      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-xl bg-blue-50 ring-1 ring-blue-100 transition group-hover:scale-105">
            <img src={logo} alt="ORION Foods logo" className="h-7 w-7 object-contain" />
          </span>
          <span className="truncate text-lg font-extrabold tracking-tight text-[#0b1b3f]">
            ORION <span className="text-red-600">Foods</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1.5 md:flex">
          {!user && (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
              <Link
                to="/register"
                className="ml-1 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-700/25 transition hover:bg-blue-800"
              >
                Signup
                <FaArrowRight className="text-[10px]" />
              </Link>
            </>
          )}

          {isCustomer &&
            CUSTOMER_LINKS.map((l) => {
              const isWallet = l.label === "Wallet";
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  aria-label={l.label}
                  title={l.label}
                  className={navLinkClass}
                >
                  <l.icon className="text-xs" />
                  {!isWallet && l.label}
                  {isWallet && profile && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        lowBalance ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {formatINR(balance)}
                    </span>
                  )}
                </NavLink>
              );
            })}

          {user && !isCustomer && roleLink && (
            <NavLink to={roleLink.to} className={navLinkClass}>
              <roleLink.icon className="text-xs" />
              {roleLink.label}
            </NavLink>
          )}

          {user && (
            <>
              <div className="ml-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 py-1.5 pl-1.5 pr-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 text-sm font-bold text-white shadow-md shadow-blue-700/25">
                  {initial}
                </span>
                <div className="leading-tight">
                  <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-2 py-px text-[10px] font-bold uppercase tracking-wide ${
                      ROLE_BADGE[user.role] || "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <FaSignOutAlt className="text-xs" />
                Logout
              </button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 md:hidden">
          {isCustomer && (
            <>
              <Link
                to="/customer/details"
                aria-label="Wallet"
                className="flex h-10 min-w-[48px] flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 bg-white px-1.5 shadow-sm transition active:scale-95"
              >
                <FaWallet className="text-sm text-blue-700" />
                <span className={`text-[10px] font-extrabold leading-none ${lowBalance ? "text-red-600" : "text-slate-900"}`}>
                  {profile ? formatINR(balance) : "…"}
                </span>
              </Link>
              <Link
                to="/customer/profile"
                aria-label="Profile"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sm text-blue-700 shadow-sm transition active:scale-95"
              >
                <FaUser />
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100"
          >
            {open ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="absolute inset-x-0 top-full border-b border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur-xl md:hidden">
          {!user && (
            <div className="grid gap-3">
              <Link
                to="/login"
                className="flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Signup
                <FaArrowRight className="text-[10px]" />
              </Link>
            </div>
          )}

          {user && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 font-bold text-white">
                  {initial}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-semibold text-slate-900">{displayName}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-px text-[10px] font-bold uppercase tracking-wide ${
                      ROLE_BADGE[user.role] || "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              {isCustomer &&
                CUSTOMER_LINKS.map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.end} className={(s) => `${navLinkClass(s)} w-full py-3`}>
                    <l.icon className="text-xs" />
                    {l.label}
                  </NavLink>
                ))}

              {!isCustomer && roleLink && (
                <NavLink to={roleLink.to} className={(s) => `${navLinkClass(s)} w-full py-3`}>
                  <roleLink.icon className="text-xs" />
                  {roleLink.label}
                </NavLink>
              )}

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                <FaSignOutAlt className="text-xs" />
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
