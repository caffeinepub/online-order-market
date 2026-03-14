import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, LogIn, LogOut, ShoppingBag, Store } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function Header() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const { lang, setLang, t } = useLanguage();

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      login();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b-2 border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 group"
            data-ocid="nav.link"
          >
            <img
              src="/assets/generated/app-icon-transparent.dim_512x512.png"
              alt="Online Order Market"
              className="h-9 w-9 object-contain"
            />
            <span className="font-display text-xl font-bold text-foreground tracking-tight">
              Online Order Market
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex items-center gap-1 mr-2">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  lang === "en"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border-2 border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
                data-ocid="nav.lang_en.toggle"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("sw")}
                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                  lang === "sw"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border-2 border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
                data-ocid="nav.lang_sw.toggle"
              >
                SW
              </button>
            </div>

            <Link to="/" data-ocid="nav.link">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground font-semibold"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">{t("browseShops")}</span>
              </Button>
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/owner/dashboard" data-ocid="nav.link">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground font-semibold"
                  >
                    <Store className="h-4 w-4" />
                    <span className="hidden sm:inline">{t("myShop")}</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAuth}
                  className="gap-2 border-2 font-bold"
                  data-ocid="nav.button"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("logout")}</span>
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                onClick={handleAuth}
                disabled={isLoggingIn}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                data-ocid="nav.button"
              >
                {isLoggingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isLoggingIn ? t("loggingIn") : t("ownerLogin")}
                </span>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
