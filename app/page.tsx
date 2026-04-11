'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  available: boolean;
};

type CartItem = MenuItem & {
  quantity: number;
  note: string;
};

type OrderItem = {
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  note?: string;
};

type Order = {
  id: string;
  phone: string;
  note: string | null;
  items: OrderItem[] | null;
  total_items: number;
  total_price: number;
  created_at: string;
  status: string;
};

export default function HomePage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupOrders, setLookupOrders] = useState<Order[]>([]);
  const [lookupMessage, setLookupMessage] = useState('');

  const fetchMenu = async () => {
    try {
      setLoadingMenu(true);

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('available', true)
        .order('created_at', { ascending: true });

      if (error) {
        alert(`Lỗi load menu: ${error.message}`);
        return;
      }

      setMenu(data || []);
    } finally {
      setLoadingMenu(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

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

  const decreaseFromCart = (itemId: string) => {
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

  const updateItemNote = (itemId: string, newNote: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, note: newNote } : item
      )
    );
  };

  const getItem = (itemId: string) => {
    return cart.find((item) => item.id === itemId);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const isValidPhone = /^0\d{9,10}$/.test(phone);
  const isValidLookupPhone = /^0\d{9,10}$/.test(lookupPhone);
  const canOrder = isValidPhone && cart.length > 0 && !isSubmitting;

  const handleOrder = async () => {
    if (!canOrder) return;

    try {
      setIsSubmitting(true);

      const payload = {
        phone,
        note,
        items: cart,
        total_items: totalItems,
        total_price: totalPrice,
        status: 'pending',
      };

      const { error } = await supabase.from('orders').insert([payload]);

      if (error) {
        alert(`Đặt hàng thất bại: ${error.message}`);
        return;
      }

      alert('Đặt hàng thành công!');
      setCart([]);
      setPhone('');
      setNote('');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Có lỗi không xác định xảy ra.';
      alert(`Có lỗi xảy ra: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLookupOrders = async () => {
    if (!isValidLookupPhone) {
      setLookupMessage('Vui lòng nhập số điện thoại hợp lệ.');
      setLookupOrders([]);
      return;
    }

    try {
      setLookupLoading(true);
      setLookupMessage('');

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('phone', lookupPhone)
        .order('created_at', { ascending: false });

      if (error) {
        setLookupMessage(`Lỗi tra cứu đơn: ${error.message}`);
        setLookupOrders([]);
        return;
      }

      if (!data || data.length === 0) {
        setLookupMessage('Không tìm thấy đơn hàng nào với số điện thoại này.');
        setLookupOrders([]);
        return;
      }

      setLookupOrders(data);
      setLookupMessage(`Tìm thấy ${data.length} đơn hàng.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Có lỗi không xác định xảy ra.';
      setLookupMessage(`Có lỗi xảy ra: ${message}`);
      setLookupOrders([]);
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-100 text-neutral-900">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-neutral-500">
                Đặt món nhanh - ăn là ghiền 😋
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                Ăn vặt TINTUNE
              </h1>
            </div>
            <a
              href="https://zalo.me/0915025463"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium shadow-sm"
            >
              Chat Zalo
            </a>
          </div>
        </header>

        <section className="space-y-4 px-4 py-4">
          {loadingMenu && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              Đang tải menu...
            </div>
          )}

          {!loadingMenu && menu.length === 0 && (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              Hôm nay chưa có món nào.
            </div>
          )}

          {!loadingMenu &&
            menu.map((item) => {
              const cartItem = getItem(item.id);

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm"
                >
                  <h2 className="text-lg font-semibold">{item.name}</h2>

                  {item.description && (
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.description}
                    </p>
                  )}

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

        <section className="px-4 pb-6">
          <div className="space-y-3 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
            <h2 className="text-lg font-semibold">Thông tin đặt hàng</h2>

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

        <section className="px-4 pb-40">
          <div className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Tra cứu đơn hàng</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Nhập số điện thoại đã đặt để kiểm tra trạng thái đơn.
            </p>

            <div className="mt-4 space-y-3">
              <input
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                placeholder="Nhập số điện thoại đã đặt"
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
              />

              <button
                onClick={handleLookupOrders}
                disabled={lookupLoading}
                className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {lookupLoading ? 'Đang tra cứu...' : 'Tra cứu đơn'}
              </button>

              {lookupMessage && (
                <div className="rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-700">
                  {lookupMessage}
                </div>
              )}
            </div>

            {lookupOrders.length > 0 && (
              <div className="mt-4 space-y-4">
                {lookupOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="text-sm text-neutral-500">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </div>

                    <div className="mt-2 text-sm">
                      Trạng thái:{' '}
                      <span
                        className={
                          order.status === 'done'
                            ? 'font-medium text-green-600'
                            : 'font-medium text-orange-500'
                        }
                      >
                        {order.status === 'done' ? 'Hoàn thành' : 'Đang chờ'}
                      </span>
                    </div>

                    {!!order.note && (
                      <div className="mt-2 text-sm text-neutral-600">
                        Ghi chú chung: {order.note}
                      </div>
                    )}

                    <div className="mt-3 space-y-1">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="text-sm">
                          • {item.name || 'Món không tên'} x{item.quantity || 0}
                          {!!item.note && (
                            <span className="text-neutral-500">
                              {' '}
                              ({item.note})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-right font-bold">
                      {order.total_price.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>
            )}
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