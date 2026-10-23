import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUtensils,
  FaArrowRight,
  FaClock,
  FaPlus,
  FaMinus,
  FaCheckCircle,
  FaUser,
  FaUserTie,
  FaUserShield,
  FaBolt,
} from "react-icons/fa";
import { GiHotMeal } from "react-icons/gi";
import { MdOutlineFastfood, MdPayment } from "react-icons/md";

// Correct import from assets/index.js
import { about1 } from "../assets/index"; // change path if your assets folder is elsewhere (e.g. "../assets")

// Chef logo for the new 3rd section
const CHEF_LOGO =
  "https://png.pngtree.com/png-clipart/20240202/original/pngtree-chef-logo-for-culinary-png-image_14215663.png";

/* Demo prices – only used for the interactive sample card in the hero */
const SAMPLE_MEALS = [
  {
    key: "breakfast",
    label: "Breakfast",
    time: "7:30 AM",
    price: 40,
    emoji: "☕",
    tile: "from-amber-100 to-orange-200",
  },
  {
    key: "lunch",
    label: "Lunch",
    time: "1:00 PM",
    price: 70,
    emoji: "🍛",
    tile: "from-orange-100 to-rose-200",
  },
  {
    key: "dinner",
    label: "Dinner",
    time: "8:00 PM",
    price: 60,
    emoji: "🍲",
    tile: "from-blue-100 to-indigo-200",
  },
];

