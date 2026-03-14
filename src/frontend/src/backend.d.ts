import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ShopData {
    ownerName: string;
    businessName: string;
    address: string;
    phone: string;
}
export type Time = bigint;
export interface OrderItem {
    productName: string;
    quantity: bigint;
    unitPrice: number;
}
export interface Order {
    customerName: string;
    status: OrderStatus;
    customerPhone: string;
    createdAt: Time;
    deliveryTime: string;
    customerAddress: string;
    items: Array<OrderItem>;
    totalPrice: number;
}
export interface UserProfile {
    name: string;
}
export interface Product {
    name: string;
    price: number;
}
export enum OrderStatus {
    verified = "verified",
    pending = "pending"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(product: Product): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteProduct(productName: string): Promise<void>;
    getAllShops(): Promise<Array<[Principal, ShopData]>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrdersForShop(): Promise<Array<Order>>;
    getProductsForShop(shopOwner: Principal): Promise<Array<Product>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    placeOrder(shopOwner: Principal, order: Order): Promise<void>;
    registerShop(shopData: ShopData): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateProduct(product: Product): Promise<void>;
    updateShop(shopData: ShopData): Promise<void>;
    verifyOrder(orderId: bigint): Promise<void>;
}
