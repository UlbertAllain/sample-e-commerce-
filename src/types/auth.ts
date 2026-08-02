export type UserRole = "customer" | "admin";

export type CustomerProfile = {
  fullName: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  address: string;
};

export type CustomerAccount = {
  id: string;
  role: UserRole;
  profile: CustomerProfile;
  createdAt: string;
};

export type CustomerRegistration = CustomerProfile & {
  password: string;
};
