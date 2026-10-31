export const DELIVERY_PINCODE = "683565";

export const LOW_ACCURACY_METERS = 100;

export const isDeliverable = (pincode) => String(pincode || "").trim() === DELIVERY_PINCODE;

export const pincodeMessage = (pincode) =>
  pincode
    ? `Sorry, we deliver only to pincode ${DELIVERY_PINCODE}. Your pincode ${pincode} is not valid for delivery. Please change your pincode in your Profile.`
    : `We deliver only to pincode ${DELIVERY_PINCODE}. Please add your pincode in your Profile.`;

export const hasLocation = (loc) =>
  Boolean(loc) && typeof loc.lat === "number" && typeof loc.lng === "number";

export const mapsLink = (lat, lng) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
