import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  type ShopData = {
    businessName : Text;
    ownerName : Text;
    phone : Text;
    address : Text;
  };

  type Product = {
    name : Text;
    price : Float;
  };

  type Order = {
    customerName : Text;
    customerPhone : Text;
    customerAddress : Text;
    deliveryTime : Text;
    items : [OrderItem];
    totalPrice : Float;
    createdAt : Time.Time;
    status : OrderStatus;
  };

  type OrderItem = {
    productName : Text;
    quantity : Nat;
    unitPrice : Float;
  };

  type OrderStatus = {
    #pending;
    #verified;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let shops = Map.empty<Principal, ShopData>();
  let products = Map.empty<Principal, [Product]>();
  let orders = Map.empty<Principal, [Order]>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func registerShop(shopData : ShopData) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can register shops");
    };
    if (shops.containsKey(caller)) {
      Runtime.trap("Shop already registered for this owner");
    } else {
      shops.add(caller, shopData);
      products.add(caller, []);
      orders.add(caller, []);
    };
  };

  public shared ({ caller }) func updateShop(shopData : ShopData) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update shops");
    };
    switch (shops.get(caller)) {
      case (null) { Runtime.trap("Shop not found for this owner") };
      case (?existingShop) {
        shops.add(caller, shopData);
      };
    };
  };

  public query func getAllShops() : async [(Principal, ShopData)] {
    shops.toArray();
  };

  public shared ({ caller }) func addProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add products");
    };
    switch (shops.get(caller)) {
      case (null) { Runtime.trap("Shop not found for this owner") };
      case (?_) {
        switch (products.get(caller)) {
          case (null) {
            let newProductsArray = [product];
            products.add(caller, newProductsArray);
          };
          case (?shopProducts) {
            let updatedProductsArray = shopProducts.concat([product]);
            products.add(caller, updatedProductsArray);
          };
        };
      };
    };
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update products");
    };
    switch (shops.get(caller)) {
      case (null) { Runtime.trap("Shop not found for this owner") };
      case (?_) {
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
    };
  };

  public shared ({ caller }) func deleteProduct(productName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete products");
    };
    switch (shops.get(caller)) {
      case (null) { Runtime.trap("Shop not found for this owner") };
      case (?_) {
        switch (products.get(caller)) {
          case (null) { Runtime.trap("No products found for this shop") };
          case (?shopProducts) {
            let filteredProducts = shopProducts.filter(
              func(p : Product) : Bool {
                p.name != productName;
              }
            );
            products.add(caller, filteredProducts);
          };
        };
      };
    };
  };

  public query func getProductsForShop(shopOwner : Principal) : async [Product] {
    switch (products.get(shopOwner)) {
      case (null) { [] };
      case (?shopProducts) { shopProducts };
    };
  };

  public func placeOrder(shopOwner : Principal, order : Order) : async () {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can verify orders");
    };
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view orders");
    };
    switch (shops.get(caller)) {
      case (null) { Runtime.trap("Shop not found for this owner") };
      case (?_) {
        switch (orders.get(caller)) {
          case (null) { [] };
          case (?shopOrders) { shopOrders };
        };
      };
    };
  };
};
