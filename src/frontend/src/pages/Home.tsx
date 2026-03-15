import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Principal } from "@icp-sdk/core/principal";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, MapPin, Phone, Store, User } from "lucide-react";
import { motion } from "motion/react";
import { FaFacebook, FaInstagram, FaTiktok } from "react-icons/fa";
import type { ShopData } from "../backend.d";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { useGetAllShops } from "../hooks/useQueries";
import { useShopPhoto } from "../hooks/useShopPhoto";
import { useShopSocials } from "../hooks/useShopSocials";

function ShopCard({
  principal,
  shop,
  index,
}: {
  principal: Principal;
  shop: ShopData;
  index: number;
}) {
  const { t } = useLanguage();
  const photoUrl = useShopPhoto(principal.toString());
  const socials = useShopSocials(principal.toString());
  const hasSocials = socials.facebook || socials.instagram || socials.tiktok;

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
        {/* Banner / Photo area */}
        {photoUrl ? (
          <div className="h-36 overflow-hidden">
            <img
              src={photoUrl}
              alt={shop.businessName}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
        ) : (
          <div className="h-36 bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center border-b-2 border-border">
            <Store className="h-12 w-12 text-primary/40" />
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="min-w-0">
              <CardTitle className="font-display font-extrabold text-xl leading-tight">
                {shop.businessName}
              </CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                <User className="h-3 w-3" /> {shop.ownerName}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 pb-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary/60" />
            <span className="line-clamp-2 font-medium">{shop.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4 flex-shrink-0 text-primary/60" />
            <span className="font-medium">{shop.phone}</span>
          </div>
        </CardContent>
        {hasSocials && (
          <div className="px-6 pb-3 flex items-center gap-2">
            {socials.facebook && (
              <a
                href={socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <FaFacebook
                  className="h-4 w-4 hover:opacity-75 transition-opacity"
                  style={{ color: "#1877F2" }}
                />
              </a>
            )}
            {socials.instagram && (
              <a
                href={socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <FaInstagram
                  className="h-4 w-4 hover:opacity-75 transition-opacity"
                  style={{ color: "#E1306C" }}
                />
              </a>
            )}
            {socials.tiktok && (
              <a
                href={socials.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <FaTiktok className="h-4 w-4 hover:opacity-75 transition-opacity text-foreground" />
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
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-bold shadow-sm"
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
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                {t("heroSubtitle")}
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="#shops">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-bold shadow-md"
                    data-ocid="hero.primary_button"
                  >
                    {t("browseShops")} <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Link to="/owner/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold"
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground">
                  {t("registeredShops")}
                </h2>
                <p className="text-muted-foreground mt-1 font-medium">
                  {isLoading
                    ? t("loading")
                    : t("shopsAvailable", shops?.length ?? 0)}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                data-ocid="shops.loading_state"
              >
                {Array.from({ length: 6 }, (_, i) => i).map((i) => (
                  <Card key={i} className="overflow-hidden border-2">
                    <Skeleton className="h-36 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : !shops || shops.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 rounded-xl border-2 border-dashed border-border bg-muted/30"
                data-ocid="shops.empty_state"
              >
                <Store className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                  {t("noShopsYet")}
                </h3>
                <p className="text-muted-foreground mb-6">{t("beTheFirst")}</p>
                <Link to="/owner/login">
                  <Button
                    className="bg-primary text-primary-foreground font-bold"
                    data-ocid="shops.primary_button"
                  >
                    {t("registerYourShop")}
                  </Button>
                </Link>
              </motion.div>
            ) : (
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
                  />
                ))}
              </motion.div>
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
                className="border-2 border-primary text-primary hover:bg-primary/5 font-bold"
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
