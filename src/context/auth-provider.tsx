"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile as updateFirebaseProfile } from "firebase/auth";
import { getFirebaseClientAuth } from "@/infrastructure/firebase/client";
import { apiFetch } from "@/lib/api/client";
import type { CustomerAccount, CustomerProfile, CustomerRegistration } from "@/types/auth";

type AuthContextValue = {
  user: CustomerAccount | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<CustomerAccount>;
  register: (input: CustomerRegistration) => Promise<CustomerAccount>;
  logout: () => Promise<void>;
  updateProfile: (profile: CustomerProfile) => Promise<CustomerAccount>;
  refreshUser: () => Promise<CustomerAccount | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerAccount | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refreshUser = useCallback(async () => {
    const account = await apiFetch<CustomerAccount | null>("/api/auth/me");
    setUser(account);
    return account;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void apiFetch<CustomerAccount | null>("/api/auth/me")
      .then((account) => {
        if (!cancelled) setUser(account);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    hydrated,
    refreshUser,
    async login(email, password) {
      const credential = await signInWithEmailAndPassword(getFirebaseClientAuth(), email.trim().toLowerCase(), password);
      const idToken = await credential.user.getIdToken(true);
      await apiFetch<{ role: string }>("/api/auth/session", { method: "POST", body: JSON.stringify({ idToken }) });
      const account = await apiFetch<CustomerAccount>("/api/auth/me");
      setUser(account);
      return account;
    },
    async register(input) {
      const auth = getFirebaseClientAuth();
      const credential = await createUserWithEmailAndPassword(auth, input.email.trim().toLowerCase(), input.password);
      await updateFirebaseProfile(credential.user, { displayName: input.fullName.trim() });
      const idToken = await credential.user.getIdToken(true);
      const profile: CustomerProfile = {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        province: input.province.trim(),
        city: input.city.trim(),
        district: input.district.trim(),
        postalCode: input.postalCode.trim(),
        address: input.address.trim(),
      };
      await apiFetch<{ role: string }>("/api/auth/session", { method: "POST", body: JSON.stringify({ idToken, profile }) });
      const account = await apiFetch<CustomerAccount>("/api/auth/me");
      setUser(account);
      return account;
    },
    async logout() {
      await Promise.allSettled([
        apiFetch<{ loggedOut: boolean }>("/api/auth/session", { method: "DELETE" }),
        signOut(getFirebaseClientAuth()),
      ]);
      setUser(null);
    },
    async updateProfile(profile) {
      const account = await apiFetch<CustomerAccount>("/api/account/profile", { method: "PATCH", body: JSON.stringify(profile) });
      setUser(account);
      return account;
    },
  }), [hydrated, refreshUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}
