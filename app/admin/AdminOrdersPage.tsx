'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AdminNav } from './AdminNav';
import { useAdminAuth } from './useAdminAuth';

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

export default function AdminOrdersPage() {
  const authorized = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        alert(`Lỗi tải đơn hàng: ${error.message}`);
        return;
      }

      setOrders(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchOrders();
    }
  }, [authorized]);

  const markOrderDone = async (id: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'done' })
      .eq('id', id);

    if (error) {
      alert(`Lỗi cập nhật đơn: ${error.message}`);
      return;
    }

    fetchOrders();
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

    fetchOrders();
  };

  const deleteOrder = async (id: string) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa đơn này?');
    if (!confirmed) return;

    const { error } = await supabase.from('orders').delete().eq('id', id);

    if (error) {
      alert(`Lỗi xóa đơn: ${error.message}`);
      return;
    }

    fetchOrders();
  };

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 p-4 text-slate-700">
      <div className="mx-auto w-full max-w-md space-y-6">
        <AdminNav active="orders" />

        <div className="rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-700">
                Quản lý đơn hàng
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi và cập nhật đơn mới
              </p>
            </div>

            <button
              onClick={fetchOrders}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              Tải lại
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
            Đang tải đơn hàng...
          </div>
        )}

        <section className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="space-y-4">
            {orders.length === 0 && !loading && (
              <div className="text-sm text-slate-500">Chưa có đơn hàng.</div>
            )}

            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-emerald-100 bg-emerald-50/30 p-4"
              >
                <div className="mb-2 text-sm text-slate-500">
                  {new Date(order.created_at).toLocaleString('vi-VN')}
                </div>

                <div className="font-semibold text-slate-700">
                  Số điện thoại: {order.phone}
                </div>

                <div className="mt-1 text-sm text-slate-600">
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
                  <div className="mt-1 text-sm text-slate-600">
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

                <div className="mt-3 text-sm text-slate-500">
                  Tổng món: {order.total_items}
                </div>

                <div className="mt-1 text-right font-bold text-emerald-700">
                  {order.total_price.toLocaleString('vi-VN')}đ
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {order.status !== 'done' ? (
                    <button
                      onClick={() => markOrderDone(order.id)}
                      className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-medium text-white"
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
                    className="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-medium text-white"
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
