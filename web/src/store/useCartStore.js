import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const { items } = get();
        // item shape: { menuItemId, name, price, imageUrl, quantity, addons, specialInstructions }
        const existing = items.findIndex(
          (i) =>
            i.menuItemId === item.menuItemId &&
            JSON.stringify(i.addons) === JSON.stringify(item.addons)
        );
        if (existing >= 0) {
          const updated = [...items];
          updated[existing] = { ...updated[existing], quantity: updated[existing].quantity + item.quantity };
          set({ items: updated });
        } else {
          set({ items: [...items, item] });
        }
      },

      updateQuantity: (index, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          set({ items: items.filter((_, i) => i !== index) });
        } else {
          const updated = [...items];
          updated[index] = { ...updated[index], quantity };
          set({ items: updated });
        }
      },

      removeItem: (index) => {
        set({ items: get().items.filter((_, i) => i !== index) });
      },

      clearCart: () => set({ items: [] }),

      get subtotal() {
        return get().items.reduce((sum, item) => {
          const addonTotal = (item.addons || []).reduce((a, ad) => a + (ad.price || 0), 0);
          return sum + (item.price + addonTotal) * item.quantity;
        }, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const addonTotal = (item.addons || []).reduce((a, ad) => a + (ad.price || 0), 0);
          return sum + (item.price + addonTotal) * item.quantity;
        }, 0);
      },

      getTax: () => Math.round(get().getSubtotal() * 0.05 * 100) / 100,
      getTotal: () => get().getSubtotal() + get().getTax(),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'canteenx-cart' }
  )
);
