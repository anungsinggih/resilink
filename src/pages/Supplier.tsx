import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Printer, TrendingUp, Search, Home, Grid, ArrowRight, Image as ImageIcon, FileText, Eye, X } from 'lucide-react';
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
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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
            alert('All pending orders marked as PRINTED.');
            fetchOrders();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-32">
            <header className="max-w-4xl mx-auto mb-6">
                <button onClick={() => window.history.back()} className="text-xs text-slate-500 mb-2 flex items-center gap-1 hover:text-blue-500 transition-colors">
                    ← Logout
                </button>
                <h1 className="text-2xl font-bold">Supplier Hub</h1>
                <p className="text-slate-500 text-sm">Process & fulfill orders</p>
            </header>

            <main className="max-w-4xl mx-auto space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <StatCard
                        label="Earnings"
                        value={`Rp ${stats.totalEarnings.toLocaleString('id-ID')}`}
                        icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
                    />
                    <StatCard
                        label="Pending"
                        value={stats.pendingCount.toString()}
                        icon={<Printer className="w-5 h-5 text-blue-500" />}
                    />
                    <StatCard
                        label="Rate"
                        value={`${stats.fulfillmentRate}%`}
                        icon={<Package className="w-5 h-5 text-indigo-500" />}
                    />
                </div>

                <button
                    onClick={handlePrintAll}
                    className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 group shadow-xl shadow-indigo-500/20"
                >
                    <Printer className="w-5 h-5" />
                    <span className="text-base">Print All Pending</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                </button>

                {/* Orders List - Mobile Optimized */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold text-sm flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            Today's Orders
                        </h3>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-500 font-black uppercase">LIVE</span>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Order Number */}
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-black text-blue-600">#{orders.length - index}</span>
                                    </div>

                                    {/* Order Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold truncate">{order.products?.name}</h4>
                                                <p className="text-xs text-slate-400">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black">Rp {Number(order.original_price).toLocaleString('id-ID')}</p>
                                                <span className={cn(
                                                    "text-[10px] font-black px-2 py-0.5 rounded-lg",
                                                    order.status === 'printed' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                                )}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* File Previews */}
                                        <div className="flex gap-2">
                                            {order.pdf_url && (
                                                <a
                                                    href={order.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors text-xs font-medium"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    <span>PDF</span>
                                                    <Eye className="w-3 h-3" />
                                                </a>
                                            )}
                                            {order.image_url && (
                                                <button
                                                    onClick={() => setPreviewImage(order.image_url)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors text-xs font-medium"
                                                >
                                                    <ImageIcon className="w-3 h-3" />
                                                    <span>Image</span>
                                                    <Eye className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {orders.length === 0 && (
                            <div className="p-12 text-center text-slate-400 italic text-sm">No orders today. Rest well!</div>
                        )}
                    </div>
                </section>
            </main>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Image Preview Modal */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewImage(null)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-4xl w-full"
                        >
                            <button
                                onClick={() => setPreviewImage(null)}
                                className="absolute -top-12 right-0 p-2 text-white hover:text-red-500 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <img
                                src={previewImage}
                                alt="Preview"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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

function StatCard({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
    return (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                    {icon}
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <h4 className="text-base font-black tracking-tight">{value}</h4>
        </div>
    );
}
