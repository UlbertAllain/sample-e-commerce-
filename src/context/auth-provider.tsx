"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentCustomer,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateCustomerProfile,
} from "@/features/auth/auth-storage";
import type { CustomerAccount, CustomerProfile, CustomerRegistration } from "@/types/auth";

type AuthContextValue = {
  user: CustomerAccount | null;
  hydrated: boolean;
  login: (email: string, password: string) => void;
  register: (input: CustomerRegistration) => void;
  logout: () => void;
  updateProfile: (profile: CustomerProfile) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerAccount | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(getCurrentCustomer());
    setHydrated(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      hydrated,
      login(email, password) {
        setUser(loginCustomer(email, password));
      },
      register(input) {
        setUser(registerCustomer(input));
      },
      logout() {
        logoutCustomer();
        setUser(null);
      },
      updateProfile(profile) {
        if (!user) throw new Error("Silakan masuk terlebih dahulu.");
        setUser(updateCustomerProfile(user.id, profile));
      },
    }),
    [user, hydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth harus digunakan di dalam AuthProvider");
  return context;
}
