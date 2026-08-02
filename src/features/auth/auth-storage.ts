import type { CustomerAccount, CustomerProfile, CustomerRegistration } from "@/types/auth";

type StoredCustomerAccount = CustomerAccount & { password: string };

const ACCOUNTS_KEY = "berkah-oyot:customer-accounts";
const SESSION_KEY = "berkah-oyot:customer-session";

function canUseStorage() {
  return typeof window !== "undefined";
}

function readAccounts(): StoredCustomerAccount[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as StoredCustomerAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: StoredCustomerAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function setSession(accountId: string) {
  window.localStorage.setItem(SESSION_KEY, accountId);
}

function toPublicAccount(account: StoredCustomerAccount): CustomerAccount {
  return {
    id: account.id,
    profile: account.profile,
    createdAt: account.createdAt,
  };
}

export function getCurrentCustomer(): CustomerAccount | null {
  if (!canUseStorage()) return null;
  const accountId = window.localStorage.getItem(SESSION_KEY);
  if (!accountId) return null;
  const account = readAccounts().find((item) => item.id === accountId);
  return account ? toPublicAccount(account) : null;
}

export function registerCustomer(input: CustomerRegistration): CustomerAccount {
  const accounts = readAccounts();
  const email = input.email.trim().toLowerCase();

  if (accounts.some((account) => account.profile.email.toLowerCase() === email)) {
    throw new Error("Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.");
  }

  const profile: CustomerProfile = {
    fullName: input.fullName.trim(),
    email,
    phone: input.phone.trim(),
    province: input.province.trim(),
    city: input.city.trim(),
    district: input.district.trim(),
    postalCode: input.postalCode.trim(),
    address: input.address.trim(),
  };

  const account: StoredCustomerAccount = {
    id: crypto.randomUUID(),
    profile,
    password: input.password,
    createdAt: new Date().toISOString(),
  };

  writeAccounts([account, ...accounts]);
  setSession(account.id);
  return toPublicAccount(account);
}

export function loginCustomer(emailInput: string, password: string): CustomerAccount {
  const email = emailInput.trim().toLowerCase();
  const account = readAccounts().find(
    (item) => item.profile.email.toLowerCase() === email && item.password === password,
  );

  if (!account) throw new Error("Email atau password tidak sesuai.");
  setSession(account.id);
  return toPublicAccount(account);
}

export function updateCustomerProfile(accountId: string, profile: CustomerProfile): CustomerAccount {
  const accounts = readAccounts();
  const index = accounts.findIndex((account) => account.id === accountId);
  if (index < 0) throw new Error("Akun pelanggan tidak ditemukan.");

  accounts[index] = {
    ...accounts[index],
    profile: {
      ...profile,
      email: profile.email.trim().toLowerCase(),
    },
  };
  writeAccounts(accounts);
  return toPublicAccount(accounts[index]);
}

export function logoutCustomer() {
  if (canUseStorage()) window.localStorage.removeItem(SESSION_KEY);
}
