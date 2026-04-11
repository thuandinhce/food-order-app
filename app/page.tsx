'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

type MenuItem = {
  id: number;
  name: string;
  price: number;
};

type CartItem = MenuItem & {
  quantity: number;
  note: string;
};

export default function HomePage() {
  const menu: MenuItem[] = [
    { id: 1, name: 'Cơm gà xối mỡ', price: 45000 },
    { id: 2, name: 'Trà sữa trân châu', price: 30000 },
  ];

  const [cart, setCart] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugMessage, setDebugMessage] = useState('');

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);

      if (found) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }

      return [...prev, { ...item, quantity: 1, note: '' }];
    });
  };

  const decreaseFromCart = (itemId: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updateItemNote = (itemId: number, newNote: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, note: newNote } : item
      )
    );
  };

  const getItem = (itemId: number) => {
    return cart.find((item) => item.id === itemId);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const isValidPhone = /^0\d{9,10}$/.test(phone);
  const canOrder = isValidPhone && cart.length > 0 && !isSubmitting;

  const testSupabaseConnection = async () => {
    try {
      setDebugMessage('Đang test kết nối Supabase...');

      const { error } = await supabase
        .from('orders')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Supabase select error:', error);
        setDebugMessage(`Có kết nối tới Supabase, nhưng query lỗi: ${error.message}`);
        return;
      }

      setDebugMessage('Kết nối Supabase OK.');
    } catch (err) {
      console.error('Supabase network error:', err);

      const message =
        err instanceof Error ? err.message : 'Unknown error';

      setDebugMessage(`Lỗi kết nối mạng tới Supabase: ${message}`);
    }
  };

  const handleOrder = async () => {
    if (!canOrder) return;

    try {
      setIsSubmitting(true);
      setDebugMessage('');

      const payload = {
        phone,
        note,
        items: cart,
        total_items: totalItems,
        total_price: totalPrice,
      };

      const { error } = await supabase.from('orders').insert([payload]);

      if (error) {
        console.error('Insert order error:', error);
        alert(`Đặt hàng thất bại: ${error.message}`);
        return;
      }

      alert('Đặt hàng thành công!');
      setDebugMessage('Insert order thành công.');

      setCart([]);
      setPhone('');
      setNote('');
    } catch (err) {
      console.error('Unexpected order error:', err);

      const message =
        err instanceof Error ? err.message : 'Có lỗi không xác định xảy ra.';

      alert(`Có lỗi xảy ra: ${message}`);
      setDebugMessage(`Lỗi mạng/runtime: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm">
        <header className="sticky top-0 border-b border-neutral-200 bg-white px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-500">
                Đặt món nhanh - ăn là ghiền 😋
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                Ăn vặt Tintune
              </h1>
            </div>
            <a
              href="https://zalo.me/0900000000"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium shadow-sm"
            >
              Chat Zalo
            </a>
          </div>

          <div className="mt-3">
            <button
              onClick={testSupabaseConnection}
              className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium"
            >
              Test kết nối Supabase
            </button>
          </div>

          {debugMessage && (
            <div className="mt-3 rounded-2xl bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
              {debugMessage}
            </div>
          )}
        </header>

        <section className="space-y-4 px-4 py-4">
          {menu.map((item) => {
            const cartItem = getItem(item.id);

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <h2 className="text-lg font-semibold">{item.name}</h2>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-base font-bold">
                    {item.price.toLocaleString('vi-VN')}đ
                  </p>

                  {!cartItem ? (
                    <button
                      onClick={() => addToCart(item)}
                      className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Thêm món
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => decreaseFromCart(item.id)}
                        className="h-9 w-9 rounded-xl bg-neutral-100 text-lg font-bold"
                      >
                        -
                      </button>

                      <span>{cartItem.quantity}</span>

                      <button
                        onClick={() => addToCart(item)}
                        className="h-9 w-9 rounded-xl bg-neutral-900 text-lg font-bold text-white"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {cartItem && (
                  <textarea
                    value={cartItem.note}
                    onChange={(e) => updateItemNote(item.id, e.target.value)}
                    placeholder="Ghi chú riêng cho món này..."
                    className="mt-3 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  />
                )}
              </article>
            );
          })}
        </section>

        <section className="px-4 pb-40">
          <div className="space-y-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
            <div>
              <label className="text-sm font-medium">Số điện thoại</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
              />
              {phone.length > 0 && !isValidPhone && (
                <p className="mt-2 text-xs text-red-500">
                  Vui lòng nhập số điện thoại hợp lệ.
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Ghi chú chung</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú chung..."
                className="mt-1 w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
                rows={4}
              />
            </div>
          </div>
        </section>

        <div className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t bg-white px-4 py-4">
          <div className="flex items-center justify-between rounded-2xl bg-neutral-900 px-4 py-3 text-white">
            <div>
              <p>{totalItems} món</p>
              <p className="font-bold">
                {totalPrice.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <button
              onClick={handleOrder}
              disabled={!canOrder}
              className="rounded-2xl bg-white px-5 py-3 text-black disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Đặt hàng'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}