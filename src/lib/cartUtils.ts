// Cart utilities for handling both anonymous and authenticated users

export interface LocalCartItem {
  product_id: string;
  quantity: number;
}

const CART_STORAGE_KEY = "guest_cart";

export const getLocalCart = (): LocalCartItem[] => {
  try {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
  } catch {
    return [];
  }
};

export const setLocalCart = (cart: LocalCartItem[]): void => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
};

export const addToLocalCart = (productId: string, quantity: number = 1): void => {
  const cart = getLocalCart();
  const existingIndex = cart.findIndex((item) => item.product_id === productId);
  
  if (existingIndex >= 0) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ product_id: productId, quantity });
  }
  
  setLocalCart(cart);
};

export const updateLocalCartQuantity = (productId: string, quantity: number): void => {
  const cart = getLocalCart();
  if (quantity <= 0) {
    const filtered = cart.filter((item) => item.product_id !== productId);
    setLocalCart(filtered);
  } else {
    const index = cart.findIndex((item) => item.product_id === productId);
    if (index >= 0) {
      cart[index].quantity = quantity;
      setLocalCart(cart);
    }
  }
};

export const removeFromLocalCart = (productId: string): void => {
  const cart = getLocalCart();
  const filtered = cart.filter((item) => item.product_id !== productId);
  setLocalCart(filtered);
};

export const clearLocalCart = (): void => {
  localStorage.removeItem(CART_STORAGE_KEY);
};

export const getLocalCartCount = (): number => {
  const cart = getLocalCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
};
