import type { Principal } from "@icp-sdk/core/principal";
export interface ShopPaymentInfo {
    network: string;
    phoneNumber: string;
    accountHolder: string;
}
export interface ShopData {
    businessName: string;
    ownerName: string;
    phone: string;
    address: string;
    payments: Array<ShopPaymentInfo>;
}
export interface ShopSocials {
    facebook: string;
    instagram: string;
    tiktok: string;
    photoUrl: string;
}
export interface ShopLocation {
    latitude: number;
    longitude: number;
}
export interface UserProfile {
    name: string;
}
export interface Order {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    deliveryTime: string;
    items: Array<OrderItem>;
    totalPrice: number;
    createdAt: bigint;
    status: OrderStatus;
    paymentProof?: PaymentProof;
    paymentStatus: PaymentStatus;
}
export interface OrderItem {
    productName: string;
    quantity: bigint;
    unitPrice: number;
}
export interface PaymentProof {
    proofText?: string;
    screenshotUrl?: string;
}
export interface Product {
    offer?: string;
    name: string;
    price: number;
}
export enum OrderStatus {
    verified = "verified",
    pending = "pending"
}
export enum PaymentStatus {
    paid = "paid",
    unpaid = "unpaid"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addProduct(product: Product): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteMyShop(): Promise<void>;
    deleteOrders(orderIndices: Array<bigint>): Promise<void>;
    deleteProduct(productName: string): Promise<void>;
    getAllShops(): Promise<Array<[Principal, ShopData]>>;
    getCallerUserProfile(): Promise<UserProfile | undefined>;
    getCustomerOrders(phone: string): Promise<Array<Order>>;
    getOrdersForShop(): Promise<Array<Order>>;
    getProductsForShop(shopOwner: Principal): Promise<Array<Product>>;
    getProductPhotos(shopOwner: Principal): Promise<Array<[string, string]>>;
    setProductPhoto(productName: string, photoUrl: string): Promise<void>;
    getShopLocation(shopOwner: Principal): Promise<ShopLocation | undefined>;
    getShopSocials(shopOwner: Principal): Promise<ShopSocials | undefined>;
    getUserProfile(user: Principal): Promise<UserProfile | undefined>;
    placeOrder(shopOwner: Principal, order: Order): Promise<void>;
    registerShop(shopData: ShopData): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setShopLocation(lat: number, lng: number): Promise<void>;
    submitPaymentProof(shopOwner: Principal, orderIndex: bigint, proofText: string, screenshotUrl: string): Promise<void>;
    updateProduct(product: Product): Promise<void>;
    updateShop(shopData: ShopData): Promise<void>;
    updateShopSocials(socials: ShopSocials): Promise<void>;
    verifyOrder(orderId: bigint): Promise<void>;
}
