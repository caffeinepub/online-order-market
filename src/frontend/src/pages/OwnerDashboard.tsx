import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Principal } from "@icp-sdk/core/principal";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  Camera,
  CheckCircle,
  Clock,
  CreditCard,
  ImagePlus,
  Loader2,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Settings,
  Share2,
  ShoppingBag,
  Tag,
  Trash2,
  User,
  Volume2,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { toast } from "sonner";
import type { ShopData, ShopPaymentInfo } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useNotifSound } from "../hooks/useNotifSound";
import { playSound, useOrderNotification } from "../hooks/useOrderNotification";
import {
  useAddProduct,
  useDeleteMyShop,
  useDeleteProduct,
  useGetAllShops,
  useGetMyProducts,
  useGetOrdersForShop,
  useGetProductPhotos,
  useRegisterShop,
  useUpdateProduct,
  useUpdateShop,
  useVerifyOrder,
} from "../hooks/useQueries";
import { useSaveShopLocation, useShopLocation } from "../hooks/useShopLocation";
import {
  useShopPhotoReactive,
  useUploadShopPhoto,
} from "../hooks/useShopPhoto";
import { useSaveShopSocials, useShopSocials } from "../hooks/useShopSocials";
import { convertToJpeg } from "../utils/imageUtils";

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

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

const SOUND_OPTIONS = [
  { id: "bell", label: "Bell" },
  { id: "chime", label: "Chime" },
  { id: "ding", label: "Ding" },
  { id: "alert", label: "Alert" },
];

const PAYMENT_NETWORKS = [
  "M-Pesa",
  "Tigo Pesa",
  "Airtel Money",
  "Halopesa",
  "Zantel",
];

type ProductWithPhoto = {
  name: string;
  price: number;
  offer?: string;
  photoUrl?: string;
};

