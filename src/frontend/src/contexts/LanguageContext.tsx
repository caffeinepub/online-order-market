import { type ReactNode, createContext, useContext, useState } from "react";

type Lang = "en" | "sw";

const translations = {
  en: {
    // Header
    browseShops: "Browse Shops",
    myShop: "My Shop",
    logout: "Logout",
    ownerLogin: "Owner Login",
    loggingIn: "Logging in...",

    // Hero
    liveMarketplace: "Live Marketplace",
    orderFromLocal: "Order from Local",
    businessesNearYou: "Businesses Near You",
    heroSubtitle:
      "Browse registered shops, compare prices, and place orders directly. Fresh products, local businesses — all in one place.",
    registerYourShop: "Register Your Shop",

    // Home section
    registeredShops: "Registered Shops",
    shopsAvailable: (n: number) => `${n} shops available`,
    loading: "Loading...",
    noShopsYet: "No shops yet",
    beTheFirst: "Be the first business to register on Online Order Market!",

    // Home CTA
    businessOwner: "Business Owner?",
    businessOwnerDesc:
      "Register your shop, manage products, and receive orders online.",

    // ShopDetail
    backToShops: "Back to Shops",
    products: "Products",
    noProductsListed: "No products listed yet.",
    placeYourOrder: "Place Your Order",
    yourName: "Your Name",
    phoneNumber: "Phone Number",
    deliveryAddress: "Delivery Address",
    preferredDeliveryTime: "Preferred Delivery Time",
    total: "Total",
    itemsSelected: (n: number) => `${n} item(s) selected`,
    placeOrder: "Place Order",
    placingOrder: "Placing Order...",
    orderConfirmed: "Order Confirmed!",
    orderPlacedAt: (shopName: string) =>
      `Your order has been placed at ${shopName}. The seller will review and verify it shortly.`,
    customer: "Customer",
    phone: "Phone",
    deliveryTime: "Delivery Time",
    backToDirectory: "Back to Directory",
    shopNotFound: "Shop Not Found",
    viewProductsOrder: "View Products & Order",

    // OwnerLogin
    businessOwnerPortal: "Business Owner Portal",
    signInToManage: "Sign in to manage your shop, products, and orders.",
    secureLogin: "Secure Login",
    useInternetIdentity:
      "We use Internet Identity for secure, passwordless authentication.",
    decentralizedSecure: "Decentralized & Secure",
    noPasswordsStored:
      "No passwords stored. Your identity is cryptographically secured.",
    initializing: "Initializing...",
    redirectingToDashboard: "Redirecting to your dashboard...",
    useADifferentAccount: "Use a different account",
    loginWithII: "Login with Internet Identity",

    // OwnerDashboard
    ownerDashboard: "Owner Dashboard",
    orders: "Orders",
    shopSettings: "Shop Settings",
    incomingOrders: "Incoming Orders",
    noOrdersYet: "No orders yet",
    shareYourShop: "Share your shop with customers to start receiving orders.",
    markVerified: "Mark Verified",
    verified: "Verified",
    pending: "Pending",
    myProducts: "My Products",
    addNewProduct: "Add New Product",
    productName: "Product name",
    price: "Price",
    add: "Add",
    noProductsYet: "No products yet. Add your first product above.",
    save: "Save",
    cancel: "Cancel",
    updateYourShopDetails: "Update your shop details below.",
    registerShopToStart: "Register your shop to start receiving orders.",
    updateShop: "Update Shop",
    registerShop: "Register Shop",
    businessName: "Business Name",
    ownerName: "Owner Name",
    businessAddress: "Business Address",
    saving: "Saving...",
    yourPrincipalId: "Your Principal ID",
    loadingDashboard: "Loading dashboard...",
    shopNotRegisteredYet: "Shop not registered yet",
    goToShopSettings: "Go to the Shop Settings tab to register your business.",
    setupShop: "Set up your shop in the Settings tab to get started.",

    // Photo upload
    uploadShopPhoto: "Upload Shop Photo",
    changePhoto: "Change Photo",
    shopPhotoHint: "This photo will appear on your shop card",
    photoTooLarge: "Photo must be under 3.5MB",
    photoUploaded: "Shop photo saved!",

    // Toasts
    orderPlacedSuccess: "Order placed successfully!",
    orderPlacedError: "Failed to place order. Please try again.",
    shopUpdated: "Shop updated successfully!",
    shopRegistered: "Shop registered successfully!",
    shopSaveError: "Failed to save shop settings.",
    productAdded: "Product added!",
    productAddError: "Failed to add product.",
    productUpdated: "Product updated!",
    productUpdateError: "Failed to update product.",
    productDeleted: "Product deleted.",
    productDeleteError: "Failed to delete product.",
    orderVerified: "Order verified!",
    orderVerifyError: "Failed to verify order.",
    selectAtLeastOne: "Please add at least one product to your order.",

    // Social Media
    socialMedia: "Social Media & Advertising",
    facebookPage: "Facebook Page URL",
    instagramPage: "Instagram Page URL",
    tiktokPage: "TikTok Page URL",
    socialMediaHint: "Customers can follow your social pages for promotions",
    saveSocialLinks: "Save Social Links",
    socialLinksSaved: "Social links saved!",
    followUs: "Follow us on",
    visitFacebook: "Facebook",
    visitInstagram: "Instagram",
    visitTikTok: "TikTok",
    advertisingSection: "Advertise With Us",

    // Location
    findNearbyShops: "Find Nearby Shops",
    nearbyShopsActive: "Nearby mode active",
    sortByDistance: "Sort by Distance",
    sortByDefault: "Default Order",
    searchShopsPlaceholder: "Search shops by name or location...",
    distanceAway: (d: string) => `${d} away`,
    locationPermissionDenied:
      "Location access denied. Please allow location in browser settings.",
    gettingLocation: "Getting location...",
    shopLocationSet: (lat: string, lng: string) =>
      `Location set: ${lat}, ${lng}`,
    useMyCurrentLocation: "Use My Current Location",
    shopLocationHint: "Setting your location helps customers find you nearby",
    shopLocationSection: "Shop Location",
    locationSaved: "Location saved!",
    locationSaveError: "Failed to save location.",

    // Payment
    paymentNumbers: "Payment Numbers",
    paymentNumbersHint:
      "Add your M-Pesa / mobile money numbers for customers to pay",
    addPaymentNumber: "Add Payment Number",
    network: "Network",
    accountHolder: "Account Holder Name",
    payNow: "Pay Now",
    payLater: "Pay After Delivery",
    copyNumber: "Copy Number",
    copied: "Copied!",
    paymentInstructions:
      "Copy this number, open your mobile money app, and send payment. Then return here to submit proof.",
    submitProof: "Submit Payment Proof",
    pasteProof: "Paste your SMS confirmation here...",
    proofSubmitted: "Payment proof submitted!",
    proofError:
      "Could not submit proof automatically. Please screenshot and send to the shop owner directly.",
    paymentStatus: "Payment Status",
    paid: "Paid",
    unpaid: "Unpaid",
    openApp: "Open App",
    noPaymentNumbers: "This shop has not set up payment numbers yet.",

    // Account Deletion
    deleteAccount: "Delete Account",
    deleteAccountWarning:
      "Are you sure you want to delete your account? Your shop and all products will be permanently deleted.",
    confirmDelete: "Yes, Delete My Account",
    deletingAccount: "Deleting...",
    accountDeleted: "Account deleted successfully.",
    accountDeleteError: "Failed to delete account.",

    // Offer
    specialOffer: "Special Offer",
    hasOffers: "This shop has special offers!",
    offerLabel: "Offer",
    productOffer: "Product Offer/Discount (optional)",

    // Customer orders
    myOrders: "My Orders",
    viewMyOrders: "View My Orders",
    enterPhoneToView: "Enter your phone number to view your orders",
    searchOrders: "Search",
    noOrdersFound: "No orders found for this number.",
    orderedItems: "Items Ordered",
    orderDate: "Order Date",
  },
  sw: {
    // Header
    browseShops: "Vinjari Maduka",
    myShop: "Duka Langu",
    logout: "Toka",
    ownerLogin: "Ingia kama Mmiliki",
    loggingIn: "Inaingia...",

    // Hero
    liveMarketplace: "Soko la Moja kwa Moja",
    orderFromLocal: "Agiza kutoka kwa",
    businessesNearYou: "Biashara Karibu Nawe",
    heroSubtitle:
      "Vinjari maduka yaliyosajiliwa, linganisha bei, na weka maagizo moja kwa moja. Bidhaa mpya, biashara za ndani — zote mahali pamoja.",
    registerYourShop: "Sajili Duka Lako",

    // Home section
    registeredShops: "Maduka Yaliyosajiliwa",
    shopsAvailable: (n: number) => `maduka ${n} yanapatikana`,
    loading: "Inapakia...",
    noShopsYet: "Hakuna maduka bado",
    beTheFirst:
      "Kuwa biashara ya kwanza kusajiliwa kwenye Online Order Market!",

    // Home CTA
    businessOwner: "Wewe ni Mmiliki wa Biashara?",
    businessOwnerDesc:
      "Sajili duka lako, simamia bidhaa, na upokee maagizo mtandaoni.",

    // ShopDetail
    backToShops: "Rudi Madukani",
    products: "Bidhaa",
    noProductsListed: "Hakuna bidhaa bado.",
    placeYourOrder: "Weka Agizo Lako",
    yourName: "Jina Lako",
    phoneNumber: "Nambari ya Simu",
    deliveryAddress: "Anwani ya Uwasilishaji",
    preferredDeliveryTime: "Wakati Unaopendelea",
    total: "Jumla",
    itemsSelected: (n: number) => `bidhaa ${n} zimechaguliwa`,
    placeOrder: "Weka Agizo",
    placingOrder: "Inaweka Agizo...",
    orderConfirmed: "Agizo Limethibitishwa!",
    orderPlacedAt: (shopName: string) =>
      `Agizo lako limewekwa katika ${shopName}. Muuzaji ataangalia na kuthibitisha hivi karibuni.`,
    customer: "Mteja",
    phone: "Simu",
    deliveryTime: "Wakati wa Uwasilishaji",
    backToDirectory: "Rudi kwenye Orodha",
    shopNotFound: "Duka Halijapatikana",
    viewProductsOrder: "Tazama Bidhaa na Agiza",

    // OwnerLogin
    businessOwnerPortal: "Lango la Mmiliki wa Biashara",
    signInToManage: "Ingia kusimamia duka lako, bidhaa, na maagizo.",
    secureLogin: "Kuingia kwa Usalama",
    useInternetIdentity:
      "Tunatumia Utambulisho wa Mtandao kwa uthibitishaji salama bila nenosiri.",
    decentralizedSecure: "Isiyo na Mfumo Mkuu na Salama",
    noPasswordsStored:
      "Hakuna nenosiri linalohifadhiwa. Utambulisho wako unalindwa kwa kriptografia.",
    initializing: "Inaanzishwa...",
    redirectingToDashboard: "Inakuelekeza kwenye dashibodi yako...",
    useADifferentAccount: "Tumia akaunti nyingine",
    loginWithII: "Ingia na Utambulisho wa Mtandao",

    // OwnerDashboard
    ownerDashboard: "Dashibodi ya Mmiliki",
    orders: "Maagizo",
    shopSettings: "Mipangilio ya Duka",
    incomingOrders: "Maagizo Yanayoingia",
    noOrdersYet: "Hakuna maagizo bado",
    shareYourShop: "Shiriki duka lako na wateja kuanza kupokea maagizo.",
    markVerified: "Thibitisha",
    verified: "Imethibitishwa",
    pending: "Inasubiri",
    myProducts: "Bidhaa Zangu",
    addNewProduct: "Ongeza Bidhaa Mpya",
    productName: "Jina la bidhaa",
    price: "Bei",
    add: "Ongeza",
    noProductsYet: "Hakuna bidhaa bado. Ongeza bidhaa yako ya kwanza hapo juu.",
    save: "Hifadhi",
    cancel: "Ghairi",
    updateYourShopDetails: "Sasisha maelezo ya duka lako hapa chini.",
    registerShopToStart: "Sajili duka lako kuanza kupokea maagizo.",
    updateShop: "Sasisha Duka",
    registerShop: "Sajili Duka",
    businessName: "Jina la Biashara",
    ownerName: "Jina la Mmiliki",
    businessAddress: "Anwani ya Biashara",
    saving: "Inahifadhi...",
    yourPrincipalId: "Kitambulisho chako cha Mkuu",
    loadingDashboard: "Inapakia dashibodi...",
    shopNotRegisteredYet: "Duka halijasajiliwa bado",
    goToShopSettings:
      "Nenda kwenye kichupo cha Mipangilio ya Duka kusajili biashara yako.",
    setupShop: "Sanidi duka lako kwenye kichupo cha Mipangilio kuanza.",

    // Photo upload
    uploadShopPhoto: "Pakia Picha ya Duka",
    changePhoto: "Badilisha Picha",
    shopPhotoHint: "Picha hii itaonekana kwenye kadi ya duka lako",
    photoTooLarge: "Picha lazima iwe chini ya 3.5MB",
    photoUploaded: "Picha ya duka imehifadhiwa!",

    // Toasts
    orderPlacedSuccess: "Agizo limewekwa kwa mafanikio!",
    orderPlacedError: "Imeshindwa kuweka agizo. Tafadhali jaribu tena.",
    shopUpdated: "Duka limesasishwa kwa mafanikio!",
    shopRegistered: "Duka limesajiliwa kwa mafanikio!",
    shopSaveError: "Imeshindwa kuhifadhi mipangilio ya duka.",
    productAdded: "Bidhaa imeongezwa!",
    productAddError: "Imeshindwa kuongeza bidhaa.",
    productUpdated: "Bidhaa imesasishwa!",
    productUpdateError: "Imeshindwa kusasisha bidhaa.",
    productDeleted: "Bidhaa imefutwa.",
    productDeleteError: "Imeshindwa kufuta bidhaa.",
    orderVerified: "Agizo limethibitishwa!",
    orderVerifyError: "Imeshindwa kuthibitisha agizo.",
    selectAtLeastOne: "Tafadhali ongeza bidhaa angalau moja kwenye agizo lako.",

    // Social Media
    socialMedia: "Mitandao ya Kijamii na Matangazo",
    facebookPage: "Ukurasa wa Facebook",
    instagramPage: "Ukurasa wa Instagram",
    tiktokPage: "Ukurasa wa TikTok",
    socialMediaHint: "Wateja wanaweza kufuata kurasa zako za matangazo",
    saveSocialLinks: "Hifadhi Viungo vya Kijamii",
    socialLinksSaved: "Viungo vya kijamii vimehifadhiwa!",
    followUs: "Tufuate kwenye",
    visitFacebook: "Facebook",
    visitInstagram: "Instagram",
    visitTikTok: "TikTok",
    advertisingSection: "Tangaza Biashara Yako",

    // Location
    findNearbyShops: "Pata Maduka Karibu",
    nearbyShopsActive: "Hali ya karibu imewashwa",
    sortByDistance: "Panga kwa Umbali",
    sortByDefault: "Mpangilio wa Kawaida",
    searchShopsPlaceholder: "Tafuta maduka kwa jina au mahali...",
    distanceAway: (d: string) => `${d} mbali`,
    locationPermissionDenied:
      "Ufikiaji wa eneo ulikataliwa. Tafadhali ruhusu eneo kwenye mipangilio ya kivinjari.",
    gettingLocation: "Inapata eneo...",
    shopLocationSet: (lat: string, lng: string) =>
      `Eneo limewekwa: ${lat}, ${lng}`,
    useMyCurrentLocation: "Tumia Eneo Langu la Sasa",
    shopLocationHint: "Kuweka eneo lako husaidia wateja kukupata karibu",
    shopLocationSection: "Eneo la Duka",
    locationSaved: "Eneo limehifadhiwa!",
    locationSaveError: "Imeshindwa kuhifadhi eneo.",

    // Payment
    paymentNumbers: "Nambari za Malipo",
    paymentNumbersHint:
      "Ongeza nambari zako za M-Pesa / pesa za simu kwa wateja kulipa",
    addPaymentNumber: "Ongeza Nambari ya Malipo",
    network: "Mtandao",
    accountHolder: "Jina la Mwenye Akaunti",
    payNow: "Lipa Sasa",
    payLater: "Lipa Baada ya Mzigo",
    copyNumber: "Nakili Nambari",
    copied: "Imenakiliwa!",
    paymentInstructions:
      "Nakili nambari hii, nenda kwenye app ya malipo yako, na utume pesa. Kisha rudi hapa kutuma uthibitisho.",
    submitProof: "Tuma Uthibitisho wa Malipo",
    pasteProof: "Bandika ujumbe wa SMS wa uthibitisho hapa...",
    proofSubmitted: "Uthibitisho wa malipo umetumwa!",
    proofError:
      "Haikuweza kutuma uthibitisho kiotomatiki. Tafadhali piga picha ya skrini na utumie mmiliki wa duka moja kwa moja.",
    paymentStatus: "Hali ya Malipo",
    paid: "Amelipa",
    unpaid: "Hajalipa",
    openApp: "Fungua App",
    noPaymentNumbers: "Duka hili halijasanidi nambari za malipo bado.",

    // Account Deletion
    deleteAccount: "Futa Akaunti",
    deleteAccountWarning:
      "Je, una uhakika unataka kufuta akaunti yako? Duka lako na bidhaa zote zitafutwa kabisa.",
    confirmDelete: "Ndiyo, Futa Akaunti Yangu",
    deletingAccount: "Inafuta...",
    accountDeleted: "Akaunti imefutwa kwa mafanikio.",
    accountDeleteError: "Imeshindwa kufuta akaunti.",

    // Offer
    specialOffer: "Punguzo Maalum",
    hasOffers: "Duka hili lina matoleo maalum!",
    offerLabel: "Ofa",
    productOffer: "Ofa/Punguzo la Bidhaa (hiari)",

    // Customer orders
    myOrders: "Maagizo Yangu",
    viewMyOrders: "Tazama Maagizo Yangu",
    enterPhoneToView: "Weka nambari yako ya simu kutazama maagizo yako",
    searchOrders: "Tafuta",
    noOrdersFound: "Hakuna maagizo kwa nambari hii.",
    orderedItems: "Bidhaa Zilizoagizwa",
    orderDate: "Tarehe ya Agizo",
  },
};

type TranslationKeys = keyof (typeof translations)["en"];

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKeys, ...args: any[]) => any;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const t = (key: TranslationKeys, ...args: any[]) => {
    const val = translations[lang][key];
    if (typeof val === "function")
      return (val as (...a: any[]) => any)(...args);
    return val;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
