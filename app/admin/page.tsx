'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type OrderItem = {
  id?: number;
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
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch orders error:', error);
        setErrorMessage(`Lỗi load đơn hàng: ${error.message}`);
        setOrders([]);
        return;
      }

      setOrders(data || []);
    } catch (err) {
      console.error('Unexpected fetch orders error:', err);
      const message =
        err instanceof Error ? err.message : 'Có lỗi không xác định xảy ra.';
      setErrorMessage(`Có lỗi xảy ra: ${message}`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-100 p-4">
      <div className="mx-auto w-full max-w-md">
        <h1 className="mb-4 text-xl font-bold">Admin - Đơn hàng</h1>

        <button
          onClick={fetchOrders}
          className="mb-4 rounded-2xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Tải lại
        </button>

        {loading && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            Đang tải đơn hàng...
          </div>
        )}

        {!loading && errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {errorMessage}
          </div>
        )}

        {!loading && !errorMessage && orders.length === 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            Chưa có đơn hàng nào.
          </div>
        )}

        {!loading && !errorMessage && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleString('vi-VN')}
                </div>

                <div className="font-semibold">SĐT: {order.phone}</div>

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
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}