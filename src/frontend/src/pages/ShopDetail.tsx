import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import { useParams } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle,
  Loader2,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  Store,
  User,
} from "lucide-react";
import { ArrowLeft, Share2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { toast } from "sonner";
import { OrderStatus } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useGetAllShops,
  useGetProductsForShop,
  usePlaceOrder,
} from "../hooks/useQueries";
import { useShopLocation, useUserLocation } from "../hooks/useShopLocation";
import { useShopPhoto } from "../hooks/useShopPhoto";
import { useShopSocials } from "../hooks/useShopSocials";
import { calcDistanceKm, formatDistance } from "../utils/distance";

export default function ShopDetail() {
  const { ownerPrincipal } = useParams({ from: "/shop/$ownerPrincipal" });
  const principal = Principal.fromText(ownerPrincipal);
  const { t } = useLanguage();
  const photoUrl = useShopPhoto(ownerPrincipal);
  const socials = useShopSocials(ownerPrincipal);
  const hasSocials = socials.facebook || socials.instagram || socials.tiktok;
  const { location: userLocation } = useUserLocation();
  const { data: shopLoc } = useShopLocation(ownerPrincipal);
  const distanceKm =
    userLocation && shopLoc
      ? calcDistanceKm(
          userLocation.lat,
          userLocation.lng,
          shopLoc.latitude,
          shopLoc.longitude,
        )
      : null;

  const { data: shops, isLoading: shopsLoading } = useGetAllShops();
  const { data: products, isLoading: productsLoading } =
    useGetProductsForShop(principal);
  const placeOrder = usePlaceOrder();

  const shop = shops?.find(([p]) => p.toString() === ownerPrincipal)?.[1];

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  // quantityText: free-text amount written by customer per product
  const [quantityText, setQuantityText] = useState<Record<string, string>>({});
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = (products ?? [])
      .filter((p) => (quantityText[p.name] ?? "").trim() !== "")
      .map((p) => ({
        // Encode the text quantity into the productName so it's visible to the shop owner
        productName: `${p.name} (${quantityText[p.name].trim()})`,
        quantity: BigInt(1),
        unitPrice: p.price,
      }));

    if (items.length === 0) {
      toast.error(t("selectAtLeastOne"));
      return;
    }

    if (!/^\d{10}$/.test(customerPhone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    const totalPrice = (products ?? []).reduce((sum, p) => {
      return (quantityText[p.name] ?? "").trim() !== "" ? sum + p.price : sum;
    }, 0);

    const order = {
      customerName,
      customerPhone,
      customerAddress,
      deliveryTime,
      items,
      totalPrice,
      status: OrderStatus.pending,
      createdAt: BigInt(Date.now() * 1_000_000),
    };

    try {
      await placeOrder.mutateAsync({ shopOwner: principal, order });
      setConfirmedOrder({ ...order, shopName: shop?.businessName });
      setOrderConfirmed(true);
      toast.success(t("orderPlacedSuccess"));
    } catch {
      toast.error(t("orderPlacedError"));
    }
  };

  if (shopsLoading || productsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-10 w-full">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-48 w-full mb-6 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-display font-extrabold mb-4">
              {t("shopNotFound")}
            </h1>
            <Link to="/">
              <Button data-ocid="nav.link" className="font-bold">
                {t("backToDirectory")}
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderConfirmed && confirmedOrder) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
            data-ocid="order.success_state"
          >
            <Card className="border-2 border-primary/20 shadow-md">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-display font-extrabold text-2xl">
                  {t("orderConfirmed")}
                </CardTitle>
                <p className="text-muted-foreground text-sm font-medium">
                  {t("orderPlacedAt", confirmedOrder.shopName)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 border-2 border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      {t("customer")}
                    </span>
                    <span className="font-bold">
                      {confirmedOrder.customerName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      {t("phone")}
                    </span>
                    <span className="font-bold">
                      {confirmedOrder.customerPhone}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground font-medium">
                      {t("deliveryTime")}
                    </span>
                    <span className="font-bold">
                      {confirmedOrder.deliveryTime}
                    </span>
                  </div>
                </div>
                <Link to="/">
                  <Button
                    className="w-full bg-primary text-primary-foreground font-bold"
                    data-ocid="order.primary_button"
                  >
                    {t("backToDirectory")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back nav */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToShops")}
          </Link>

          {/* Shop Banner */}
          <div className="mb-8">
            {photoUrl ? (
              <div className="w-full h-48 rounded-xl overflow-hidden mb-4 shadow-md">
                <img
                  src={photoUrl}
                  alt={shop.businessName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-48 rounded-xl mb-4 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center border-2 border-border shadow-md">
                <Store className="h-20 w-20 text-primary/30" />
              </div>
            )}
            <div className="flex flex-wrap items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground leading-tight">
                  {shop.businessName}
                </h1>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <User className="h-4 w-4" /> {shop.ownerName}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <Phone className="h-4 w-4" /> {shop.phone}
                  </span>
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="h-4 w-4" /> {shop.address}
                  </span>
                  {distanceKm !== null && (
                    <span className="flex items-center gap-1 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      <MapPin className="h-4 w-4" />{" "}
                      {formatDistance(distanceKm)} away
                    </span>
                  )}
                </div>
                {hasSocials && (
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-bold">
                      <Share2 className="h-3 w-3" /> {t("followUs")}:
                    </span>
                    {socials.facebook && (
                      <a
                        href={socials.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: "#1877F2" }}
                          type="button"
                          data-ocid="shop.facebook.button"
                        >
                          <FaFacebook className="h-3.5 w-3.5" />
                          {t("visitFacebook")}
                        </button>
                      </a>
                    )}
                    {socials.instagram && (
                      <a
                        href={socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400"
                          type="button"
                          data-ocid="shop.instagram.button"
                        >
                          <FaInstagram className="h-3.5 w-3.5" />
                          {t("visitInstagram")}
                        </button>
                      </a>
                    )}
                    {socials.tiktok && (
                      <a
                        href={socials.tiktok}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
                          style={{ backgroundColor: "#010101" }}
                          type="button"
                          data-ocid="shop.tiktok.button"
                        >
                          <FaTiktok className="h-3.5 w-3.5" />
                          {t("visitTikTok")}
                        </button>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Products */}
            <div>
              <h2 className="text-xl font-display font-extrabold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t("products")}
              </h2>
              {!products || products.length === 0 ? (
                <div
                  className="py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground"
                  data-ocid="products.empty_state"
                >
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{t("noProductsListed")}</p>
                </div>
              ) : (
                <div className="space-y-3" data-ocid="products.list">
                  {products.map((product, idx) => (
                    <Card
                      key={product.name}
                      className="border-2 border-border hover:border-primary/40 transition-colors"
                      data-ocid={`products.item.${idx + 1}`}
                    >
                      <CardContent className="py-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-sm">
                              {product.name}
                            </span>
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                              TSh {product.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {/* Quantity text input written by customer */}
                        <div className="space-y-1">
                          <Label
                            htmlFor={`qty-${product.name}`}
                            className="text-xs font-bold text-muted-foreground"
                          >
                            Kiasi / Quantity
                          </Label>
                          <Input
                            id={`qty-${product.name}`}
                            placeholder="Mfano: kilo moja na robo, lita 2..."
                            value={quantityText[product.name] ?? ""}
                            onChange={(e) =>
                              setQuantityText((prev) => ({
                                ...prev,
                                [product.name]: e.target.value,
                              }))
                            }
                            className="h-8 text-sm font-medium border-2 border-blue-200 focus:border-blue-500"
                            data-ocid={`products.input.${idx + 1}`}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Order Form */}
            <div>
              <h2 className="text-xl font-display font-extrabold mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                {t("placeYourOrder")}
              </h2>
              <Card className="border-2 border-primary/20 shadow-md">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="customerName" className="font-bold">
                        {t("yourName")}
                      </Label>
                      <Input
                        id="customerName"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                        data-ocid="order.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="customerPhone" className="font-bold">
                        {t("phoneNumber")}
                      </Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) =>
                          setCustomerPhone(
                            e.target.value.replace(/\D/g, "").slice(0, 10),
                          )
                        }
                        maxLength={10}
                        pattern="[0-9]{10}"
                        required
                        data-ocid="order.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="customerAddress" className="font-bold">
                        {t("deliveryAddress")}
                      </Label>
                      <Textarea
                        id="customerAddress"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        required
                        rows={2}
                        data-ocid="order.textarea"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="deliveryTime" className="font-bold">
                        {t("preferredDeliveryTime")}
                      </Label>
                      <Input
                        id="deliveryTime"
                        value={deliveryTime}
                        onChange={(e) => setDeliveryTime(e.target.value)}
                        required
                        data-ocid="order.input"
                      />
                    </div>

                    {/* Summary of selected items */}
                    {Object.values(quantityText).some(
                      (v) => v.trim() !== "",
                    ) && (
                      <div className="bg-primary/5 rounded-lg p-3 border-2 border-primary/20">
                        <p className="font-bold text-sm mb-2">
                          {t(
                            "itemsSelected",
                            Object.values(quantityText).filter(
                              (v) => v.trim() !== "",
                            ).length,
                          )}
                        </p>
                        <div className="space-y-1">
                          {(products ?? [])
                            .filter(
                              (p) => (quantityText[p.name] ?? "").trim() !== "",
                            )
                            .map((p) => (
                              <div
                                key={p.name}
                                className="flex justify-between text-xs"
                              >
                                <span className="font-medium text-muted-foreground">
                                  {p.name}
                                </span>
                                <span className="font-bold text-foreground">
                                  {quantityText[p.name]}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md"
                      disabled={placeOrder.isPending}
                      data-ocid="order.submit_button"
                    >
                      {placeOrder.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          {t("placingOrder")}
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {t("placeOrder")}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
