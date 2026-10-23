import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaBars, FaTimes, FaSignOutAlt, FaTachometerAlt, FaUserShield, FaUserTie, FaArrowRight } from "react-icons/fa";
import { logo } from "../assets";

const ROLE_LINK = {
  customer: { to: "/customer", label: "Dashboard", icon: FaTachometerAlt },
  admin: { to: "/admin", label: "Admin", icon: FaUserShield },
  staff: { to: "/staff", label: "Staff", icon: FaUserTie },
};

const ROLE_BADGE = {
  customer: "bg-green-100 text-green-700",
  staff: "bg-blue-100 text-blue-700",
  admin: "bg-orange-100 text-orange-700",
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login");
  };

  const roleLink = user ? ROLE_LINK[user.role] : null;
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  const navLinkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
      isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-200/70 bg-white/60 shadow-lg shadow-slate-900/5 backdrop-blur-xl"
          : "border-slate-200/40 bg-white/70 backdrop-blur-xl"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-blue-700 via-blue-400 to-orange-500" />

      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-200 ring-1 ring-orange-200 transition group-hover:scale-105 group-hover:rotate-3">
            <img src={logo} alt="ORION Foods logo" className="h-7 w-7 object-contain" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-[#0b1b3f]">
            ORION <span className="text-orange-500">Foods</span>
          </span>
        </Link>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {!user && (
            <>
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
              <Link to="/register" className="btn-primary ml-1 px-5 py-2.5">
                Signup
                <FaArrowRight className="text-[10px]" />
              </Link>
            </>
          )}

          {user && (
            <>
              {roleLink && (
                <NavLink to={roleLink.to} className={navLinkClass}>
                  <roleLink.icon className="text-xs" />
                  {roleLink.label}
                </NavLink>
              )}

              <div className="ml-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 py-1.5 pl-1.5 pr-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 text-sm font-bold text-white shadow-md shadow-blue-700/25">
                  {initial}
                </span>
                <div className="leading-tight">
                  <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900">{user.name}</p>
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
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-500 hover:text-white hover:shadow-lg hover:shadow-red-500/25"
              >
                <FaSignOutAlt className="text-xs" />
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 md:hidden"
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="animate-rise absolute inset-x-0 top-full border-b border-slate-200/70 bg-white/90 p-4 shadow-xl backdrop-blur-xl md:hidden">
          {!user && (
            <div className="grid gap-3">
              <Link to="/login" className="btn-outline w-full py-3">
                Login
              </Link>
              <Link to="/register" className="btn-primary w-full py-3">
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
                  <p className="truncate font-semibold text-slate-900">{user.name}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-px text-[10px] font-bold uppercase tracking-wide ${
                      ROLE_BADGE[user.role] || "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              {roleLink && (
                <NavLink to={roleLink.to} className={(s) => `${navLinkClass(s)} w-full py-3`}>
                  <roleLink.icon className="text-xs" />
                  {roleLink.label}
                </NavLink>
              )}

              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
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