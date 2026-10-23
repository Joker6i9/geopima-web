export const API_URL = process.env.GEOPIMA_API_URL?.replace(/\/$/, "");
/** With no API configured the app runs on the built-in demo dataset. */
export const isDemo = !API_URL;