export default function OwnerDashboard() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { actor } = useActor();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: "/owner/login" });
    }
  }, [identity, isInitializing, navigate]);

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const ownerPrincipal = identity?.getPrincipal().toString();

  const { data: allShops, isLoading: shopsLoading } = useGetAllShops();
  const { data: orders, isLoading: ordersLoading } = useGetOrdersForShop();
  const { data: rawProducts, isLoading: productsLoading } = useGetMyProducts();
  const products = (rawProducts ?? []) as ProductWithPhoto[];
  const ownerPrincipalObj = ownerPrincipal
    ? Principal.fromText(ownerPrincipal)
    : null;
  const { data: productPhotos } = useGetProductPhotos(ownerPrincipalObj);
  const photoMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [name, url] of productPhotos ?? []) {
      m[name] = url;
    }
    // Fallback: check localStorage for cached photos
    for (const product of products) {
      if (!m[product.name] && ownerPrincipal) {
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
  const verifyOrder = useVerifyOrder();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const registerShop = useRegisterShop();
  const updateShop = useUpdateShop();
  const saveSocials = useSaveShopSocials();
  const deleteMyShop = useDeleteMyShop();

  // Photo
  const photoUrl = useShopPhotoReactive(ownerPrincipal);
  const { uploadPhoto, isUploading } = useUploadShopPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productFileInputRef = useRef<HTMLInputElement>(null);
  const editProductFileInputRef = useRef<HTMLInputElement>(null);

  const myShop =
    allShops?.find(([p]) => p.toString() === ownerPrincipal)?.[1] ?? null;
  const [activeTab, setActiveTab] = useState(myShop ? "orders" : "settings");

  // Browser notification for new orders

  // Notification hooks
  const { hasUnread } = useOrderNotification(orders, activeTab === "orders");

  // Enhanced: also show browser notification when orders increase
  const prevOrderCountRef = useRef<number | null>(null);
  useEffect(() => {
    const count = orders?.length ?? 0;
    if (
      prevOrderCountRef.current !== null &&
      count > prevOrderCountRef.current
    ) {
      // Get the newest order's product names
      const newestOrder = orders?.[orders.length - 1];
      const names =
        newestOrder?.items.map((i) => i.productName).join(", ") ?? "";
      if ("Notification" in window && Notification.permission === "granted") {
        const notif = new Notification(
          `Agizo Jipya! - ${myShop?.businessName ?? "Duka Lako"}`,
          {
            body: `Bidhaa: ${names}`,
            icon: "/icon-192.png",
            tag: "new-order",
            requireInteraction: true,
          },
        );
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    }
    prevOrderCountRef.current = count;
  }, [orders, myShop?.businessName]);

  const myPrincipal = identity?.getPrincipal().toString() ?? "";
  const { data: savedShopLoc } = useShopLocation(myPrincipal);
  const saveLocation = useSaveShopLocation();
  const [locSaving, setLocSaving] = useState(false);

  const handleSaveCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocSaving(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await saveLocation.mutateAsync({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          toast.success(t("locationSaved"));
        } catch {
          toast.error(t("locationSaveError"));
        } finally {
          setLocSaving(false);
        }
      },
      () => {
        toast.error(t("locationPermissionDenied"));
        setLocSaving(false);
      },
    );
  };

  const { selectedSound, setSelectedSound } = useNotifSound();

  // Payment numbers state
  const [paymentNumbers, setPaymentNumbers] = useState<ShopPaymentInfo[]>([]);
  const [newPayment, setNewPayment] = useState<ShopPaymentInfo>({
    network: "M-Pesa",
    phoneNumber: "",
    accountHolder: "",
  });

  // Sync payment numbers from loaded shop
  useEffect(() => {
    if (myShop?.payments) {
      setPaymentNumbers(myShop.payments);
    }
  }, [myShop]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ownerPrincipal) return;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("photoTooLarge"));
      return;
    }
    try {
      const dataUrl = await uploadPhoto(ownerPrincipal, file);
      await saveSocials.mutateAsync({
        principalId: ownerPrincipal,
        socials: {
          facebook: socialForm.facebook,
          instagram: socialForm.instagram,
          tiktok: socialForm.tiktok,
          photoUrl: dataUrl,
        },
      });
      setSocialForm((prev) => ({ ...prev, photoUrl: dataUrl }));
      toast.success(t("photoUploaded"));
    } catch {
      toast.error("Failed to save photo.");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const [shopForm, setShopForm] = useState<ShopData>({
    businessName: "",
    ownerName: "",
    phone: "",
    address: "",
    payments: [],
  });
  const [socialForm, setSocialForm] = useState({
    facebook: "",
    instagram: "",
    tiktok: "",
    photoUrl: "",
  });

  useEffect(() => {
    if (myShop) {
      setShopForm({
        businessName: myShop.businessName,
        ownerName: myShop.ownerName,
        phone: myShop.phone,
        address: myShop.address,
        payments: myShop.payments ?? [],
      });
    }
  }, [myShop]);

  const currentSocials = useShopSocials(ownerPrincipal || "");
  useEffect(() => {
    if (
      currentSocials.facebook ||
      currentSocials.instagram ||
      currentSocials.tiktok
    ) {
      setSocialForm({
        facebook: currentSocials.facebook,
        instagram: currentSocials.instagram,
        tiktok: currentSocials.tiktok,
        photoUrl: currentSocials.photoUrl || "",
      });
    }
  }, [
    currentSocials.facebook,
    currentSocials.instagram,
    currentSocials.tiktok,
    currentSocials.photoUrl,
  ]);

  const handleShopSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(shopForm.phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    try {
      const shopData: ShopData = { ...shopForm, payments: paymentNumbers };
      if (myShop) {
        await updateShop.mutateAsync(shopData);
        toast.success(t("shopUpdated"));
      } else {
        await registerShop.mutateAsync(shopData);
        toast.success(t("shopRegistered"));
      }
    } catch {
      toast.error(t("shopSaveError"));
    }
  };

  const handleSocialSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPrincipal) return;
    try {
      await saveSocials.mutateAsync({
        principalId: ownerPrincipal,
        socials: socialForm,
      });
      toast.success(t("shopUpdated"));
    } catch {
      toast.error(t("shopSaveError"));
    }
  };

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductOffer, setNewProductOffer] = useState("");
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editProductPrice, setEditProductPrice] = useState("");
  const [editProductOffer, setEditProductOffer] = useState("");
  const [newProductPhotoUrl, setNewProductPhotoUrl] = useState("");
  const [newProductPhotoUploading, setNewProductPhotoUploading] =
    useState(false);
  const [editProductPhotoUrl, setEditProductPhotoUrl] = useState("");
  const [editProductPhotoUploading, setEditProductPhotoUploading] =
    useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleProductPhotoSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    mode: "add" | "edit",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error(t("photoTooLarge"));
      return;
    }
    const setter =
      mode === "add"
        ? setNewProductPhotoUploading
        : setEditProductPhotoUploading;
    const urlSetter =
      mode === "add" ? setNewProductPhotoUrl : setEditProductPhotoUrl;
    setter(true);
    const productName = mode === "add" ? newProductName.trim() : editingProduct;
    try {
      const { createStorageClient } = await import(
        "../utils/createStorageClient"
      );
      const jpegFile = await convertToJpeg(file, 0.85, 600, 600);
      const bytes = new Uint8Array(await jpegFile.arrayBuffer());
      const storageClient = await createStorageClient(identity);
      const { hash } = await storageClient.putFile(bytes, undefined);
      const url = await storageClient.getDirectURL(hash);
      urlSetter(url);
      // Cache to localStorage for immediate display
      if (productName && ownerPrincipal) {
        try {
          localStorage.setItem(
            `productPhoto_${ownerPrincipal}_${productName}`,
            url,
          );
        } catch {}
      }
      // Save photo URL to backend immediately if product name is known
      if (productName && actor) {
        try {
          await (actor as any).setProductPhoto(productName, url);
          queryClient.invalidateQueries({ queryKey: ["productPhotos"] });
        } catch {
          // Non-fatal: photo saved locally, will try again on product save
        }
      }
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setter(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) return;
    try {
      await addProduct.mutateAsync({
        name: newProductName.trim(),
        price: Number.parseFloat(newProductPrice),
        offer: newProductOffer.trim() || undefined,
      } as any);
      // Save photo to backend using separate map
      if (newProductPhotoUrl && actor) {
        try {
          await (actor as any).setProductPhoto(
            newProductName.trim(),
            newProductPhotoUrl,
          );
          queryClient.invalidateQueries({ queryKey: ["productPhotos"] });
        } catch {
          // Non-fatal
        }
      }
      setNewProductName("");
      setNewProductPrice("");
      setNewProductOffer("");
      setNewProductPhotoUrl("");
      toast.success(t("productAdded"));
    } catch {
      toast.error(t("productAddError"));
    }
  };

  const handleUpdateProduct = async (name: string) => {
    try {
      await updateProduct.mutateAsync({
        name,
        price: Number.parseFloat(editProductPrice),
        offer: editProductOffer.trim() || undefined,
      } as any);
      // Save photo to backend using separate map
      if (editProductPhotoUrl && actor) {
        try {
          await (actor as any).setProductPhoto(name, editProductPhotoUrl);
          queryClient.invalidateQueries({ queryKey: ["productPhotos"] });
        } catch {
          // Non-fatal
        }
      }
      setEditingProduct(null);
      setEditProductPhotoUrl("");
      setEditProductOffer("");
      toast.success(t("productUpdated"));
    } catch {
      toast.error(t("productUpdateError"));
    }
  };

  const handleDeleteProduct = async (name: string) => {
    try {
      await deleteProduct.mutateAsync(name);
      toast.success(t("productDeleted"));
    } catch {
      toast.error(t("productDeleteError"));
    }
  };

  const handleVerifyOrder = async (index: number) => {
    try {
      await verifyOrder.mutateAsync(BigInt(index));
      toast.success(t("orderVerified"));
    } catch {
      toast.error(t("orderVerifyError"));
    }
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteMyShop.mutateAsync();
      await clear();
      queryClient.clear();
      toast.success(t("accountDeleted"));
      navigate({ to: "/" });
    } catch {
      toast.error(t("accountDeleteError"));
    } finally {
      setDeletingAccount(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleAddPaymentNumber = () => {
    if (!newPayment.phoneNumber.trim() || !newPayment.accountHolder.trim())
      return;
    setPaymentNumbers((prev) => [...prev, { ...newPayment }]);
    setNewPayment({ network: "M-Pesa", phoneNumber: "", accountHolder: "" });
  };

  const handleRemovePayment = (index: number) => {
    setPaymentNumbers((prev) => prev.filter((_, i) => i !== index));
  };

  if (isInitializing || (!identity && isInitializing)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center" data-ocid="dashboard.loading_state">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              {t("loadingDashboard")}
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!identity) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Dashboard Header */}
        <div className="market-gradient border-b-2 border-border py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
                  {myShop ? myShop.businessName : t("ownerDashboard")}
                </h1>
                {myShop ? (
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <User className="h-4 w-4" />
                      {myShop.ownerName}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Phone className="h-4 w-4" />
                      {myShop.phone}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin className="h-4 w-4" />
                      {myShop.address}
                    </span>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-1 font-medium">
                    {t("setupShop")}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2 flex-shrink-0 border-2 font-bold btn-bold"
                data-ocid="dashboard.secondary_button"
              >
                <LogOut className="h-4 w-4" /> {t("logout")}
              </Button>
            </div>

            {!myShop && !shopsLoading && (
              <div
                className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-lg p-4 flex items-start gap-3"
                data-ocid="dashboard.error_state"
              >
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    {t("shopNotRegisteredYet")}
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5 font-medium">
                    {t("goToShopSettings")}
                  </p>
                </div>
              </div>
            )}

            {/* Browser notification hint */}
            {"Notification" in window &&
              Notification.permission !== "granted" && (
                <div className="mt-3 text-xs text-muted-foreground font-medium bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  🔔 Wezesha arifa za kivinjari ili upate sauti hata ukiwa nje
                  ya app.
                </div>
              )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <Tabs
            defaultValue={myShop ? "orders" : "settings"}
            onValueChange={setActiveTab}
          >
            <TabsList className="mb-6" data-ocid="dashboard.tab">
              <TabsTrigger
                value="orders"
                className="gap-2 font-bold"
                data-ocid="dashboard.orders.tab"
              >
                <div className="relative inline-flex items-center">
                  <ShoppingBag className="h-4 w-4" />
                  {hasUnread && (
                    <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-400" />
                  )}
                </div>
                {t("orders")}
                {orders && orders.length > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 text-xs bg-primary text-primary-foreground">
                    {orders.filter((o) => o.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="products"
                className="gap-2 font-bold"
                data-ocid="dashboard.products.tab"
              >
                <Package className="h-4 w-4" /> {t("products")}
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="gap-2 font-bold"
                data-ocid="dashboard.settings.tab"
              >
                <Settings className="h-4 w-4" /> {t("shopSettings")}
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <div className="space-y-4">
                <h2 className="text-xl font-display font-extrabold">
                  {t("incomingOrders")}
                </h2>
                {ordersLoading ? (
                  <div className="space-y-3" data-ocid="orders.loading_state">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-32 w-full" />
                    ))}
                  </div>
                ) : !orders || orders.length === 0 ? (
                  <div
                    className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground"
                    data-ocid="orders.empty_state"
                  >
                    <ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-bold">{t("noOrdersYet")}</p>
                    <p className="text-sm mt-1 font-medium">
                      {t("shareYourShop")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order, index) => (
                      <motion.div
                        key={`order-${order.customerName}-${order.createdAt.toString()}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        data-ocid={`orders.item.${index + 1}`}
                      >
                        <Card className="border-2 border-border shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                {/* Product names prominently shown */}
                                <p className="font-extrabold text-base text-foreground mb-1">
                                  {order.items
                                    .map((i) => i.productName)
                                    .join(", ")}
                                </p>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1 font-medium">
                                    <User className="h-3.5 w-3.5" />
                                    {order.customerName}
                                  </span>
                                  <span className="flex items-center gap-1 font-medium">
                                    <Phone className="h-3.5 w-3.5" />
                                    {order.customerPhone}
                                  </span>
                                  <span className="flex items-center gap-1 font-medium">
                                    <Clock className="h-3.5 w-3.5" />
                                    {order.deliveryTime}
                                  </span>
                                  <span className="flex items-center gap-1 font-medium">
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                                    {formatOrderTime(order.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <Badge
                                  variant={
                                    order.status === "verified"
                                      ? "default"
                                      : "outline"
                                  }
                                  className={
                                    order.status === "verified"
                                      ? "bg-green-100 text-green-800 border-2 border-green-200 font-bold"
                                      : "border-2 border-amber-300 text-amber-700 bg-amber-50 font-bold"
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
                                      ? "bg-blue-50 text-blue-700 border-2 border-blue-200 font-bold"
                                      : "bg-gray-50 text-gray-600 border-2 border-gray-200 font-bold"
                                  }
                                >
                                  <CreditCard className="h-3 w-3 mr-1" />
                                  {order.paymentStatus === "paid"
                                    ? t("paid")
                                    : t("unpaid")}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <Separator className="mb-3" />
                            <div className="space-y-1 mb-3">
                              {order.items.map((item) => (
                                <div
                                  key={item.productName}
                                  className="flex justify-between text-sm"
                                >
                                  <span className="font-bold text-foreground">
                                    {item.productName}
                                  </span>
                                  <span className="font-bold text-primary">
                                    TSh{" "}
                                    {(
                                      Number(item.quantity) * item.unitPrice
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {order.paymentProof?.proofText && (
                              <div className="mb-3 bg-green-50 border-2 border-green-400 rounded-lg p-3 text-sm text-green-900 font-medium">
                                <p className="font-extrabold mb-1 flex items-center gap-1.5">
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                  Uthibitisho wa Malipo:
                                </p>
                                <p className="bg-white rounded p-2 border border-green-200">
                                  {order.paymentProof.proofText}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-bold text-primary">
                                {t("total")}: TSh{" "}
                                {order.totalPrice.toLocaleString()}
                              </span>
                              <div className="flex gap-2">
                                {order.paymentProof?.proofText &&
                                  order.status !== "verified" && (
                                    <Button
                                      size="sm"
                                      className="gap-1.5 bg-green-600 text-white hover:bg-green-700 font-bold btn-bold"
                                      onClick={() => handleVerifyOrder(index)}
                                      disabled={verifyOrder.isPending}
                                      data-ocid={`orders.item.${index + 1}.confirm_button`}
                                    >
                                      {verifyOrder.isPending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <CheckCircle className="h-3 w-3" />
                                      )}
                                      Thibitisha Malipo
                                    </Button>
                                  )}
                                {order.status !== "verified" && (
                                  <Button
                                    size="sm"
                                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold btn-bold"
                                    onClick={() => handleVerifyOrder(index)}
                                    disabled={verifyOrder.isPending}
                                    data-ocid={`orders.item.${index + 1}.primary_button`}
                                  >
                                    {verifyOrder.isPending ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-3 w-3" />
                                    )}
                                    {t("markVerified")}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-display font-extrabold">
                    {t("myProducts")}
                  </h2>
                </div>

                {/* Add Product Form */}
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display font-bold text-base flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" />{" "}
                      {t("addNewProduct")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddProduct} className="space-y-3">
                      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex-1 min-w-0">
                          <Input
                            placeholder={t("productName")}
                            value={newProductName}
                            onChange={(e) => setNewProductName(e.target.value)}
                            required
                            className="border-2 font-medium"
                            data-ocid="product.input"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            placeholder={t("price")}
                            type="number"
                            min="0"
                            step="0.01"
                            value={newProductPrice}
                            onChange={(e) => setNewProductPrice(e.target.value)}
                            required
                            className="border-2 font-medium"
                            data-ocid="product.input"
                          />
                        </div>
                      </div>
                      {/* Offer field */}
                      <Input
                        placeholder={t("productOffer")}
                        value={newProductOffer}
                        onChange={(e) => setNewProductOffer(e.target.value)}
                        className="border-2 font-medium"
                        data-ocid="product.input"
                      />
                      {/* Product Photo Upload */}
                      <div className="flex items-center gap-3">
                        <input
                          ref={productFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleProductPhotoSelect(e, "add")}
                        />
                        {newProductPhotoUrl ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-12 rounded-lg border-2 border-primary/30 overflow-hidden">
                              <img
                                src={newProductPhotoUrl}
                                alt="Product preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground"
                              onClick={() => setNewProductPhotoUrl("")}
                            >
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2 border-dashed border-2 font-medium text-muted-foreground"
                            onClick={() => productFileInputRef.current?.click()}
                            disabled={newProductPhotoUploading}
                            data-ocid="product.upload_button"
                          >
                            {newProductPhotoUploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ImagePlus className="h-4 w-4" />
                            )}
                            {newProductPhotoUploading
                              ? "Uploading..."
                              : "Add Photo"}
                          </Button>
                        )}
                        <Button
                          type="submit"
                          disabled={
                            addProduct.isPending || newProductPhotoUploading
                          }
                          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-bold btn-bold ml-auto"
                          data-ocid="product.primary_button"
                        >
                          {addProduct.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                          {t("add")}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Product List */}
                {productsLoading ? (
                  <div className="space-y-2" data-ocid="products.loading_state">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !products || products.length === 0 ? (
                  <div
                    className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground"
                    data-ocid="products.empty_state"
                  >
                    <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">{t("noProductsYet")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {products.map((product, index) => (
                      <motion.div
                        key={product.name}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        data-ocid={`products.item.${index + 1}`}
                      >
                        <Card className="border-2 border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                          <CardContent className="py-3 flex items-center gap-3">
                            {/* Square product photo thumbnail */}
                            <div className="w-14 h-14 rounded-lg border-2 border-border overflow-hidden bg-muted/50 flex-shrink-0">
                              {photoMap[product.name] ||
                              (editingProduct === product.name &&
                                editProductPhotoUrl) ? (
                                <img
                                  src={
                                    editingProduct === product.name &&
                                    editProductPhotoUrl
                                      ? editProductPhotoUrl
                                      : photoMap[product.name]
                                  }
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground/30" />
                                </div>
                              )}
                            </div>
                            {editingProduct === product.name ? (
                              <div className="flex-1 flex flex-wrap items-center gap-2">
                                <span className="font-bold text-sm flex-1 min-w-0 truncate">
                                  {product.name}
                                </span>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editProductPrice}
                                  onChange={(e) =>
                                    setEditProductPrice(e.target.value)
                                  }
                                  className="w-24 border-2"
                                  data-ocid={`products.item.${index + 1}.input`}
                                />
                                <Input
                                  placeholder="Offer..."
                                  value={editProductOffer}
                                  onChange={(e) =>
                                    setEditProductOffer(e.target.value)
                                  }
                                  className="w-32 border-2 text-xs"
                                />
                                {/* Edit photo */}
                                <input
                                  ref={editProductFileInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleProductPhotoSelect(e, "edit")
                                  }
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="gap-1 font-medium border-dashed text-xs"
                                  onClick={() =>
                                    editProductFileInputRef.current?.click()
                                  }
                                  disabled={editProductPhotoUploading}
                                >
                                  {editProductPhotoUploading ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <ImagePlus className="h-3 w-3" />
                                  )}
                                  {editProductPhotoUrl ? "Change" : "Photo"}
                                </Button>
                                {editProductPhotoUrl && (
                                  <div className="w-8 h-8 rounded overflow-hidden border">
                                    <img
                                      src={editProductPhotoUrl}
                                      alt="preview"
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateProduct(product.name)
                                  }
                                  disabled={
                                    updateProduct.isPending ||
                                    editProductPhotoUploading
                                  }
                                  className="bg-primary text-primary-foreground font-bold btn-bold"
                                  data-ocid={`products.item.${index + 1}.save_button`}
                                >
                                  {updateProduct.isPending ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    t("save")
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingProduct(null)}
                                  data-ocid={`products.item.${index + 1}.cancel_button`}
                                >
                                  {t("cancel")}
                                </Button>
                              </div>
                            ) : (
                              <div className="flex-1 flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm">
                                      {product.name}
                                    </span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                      TSh {product.price.toLocaleString()}
                                    </span>
                                    {product.offer && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-orange-700 bg-orange-50 border border-orange-200 font-bold">
                                        <Tag className="h-2.5 w-2.5" />
                                        {product.offer}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setEditingProduct(product.name);
                                      setEditProductPrice(
                                        product.price.toString(),
                                      );
                                      setEditProductPhotoUrl(
                                        photoMap[product.name] || "",
                                      );
                                      setEditProductOffer(product.offer || "");
                                    }}
                                    data-ocid={`products.item.${index + 1}.edit_button`}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() =>
                                      handleDeleteProduct(product.name)
                                    }
                                    disabled={deleteProduct.isPending}
                                    data-ocid={`products.item.${index + 1}.delete_button`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Shop Settings Tab */}
            <TabsContent value="settings">
              <div className="max-w-xl space-y-6">
                <div>
                  <h2 className="text-xl font-display font-extrabold">
                    {t("shopSettings")}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {myShop
                      ? t("updateYourShopDetails")
                      : t("registerShopToStart")}
                  </p>
                </div>

                {/* Photo Upload Section */}
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display font-bold text-base flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary" />
                      {photoUrl ? t("changePhoto") : t("uploadShopPhoto")}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      {t("shopPhotoHint")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      {/* Square profile photo */}
                      <div className="w-24 h-24 rounded-xl border-2 border-primary/20 overflow-hidden bg-muted/50 flex-shrink-0">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="Shop"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoSelect}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold btn-bold"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          data-ocid="settings.upload_button"
                        >
                          {isUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                          {photoUrl ? t("changePhoto") : t("uploadShopPhoto")}
                        </Button>
                        <p className="text-xs text-muted-foreground font-medium">
                          Max 3.5MB · JPG, PNG, WebP
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shop Info Form */}
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display font-bold text-base">
                      {myShop ? t("updateShop") : t("registerShop")}
                    </CardTitle>
                    <CardDescription>
                      This information will be visible to customers browsing the
                      marketplace.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleShopSave} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="businessName" className="font-bold">
                          {t("businessName")}
                        </Label>
                        <Input
                          id="businessName"
                          placeholder="e.g. Sunrise Grocery"
                          value={shopForm.businessName}
                          onChange={(e) =>
                            setShopForm({
                              ...shopForm,
                              businessName: e.target.value,
                            })
                          }
                          required
                          className="border-2 font-medium"
                          data-ocid="settings.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ownerName" className="font-bold">
                          {t("ownerName")}
                        </Label>
                        <Input
                          id="ownerName"
                          placeholder="Your full name"
                          value={shopForm.ownerName}
                          onChange={(e) =>
                            setShopForm({
                              ...shopForm,
                              ownerName: e.target.value,
                            })
                          }
                          required
                          className="border-2 font-medium"
                          data-ocid="settings.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="shopPhone" className="font-bold">
                          {t("phoneNumber")}
                        </Label>
                        <Input
                          id="shopPhone"
                          placeholder="0712345678"
                          type="tel"
                          value={shopForm.phone}
                          onChange={(e) =>
                            setShopForm({
                              ...shopForm,
                              phone: e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 10),
                            })
                          }
                          maxLength={10}
                          pattern="[0-9]{10}"
                          required
                          className="border-2 font-medium"
                          data-ocid="settings.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="shopAddress" className="font-bold">
                          {t("businessAddress")}
                        </Label>
                        <Textarea
                          id="shopAddress"
                          placeholder="123 Market Street, City"
                          value={shopForm.address}
                          onChange={(e) =>
                            setShopForm({
                              ...shopForm,
                              address: e.target.value,
                            })
                          }
                          required
                          rows={3}
                          className="border-2 font-medium"
                          data-ocid="settings.textarea"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md btn-bold py-3"
                        disabled={
                          registerShop.isPending || updateShop.isPending
                        }
                        data-ocid="settings.submit_button"
                      >
                        {registerShop.isPending || updateShop.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                            {t("saving")}
                          </>
                        ) : myShop ? (
                          t("updateShop")
                        ) : (
                          t("registerShop")
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Payment Numbers Card */}
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display font-bold text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      {t("paymentNumbers")}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      {t("paymentNumbersHint")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Existing payment numbers */}
                    {paymentNumbers.length > 0 && (
                      <div className="space-y-2">
                        {paymentNumbers.map((p, i) => (
                          <div
                            key={`${p.network}-${p.phoneNumber}-${i}`}
                            className="flex items-center justify-between border-2 border-border rounded-lg px-3 py-2"
                            data-ocid={`payment.item.${i + 1}`}
                          >
                            <div>
                              <p className="font-bold text-sm text-primary">
                                {p.network}
                              </p>
                              <p className="font-extrabold text-base tracking-wide">
                                {p.phoneNumber}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {p.accountHolder}
                              </p>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleRemovePayment(i)}
                              data-ocid={`payment.item.${i + 1}.delete_button`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new payment number */}
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-sm font-bold">
                        {t("addPaymentNumber")}
                      </p>
                      <Select
                        value={newPayment.network}
                        onValueChange={(v) =>
                          setNewPayment((prev) => ({ ...prev, network: v }))
                        }
                      >
                        <SelectTrigger
                          className="border-2 font-medium"
                          data-ocid="payment.select"
                        >
                          <SelectValue placeholder={t("network")} />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_NETWORKS.map((n) => (
                            <SelectItem key={n} value={n}>
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="0712345678"
                        value={newPayment.phoneNumber}
                        onChange={(e) =>
                          setNewPayment((prev) => ({
                            ...prev,
                            phoneNumber: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 10),
                          }))
                        }
                        maxLength={10}
                        className="border-2 font-medium"
                        data-ocid="payment.input"
                      />
                      <Input
                        placeholder={t("accountHolder")}
                        value={newPayment.accountHolder}
                        onChange={(e) =>
                          setNewPayment((prev) => ({
                            ...prev,
                            accountHolder: e.target.value,
                          }))
                        }
                        className="border-2 font-medium"
                        data-ocid="payment.input"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 border-2 border-primary/40 text-primary font-bold btn-bold"
                        onClick={handleAddPaymentNumber}
                        disabled={
                          !newPayment.phoneNumber.trim() ||
                          !newPayment.accountHolder.trim()
                        }
                        data-ocid="payment.primary_button"
                      >
                        <Plus className="h-4 w-4" />
                        {t("addPaymentNumber")}
                      </Button>
                    </div>

                    {/* Save payment numbers with shop */}
                    {paymentNumbers.length > 0 && (
                      <p className="text-xs text-muted-foreground font-medium">
                        Nambari hizi zitahifadhiwa ukibonyeza "
                        {myShop ? t("updateShop") : t("registerShop")}" hapo
                        juu.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Social Media Card */}
                <Card
                  className="border-2 border-primary/20 shadow-md"
                  data-ocid="settings.social_media.card"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display font-bold text-base flex items-center gap-2">
                      <Share2 className="h-4 w-4 text-primary" />
                      {t("socialMedia")}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      {t("socialMediaHint")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form onSubmit={handleSocialSave} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="fbPage"
                          className="font-bold flex items-center gap-2"
                        >
                          <FaFacebook
                            className="h-4 w-4"
                            style={{ color: "#1877F2" }}
                          />
                          {t("facebookPage")}
                        </Label>
                        <div className="relative">
                          <FaFacebook
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                            style={{ color: "#1877F2" }}
                          />
                          <Input
                            id="fbPage"
                            placeholder="https://facebook.com/yourpage"
                            value={socialForm.facebook}
                            onChange={(e) =>
                              setSocialForm({
                                ...socialForm,
                                facebook: e.target.value,
                              })
                            }
                            className="pl-9 font-medium border-2"
                            data-ocid="settings.facebook.input"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="igPage"
                          className="font-bold flex items-center gap-2"
                        >
                          <FaInstagram
                            className="h-4 w-4"
                            style={{ color: "#E1306C" }}
                          />
                          {t("instagramPage")}
                        </Label>
                        <div className="relative">
                          <FaInstagram
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                            style={{ color: "#E1306C" }}
                          />
                          <Input
                            id="igPage"
                            placeholder="https://instagram.com/yourpage"
                            value={socialForm.instagram}
                            onChange={(e) =>
                              setSocialForm({
                                ...socialForm,
                                instagram: e.target.value,
                              })
                            }
                            className="pl-9 font-medium border-2"
                            data-ocid="settings.instagram.input"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="ttPage"
                          className="font-bold flex items-center gap-2"
                        >
                          <FaTiktok className="h-4 w-4 text-foreground" />
                          {t("tiktokPage")}
                        </Label>
                        <div className="relative">
                          <FaTiktok className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-foreground" />
                          <Input
                            id="ttPage"
                            placeholder="https://tiktok.com/@yourpage"
                            value={socialForm.tiktok}
                            onChange={(e) =>
                              setSocialForm({
                                ...socialForm,
                                tiktok: e.target.value,
                              })
                            }
                            className="pl-9 font-medium border-2"
                            data-ocid="settings.tiktok.input"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md btn-bold mt-2"
                        disabled={saveSocials.isPending}
                        data-ocid="settings.social.submit_button"
                      >
                        {saveSocials.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                            {t("saving")}
                          </>
                        ) : (
                          t("saveSocialLinks") || "Save Social Links"
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Shop Location Card */}
                <Card className="border-2 border-primary/20 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display font-bold text-base flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      {t("shopLocationSection")}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      {t("shopLocationHint")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {savedShopLoc && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                        <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="font-medium">
                          {t(
                            "shopLocationSet",
                            savedShopLoc.latitude.toFixed(4),
                            savedShopLoc.longitude.toFixed(4),
                          )}
                        </span>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold btn-bold"
                      onClick={handleSaveCurrentLocation}
                      disabled={locSaving}
                      data-ocid="shop.location.button"
                    >
                      {locSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MapPin className="h-4 w-4" />
                      )}
                      {t("useMyCurrentLocation")}
                    </Button>
                  </CardContent>
                </Card>

                {/* Notification Sound Card */}
                <Card
                  className="border-2 border-primary/20 shadow-md"
                  data-ocid="settings.notif_sound.card"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display font-bold text-base flex items-center gap-2">
                      <Bell className="h-4 w-4 text-primary" />
                      Notification Sound
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      Choose the sound you hear when a new order arrives
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup
                      value={selectedSound}
                      onValueChange={setSelectedSound}
                      className="grid grid-cols-2 gap-3"
                    >
                      {SOUND_OPTIONS.map((opt) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2.5 cursor-pointer transition-colors ${
                            selectedSound === opt.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <RadioGroupItem
                            value={opt.id}
                            id={`sound-${opt.id}`}
                            data-ocid="settings.notif_sound.radio"
                          />
                          <Label
                            htmlFor={`sound-${opt.id}`}
                            className="cursor-pointer font-bold text-sm"
                          >
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold btn-bold"
                      onClick={() => playSound(selectedSound)}
                      data-ocid="settings.notif_sound.button"
                    >
                      <Volume2 className="h-4 w-4" />
                      Test Sound
                    </Button>
                  </CardContent>
                </Card>

                {/* Danger Zone - Account Deletion */}
                <Card className="border-2 border-destructive/30 shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-display font-bold text-base flex items-center gap-2 text-destructive">
                      <Trash2 className="h-4 w-4" />
                      {t("deleteAccount")}
                    </CardTitle>
                    <CardDescription className="text-xs font-medium">
                      {t("deleteAccountWarning")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      variant="destructive"
                      className="gap-2 font-bold btn-bold"
                      onClick={() => setDeleteDialogOpen(true)}
                      data-ocid="settings.delete_button"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("deleteAccount")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent data-ocid="settings.delete.dialog">
          <DialogHeader>
            <DialogTitle className="text-destructive font-display font-extrabold">
              {t("deleteAccount")}
            </DialogTitle>
            <DialogDescription>{t("deleteAccountWarning")}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="font-bold border-2"
              data-ocid="settings.delete.cancel_button"
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="font-bold btn-bold"
              data-ocid="settings.delete.confirm_button"
            >
              {deletingAccount ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {deletingAccount ? t("deletingAccount") : t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
