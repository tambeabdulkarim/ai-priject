// Client-only shopping cart. NOT a backend concept — the real backend has
// no cart persistence endpoint at all (verified: POST /orders takes the
// full `items[]` array directly at checkout time, see
// packages/types/src/marketplace.ts's header comment). This Context
// holds cart state purely in the browser (localStorage-backed) and is
// submitted wholesale to the real `POST /orders` endpoint at checkout —
// it does not simulate or invent any server-side cart behavior.

import { createContext } from 'react';

export interface CartItem {
  productId: string;
  title: string;
  slug: string;
  priceCents: number;
  quantity: number;
}

export interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalCents: number;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);
