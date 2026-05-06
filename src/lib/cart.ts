// src/lib/cart.ts

export type CartItem = {
  productId: string;
  name: string;
  sku: string;
  price: number;
  imageUrl: string;
  quantity: number;
  stockQuantity: number;
};

const CART_KEY = "retail360_cart";

export function getCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];

  const storedCart = localStorage.getItem(CART_KEY);

  if (!storedCart) return [];

  try {
    return JSON.parse(storedCart) as CartItem[];
  } catch {
    return [];
  }
}

export function saveCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;

  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("retail360-cart-updated"));
}

export function addToCart(item: CartItem) {
  const existingItems = getCartItems();

  const existingItem = existingItems.find(
    (cartItem) => cartItem.productId === item.productId,
  );

  if (existingItem) {
    const nextQuantity = Math.min(
      existingItem.quantity + item.quantity,
      item.stockQuantity,
    );

    const updatedItems = existingItems.map((cartItem) =>
      cartItem.productId === item.productId
        ? {
            ...cartItem,
            quantity: nextQuantity,
          }
        : cartItem,
    );

    saveCartItems(updatedItems);
    return updatedItems;
  }

  const updatedItems = [...existingItems, item];
  saveCartItems(updatedItems);
  return updatedItems;
}

export function updateCartQuantity(productId: string, quantity: number) {
  const existingItems = getCartItems();

  const updatedItems = existingItems
    .map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: Math.max(1, Math.min(quantity, item.stockQuantity)),
          }
        : item,
    )
    .filter((item) => item.quantity > 0);

  saveCartItems(updatedItems);
  return updatedItems;
}

export function removeCartItem(productId: string) {
  const updatedItems = getCartItems().filter(
    (item) => item.productId !== productId,
  );

  saveCartItems(updatedItems);
  return updatedItems;
}

export function clearCart() {
  saveCartItems([]);
}

export function getCartTotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
