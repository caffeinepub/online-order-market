import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import { useParams } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  History,
  Loader2,
  MapPin,
  Package,
  Phone,
  Search,
  Share2,
  ShoppingCart,
  Store,
  Tag,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { toast } from "sonner";
import { OrderStatus, PaymentStatus } from "../backend.d";
import type { Order, ShopPaymentInfo } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useGetAllShops,
  useGetCustomerOrders,
  useGetProductPhotos,
  useGetProductsForShop,
  usePlaceOrder,
  useSubmitPaymentProof,
} from "../hooks/useQueries";
import { useShopLocation, useUserLocation } from "../hooks/useShopLocation";
import { useShopPhoto } from "../hooks/useShopPhoto";
import { useShopSocials } from "../hooks/useShopSocials";
import { calcDistanceKm, formatDistance } from "../utils/distance";

type ProductWithPhoto = {
  name: string;
  price: number;
  offer?: string;
  photoUrl?: string;
};

function PaymentModal({
  open,
  onClose,
  payments,
  shopOwner,
  orderIndex,
  t,
}: {
  open: boolean;
  onClose: () => void;
  payments: ShopPaymentInfo[];
  shopOwner: Principal;
  orderIndex: bigint;
  t: (key: any, ...args: any[]) => any;
}) {
  const [proofText, setProofText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [showProofForm, setShowProofForm] = useState(false);
  const submitProof = useSubmitPaymentProof();

  const handleCopy = (number: string) => {
    navigator.clipboard.writeText(number).then(() => {
      setCopied(number);
      setTimeout(() => setCopied(null), 2000);
      setShowProofForm(true); // Auto-show proof form after copy
    });
  };

  const handleOpenMpesa = (network: string, number: string) => {
    // Try deep links for common networks
    const n = network.toLowerCase();
    if (n.includes("m-pesa") || n.includes("mpesa")) {
      window.location.href = `mpesa://pay?number=${number}`;
    } else {
      // Fallback: open tel link to copy/dial
      window.location.href = `tel:${number}`;
    }
    setShowProofForm(true); // Auto-show proof form after opening app
  };

  const handleSubmitProof = async () => {
    try {
      await submitProof.mutateAsync({
        shopOwner,
        orderIndex,
        proofText,
        screenshotUrl: "",
      });
      toast.success(t("proofSubmitted"));
      setProofText("");
      setShowProofForm(false);
      onClose();
    } catch {
      toast.error(t("proofError"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-ocid="payment.dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display font-extrabold">
            <CreditCard className="h-5 w-5 text-primary" />
            {t("payNow")}
          </DialogTitle>
        </DialogHeader>

        {payments.length === 0 ? (
          <p className="text-muted-foreground text-sm font-medium">
            {t("noPaymentNumbers")}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 font-medium">
              {t("paymentInstructions")}
            </div>

            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={`${p.network}-${p.phoneNumber}`}
                  className="border-2 border-border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-primary">
                        {p.network}
                      </p>
                      <p className="font-extrabold text-lg tracking-widest">
                        {p.phoneNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.accountHolder}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs font-bold border-2 btn-bold"
                        onClick={() => handleCopy(p.phoneNumber)}
                        data-ocid="payment.button"
                      >
                        <Copy className="h-3 w-3" />
                        {copied === p.phoneNumber
                          ? t("copied")
                          : t("copyNumber")}
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs font-bold bg-primary text-primary-foreground btn-bold"
                        onClick={() =>
                          handleOpenMpesa(p.network, p.phoneNumber)
                        }
                        data-ocid="payment.primary_button"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t("openApp")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {!showProofForm ? (
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-primary text-primary-foreground font-bold btn-bold py-3"
                  onClick={() => setShowProofForm(true)}
                  data-ocid="payment.submit_button"
                >
                  {t("submitProof")}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 font-bold border-2 btn-bold"
                  onClick={onClose}
                  data-ocid="payment.cancel_button"
                >
                  {t("payLater")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder="Bandika ujumbe wa malipo hapa kama uthibitisho..."
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  rows={4}
                  className="border-2 font-medium"
                  data-ocid="payment.textarea"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-primary text-primary-foreground font-bold btn-bold"
                    onClick={handleSubmitProof}
                    disabled={submitProof.isPending || !proofText.trim()}
                    data-ocid="payment.confirm_button"
                  >
                    {submitProof.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {t("submitProof")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowProofForm(false)}
                    data-ocid="payment.close_button"
                  >
                    {t("cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerOrderHistory({ t }: { t: (key: any, ...args: any[]) => any }) {
  const [phone, setPhone] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const { data: orders, isLoading } = useGetCustomerOrders(searchPhone);

  return (
    <div className="space-y-4" data-ocid="history.panel">
      <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
        <History className="h-5 w-5 text-primary" />
        {t("myOrders")}
      </h3>
      <p className="text-sm text-muted-foreground font-medium">
        {t("enterPhoneToView")}
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="0712345678"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          maxLength={10}
          className="border-2 font-medium"
          data-ocid="history.input"
        />
        <Button
          className="bg-primary text-primary-foreground font-bold btn-bold"
          onClick={() => setSearchPhone(phone)}
          disabled={phone.length !== 10}
          data-ocid="history.primary_button"
        >
          <Search className="h-4 w-4 mr-1" />
          {t("searchOrders")}
        </Button>
      </div>

      {isLoading && searchPhone && (
        <div className="space-y-2" data-ocid="history.loading_state">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {orders && orders.length === 0 && searchPhone && (
        <p
          className="text-muted-foreground text-sm font-medium py-4 text-center"
          data-ocid="history.empty_state"
        >
          {t("noOrdersFound")}
        </p>
      )}

      {orders && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order: Order, idx: number) => (
            <Card
              key={order.createdAt.toString()}
              className="border-2 border-border"
              data-ocid={`history.item.${idx + 1}`}
            >
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    className={
                      order.status === "verified"
                        ? "bg-green-100 text-green-800 border-green-200 font-bold border"
                        : "bg-amber-50 text-amber-700 border-amber-300 font-bold border"
                    }
                  >
                    {order.status === "verified" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {t("verified")}
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        {t("pending")}
                      </>
                    )}
                  </Badge>
                  <Badge
                    className={
                      order.paymentStatus === "paid"
                        ? "bg-blue-50 text-blue-700 border-blue-200 font-bold border"
                        : "bg-gray-50 text-gray-600 border-gray-200 font-bold border"
                    }
                  >
                    {order.paymentStatus === "paid" ? t("paid") : t("unpaid")}
                  </Badge>
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-bold text-foreground">
                    {order.items.map((i) => i.productName).join(", ")}
                  </p>
                  <p className="text-muted-foreground font-medium">
                    {t("total")}: TSh {order.totalPrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    ⏰ {formatOrderTime(order.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatOrderTime(createdAt: bigint): string {
  const ms = Number(createdAt / BigInt(1_000_000));
  const date = new Date(ms);
  return date.toLocaleString("sw-TZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const { data: rawProducts, isLoading: productsLoading } =
    useGetProductsForShop(principal);
  const products = (rawProducts ?? []) as ProductWithPhoto[];
  const { data: productPhotos } = useGetProductPhotos(principal);
  const photoMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [name, url] of productPhotos ?? []) {
      m[name] = url;
    }
    // Fallback: check localStorage for cached photos
    for (const product of products) {
      if (!m[product.name]) {
        try {
          const cached = localStorage.getItem(
            `productPhoto_${ownerPrincipal}_${product.name}`,
          );
          if (cached) m[product.name] = cached;
        } catch {}
      }
    }
    return m;
  }, [productPhotos, products, ownerPrincipal]);
  const placeOrder = usePlaceOrder();

  const shop = shops?.find(([p]) => p.toString() === ownerPrincipal)?.[1];
  const shopPayments = shop?.payments ?? [];
  const hasOffers = products.some((p) => p.offer);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [quantityPreset, setQuantityPreset] = useState<Record<string, string>>(
    {},
  );
  const [quantityCustom, setQuantityCustom] = useState<Record<string, string>>(
    {},
  );
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [shopPhotoError, setShopPhotoError] = useState(false);
  const [productPhotoErrors, setProductPhotoErrors] = useState<
    Record<string, boolean>
  >({});
  const [productSearch, setProductSearch] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [confirmedOrderIndex] = useState<bigint>(BigInt(0));
  const [showHistory, setShowHistory] = useState(false);

  const QUANTITY_OPTIONS: { label: string; multiplier: number }[] = [
    { label: "robo", multiplier: 0.25 },
    { label: "nusu", multiplier: 0.5 },
    { label: "robo tatu", multiplier: 0.75 },
    { label: "kilo moja", multiplier: 1 },
    { label: "kilo mbili", multiplier: 2 },
    { label: "kilo tatu", multiplier: 3 },
    { label: "kilo nne", multiplier: 4 },
    { label: "kilo tano", multiplier: 5 },
  ];

  function getQuantityMultiplier(preset: string): number {
    return QUANTITY_OPTIONS.find((o) => o.label === preset)?.multiplier ?? 1;
  }

  function parseCustomMultiplier(text: string): number | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/[0-9]+([.,][0-9]+)?/);
    if (match) {
      const num = Number.parseFloat(match[0].replace(",", "."));
      if (!Number.isNaN(num) && num > 0) return num;
    }
    return null;
  }

  function getEffectiveMultiplier(
    productName: string,
    preset: Record<string, string>,
    custom: Record<string, string>,
  ): number {
    const c = (custom[productName] ?? "").trim();
    if (c) {
      const parsed = parseCustomMultiplier(c);
      return parsed ?? 1;
    }
    return getQuantityMultiplier(preset[productName] ?? "kilo moja");
  }

  function getEffectiveQuantityText(
    productName: string,
    preset: Record<string, string>,
    custom: Record<string, string>,
  ): string {
    const c = (custom[productName] ?? "").trim();
    if (c) return c;
    return preset[productName] ?? "";
  }

  const filteredProducts = productSearch.trim()
    ? products.filter((p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()),
      )
    : products;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = products
      .filter((p) => {
        const qText = getEffectiveQuantityText(
          p.name,
          quantityPreset,
          quantityCustom,
        );
        return qText !== "";
      })
      .map((p) => {
        const qText = getEffectiveQuantityText(
          p.name,
          quantityPreset,
          quantityCustom,
        );
        const multiplier = getEffectiveMultiplier(
          p.name,
          quantityPreset,
          quantityCustom,
        );
        return {
          productName: p.name,
          quantityText: qText,
          quantity: BigInt(1),
          unitPrice: p.price * multiplier,
        };
      });

    if (items.length === 0) {
      toast.error(t("selectAtLeastOne"));
      return;
    }

    if (!/^\d{10}$/.test(customerPhone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    const totalPrice = items.reduce((sum, item) => sum + item.unitPrice, 0);

    const order = {
      customerName,
      customerPhone,
      customerAddress,
      deliveryTime,
      items,
      totalPrice,
      status: OrderStatus.pending,
      paymentStatus: PaymentStatus.unpaid,
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
          <Skeleton className="aspect-square w-full max-w-sm mb-6 rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square w-full" />
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
              <Button data-ocid="nav.link" className="font-bold btn-bold">
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
                  <Separator />
                  <p className="text-xs font-bold text-muted-foreground">
                    {t("orderedItems")}:
                  </p>
                  {confirmedOrder.items.map((item: any) => (
                    <div
                      key={item.productName}
                      className="flex justify-between text-sm"
                    >
                      <span className="font-bold text-foreground">
                        {item.productName}
                      </span>
                      <span className="font-bold text-primary">
                        TSh {item.unitPrice.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm pt-1 border-t border-border">
                    <span className="font-bold">{t("total")}</span>
                    <span className="font-bold text-primary">
                      TSh {confirmedOrder.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                {shopPayments.length > 0 && (
                  <Button
                    className="w-full bg-primary text-primary-foreground font-bold btn-bold py-3"
                    onClick={() => setPaymentModalOpen(true)}
                    data-ocid="order.primary_button"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("payNow")}
                  </Button>
                )}

                <Link to="/">
                  <Button
                    variant="outline"
                    className="w-full font-bold border-2 btn-bold"
                    data-ocid="order.secondary_button"
                  >
                    {t("backToDirectory")}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </main>

        <PaymentModal
          open={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          payments={shopPayments}
          shopOwner={principal}
          orderIndex={confirmedOrderIndex}
          t={t}
        />

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

          {/* Offer Banner */}
          <AnimatePresence>
            {hasOffers && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-4 bg-orange-50 border-2 border-orange-300 rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <Tag className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <p className="font-bold text-orange-700 text-sm">
                  {t("hasOffers")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Shop Banner - Square Profile Photo */}
          <div className="mb-8">
            <div className="w-full max-w-xs mx-auto aspect-square rounded-xl overflow-hidden mb-4 shadow-md bg-muted">
              {photoUrl && !shopPhotoError ? (
                <img
                  src={photoUrl}
                  alt={shop.businessName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setShopPhotoError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center border-2 border-border">
                  <Store className="h-20 w-20 text-primary/30" />
                </div>
              )}
            </div>
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity btn-bold"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 btn-bold"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-90 transition-opacity btn-bold"
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display font-extrabold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  {t("products")}
                </h2>
              </div>

              {/* Product Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Tafuta bidhaa..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9 border-2 font-medium"
                  data-ocid="products.search_input"
                />
              </div>

              {!products || products.length === 0 ? (
                <div
                  className="py-12 text-center border-2 border-dashed rounded-xl text-muted-foreground"
                  data-ocid="products.empty_state"
                >
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{t("noProductsListed")}</p>
                </div>
              ) : (
                <div className="space-y-4" data-ocid="products.list">
                  {filteredProducts.map((product, idx) => (
                    <Card
                      key={product.name}
                      className="border-2 border-border hover:border-primary/40 transition-colors overflow-hidden"
                      data-ocid={`products.item.${idx + 1}`}
                    >
                      <CardContent className="pt-3 pb-4 flex flex-row items-start gap-3">
                        {/* Square product image - small on left */}
                        <div className="w-28 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted border border-border">
                          {photoMap[product.name] &&
                          !productPhotoErrors[product.name] ? (
                            <img
                              src={photoMap[product.name]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="eager"
                              onError={() => {
                                setProductPhotoErrors((prev) => ({
                                  ...prev,
                                  [product.name]: true,
                                }));
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              <Package className="h-8 w-8 text-primary/25" />
                            </div>
                          )}
                        </div>
                        {/* Product details on right */}
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Offer badge */}
                          {product.offer && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-full w-fit">
                              <Tag className="h-3 w-3 text-orange-500" />
                              <span className="text-xs font-bold text-orange-700">
                                {product.offer}
                              </span>
                            </div>
                          )}

                          {/* Name + price */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-extrabold text-base text-foreground">
                              {product.name}
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-primary text-primary-foreground shadow-sm">
                              TSh {product.price.toLocaleString()}
                            </span>
                          </div>

                          {/* Quantity picker */}
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-muted-foreground">
                              Kiasi / Quantity
                            </Label>
                            <Select
                              value={quantityPreset[product.name] ?? ""}
                              onValueChange={(val) => {
                                setQuantityPreset((prev) => ({
                                  ...prev,
                                  [product.name]: val,
                                }));
                                setQuantityCustom((prev) => ({
                                  ...prev,
                                  [product.name]: "",
                                }));
                              }}
                            >
                              <SelectTrigger
                                className="h-8 text-sm font-medium border-2 border-border focus:border-primary"
                                data-ocid={`products.select.${idx + 1}`}
                              >
                                <SelectValue placeholder="Chagua kiasi..." />
                              </SelectTrigger>
                              <SelectContent>
                                {QUANTITY_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.label} value={opt.label}>
                                    <span className="font-bold">
                                      {opt.label}
                                    </span>
                                    <span className="ml-2 text-muted-foreground text-xs">
                                      — TSh{" "}
                                      {(
                                        product.price * opt.multiplier
                                      ).toLocaleString()}
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {quantityPreset[product.name] &&
                              !(quantityCustom[product.name] ?? "").trim() && (
                                <p className="text-xs font-bold text-primary">
                                  Bei: TSh{" "}
                                  {(
                                    product.price *
                                    getQuantityMultiplier(
                                      quantityPreset[product.name],
                                    )
                                  ).toLocaleString()}
                                </p>
                              )}
                            <Input
                              placeholder="Au andika kiasi chako mwenyewe..."
                              value={quantityCustom[product.name] ?? ""}
                              onChange={(e) => {
                                setQuantityCustom((prev) => ({
                                  ...prev,
                                  [product.name]: e.target.value,
                                }));
                                if (e.target.value) {
                                  setQuantityPreset((prev) => ({
                                    ...prev,
                                    [product.name]: "",
                                  }));
                                }
                              }}
                              className="h-7 text-xs font-medium border border-border focus:border-primary"
                              data-ocid={`products.input.${idx + 1}`}
                            />
                            {(quantityCustom[product.name] ?? "").trim() &&
                              (() => {
                                const parsed = parseCustomMultiplier(
                                  quantityCustom[product.name] ?? "",
                                );
                                if (parsed !== null) {
                                  return (
                                    <p className="text-xs font-bold text-primary">
                                      Bei: TSh{" "}
                                      {(
                                        product.price * parsed
                                      ).toLocaleString()}
                                    </p>
                                  );
                                }
                                return null;
                              })()}
                          </div>
                        </div>
                        {/* end product details */}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Customer Order History */}
              <div className="mt-8 border-t-2 border-border pt-6">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 font-bold text-muted-foreground hover:text-foreground mb-4"
                  onClick={() => setShowHistory((v) => !v)}
                  data-ocid="history.toggle"
                >
                  <History className="h-4 w-4" />
                  {t("viewMyOrders")}
                </Button>
                {showHistory && <CustomerOrderHistory t={t} />}
              </div>
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
                        className="border-2 font-medium"
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
                        className="border-2 font-medium"
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
                        className="border-2 font-medium"
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
                        className="border-2 font-medium"
                        data-ocid="order.input"
                      />
                    </div>

                    {/* Order summary */}
                    {products.some(
                      (p) =>
                        getEffectiveQuantityText(
                          p.name,
                          quantityPreset,
                          quantityCustom,
                        ) !== "",
                    ) && (
                      <div className="bg-primary/5 rounded-lg p-3 border-2 border-primary/20">
                        <p className="font-bold text-sm mb-2">
                          Muhtasari wa Agizo:
                        </p>
                        <div className="space-y-1">
                          {products
                            .filter(
                              (p) =>
                                getEffectiveQuantityText(
                                  p.name,
                                  quantityPreset,
                                  quantityCustom,
                                ) !== "",
                            )
                            .map((p) => {
                              const qText = getEffectiveQuantityText(
                                p.name,
                                quantityPreset,
                                quantityCustom,
                              );
                              const multiplier = getEffectiveMultiplier(
                                p.name,
                                quantityPreset,
                                quantityCustom,
                              );
                              const lineTotal = p.price * multiplier;
                              return (
                                <div
                                  key={p.name}
                                  className="flex justify-between text-xs"
                                >
                                  <span className="font-medium text-muted-foreground">
                                    {p.name} ×{" "}
                                    <span className="font-bold text-foreground">
                                      {qText}
                                    </span>
                                  </span>
                                  <span className="font-bold text-primary">
                                    TSh {lineTotal.toLocaleString()}
                                  </span>
                                </div>
                              );
                            })}
                          <div className="flex justify-between text-xs pt-1 border-t border-primary/20 mt-1">
                            <span className="font-bold">Jumla / Total</span>
                            <span className="font-bold text-primary">
                              TSh{" "}
                              {products
                                .filter(
                                  (p) =>
                                    getEffectiveQuantityText(
                                      p.name,
                                      quantityPreset,
                                      quantityCustom,
                                    ) !== "",
                                )
                                .reduce((sum, p) => {
                                  const multiplier = getEffectiveMultiplier(
                                    p.name,
                                    quantityPreset,
                                    quantityCustom,
                                  );
                                  return sum + p.price * multiplier;
                                }, 0)
                                .toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {shopPayments.length > 0 && (
                      <div
                        className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3"
                        data-ocid="order.panel"
                      >
                        <p className="font-extrabold text-sm text-primary flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Namba za Malipo
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          Unaweza kulipa kupitia namba hizi kabla ya kuweka
                          agizo:
                        </p>
                        {shopPayments.map((p: any) => (
                          <div
                            key={`${p.network}-${p.phoneNumber}`}
                            className="flex items-center justify-between bg-white rounded-lg border border-primary/20 px-3 py-2"
                          >
                            <div>
                              <p className="font-bold text-xs text-primary">
                                {p.network}
                              </p>
                              <p className="font-extrabold text-base tracking-wider">
                                {p.phoneNumber}
                              </p>
                              {p.accountHolder && (
                                <p className="text-xs text-muted-foreground">
                                  {p.accountHolder}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs font-bold border-2"
                              onClick={() => {
                                navigator.clipboard.writeText(p.phoneNumber);
                                toast.success("Namba imenakiliwa!");
                              }}
                              data-ocid="order.button"
                            >
                              <Copy className="h-3 w-3" />
                              Nakili
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md btn-bold py-3"
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
