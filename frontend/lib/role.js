"use client";

// Demo "login": the chosen role lives in localStorage until Firebase Auth is wired up.
import { useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "bitgig_role";
const listeners = new Set();

function subscribe(callback) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

// role: "company" | "expert" | null
export function setRole(role) {
  if (role) localStorage.setItem(STORAGE_KEY, role);
  else localStorage.removeItem(STORAGE_KEY);
  listeners.forEach((listener) => listener());
}

export function useRole() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Picks a role and routes to that role's first screen.
export function useChooseRole() {
  const router = useRouter();
  return useCallback(
    (role) => {
      setRole(role);
      router.push(role === "company" ? "/company/gigs/new" : "/tasks");
    },
    [router]
  );
}
