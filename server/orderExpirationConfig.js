const DEFAULT_RESERVATION_MINUTES = 60;
const MINIMUM_RESERVATION_MINUTES = 31;
const MAXIMUM_RESERVATION_MINUTES = 24 * 60;

export const getReservationMinutes = () => {
  const configured = Number.parseInt(process.env.ORDER_RESERVATION_MINUTES, 10);
  if (!Number.isFinite(configured)) return DEFAULT_RESERVATION_MINUTES;
  return Math.min(Math.max(configured, MINIMUM_RESERVATION_MINUTES), MAXIMUM_RESERVATION_MINUTES);
};

export const getReservationExpiry = (from = new Date()) => new Date(
  from.getTime() + getReservationMinutes() * 60 * 1000
);