function SampleOrderCard() {
  const [counts, setCounts] = useState({ breakfast: 1, lunch: 1, dinner: 1 });

  const change = (key, delta) =>
    setCounts((c) => ({ ...c, [key]: Math.max(0, Math.min(9, c[key] + delta)) }));

  const total = SAMPLE_MEALS.reduce((sum, m) => sum + m.price * counts[m.key], 0);
  const items = SAMPLE_MEALS.reduce((sum, m) => sum + counts[m.key], 0);

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* soft glow behind the card */}
      <div className="absolute inset-0 -z-0 scale-95 rounded-[2rem] bg-gradient-to-br from-blue-400/40 to-orange-400/40 blur-2xl" />

      {/* floating status chips */}
      <div className="animate-float absolute -left-5 -top-6 z-20 hidden items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-xl ring-1 ring-slate-900/5 sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-600">
          <FaCheckCircle />
        </span>
        Payment received
      </div>
      <div className="animate-float-slow absolute -bottom-5 -right-4 z-20 hidden items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-xl shadow-orange-500/30 sm:flex">
        <FaClock /> Ready in 12 min
      </div>

      <div className="relative z-10 overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/30 ring-1 ring-white/40">
        {/* accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-blue-400 to-orange-500" />

        <div className="p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Today's order</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                  Live
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">Sample – try the counters</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FaUtensils />
            </span>
          </div>

          <ul className="space-y-3">
            {SAMPLE_MEALS.map(({ key, label, time, price, emoji, tile }) => {
              const active = counts[key] > 0;
              return (
                <li
                  key={key}
                  className={`group flex items-center justify-between rounded-2xl border p-3 transition-all duration-200 ${
                    active
                      ? "border-orange-200 bg-orange-50/50 shadow-sm"
                      : "border-slate-100 bg-slate-50 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl shadow-inner transition-transform duration-200 group-hover:scale-110 ${tile}`}
                    >
                      <span aria-hidden="true">{emoji}</span>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{label}</p>
                      <p className="text-xs text-slate-500">
                        {time} · ₹{price} each
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
                      <button
                        type="button"
                        aria-label={`Remove one ${label}`}
                        onClick={() => change(key, -1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
                      >
                        <FaMinus className="text-[10px]" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-slate-900">{counts[key]}</span>
                      <button
                        type="button"
                        aria-label={`Add one ${label}`}
                        onClick={() => change(key, 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-white transition hover:bg-blue-800"
                      >
                        <FaPlus className="text-[10px]" />
                      </button>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">₹{price * counts[key]}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-5 flex items-end justify-between rounded-2xl bg-[#0b1b3f] px-5 py-4 text-white">
            <div>
              <p className="text-xs text-blue-200/70">
                {items} {items === 1 ? "meal" : "meals"} today
              </p>
              <p className="text-sm font-medium text-blue-100">Total amount</p>
            </div>
            <span className="font-display text-3xl font-extrabold">₹{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Create your account",
    text: "Sign up in under a minute with your name, phone and delivery address.",
  },
  {
    title: "Choose your meals",
    text: "Set how many breakfasts, lunches and dinners you need for the day.",
  },
  {
    title: "Pay and track",
    text: "Pay by UPI or GPay, then follow the order until it reaches you.",
  },
];

const ROLES = [
  { icon: FaUser, name: "Customer", text: "Order meals, pay, view balance" },
  { icon: FaUserTie, name: "Staff", text: "Prepare and deliver orders" },
  { icon: FaUserShield, name: "Admin", text: "Manage users, menu and payments" },
];

const TRACK = ["Placed", "Preparing", "Delivered"];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden bg-brand-gradient">
        <div className="bg-grid-dark absolute inset-0" />
        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-orange-500/25 blur-3xl" />

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-20 lg:grid-cols-2 lg:pb-32 lg:pt-28">
          <div className="animate-rise text-center lg:text-left">
            <div className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-orange-200">
              <GiHotMeal className="text-lg text-orange-500" />
              Meal ordering for homes, hostels and offices
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Every meal of the day, ordered in <span className="text-gradient">one place.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-blue-100/80 lg:mx-0">
              ORION FoodOrder lets you plan breakfast, lunch and dinner, pay by UPI, and follow each order in
              real time.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <Link to="/register" className="btn-primary px-8 py-3.5">
                Get started free
                <FaArrowRight className="text-xs" />
              </Link>
              <Link to="/login" className="btn-outline-light px-8 py-3.5">
                Login to account
              </Link>
            </div>

            <ul className="mt-9 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-blue-100/80 lg:justify-start">
              {["UPI & GPay payments", "Live order tracking", "Separate staff and admin panels"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <FaCheckCircle className="text-orange-500" /> {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-rise delay-200">
            <SampleOrderCard />
          </div>
        </div>
      </section>

      {/* ============================ ABOUT ============================ */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20 sm:py-24">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-slate-900/5 md:grid md:grid-cols-2">
          {/* Left – Image (shows the full picture on every screen size) */}
          <div className="group relative flex min-h-[280px] items-center justify-center overflow-hidden bg-gradient-to-br from-orange-50 via-white to-blue-50 p-4 md:min-h-[460px] lg:p-6">
            <img
              src={about1}
              alt="Orion Foods – Homely & Healthy Food"
              className="h-auto max-h-[560px] w-full rounded-2xl object-contain transition duration-700 group-hover:scale-[1.03]"
            />
          </div>

          {/* Right – Content */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              About Orion Foods
            </div>

            <h2 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
              Homely Food. Healthy Food.
              <span className="mt-1 block text-blue-700">Restaurant & Caterers</span>
            </h2>

            <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
              At Orion Foods we believe every meal should taste like home — fresh, nutritious and prepared with
              care. We serve daily breakfast, lunch and dinner for homes, hostels and offices with complete
              transparency and hygiene.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                "No Ajinomoto",
                "No artificial colors & flavors",
                "No recycled oils",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <FaCheckCircle className="text-xs" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/25 transition hover:bg-blue-800"
              >
                Order healthy meals
                <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ CHEF / PARAGRAPH (3rd section) ============================ */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-20 sm:pb-24">
        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16">
          {/* Left – Chef logo */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 scale-90 rounded-full bg-gradient-to-br from-orange-300/40 to-blue-300/40 blur-3xl" />
            <div className="relative flex items-center justify-center rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-900/5 sm:p-10">
              <img
                src={CHEF_LOGO}
                alt="Orion Foods chef"
                className="h-auto max-h-[380px] w-full object-contain transition duration-500 hover:scale-105"
                loading="lazy"
              />
            </div>
          </div>

          {/* Right – Paragraph */}
          <div className="text-center md:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              Our Kitchen
            </div>

            <h2 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Cooked fresh by chefs who care about <span className="text-orange-500">every plate.</span>
            </h2>

            <p className="mt-5 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Behind every Orion Foods order is a kitchen team that cooks with fresh ingredients and simple,
              homely recipes. Meals are prepared in small batches every day, packed with hygiene in mind and
              delivered on time, so what reaches your table tastes just like food made at home.
            </p>

            <p className="mt-4 text-[15px] leading-relaxed text-slate-600 sm:text-base">
              Whether you are at home, in a hostel or at the office, you get the same care and the same taste
              at breakfast, lunch and dinner.
            </p>

            <div className="mt-8 flex justify-center md:justify-start">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-600"
              >
                Start ordering
                <FaArrowRight className="text-xs" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-24">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Built for the way people actually eat</h2>
          <p className="mt-4 text-lg text-slate-500">
            One platform for the person ordering, the team cooking and the admin keeping the books.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-6">
          {/* Easy ordering – large, dark blue */}
          <div className="group relative overflow-hidden rounded-3xl bg-[#0b1b3f] p-8 text-white transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/30 md:col-span-4">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blue-600/40 blur-3xl" />
            <div className="bg-grid-dark absolute inset-0 opacity-60" />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl text-orange-300 ring-1 ring-white/10">
              <MdOutlineFastfood />
            </span>
            <h3 className="relative mt-6 text-2xl font-bold text-white">Easy ordering</h3>
            <p className="relative mt-3 max-w-md leading-relaxed text-blue-100/75">
              Set your breakfast, lunch and dinner counts with a tap. Change them for tomorrow, or skip a day,
              without calling anyone.
            </p>
            <div className="relative mt-6 flex gap-2">
              {["☕ Breakfast", "🍛 Lunch", "🍲 Dinner"].map((m) => (
                <span
                  key={m}
                  className="glass rounded-full px-3.5 py-1.5 text-xs font-medium text-blue-50 transition group-hover:bg-white/20"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Payments – orange tint */}
          <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/15 md:col-span-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-2xl text-white shadow-lg shadow-orange-500/30">
              <MdPayment />
            </span>
            <h3 className="mt-6 text-xl font-bold">Secure payments</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Pay with UPI or GPay and see every payment and balance in one list.
            </p>
          </div>

          {/* Fast service */}
          <div className="card p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl md:col-span-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-700">
              <FaBolt />
            </span>
            <h3 className="mt-6 text-xl font-bold">Fast service</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Staff see new orders instantly, so meals are ready and delivered on time.
            </p>
            <div className="mt-5 flex items-center gap-1.5">
              {TRACK.map((t, i) => (
                <div key={t} className="flex flex-1 flex-col gap-1.5">
                  <span className={`h-1.5 rounded-full ${i < 2 ? "bg-blue-600" : "bg-slate-200"}`} />
                  <span className="text-[10px] font-medium text-slate-500">{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="card p-8 transition duration-300 hover:shadow-xl md:col-span-4">
            <h3 className="text-xl font-bold">A dashboard for every role</h3>
            <p className="mt-2 text-sm text-slate-500">Each person signs in and sees only what they need.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {ROLES.map(({ icon: Icon, name, text }) => (
                <div
                  key={name}
                  className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm transition group-hover:bg-blue-700 group-hover:text-white">
                    <Icon />
                  </span>
                  <p className="mt-3 font-semibold text-slate-900">{name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ HOW IT WORKS ============================ */}
      <section className="border-y border-slate-200 bg-white py-24">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="max-w-xl text-3xl font-bold sm:text-4xl">Your first order in three steps</h2>

          <ol className="mt-14 grid gap-10 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                {i < STEPS.length - 1 && (
                  <span className="absolute left-14 top-6 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-blue-300 to-orange-300 md:block" />
                )}
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 font-display text-lg font-bold text-white shadow-lg shadow-blue-700/30 ring-8 ring-white">
                  {i + 1}
                </span>
                <h3 className="mt-5 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 max-w-xs leading-relaxed text-slate-500">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ============================ CTA ============================ */}
      <section className="px-5 py-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-brand-gradient px-8 py-16 text-center sm:px-16">
          <div className="bg-grid-dark absolute inset-0" />
          <div className="absolute -bottom-20 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-orange-500/40 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to simplify your daily meals?</h2>
            <p className="mx-auto mt-4 max-w-xl text-blue-100/80">
              Create an account and place your first order today.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary px-8 py-3.5">
                Create account
                <FaArrowRight className="text-xs" />
              </Link>
              <Link to="/login" className="btn-outline-light px-8 py-3.5">
                I already have an account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} ORION FoodOrder. All rights reserved.
      </footer>
    </div>
  );
}