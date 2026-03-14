import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn, Shield, Store } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { useLanguage } from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function OwnerLogin() {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  useEffect(() => {
    if (identity) {
      navigate({ to: "/owner/dashboard" });
    }
  }, [identity, navigate]);

  const handleLogin = () => {
    login();
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-md w-full"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Store className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-3xl font-display font-extrabold text-foreground">
              {t("businessOwnerPortal")}
            </h1>
            <p className="text-muted-foreground mt-2 font-medium">
              {t("signInToManage")}
            </p>
          </div>

          <Card className="border-2 border-primary/20 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="font-display font-bold">
                {t("secureLogin")}
              </CardTitle>
              <CardDescription>{t("useInternetIdentity")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3 border-2 border-border">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold">
                      {t("decentralizedSecure")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("noPasswordsStored")}
                    </p>
                  </div>
                </div>
              </div>

              {isInitializing ? (
                <Button
                  disabled
                  className="w-full font-bold"
                  data-ocid="login.primary_button"
                >
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />{" "}
                  {t("initializing")}
                </Button>
              ) : identity ? (
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground font-medium">
                    {t("redirectingToDashboard")}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full border-2 font-bold"
                    data-ocid="login.secondary_button"
                  >
                    {t("useADifferentAccount")}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 font-bold shadow-md"
                  data-ocid="login.primary_button"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />{" "}
                      {t("loggingIn")}
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" /> {t("loginWithII")}
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
