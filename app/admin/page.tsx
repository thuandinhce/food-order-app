'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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

type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  available: boolean;
  created_at: string;
};

const ADMIN_PASSWORD = '090819';

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');

  useEffect(() => {
    const password = window.prompt('Nhập mật khẩu admin:');

    if (password === ADMIN_PASSWORD) {
      setAuthorized(true);
    } else {
      alert('Sai mật khẩu');
      window.location.href = '/';
    }
  }, []);

  useEffect(() => {
    if (authorized) {
      fetchAll();
    }
  }, [authorized]);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [ordersRes, menuRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('menu_items')
          .select('*')
          .order('created_at', { ascending: true }),
      ]);

      if (ordersRes.error) {
        alert(`Lỗi load đơn hàng: ${ordersRes.error.message}`);
      } else {
        setOrders(ordersRes.data || []);
      }

      if (menuRes.error) {
        alert(`Lỗi load menu: ${menuRes.error.message}`);
      } else {
        setMenuItems(menuRes.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async () => {
    const priceNumber = Number(newPrice);

    if (!newName.trim()) {
      alert('Vui lòng nhập tên món');
      return;
    }

    if (!priceNumber || priceNumber <= 0) {
      alert('Vui lòng nhập giá hợp lệ');
      return;
    }

    const { error } = await supabase.from('menu_items').insert([
      {
        name: newName.trim(),
        price: priceNumber,
        description: newDescription.trim() || null,
        available: true,
      },
    ]);

    if (error) {
      alert(`Lỗi thêm món: ${error.message}`);
      return;
    }

    setNewName('');
    setNewPrice('');
    setNewDescription('');
    fetchAll();
  };

  const toggleAvailable = async (item: MenuItem) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ available: !item.available })
      .eq('id', item.id);

    if (error) {
      alert(`Lỗi cập nhật món: ${error.message}`);
      return;
    }

    fetchAll();
  };

  const deleteMenuItem = async (id: string) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa món này?');
    if (!confirmed) return;

    const { error } = await supabase.from('menu_items').delete().eq('id', id);

    if (error) {
      alert(`Lỗi xóa món: ${error.message}`);
      return;
    }

    fetchAll();
  };

  const markOrderDone = async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'done' })
      .eq('id', id);

    if (error) {
      alert(`Lỗi cập nhật đơn: ${error.message}`);
      return;
    }

    fetchAll();
  };

  const markOrderPending = async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'pending' })
      .eq('id', id);

    if (error) {
      alert(`Lỗi cập nhật đơn: ${error.message}`);
      return;
    }

    fetchAll();
  };

  const deleteOrder = async (id: string) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa đơn này?');
    if (!confirmed) return;

    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) {
      alert(`Lỗi xóa đơn: ${error.message}`);
      return;
    }

    fetchAll();
  };

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-neutral-100 p-4 text-neutral-900">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin - Tintune</h1>
          <button
            onClick={fetchAll}
            className="rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Tải lại
          </button>
        </div>

        {loading && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            Đang tải dữ liệu...
          </div>
        )}

        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Thêm món mới</h2>

          <div className="mt-4 space-y-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tên món"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
            />

            <input
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Giá"
              inputMode="numeric"
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
            />

            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Mô tả món"
              rows={3}
              className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
            />

            <button
              onClick={addMenuItem}
              className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Thêm món
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Quản lý menu</h2>

          <div className="mt-4 space-y-3">
            {menuItems.length === 0 && (
              <div className="text-sm text-neutral-500">Chưa có món nào.</div>
            )}

            {menuItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-neutral-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-neutral-500">
                      {item.price.toLocaleString('vi-VN')}đ
                    </div>
                    {item.description && (
                      <div className="mt-1 text-sm text-neutral-500">
                        {item.description}
                      </div>
                    )}
                    <div className="mt-1 text-xs">
                      Trạng thái:{' '}
                      <span
                        className={
                          item.available ? 'text-green-600' : 'text-red-500'
                        }
                      >
                        {item.available ? 'Đang bán' : 'Đang ẩn'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => toggleAvailable(item)}
                    className="rounded-2xl bg-neutral-900 px-3 py-2 text-xs font-medium text-white"
                  >
                    {item.available ? 'Ẩn món' : 'Hiện món'}
                  </button>

                  <button
                    onClick={() => deleteMenuItem(item.id)}
                    className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-medium text-white"
                  >
                    Xóa món
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Quản lý đơn hàng</h2>

          <div className="mt-4 space-y-4">
            {orders.length === 0 && (
              <div className="text-sm text-neutral-500">Chưa có đơn hàng.</div>
            )}

            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-neutral-200 p-4"
              >
                <div className="mb-2 text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleString('vi-VN')}
                </div>

                <div className="font-semibold">SĐT: {order.phone}</div>

                <div className="mt-1 text-sm">
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
                  <div className="mt-1 text-sm text-gray-600">
                    Ghi chú chung: {order.note}
                  </div>
                )}

                <div className="mt-3 space-y-1">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="text-sm">
                      • {item.name || 'Món không tên'} x{item.quantity || 0}
                      {!!item.note && (
                        <span className="text-gray-500"> ({item.note})</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-sm text-gray-500">
                  Tổng món: {order.total_items}
                </div>

                <div className="mt-1 text-right font-bold">
                  {order.total_price.toLocaleString('vi-VN')}đ
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {order.status !== 'done' ? (
                    <button
                      onClick={() => markOrderDone(order.id)}
                      className="rounded-2xl bg-green-600 px-3 py-2 text-xs font-medium text-white"
                    >
                      Hoàn thành
                    </button>
                  ) : (
                    <button
                      onClick={() => markOrderPending(order.id)}
                      className="rounded-2xl bg-orange-500 px-3 py-2 text-xs font-medium text-white"
                    >
                      Chuyển lại chờ
                    </button>
                  )}

                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-medium text-white"
                  >
                    Xóa đơn
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}