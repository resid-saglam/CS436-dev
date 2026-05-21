import { apiFetch } from "../api/api";

export interface Address {
    city: string;
    district: string;
    neighborhood: string;
    street: string;
    apartment: string;
    doorNumber: string;
    floor: string;
    zip: string;
    country: string;
}

export interface UserProfile {
    name: string;
    email: string;
    address: Address | null;
}

export const getProfile = () =>
    apiFetch<{ user: UserProfile }>("/users/profile").then((r) => {
        const u = r.user as any;
        if (u.address && typeof u.address === "string") {
            try {
                u.address = JSON.parse(u.address);
            } catch {
                u.address = null;
            }
        }
        return u as UserProfile;
    });


export const saveAddress = (address: Address) =>
    apiFetch<{ address: Address | string }>("/users/me/address", {
        method: "PUT",
        body: JSON.stringify({ address }),
    }).then((r) =>
        typeof r.address === "string" ? JSON.parse(r.address) : r.address
    );
