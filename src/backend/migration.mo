import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  public type ShopLocation = {
    latitude : Float;
    longitude : Float;
  };

  public type OldActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    shops : Map.Map<Principal, {
      businessName : Text;
      ownerName : Text;
      phone : Text;
      address : Text;
    }>;
    shopSocials : Map.Map<Principal, {
      facebook : Text;
      instagram : Text;
      tiktok : Text;
      photoUrl : Text;
    }>;
    products : Map.Map<Principal, [{ name : Text; price : Float }]>;
    orders : Map.Map<Principal, [{
      customerName : Text;
      customerPhone : Text;
      customerAddress : Text;
      deliveryTime : Text;
      items : [{
        productName : Text;
        quantity : Nat;
        unitPrice : Float;
      }];
      totalPrice : Float;
      createdAt : Int;
      status : { #pending; #verified };
    }]>;
  };

  public type NewActor = {
    userProfiles : Map.Map<Principal, { name : Text }>;
    shops : Map.Map<Principal, {
      businessName : Text;
      ownerName : Text;
      phone : Text;
      address : Text;
    }>;
    shopSocials : Map.Map<Principal, {
      facebook : Text;
      instagram : Text;
      tiktok : Text;
      photoUrl : Text;
    }>;
    products : Map.Map<Principal, [{ name : Text; price : Float }]>;
    orders : Map.Map<Principal, [{
      customerName : Text;
      customerPhone : Text;
      customerAddress : Text;
      deliveryTime : Text;
      items : [{
        productName : Text;
        quantity : Nat;
        unitPrice : Float;
      }];
      totalPrice : Float;
      createdAt : Int;
      status : { #pending; #verified };
    }]>;
    shopLocations : Map.Map<Principal, ShopLocation>;
  };

  public func run(oldActor : OldActor) : NewActor {
    {
      oldActor with
      shopLocations = Map.empty<Principal, ShopLocation>();
    };
  };
};
