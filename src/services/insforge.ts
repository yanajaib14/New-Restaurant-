/// <reference types="vite/client" />

import { InsForgeClient } from "@insforge/sdk";

const API_URL = import.meta.env.VITE_INSFORGE_URL?.replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_INSFORGE_KEY;

if (!API_URL || !API_KEY) {
  console.warn("Missing InsForge URL or Key in environment variables.");
}

export const insforge = new InsForgeClient({
  baseUrl: API_URL,
  anonKey: API_KEY,
});
