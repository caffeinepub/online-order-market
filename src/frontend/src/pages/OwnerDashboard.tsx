import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  Camera,
  CheckCircle,
  Clock,
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
  Trash2,
  User,
  Volume2,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import { toast } from "sonner";
import type { ShopData } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useNotifSound } from "../hooks/useNotifSound";
import { playSound, useOrderNotification } from "../hooks/useOrderNotification";
import {
  useAddProduct,
  useDeleteProduct,
  useGetAllShops,
  useGetMyProducts,
  useGetOrdersForShop,
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

const SOUND_OPTIONS = [
  { id: "bell", label: "Bell" },
  { id: "chime", label: "Chime" },
  { id: "ding", label: "Ding" },
  { id: "alert", label: "Alert" },
];

export default function OwnerDashboard() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  useEffect(() => {
    if (!isInitializing && !identity) {
      navigate({ to: "/owner/login" });
    }
  }, [identity, isInitializing, navigate]);

  const ownerPrincipal = identity?.getPrincipal().toString();

  const { data: allShops, isLoading: shopsLoading } = useGetAllShops();
  const { data: orders, isLoading: ordersLoading } = useGetOrdersForShop();
  const { data: products, isLoading: productsLoading } = useGetMyProducts();
  const verifyOrder = useVerifyOrder();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const registerShop = useRegisterShop();
  const updateShop = useUpdateShop();
  const saveSocials = useSaveShopSocials();

  // Photo
  const photoUrl = useShopPhotoReactive(ownerPrincipal);
  const { uploadPhoto, isUploading } = useUploadShopPhoto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active tab tracking
  const myShop =
    allShops?.find(([p]) => p.toString() === ownerPrincipal)?.[1] ?? null;
  const [activeTab, setActiveTab] = useState(myShop ? "orders" : "settings");

  // Notification hooks
  const { hasUnread } = useOrderNotification(orders, activeTab === "orders");
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

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !ownerPrincipal) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("photoTooLarge"));
      return;
    }
    try {
      await uploadPhoto(ownerPrincipal, file);
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
      if (myShop) {
        await updateShop.mutateAsync(shopForm);
        toast.success(t("shopUpdated"));
      } else {
        await registerShop.mutateAsync(shopForm);
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

  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [editProductPrice, setEditProductPrice] = useState("");

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !newProductPrice) return;
    try {
      await addProduct.mutateAsync({
        name: newProductName.trim(),
        price: Number.parseFloat(newProductPrice),
      });
      setNewProductName("");
      setNewProductPrice("");
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
      });
      setEditingProduct(null);
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
                className="gap-2 flex-shrink-0 border-2 font-bold"
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
                              <div>
                                <CardTitle className="font-display font-bold text-base">
                                  {order.customerName}
                                </CardTitle>
                                <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Phone className="h-3 w-3" />
                                    {order.customerPhone}
                                  </span>
                                  <span className="flex items-center gap-1 font-medium">
                                    <MapPin className="h-3 w-3" />
                                    {order.customerAddress}
                                  </span>
                                  <span className="flex items-center gap-1 font-medium">
                                    <Clock className="h-3 w-3" />
                                    {order.deliveryTime}
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
                                  <span className="text-muted-foreground font-medium">
                                    {item.productName} ×{" "}
                                    {item.quantity.toString()}
                                  </span>
                                  <span className="font-bold">
                                    TSh{" "}
                                    {(
                                      Number(item.quantity) * item.unitPrice
                                    ).toLocaleString()}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-primary">
                                {t("total")}: TSh{" "}
                                {order.totalPrice.toLocaleString()}
                              </span>
                              {order.status !== "verified" && (
                                <Button
                                  size="sm"
                                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
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
                    <form
                      onSubmit={handleAddProduct}
                      className="flex gap-3 flex-wrap sm:flex-nowrap"
                    >
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder={t("productName")}
                          value={newProductName}
                          onChange={(e) => setNewProductName(e.target.value)}
                          required
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
                          data-ocid="product.input"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={addProduct.isPending}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-bold"
                        data-ocid="product.primary_button"
                      >
                        {addProduct.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        {t("add")}
                      </Button>
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
                        <Card className="border-2 border-border shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="py-3 flex items-center gap-3">
                            {editingProduct === product.name ? (
                              <div className="flex-1 flex items-center gap-2">
                                <span className="font-bold text-sm flex-1">
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
                                  className="w-24"
                                  data-ocid={`products.item.${index + 1}.input`}
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleUpdateProduct(product.name)
                                  }
                                  disabled={updateProduct.isPending}
                                  className="bg-primary text-primary-foreground font-bold"
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
                                  <span className="font-bold text-sm">
                                    {product.name}
                                  </span>
                                  <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                                    TSh {product.price.toLocaleString()}
                                  </span>
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
                          className="gap-2 border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold"
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
                          Max 2MB · JPG, PNG, WebP
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
                          data-ocid="settings.input"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="shopAddress" className="font-bold">
                          {t("businessAddress")}
                        </Label>
                        <Textarea
                          id="shopAddress"
                          placeholder="123 Market Street, City, Country"
                          value={shopForm.address}
                          onChange={(e) =>
                            setShopForm({
                              ...shopForm,
                              address: e.target.value,
                            })
                          }
                          required
                          rows={3}
                          data-ocid="settings.textarea"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md"
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
                            className="pl-9 font-medium"
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
                            className="pl-9 font-medium"
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
                            className="pl-9 font-medium"
                            data-ocid="settings.tiktok.input"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-md mt-2"
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
                      className="gap-2 border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold"
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
                      className="gap-2 border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold"
                      onClick={() => playSound(selectedSound)}
                      data-ocid="settings.notif_sound.primary_button"
                    >
                      <Volume2 className="h-4 w-4" />
                      Test Sound
                    </Button>
                  </CardContent>
                </Card>

                {ownerPrincipal && (
                  <div className="bg-muted/50 rounded-lg p-4 border-2 border-border">
                    <p className="text-xs font-bold text-muted-foreground mb-1">
                      {t("yourPrincipalId")}
                    </p>
                    <p className="text-xs font-mono text-foreground break-all">
                      {ownerPrincipal}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
