import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  public type ShopPaymentInfo = {
    network : Text;
    phoneNumber : Text;
    accountHolder : Text;
  };

  public type ShopData = {
    businessName : Text;
    ownerName : Text;
    phone : Text;
    address : Text;
    payments : [ShopPaymentInfo];
  };

  public type ShopSocials = {
    facebook : Text;
    instagram : Text;
    tiktok : Text;
    photoUrl : Text;
  };

  public type ShopLocation = {
    latitude : Float;
    longitude : Float;
  };

  // Product type WITHOUT photoUrl to preserve stable variable compatibility
  public type Product = {
    name : Text;
    price : Float;
    offer : ?Text;
  };

  public type Order = {
    customerName : Text;
    customerPhone : Text;
    customerAddress : Text;
    deliveryTime : Text;
    items : [OrderItem];
    totalPrice : Float;
    createdAt : Time.Time;
    status : OrderStatus;
    paymentProof : ?PaymentProof;
    paymentStatus : PaymentStatus;
  };

  public type PaymentProof = {
    proofText : ?Text;
    screenshotUrl : ?Text;
  };

  public type OrderItem = {
    productName : Text;
    quantity : Nat;
    unitPrice : Float;
  };

  public type OrderStatus = {
    #pending;
    #verified;
  };

  public type PaymentStatus = {
    #unpaid;
    #paid;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let shops = Map.empty<Principal, ShopData>();
  let shopSocials = Map.empty<Principal, ShopSocials>();
  let shopLocations = Map.empty<Principal, ShopLocation>();
  let products = Map.empty<Principal, [Product]>();
  let orders = Map.empty<Principal, [Order]>();
  // Separate stable map for product photos: owner -> [(productName, photoUrl)]
  let productPhotos = Map.empty<Principal, [(Text, Text)]>();

  func requireAuthenticated(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot perform this action");
    };
  };

  func ensureUserRegistered(caller : Principal) {
    switch (accessControlState.userRoles.get(caller)) {
      case (null) { accessControlState.userRoles.add(caller, #user) };
      case (_) {};
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuthenticated(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireAuthenticated(caller);
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func registerShop(shopData : ShopData) : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    if (shops.containsKey(caller)) {
      shops.add(caller, shopData);
    } else {
      shops.add(caller, shopData);
      products.add(caller, []);
      orders.add(caller, []);
    };
  };

  public shared ({ caller }) func updateShop(shopData : ShopData) : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    switch (shops.get(caller)) {
      case (null) {
        shops.add(caller, shopData);
        products.add(caller, []);
        orders.add(caller, []);
      };
      case (?_) {
        shops.add(caller, shopData);
      };
    };
  };

  public shared ({ caller }) func deleteMyShop() : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    if (not shops.containsKey(caller)) {
      Runtime.trap("Shop not found");
    };
    shops.remove(caller);
    shopSocials.remove(caller);
    shopLocations.remove(caller);
    products.remove(caller);
    productPhotos.remove(caller);
    orders.remove(caller);
  };

  public shared ({ caller }) func updateShopSocials(socials : ShopSocials) : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    shopSocials.add(caller, socials);
  };

  public query func getShopSocials(shopOwner : Principal) : async ?ShopSocials {
    shopSocials.get(shopOwner);
  };

  public query func getAllShops() : async [(Principal, ShopData)] {
    shops.toArray();
  };

  // Save a product photo URL for a specific product
  public shared ({ caller }) func setProductPhoto(productName : Text, photoUrl : Text) : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    let existing = switch (productPhotos.get(caller)) {
      case (null) { [] };
      case (?arr) { arr };
    };
    // Remove old entry for this product name if any, then add new
    let filtered = existing.filter(func((name, _) : (Text, Text)) : Bool {
      name != productName;
    });
    productPhotos.add(caller, filtered.concat([(productName, photoUrl)]));
  };

  // Get all product photos for a shop
  public query func getProductPhotos(shopOwner : Principal) : async [(Text, Text)] {
    switch (productPhotos.get(shopOwner)) {
      case (null) { [] };
      case (?arr) { arr };
    };
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    if (not shops.containsKey(caller)) {
      Runtime.trap("Please register your shop first before adding products");
    };
    switch (products.get(caller)) {
      case (null) {
        products.add(caller, [product]);
      };
      case (?shopProducts) {
        let updatedProductsArray = shopProducts.concat([product]);
        products.add(caller, updatedProductsArray);
      };
    };
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    switch (products.get(caller)) {
      case (null) { Runtime.trap("No products found for this shop") };
      case (?shopProducts) {
        var productUpdated = false;
        let updatedProducts = shopProducts.map(
          func(p : Product) : Product {
            if (p.name == product.name) {
              productUpdated := true;
              product;
            } else {
              p;
            };
          }
        );
        if (not productUpdated) {
          Runtime.trap("Product not found");
        };
        products.add(caller, updatedProducts);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productName : Text) : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    switch (products.get(caller)) {
      case (null) { Runtime.trap("No products found for this shop") };
      case (?shopProducts) {
        let filteredProducts = shopProducts.filter(
          func(p : Product) : Bool {
            p.name != productName;
          }
        );
        products.add(caller, filteredProducts);
        // Also remove the photo entry
        let existingPhotos = switch (productPhotos.get(caller)) {
          case (null) { [] };
          case (?arr) { arr };
        };
        let filteredPhotos = existingPhotos.filter(func((name, _) : (Text, Text)) : Bool {
          name != productName;
        });
        productPhotos.add(caller, filteredPhotos);
      };
    };
  };

  public query func getProductsForShop(shopOwner : Principal) : async [Product] {
    switch (products.get(shopOwner)) {
      case (null) { [] };
      case (?shopProducts) { shopProducts };
    };
  };

  public shared ({ caller }) func placeOrder(shopOwner : Principal, order : Order) : async () {
    let totalPrice = order.items.foldLeft(
      0.0,
      func(acc : Float, item : OrderItem) : Float {
        acc + (item.unitPrice * item.quantity.toFloat());
      },
    );

    let newOrder = {
      customerName = order.customerName;
      customerPhone = order.customerPhone;
      customerAddress = order.customerAddress;
      deliveryTime = order.deliveryTime;
      items = order.items;
      totalPrice = totalPrice;
      createdAt = Time.now();
      status = #pending;
      paymentProof = null;
      paymentStatus = #unpaid;
    };

    switch (orders.get(shopOwner)) {
      case (null) { Runtime.trap("Shop not found") };
      case (?shopOrders) {
        let updatedOrders = shopOrders.concat([newOrder]);
        orders.add(shopOwner, updatedOrders);
      };
    };
  };

  public shared ({ caller }) func verifyOrder(orderId : Nat) : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    switch (shops.get(caller)) {
      case (null) { Runtime.trap("Shop not found for this owner") };
      case (?_) {
        let ownerOrders = switch (orders.get(caller)) {
          case (null) { Runtime.trap("No orders found for this shop") };
          case (?foundOrders) { foundOrders };
        };

        if (orderId >= ownerOrders.size()) {
          Runtime.trap("Invalid order ID");
        };

        var orderFound = false;
        let updatedOrdersArray = ownerOrders.enumerate().map(
          func((i : Nat, order : Order)) : Order {
            if (i == orderId) {
              orderFound := true;
              {
                customerName = order.customerName;
                customerPhone = order.customerPhone;
                customerAddress = order.customerAddress;
                deliveryTime = order.deliveryTime;
                items = order.items;
                totalPrice = order.totalPrice;
                createdAt = order.createdAt;
                status = #verified;
                paymentProof = order.paymentProof;
                paymentStatus = #paid;
              };
            } else {
              order;
            };
          }
        ).toArray();

        if (not orderFound) {
          Runtime.trap("Order not found");
        };

        orders.add(caller, updatedOrdersArray);
      };
    };
  };

  public query ({ caller }) func getOrdersForShop() : async [Order] {
    requireAuthenticated(caller);
    switch (orders.get(caller)) {
      case (null) { [] };
      case (?shopOrders) { shopOrders };
    };
  };

  // Customer submits payment proof - no auth required (customers may be anonymous)
  public shared ({ caller }) func submitPaymentProof(shopOwner : Principal, orderIndex : Nat, proofText : Text, screenshotUrl : Text) : async () {
    let shopOrders = switch (orders.get(shopOwner)) {
      case (null) { Runtime.trap("Shop not found") };
      case (?shopOrders) { shopOrders };
    };

    if (orderIndex >= shopOrders.size()) {
      Runtime.trap("Invalid order index");
    };

    let paymentProof : PaymentProof = {
      proofText = ?proofText;
      screenshotUrl = ?screenshotUrl;
    };

    let updatedOrders = shopOrders.enumerate().map(
      func((index : Nat, order : Order)) : Order {
        if (index == orderIndex) {
          {
            customerName = order.customerName;
            customerPhone = order.customerPhone;
            customerAddress = order.customerAddress;
            deliveryTime = order.deliveryTime;
            items = order.items;
            totalPrice = order.totalPrice;
            createdAt = order.createdAt;
            status = order.status;
            paymentProof = ?paymentProof;
            paymentStatus = #paid;
          };
        } else {
          order;
        };
      }
    ).toArray();

    orders.add(shopOwner, updatedOrders);
  };

  // Delete orders by index (owner only, indices become invalid after deletion)
  public shared ({ caller }) func deleteOrders(orderIndices : [Nat]) : async () {
    requireAuthenticated(caller);
    ensureUserRegistered(caller);
    switch (orders.get(caller)) {
      case (null) { };
      case (?shopOrders) {
        var remaining : [Order] = [];
        var i : Nat = 0;
        for (order in shopOrders.vals()) {
          var shouldKeep = true;
          for (idx in orderIndices.vals()) {
            if (idx == i) { shouldKeep := false };
          };
          if (shouldKeep) {
            remaining := remaining.concat([order]);
          };
          i += 1;
        };
        orders.add(caller, remaining);
      };
    };
  };

  public query ({ caller }) func getCustomerOrders(phone : Text) : async [Order] {
    requireAuthenticated(caller);

    let flattenedOrders = orders.values().foldLeft(
      [] : [Order],
      func(acc, current) {
        acc.concat(current);
      },
    );

    let filteredOrdersIter = flattenedOrders.values().filter(
      func(order) {
        Text.equal(order.customerPhone, phone);
      }
    );
    filteredOrdersIter.toArray();
  };

  public shared ({ caller }) func setShopLocation(lat : Float, lng : Float) : async () {
    requireAuthenticated(caller);
    let location = { latitude = lat; longitude = lng };
    shopLocations.add(caller, location);
  };

  public query func getShopLocation(shopOwner : Principal) : async ?ShopLocation {
    shopLocations.get(shopOwner);
  };
};
