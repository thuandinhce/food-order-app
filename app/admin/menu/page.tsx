'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../../../lib/supabase';
import { AdminNav } from '../AdminNav';
import { useAdminAuth } from '../useAdminAuth';

type MenuItem = {
  id: string;
  name: string;
  price: number;
  description: string | null;
  available: boolean;
  created_at: string;
  image_url: string | null;
  image_path: string | null;
  display_order: number;
  category: string | null;
};

const CATEGORY_OPTIONS = [
  'Trái cây',
  'Ăn vặt',
  'Nước uống',
  'Combo',
  'Món chay',
  'Tráng miệng',
];

export default function AdminMenuPage() {
  const authorized = useAdminAuth();
  const [loading, setLoading] = useState(true);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('Món chính');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('Món chính');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (authorized) {
      fetchMenuItems();
    }
  }, [authorized]);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        alert(`Lỗi tải menu: ${error.message}`);
      } else {
        setMenuItems(data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 0.3,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.75,
      fileType: 'image/webp',
    };

    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  };

  const uploadMenuImage = async (file: File) => {
    const compressedFile = await compressImage(file);

    const fileExt = 'webp';
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const filePath = `menu/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(filePath, compressedFile, {
        upsert: false,
        contentType: 'image/webp',
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

      const maxOrder = Math.max(
        0,
        ...menuItems.map((item) => item.display_order || 0)
      );

      const { error } = await supabase.from('menu_items').insert([
        {
          name: newName.trim(),
          price: priceNumber,
          description: newDescription.trim() || null,
          category: newCategory,
          available: true,
          image_url: imageUrl,
          image_path: imagePath,
          display_order: maxOrder + 1,
        },
      ]);

      if (error) {
        alert(`Lỗi thêm món: ${error.message}`);
        return;
      }

      setNewName('');
      setNewPrice('');
      setNewDescription('');
      setNewCategory('Món chính');
      setNewImageFile(null);
      fetchMenuItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Tải ảnh lên thất bại.';
      alert(`Lỗi tải ảnh: ${message}`);
    }
  };

  const startEditMenuItem = (item: MenuItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(String(item.price));
    setEditDescription(item.description || '');
    setEditCategory(item.category || 'Món chính');
    setEditImageFile(null);
  };

  const cancelEditMenuItem = () => {
    setEditingId(null);
    setEditName('');
    setEditPrice('');
    setEditDescription('');
    setEditCategory('Món chính');
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
          category: editCategory,
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
      fetchMenuItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Tải ảnh lên thất bại.';
      alert(`Lỗi tải ảnh: ${message}`);
    }
  };

  const moveMenuItem = async (item: MenuItem, direction: 'up' | 'down') => {
    const sorted = [...menuItems].sort(
      (a, b) => (a.display_order || 0) - (b.display_order || 0)
    );

    const currentIndex = sorted.findIndex((menu) => menu.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const currentItem = sorted[currentIndex];
    const targetItem = sorted[targetIndex];

    const { error: firstError } = await supabase
      .from('menu_items')
      .update({ display_order: targetItem.display_order })
      .eq('id', currentItem.id);

    if (firstError) {
      alert(`Lỗi đổi thứ tự món: ${firstError.message}`);
      return;
    }

    const { error: secondError } = await supabase
      .from('menu_items')
      .update({ display_order: currentItem.display_order })
      .eq('id', targetItem.id);

    if (secondError) {
      alert(`Lỗi đổi thứ tự món: ${secondError.message}`);
      return;
    }

    fetchMenuItems();
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

    fetchMenuItems();
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

    fetchMenuItems();
  };

  if (!authorized) return null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-teal-50 to-cyan-50 p-4 text-slate-700">
      <div className="mx-auto w-full max-w-md space-y-6">
        <AdminNav active="menu" />

        <div className="rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-700">Edit món</h1>
              <p className="mt-1 text-sm text-slate-500">
                Thêm, sửa và sắp xếp món ăn
              </p>
            </div>

            <button
              onClick={fetchMenuItems}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              Tải lại
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
            Đang tải menu...
          </div>
        )}

        <section className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-700">Thêm món mới</h2>

          <div className="mt-4 space-y-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tên món"
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-slate-600 outline-none"
            />

            <input
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Giá"
              inputMode="numeric"
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-slate-600 outline-none"
            />

            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-slate-600 outline-none"
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Mô tả món"
              rows={3}
              className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-slate-600 outline-none"
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                Ảnh món
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                className="w-full rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3 text-sm text-slate-600"
              />
              <p className="mt-2 text-xs text-slate-500">
                Ảnh sẽ được nén tự động trước khi tải lên.
              </p>
            </div>

            <button
              onClick={addMenuItem}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-sm"
            >
              Thêm món
            </button>
          </div>
        </section>

        <section className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-700">Quản lý menu</h2>
          <p className="mt-1 text-sm text-slate-500">
            Dùng nút ↑ ↓ để thay đổi thứ tự hiển thị món.
          </p>

          <div className="mt-4 space-y-3">
            {menuItems.length === 0 && (
              <div className="text-sm text-slate-500">Chưa có món nào.</div>
            )}

            {menuItems.map((item, index) => {
              const isEditing = editingId === item.id;
              const isFirst = index === 0;
              const isLast = index === menuItems.length - 1;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-emerald-100 bg-emerald-50/30 px-3 py-3"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Tên món"
                        className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-600 outline-none"
                      />

                      <input
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        placeholder="Giá"
                        inputMode="numeric"
                        className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-600 outline-none"
                      />

                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-600 outline-none"
                      >
                        {CATEGORY_OPTIONS.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>

                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Mô tả món"
                        rows={3}
                        className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-600 outline-none"
                      />

                      {item.image_url && (
                        <div className="relative h-28 w-28 overflow-hidden rounded-2xl">
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
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          Đổi ảnh món
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            setEditImageFile(e.target.files?.[0] || null)
                          }
                          className="w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-600"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Ảnh mới sẽ được nén tự động trước khi tải lên.
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEditMenuItem(item)}
                          className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-medium text-white"
                        >
                          Lưu
                        </button>

                        <button
                          onClick={cancelEditMenuItem}
                          className="rounded-2xl bg-slate-200 px-3 py-2 text-xs font-medium text-slate-600"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
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
                            <h3 className="line-clamp-2 text-[17px] font-semibold leading-6 text-slate-700">
                              {item.name}
                            </h3>

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
                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                  {item.category}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 text-xs text-slate-500">
                              Thứ tự: {item.display_order}{' '}
                              <span className="mx-1">•</span>
                              <span
                                className={
                                  item.available
                                    ? 'font-semibold text-emerald-600'
                                    : 'font-semibold text-red-500'
                                }
                              >
                                {item.available ? 'Đang bán' : 'Đang ẩn'}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-col gap-2">
                            <button
                              onClick={() => moveMenuItem(item, 'up')}
                              disabled={isFirst}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-semibold text-emerald-700 shadow-sm disabled:opacity-40"
                            >
                              ↑
                            </button>

                            <button
                              onClick={() => moveMenuItem(item, 'down')}
                              disabled={isLast}
                              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg font-semibold text-emerald-700 shadow-sm disabled:opacity-40"
                            >
                              ↓
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => startEditMenuItem(item)}
                            className="rounded-2xl bg-cyan-500 px-3 py-2 text-xs font-medium text-white"
                          >
                            Sửa món
                          </button>

                          <button
                            onClick={() => toggleAvailable(item)}
                            className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-medium text-white"
                          >
                            {item.available ? 'Ẩn món' : 'Hiện món'}
                          </button>

                          <button
                            onClick={() => deleteMenuItem(item)}
                            className="rounded-2xl bg-rose-500 px-3 py-2 text-xs font-medium text-white"
                          >
                            Xóa món
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
