'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Order = {
  id: string;
  phone: string;
  note: string;
  items: any[];
  total_items: number;
  total_price: number;
  created_at: string;
};

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const password = prompt('Nhập mật khẩu admin:');

    if (password === '090819') {
      setAuthorized(true);
      fetchOrders();
    } else {
      alert('Sai mật khẩu');
      window.location.href = '/';
    }
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      alert('Lỗi load đơn hàng');
      return;
    }

    setOrders(data || []);
  };

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-neutral-100 p-4">
      <h1 className="mb-4 text-xl font-bold">Admin - Đơn hàng</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl bg-white p-4 shadow">
            <div className="text-sm text-gray-500">
              {new Date(order.created_at).toLocaleString('vi-VN')}
            </div>

            <div className="font-semibold">SĐT: {order.phone}</div>

            <div className="mt-2">
              {order.items.map((item, idx) => (
                <div key={idx}>
                  {item.name} x{item.quantity} ({item.note || 'no note'})
                </div>
              ))}
            </div>

            <div className="mt-2 font-bold text-right">
              {order.total_price.toLocaleString('vi-VN')}đ
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}