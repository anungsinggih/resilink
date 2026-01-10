import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Printer, TrendingUp, Search, Home, Grid, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Supplier() {
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalEarnings: 0, pendingCount: 0, fulfillmentRate: 0 });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: orderData } = await supabase
            .from('orders')
            .select('*, products(name)')
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });

        if (orderData) {
            setOrders(orderData);

            // Calculate stats
            const total = orderData.reduce((acc: number, curr: any) => acc + (Number(curr.original_price) || 0), 0);
            const pending = orderData.filter((o: any) => o.status === 'pending').length;
            setStats({
                totalEarnings: total,
                pendingCount: pending,
                fulfillmentRate: orderData.length > 0 ? Math.round(((orderData.length - pending) / orderData.length) * 100) : 0
            });
        }
    };

    const handlePrintAll = async () => {
        const pendingOrders = orders.filter(o => o.status === 'pending');
        if (pendingOrders.length === 0) return;

        const { error } = await supabase
            .from('orders')
            .update({ status: 'printed' })
            .in('id', pendingOrders.map(o => o.id));

        if (!error) {
            alert('Semua resi baru telah ditandai sebagai DICETAK.');
            fetchOrders();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-32">
            <header className="max-w-4xl mx-auto mb-8">
                <button onClick={() => window.history.back()} className="text-xs text-slate-500 mb-2 flex items-center gap-1 hover:text-blue-500 transition-colors">
                    ← Logout
                </button>
                <h1 className="text-3xl font-bold">Supplier Hub</h1>
                <p className="text-slate-500">Live order processing</p>
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        label="Today's Earnings"
                        value={`Rp ${stats.totalEarnings.toLocaleString('id-ID')}`}
                        icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
                    />
                    <StatCard
                        label="Pending Resi"
                        value={stats.pendingCount.toString()}
                        icon={<Printer className="w-6 h-6 text-blue-500" />}
                    />
                    <StatCard
                        label="Fulfillment Rate"
                        value={`${stats.fulfillmentRate}%`}
                        icon={<Package className="w-6 h-6 text-indigo-500" />}
                    />
                </div>

                <div className="flex gap-4 items-center">
                    <button
                        onClick={handlePrintAll}
                        className="flex-1 py-5 rounded-[2rem] bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group shadow-xl shadow-indigo-500/20"
                    >
                        <Printer className="w-6 h-6" />
                        <span className="text-lg tracking-tight">Cetak Semua Resi Baru</span>
                        <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                </div>

                {/* Orders List */}
                <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            Incoming Orders
                        </h3>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 font-black uppercase tracking-widest">LIVE VIEW</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                                <tr>
                                    <th className="px-8 py-5">Status</th>
                                    <th className="px-8 py-5">Info</th>
                                    <th className="px-8 py-5">Product</th>
                                    <th className="px-8 py-5">Image</th>
                                    <th className="px-8 py-5 text-right">Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {orders.map((order) => (
                                    <motion.tr
                                        key={order.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <td className="px-8 py-5">
                                            <span className={cn(
                                                "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest",
                                                order.status === 'printed' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                            )}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-bold">{order.tracking_number}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{order.courier}</p>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium">{order.products?.name}</td>
                                        <td className="px-8 py-5">
                                            {order.image_url ? (
                                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group cursor-pointer relative">
                                                    <img src={order.image_url} alt="Order" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <ImageIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                    <ImageIcon className="w-4 h-4 text-slate-300" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-sm font-black text-right">Rp {Number(order.original_price).toLocaleString('id-ID')}</td>
                                    </motion.tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">No incoming orders. Rest well!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}

function BottomNav() {
    const location = useLocation();

    const navItems = [
        { label: 'Hub', path: '/supplier', icon: <Home className="w-5 h-5" /> },
        { label: 'Catalog', path: '/supplier/catalog', icon: <Grid className="w-5 h-5" /> },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-3xl p-2 flex justify-between items-center shadow-2xl z-40">
            {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                        "flex-1 flex flex-col items-center py-2 transition-all rounded-2xl",
                        location.pathname === item.path ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    )}
                >
                    {item.icon}
                    <span className="text-[10px] font-black mt-1 uppercase tracking-widest">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}

function StatCard({ label, value, icon, interactive }: { label: string, value: string, icon: React.ReactNode, interactive?: boolean }) {
    return (
        <div className={cn(
            "p-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition-all",
            interactive && "hover:border-blue-500 active:scale-95 cursor-pointer shadow-lg shadow-blue-500/5"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                    {icon}
                </div>
                {interactive && <ArrowRight className="w-4 h-4 text-slate-300" />}
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-xl font-black tracking-tight">{value}</h4>
        </div>
    );
}
