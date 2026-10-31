
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  FaLocationArrow,
  FaMapMarkerAlt,
  FaPen,
  FaExternalLinkAlt,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import API from "../services/api";
import {
  LOW_ACCURACY_METERS,
  isDeliverable,
  pincodeMessage,
  hasLocation,
  mapsLink,
} from "../assets/utils/delivery";

/* Loads the logged-in customer's pincode + saved location */
export function useCustomerDelivery(active = true) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/customers/me");
      setCustomer(data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't load your delivery details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  const pincode = customer?.pincode || "";

  return {
    customer,
    setCustomer,
    loading,
    pincode,
    deliverable: isDeliverable(pincode),
    location: hasLocation(customer?.location) ? customer.location : null,
    reload: load,
  };
}

/* Location view + "use current location" + edit. Used by customer and admin. */
export function LocationPanel({ location, onSave, allowDetect = true }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ note: "", lat: "", lng: "" });
  const has = hasLocation(location);
  const lowAccuracy = has && typeof location.accuracy === "number" && location.accuracy > LOW_ACCURACY_METERS;

  const persist = async (payload) => {
    setBusy(true);
    const ok = await onSave(payload);
    setBusy(false);
    return ok;
  };

  const detect = () => {
    if (!navigator.geolocation) {
      toast.error("Your browser doesn't support location");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const accuracy = Math.round(pos.coords.accuracy || 0);
        const ok = await persist({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy,
          note: has ? location.note || "" : "",
        });
        if (ok) {
          setEditing(false);
          if (accuracy > LOW_ACCURACY_METERS) {
            toast.warn(
              `Location accuracy is low (about ${accuracy} m). Laptops use Wi-Fi/IP, so it can be far off. Please use your phone, or edit the location.`,
              { autoClose: 8000 }
            );
          }
        }
      },
      (err) => {
        setBusy(false);
        toast.error(
          err.code === 1
            ? "Location permission denied. Please allow location access in your browser and try again."
            : "Couldn't get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const startEdit = () => {
    setForm({
      note: has ? location.note || "" : "",
      lat: has ? String(location.lat) : "",
      lng: has ? String(location.lng) : "",
    });
    setEditing(true);
  };

  const submitEdit = async () => {
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (
      form.lat.trim() === "" ||
      form.lng.trim() === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      toast.error("Enter a valid latitude and longitude");
      return;
    }
    const ok = await persist({ lat, lng, note: form.note.trim() });
    if (ok) setEditing(false);
  };

  const field =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <FaMapMarkerAlt />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Delivery location</p>
          {has ? (
            <>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </p>
              {typeof location.accuracy === "number" && (
                <p className={`text-xs font-semibold ${lowAccuracy ? "text-amber-600" : "text-emerald-600"}`}>
                  Accuracy ±{location.accuracy} m{lowAccuracy ? " · low, please verify on the map" : ""}
                </p>
              )}
              {location.note && <p className="break-words text-xs text-slate-600">{location.note}</p>}
              {location.updatedAt && (
                <p className="text-[11px] text-slate-400">
                  Updated {new Date(location.updatedAt).toLocaleString("en-IN")}
                </p>
              )}
              <a
                href={mapsLink(location.lat, location.lng)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:underline"
              >
                Open in Maps <FaExternalLinkAlt className="text-[10px]" />
              </a>
            </>
          ) : (
            <p className="mt-0.5 text-sm text-slate-500">No location set yet</p>
          )}
        </div>
      </div>

      {!editing && (
        <div className="mt-3 flex flex-wrap gap-2">
          {allowDetect && (
            <button
              type="button"
              onClick={detect}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              <FaLocationArrow />
              {busy ? "Getting location…" : "Use my current location"}
            </button>
          )}
          <button
            type="button"
            onClick={startEdit}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FaPen />
            Edit
          </button>
        </div>
      )}

      {editing && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Latitude</label>
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
                className={field}
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Longitude</label>
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
                className={field}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-slate-500">Landmark / note</label>
            <input
              type="text"
              maxLength={200}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="e.g. Near the temple, 2nd floor"
              className={field}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {allowDetect && (
              <button
                type="button"
                onClick={detect}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <FaLocationArrow />
                {busy ? "Getting…" : "Use current"}
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <FaTimes />
                Cancel
              </button>
              <button
                type="button"
                onClick={submitEdit}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <FaCheck />
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Customer-side card: pincode alert + location panel */
export function DeliveryLocationCard({ delivery, showAlert = true }) {
  const { loading, pincode, deliverable, location, setCustomer } = delivery;

  const save = async (payload) => {
    try {
      const { data } = await API.put("/customers/me/location", payload);
      setCustomer(data);
      toast.success("Delivery location saved");
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't save the location");
      return false;
    }
  };

  if (loading) return <div className="h-20 animate-pulse rounded-xl bg-slate-200/70" />;

  return (
    <div className="space-y-2">
      {showAlert && !deliverable && (
        <p className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-600">
          <FaExclamationTriangle className="mt-0.5 flex-none" />
          {pincodeMessage(pincode)}
        </p>
      )}
      <LocationPanel location={location} onSave={save} />
    </div>
  );
}
