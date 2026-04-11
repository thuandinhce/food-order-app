'use client';

import Image from 'next/image';
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
  image_url: string | null;
  image_path: string | null;
};

const ADMIN_PASSWORD = '123456';

export default function AdminPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

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

  const uploadMenuImage = async (file: File) => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const filePath = `menu/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(filePath, file, {
        upsert: false,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from('menu-images')
      .getPublicUrl(filePath);

    return {
      imageUrl: data.publicUrl,
      imagePath: filePath,
    };
  };

  const removeMenuImageByPath = async (imagePath: string | null) => {
    if (!imagePath) return;

    const { error } = await supabase.storage
      .from('menu-images')
      .remove([imagePath]);

    if (error) {
      console.error('Delete storage image error:', error.message);
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

    try {
      let imageUrl: string | null = null;
      let imagePath: string | null = null;

      if (newImageFile) {
        const uploadResult = await uploadMenuImage(newImageFile);
        imageUrl = uploadResult.imageUrl;
        imagePath = uploadResult.imagePath;
      }

      const { error } = await supabase.from('menu_items').insert([
        {
          name: newName.trim(),
          price: priceNumber,
          description: newDescription.trim() || null,
          available: true,
          image_url: imageUrl,
          image_path: imagePath,
        },
      ]);

      if (error) {
        alert(`Lỗi thêm món: ${error.message}`);
        return;
      }

      setNewName('');
      setNewPrice('');
      setNewDescription('');
      setNewImageFile(null);
      fetchAll();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload ảnh thất bại.';
      alert(`Lỗi upload ảnh: ${message}`);
    }
  };

  const startEditMenuItem = (item: MenuItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditDescription(item.description || '');
    setEditImageFile(null);
  };

  const cancelEditMenuItem = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
    setEditDescription('');
    setEditImageFile(null);
  };

  const saveEditMenuItem = async (currentItem: MenuItem) => {
    if (!editingId) return;

    const priceNumber = Number(editPrice);

    if (!editName.trim()) {
      alert('Vui lòng nhập tên món');
      return;
    }

    if (!priceNumber || priceNumber <= 0) {
      alert('Vui lòng nhập giá hợp lệ');
      return;
    }

    try {
      let imageUrl = currentItem.image_url;
      let imagePath = currentItem.image_path;

      if (editImageFile) {
        const uploadResult = await uploadMenuImage(editImageFile);
        imageUrl = uploadResult.imageUrl;
        imagePath = uploadResult.imagePath;
      }

      const { error } = await supabase
        .from('menu_items')
        .update({
          name: editName.trim(),
          price: priceNumber,
          description: editDescription.trim() || null,
          image_url: imageUrl,
          image_path: imagePath,
        })
        .eq('id', editingId);

      if (error) {
        alert(`Lỗi sửa món: ${error.message}`);
        return;
      }

      if (editImageFile && currentItem.image_path) {
        await removeMenuImageByPath(currentItem.image_path);
      }

      cancelEditMenuItem();
      fetchAll();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload ảnh thất bại.';
      alert(`Lỗi upload ảnh: ${message}`);
    }
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

  const deleteMenuItem = async (item: MenuItem) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa món này?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', item.id);

    if (error) {
      alert(`Lỗi xóa món: ${error.message}`);
      return;
    }

    if (item.image_path) {
      await removeMenuImageByPath(item.image_path);
    }

    if (editingId === item.id) {
      cancelEditMenuItem();
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

            <div>
              <label className="mb-2 block text-sm font-medium">Ảnh món</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
              />
            </div>

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

            {menuItems.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-neutral-200 p-3"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Tên món"
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
                      />

                      <input
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Giá"
                        inputMode="numeric"
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
                      />

                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Mô tả món"
                        rows={3}
                        className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm outline-none"
                      />

                      {item.image_url && (
                        <div className="relative h-40 w-full overflow-hidden rounded-2xl">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Đổi ảnh món
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditImageFile(e.target.files?.[0] || null)
                          }
                          className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm"
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEditMenuItem(item)}
                          className="rounded-2xl bg-green-600 px-3 py-2 text-xs font-medium text-white"
                        >
                          Lưu
                        </button>

                        <button
                          onClick={cancelEditMenuItem}
                          className="rounded-2xl bg-neutral-300 px-3 py-2 text-xs font-medium text-neutral-900"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {item.image_url && (
                        <div className="relative mb-3 h-40 w-full overflow-hidden rounded-2xl">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}

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

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => startEditMenuItem(item)}
                          className="rounded-2xl bg-blue-600 px-3 py-2 text-xs font-medium text-white"
                        >
                          Sửa món
                        </button>

                        <button
                          onClick={() => toggleAvailable(item)}
                          className="rounded-2xl bg-neutral-900 px-3 py-2 text-xs font-medium text-white"
                        >
                          {item.available ? 'Ẩn món' : 'Hiện món'}
                        </button>

                        <button
                          onClick={() => deleteMenuItem(item)}
                          className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-medium text-white"
                        >
                          Xóa món
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
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