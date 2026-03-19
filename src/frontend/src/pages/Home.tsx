import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Search,
  Store,
  Tag,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import type { ShopData } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { useGetAllShops } from "../hooks/useQueries";
import { useShopLocation, useUserLocation } from "../hooks/useShopLocation";
import { useShopPhoto } from "../hooks/useShopPhoto";
import { useShopSocials } from "../hooks/useShopSocials";
import { type Theme, useTheme } from "../hooks/useTheme";
import { calcDistanceKm, formatDistance } from "../utils/distance";

const THEME_OPTIONS: {
  key: Theme;
  label: string;
  color: string;
  ring: string;
}[] = [
  { key: "blue", label: "Bluu", color: "#1d4ed8", ring: "ring-blue-600" },
  { key: "dark", label: "Giza", color: "#1f2937", ring: "ring-gray-800" },
  { key: "gold", label: "Dhahabu", color: "#b45309", ring: "ring-amber-700" },
];

function ThemePicker() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-3" data-ocid="theme.panel">
      <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">
        🎨 Chagua Rangi:
      </span>
      <div className="flex items-center gap-2">
        {THEME_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setTheme(opt.key)}
            title={opt.label}
            className={`relative w-9 h-9 rounded-full border-2 transition-all shadow-md hover:scale-110 ${
              theme === opt.key
                ? `border-foreground scale-110 ring-2 ring-offset-2 ring-offset-background ${opt.ring}`
                : "border-border/50 hover:border-foreground/60"
            }`}
            style={{ backgroundColor: opt.color }}
            data-ocid={`theme.${opt.key}.toggle`}
          >
            {theme === opt.key && (
              <CheckCircle2 className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function DistanceBadge({
  principalId,
  userLat,
  userLng,
}: {
  principalId: string;
  userLat: number;
  userLng: number;
}) {
  const { data: shopLoc } = useShopLocation(principalId);
  if (!shopLoc) return null;
  const km = calcDistanceKm(
    userLat,
    userLng,
    shopLoc.latitude,
    shopLoc.longitude,
  );
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-extrabold text-sm border-2 border-blue-300 shadow-sm">
      <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
      <span className="text-base font-extrabold">{formatDistance(km)}</span>
    </div>
  );
}

function ShopCard({
  principal,
  shop,
  index,
  userLat,
  userLng,
  matchedProducts,
}: {
  principal: Principal;
  shop: ShopData;
  index: number;
  userLat?: number;
  userLng?: number;
  matchedProducts?: string[];
}) {
  const { t } = useLanguage();
  const photoUrl = useShopPhoto(principal.toString());
  const socials = useShopSocials(principal.toString());
  const hasSocials = socials.facebook || socials.instagram || socials.tiktok;
  const [photoError, setPhotoError] = useState(false);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.35 },
        },
      }}
      data-ocid={`shops.item.${index + 1}`}
    >
      <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-200 border-2 border-border overflow-hidden">
        {/* Square Profile Photo */}
        <div className="w-full aspect-square overflow-hidden bg-muted">
          {photoUrl && !photoError ? (
            <img
              src={photoUrl}
              alt={shop.businessName}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
              onError={() => setPhotoError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center">
              <Store className="h-16 w-16 text-primary/40" />
            </div>
          )}
        </div>

        <CardHeader className="pb-2 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="font-display font-extrabold text-lg leading-tight">
                {shop.businessName}
              </CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                <User className="h-3 w-3" /> {shop.ownerName}
              </p>
            </div>
            {userLat !== undefined && userLng !== undefined && (
              <DistanceBadge
                principalId={principal.toString()}
                userLat={userLat}
                userLng={userLng}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-1.5 pb-3">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary/60" />
            <span className="line-clamp-2 font-medium">{shop.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0 text-primary/60" />
            <span className="font-medium">{shop.phone}</span>
          </div>
          {matchedProducts && matchedProducts.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {matchedProducts.slice(0, 3).map((p) => (
                <Badge
                  key={p}
                  variant="secondary"
                  className="text-xs font-bold"
                >
                  <Tag className="h-2.5 w-2.5 mr-1" />
                  {p}
                </Badge>
              ))}
              {matchedProducts.length > 3 && (
                <Badge variant="secondary" className="text-xs font-bold">
                  +{matchedProducts.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        {hasSocials && (
          <div className="px-4 pb-3 flex flex-wrap items-center gap-2">
            {socials.facebook && (
              <a
                href={socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                data-ocid="shop.facebook.button"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow hover:opacity-90 transition-opacity btn-bold"
                  style={{ backgroundColor: "#1877F2" }}
                >
                  <FaFacebook className="h-3 w-3" />
                  Facebook
                </button>
              </a>
            )}
            {socials.instagram && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                data-ocid="shop.instagram.button"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow hover:opacity-90 transition-opacity bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 btn-bold"
                >
                  <FaInstagram className="h-3 w-3" />
                  Instagram
                </button>
              </a>
            )}
            {socials.tiktok && (
              <a
                href={socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                data-ocid="shop.tiktok.button"
              >
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white shadow hover:opacity-90 transition-opacity btn-bold"
                  style={{ backgroundColor: "#010101" }}
                >
                  <FaTiktok className="h-3 w-3" />
                  TikTok
                </button>
              </a>
            )}
          </div>
        )}
        <CardFooter className="pt-0">
          <Link
            to="/shop/$ownerPrincipal"
            params={{ ownerPrincipal: principal.toString() }}
            className="w-full"
          >
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-bold shadow-md btn-bold py-3"
              data-ocid={`shops.item.${index + 1}.primary_button`}
            >
              {t("viewProductsOrder")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function Home() {
  const { data: shops, isLoading } = useGetAllShops();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortByDist, setSortByDist] = useState(false);
  const {
    location: userLocation,
    loading: locLoading,
    error: locError,
    requestLocation,
  } = useUserLocation();

  const filteredShops = useMemo(() => {
    if (!shops) return [];
    let result = shops;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        ([, shop]) =>
          shop.businessName.toLowerCase().includes(q) ||
          shop.ownerName.toLowerCase().includes(q) ||
          shop.address.toLowerCase().includes(q),
      );
    }
    return result;
  }, [shops, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="market-gradient hero-texture py-16 sm:py-24 border-b-2 border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-bold border-2 border-primary/40 text-primary"
                >
                  {t("liveMarketplace")}
                </Badge>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-extrabold text-foreground leading-tight mb-4">
                {t("orderFromLocal")}
                <span className="block text-primary">
                  {t("businessesNearYou")}
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {t("heroSubtitle")}
              </p>

              {/* Theme Picker — visible below hero text */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mb-6 inline-flex items-center gap-3 bg-card/80 backdrop-blur-sm border-2 border-border rounded-xl px-4 py-2.5 shadow-sm"
              >
                <ThemePicker />
              </motion.div>

              <div className="flex flex-wrap gap-3">
                <a href="#shops">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-bold shadow-md btn-bold py-3 px-6"
                    data-ocid="hero.primary_button"
                  >
                    {t("browseShops")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Link to="/owner/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold btn-bold py-3 px-6"
                    data-ocid="hero.secondary_button"
                  >
                    <Store className="h-4 w-4" /> {t("registerYourShop")}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Shop Directory */}
        <section id="shops" className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
                    {t("registeredShops")}
                  </h2>
                  <p className="text-muted-foreground mt-1 font-medium">
                    {isLoading
                      ? t("loading")
                      : t("shopsAvailable", filteredShops?.length ?? 0)}
                  </p>
                </div>
              </div>

              {/* Search + Location Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder={t("searchShopsPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 font-medium border-2"
                    data-ocid="shops.search_input"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {/* Location status / button */}
                  {userLocation ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-green-400 bg-green-50 text-green-800 font-bold text-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                      Eneo limewashwa
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="gap-2 font-bold border-2 border-primary/40 text-primary hover:bg-primary/5 btn-bold"
                      onClick={requestLocation}
                      disabled={locLoading}
                      data-ocid="shops.location.button"
                    >
                      {locLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Navigation className="h-4 w-4" />
                      )}
                      {locLoading ? "Inatafuta..." : "Washa Eneo Lako"}
                    </Button>
                  )}
                  {userLocation && (
                    <Button
                      variant={sortByDist ? "default" : "outline"}
                      className={`gap-2 font-bold border-2 btn-bold ${
                        sortByDist
                          ? "bg-primary text-primary-foreground"
                          : "border-primary/40 text-primary hover:bg-primary/5"
                      }`}
                      onClick={() => setSortByDist((v) => !v)}
                      data-ocid="shops.sort.toggle"
                    >
                      <MapPin className="h-4 w-4" />
                      {sortByDist ? t("sortByDistance") : t("sortByDefault")}
                    </Button>
                  )}
                </div>
              </div>
              {locError && (
                <p className="text-sm text-destructive font-medium">
                  {t("locationPermissionDenied")}
                </p>
              )}
            </div>

            {isLoading ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                data-ocid="shops.loading_state"
              >
                {Array.from({ length: 6 }, (_, i) => i).map((i) => (
                  <Card key={i} className="overflow-hidden border-2">
                    <Skeleton className="aspect-square w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : !filteredShops || filteredShops.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 rounded-xl border-2 border-dashed border-border bg-muted/30"
                data-ocid="shops.empty_state"
              >
                <Store className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                  {searchQuery ? "No shops match your search" : t("noShopsYet")}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "Try a different search term"
                    : t("beTheFirst")}
                </p>
                {!searchQuery && (
                  <Link to="/owner/login">
                    <Button
                      className="bg-primary text-primary-foreground font-bold btn-bold"
                      data-ocid="shops.primary_button"
                    >
                      {t("registerYourShop")}
                    </Button>
                  </Link>
                )}
              </motion.div>
            ) : (
              <ShopListWithDistance
                shops={filteredShops}
                userLocation={userLocation}
              />
            )}
          </div>
        </section>

        {/* Owner CTA */}
        <section className="py-12 bg-primary/5 border-t-2 border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-display font-extrabold text-foreground mb-3">
              {t("businessOwner")}
            </h2>
            <p className="text-muted-foreground mb-6 font-medium">
              {t("businessOwnerDesc")}
            </p>
            <Link to="/owner/login">
              <Button
                variant="outline"
                className="border-2 border-primary text-primary hover:bg-primary/5 font-bold btn-bold py-3 px-6"
                data-ocid="cta.secondary_button"
              >
                {t("registerYourShop")} <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function ShopListWithDistance({
  shops,
  userLocation,
}: {
  shops: [Principal, ShopData][];
  userLocation: { lat: number; lng: number } | null;
}) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.07 } },
      }}
    >
      {shops.map(([principal, shop], index) => (
        <ShopCard
          key={principal.toString()}
          principal={principal}
          shop={shop}
          index={index}
          userLat={userLocation?.lat}
          userLng={userLocation?.lng}
        />
      ))}
    </motion.div>
  );
}
