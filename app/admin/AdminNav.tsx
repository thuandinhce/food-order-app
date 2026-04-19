import Link from 'next/link';

type AdminNavProps = {
  active: 'orders' | 'menu';
};

export function AdminNav({ active }: AdminNavProps) {
  const linkClass = (tab: AdminNavProps['active']) =>
    [
      'flex-1 rounded-2xl px-3 py-2 text-center text-sm font-semibold transition',
      active === tab
        ? 'bg-emerald-500 text-white shadow-sm'
        : 'bg-white text-slate-600 hover:bg-emerald-50',
    ].join(' ');

  return (
    <nav className="grid grid-cols-2 gap-2 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-2">
      <Link href="/admin" className={linkClass('orders')}>
        Đơn hàng
      </Link>

      <Link href="/admin/menu" className={linkClass('menu')}>
        Quản lý món
      </Link>
    </nav>
  );
}
