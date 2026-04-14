'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  available: boolean;
  image_url: string | null;
  image_path: string | null;
  display_order: number;
  category: string | null;
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

const ALL_CATEGORY = 'Tất cả';

export default function HomePage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);

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
        .order('display_order', { ascending: true });

      if (error) {
        alert(`Lỗi tải menu: ${error.message}`);
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

  const categories = useMemo(() => {
    const values = Array.from(
      new Set(
        menu
          .map((item) => item.category?.trim())
          .filter((value): value is string => !!value)
      )
    );

    return [ALL_CATEGORY, ...values];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    if (selectedCategory === ALL_CATEGORY) {
      return menu;
    }

    return menu.filter((item) => item.category === selectedCategory);
  }, [menu, selectedCategory]);

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

      alert('Đặt hàng thành công');
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
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 text-slate-700">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white/80 shadow-[0_10px_40px_rgba(15,118,110,0.10)] backdrop-blur-sm">
        <header className="sticky top-0 z-20 border-b border-emerald-100 bg-white/90 backdrop-blur">
          <div className="px-4 pb-4 pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-emerald-600">
                  Đặt món nhanh, ăn là ghiền 😋
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-700">
                  ĂN VẶT TINTUNE
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                  Món ngon mỗi ngày, đặt nhanh trên điện thoại
                </p>
              </div>

              <a
                href="https://zalo.me/0915025463"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-200"
              >
                Chat Zalo
              </a>
            </div>

            <div className="mt-4 -mx-4 overflow-x-auto px-4">
              <div className="flex min-w-max gap-2 pb-1">
                {categories.map((category) => {
                  const active = selectedCategory === category;

                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={
                        active
                          ? 'rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm'
                          : 'rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-slate-600'
                      }
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </header>

        <section className="space-y-3 px-4 py-4">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 p-[1px] shadow-sm">
            <div className="rounded-3xl bg-white/95 px-4 py-4">
              <p className="text-sm font-semibold text-emerald-700">
                {selectedCategory === ALL_CATEGORY
                  ? 'Hôm nay có gì ngon'
                  : `Danh mục: ${selectedCategory}`}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Chọn món, thêm ghi chú riêng, rồi đặt hàng thật nhanh.
              </p>
            </div>
          </div>

          {loadingMenu && (
            <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
              Đang tải menu...
            </div>
          )}

          {!loadingMenu && filteredMenu.length === 0 && (
            <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
              Không có món nào trong danh mục này.
            </div>
          )}

          {!loadingMenu &&
            filteredMenu.map((item) => {
              const cartItem = getItem(item.id);

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-emerald-100 bg-white px-3 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-emerald-50">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100">
                          <span className="px-2 text-center text-xs font-medium text-emerald-700">
                            Chưa có ảnh
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 text-[17px] font-semibold leading-6 text-slate-700">
                            {item.name}
                          </h2>

                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                              {item.description}
                            </p>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <p className="text-[18px] font-bold text-slate-700">
                              {item.price.toLocaleString('vi-VN')}đ
                            </p>
                            {item.category && (
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                                {item.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {!cartItem ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-3xl font-light leading-none text-white shadow-sm"
                            aria-label={`Thêm ${item.name}`}
                          >
                            +
                          </button>
                        ) : (
                          <div className="mt-1 flex shrink-0 flex-col items-center gap-2 rounded-2xl bg-emerald-50 px-2 py-2">
                            <button
                              onClick={() => addToCart(item)}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-2xl font-light leading-none text-white"
                              aria-label={`Tăng số lượng ${item.name}`}
                            >
                              +
                            </button>

                            <span className="text-sm font-semibold text-slate-700">
                              {cartItem.quantity}
                            </span>

                            <button
                              onClick={() => decreaseFromCart(item.id)}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-2xl font-light leading-none text-emerald-700 shadow-sm"
                              aria-label={`Giảm số lượng ${item.name}`}
                            >
                              -
                            </button>
                          </div>
                        )}
                      </div>

                      {cartItem && (
                        <textarea
                          value={cartItem.note}
                          onChange={(e) => updateItemNote(item.id, e.target.value)}
                          placeholder="Ghi chú riêng cho món này..."
                          className="mt-3 w-full rounded-2xl border border-emerald-100 bg-emerald-50/50 px-3 py-3 text-sm text-slate-600 outline-none placeholder:text-slate-400 focus:border-emerald-300"
                          rows={2}
                        />
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
        </section>

        <section className="px-4 pb-6">
          <div className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-700">
              Thông tin đặt hàng
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Số điện thoại
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0901234567"
                  className="mt-2 w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-slate-600 outline-none placeholder:text-slate-400 focus:border-emerald-300"
                />
                {phone.length > 0 && !isValidPhone && (
                  <p className="mt-2 text-xs text-red-500">
                    Vui lòng nhập số điện thoại hợp lệ.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-600">
                  Ghi chú chung
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ghi chú chung..."
                  className="mt-2 w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-slate-600 outline-none placeholder:text-slate-400 focus:border-emerald-300"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-40">
          <div className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-bold text-slate-700">
              Tra cứu đơn hàng
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Nhập số điện thoại đã đặt để kiểm tra trạng thái đơn.
            </p>

            <div className="mt-4 space-y-3">
              <input
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                placeholder="Nhập số điện thoại đã đặt"
                className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-slate-600 outline-none placeholder:text-slate-400 focus:border-emerald-300"
              />

              <button
                onClick={handleLookupOrders}
                disabled={lookupLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {lookupLoading ? 'Đang tra cứu...' : 'Tra cứu đơn'}
              </button>

              {lookupMessage && (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-slate-600">
                  {lookupMessage}
                </div>
              )}
            </div>

            {lookupOrders.length > 0 && (
              <div className="mt-4 space-y-4">
                {lookupOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4"
                  >
                    <div className="text-sm text-slate-500">
                      {new Date(order.created_at).toLocaleString('vi-VN')}
                    </div>

                    <div className="mt-2 text-sm text-slate-600">
                      Trạng thái:{' '}
                      <span
                        className={
                          order.status === 'done'
                            ? 'font-semibold text-emerald-600'
                            : 'font-semibold text-orange-500'
                        }
                      >
                        {order.status === 'done' ? 'Hoàn thành' : 'Đang chờ'}
                      </span>
                    </div>

                    {!!order.note && (
                      <div className="mt-2 text-sm text-slate-600">
                        Ghi chú chung: {order.note}
                      </div>
                    )}

                    <div className="mt-3 space-y-1">
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="text-sm text-slate-600">
                          • {item.name || 'Món không tên'} x{item.quantity || 0}
                          {!!item.note && (
                            <span className="text-slate-500"> ({item.note})</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-right font-bold text-emerald-700">
                      {order.total_price.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-emerald-100 bg-white/90 px-4 py-4 backdrop-blur">
          <div className="flex items-center justify-between rounded-[24px] bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-4 text-white shadow-[0_10px_30px_rgba(16,185,129,0.25)]">
            <div>
              <p className="text-sm text-white/85">{totalItems} món</p>
              <p className="text-lg font-bold">
                {totalPrice.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <button
              onClick={handleOrder}
              disabled={!canOrder}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Đang gửi...' : 'Đặt hàng'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}