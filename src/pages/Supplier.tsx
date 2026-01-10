import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Printer, Plus, TrendingUp, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Supplier() {
    const [orders, setOrders] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalEarnings: 0, pendingCount: 0, fulfillmentRate: 0 });
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', code: '', image_url: '' });

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

        // In a real app, this would trigger a PDF generation
        // Here we just mark them as printed
        const { error } = await supabase
            .from('orders')
            .update({ status: 'printed' })
            .in('id', pendingOrders.map(o => o.id));

        if (!error) {
            alert('Semua resi baru telah ditandai sebagai DICETAK.');
            fetchOrders();
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        const { error } = await supabase.from('products').insert([{
            name: newProduct.name,
            price: parseInt(newProduct.price),
            code: newProduct.code,
            image_url: newProduct.image_url
        }]);

        if (!error) {
            setIsAddingProduct(false);
            setNewProduct({ name: '', price: '', code: '', image_url: '' });
            alert('Produk berhasil ditambahkan!');
        } else {
            alert('Gagal menambah produk: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-24">
            <header className="max-w-4xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <button onClick={() => window.history.back()} className="text-xs text-slate-500 mb-2 flex items-center gap-1 hover:text-blue-500 transition-colors">
                        ← Back to Landing
                    </button>
                    <h1 className="text-3xl font-bold">Supplier Hub</h1>
                    <p className="text-slate-500">Earnings & Fulfillment Center</p>
                </div>
                <button
                    onClick={() => setIsAddingProduct(true)}
                    className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Product</span>
                </button>
            </header>

            <main className="max-w-4xl mx-auto space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        label="Total Earnings Today"
                        value={`Rp ${stats.totalEarnings.toLocaleString('id-ID')}`}
                        icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
                        trend="+12% from yesterday"
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
                        className="flex-1 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-bold hover:border-blue-500 transition-all flex items-center justify-center gap-2 group shadow-sm"
                    >
                        <Printer className="w-5 h-5 group-hover:text-blue-500" />
                        <span>Cetak Semua Resi Baru</span>
                    </button>
                </div>

                {/* Orders List */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                        <h3 className="font-bold flex items-center gap-2">
                            <Search className="w-4 h-4 text-slate-400" />
                            Incoming Orders
                        </h3>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 font-medium">Daily View</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/50 text-[10px] uppercase text-slate-400 font-bold overflow-hidden">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Order ID</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Courier</th>
                                    <th className="px-6 py-4 text-right">Price</th>
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
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-1 rounded-lg",
                                                order.status === 'printed' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                                            )}>
                                                {order.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium">{order.tracking_number}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{order.order_id}</p>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{order.products?.name}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{order.courier}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-right">Rp {Number(order.original_price).toLocaleString('id-ID')}</td>
                                    </motion.tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No orders yet. Start your engine!</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>

            {/* Add Product Modal */}
            <AnimatePresence>
                {isAddingProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 glass backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800"
                        >
                            <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
                            <form onSubmit={handleAddProduct} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Product Name</label>
                                    <input
                                        required
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-hidden focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. Kaos Polos Cotton Combed"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Price (Rp)</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-hidden focus:ring-2 focus:ring-blue-500"
                                            placeholder="45000"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">SKU Code</label>
                                        <input
                                            required
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-hidden focus:ring-2 focus:ring-blue-500"
                                            placeholder="KP-001"
                                            value={newProduct.code}
                                            onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Image URL (Optional)</label>
                                    <input
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-hidden focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://..."
                                        value={newProduct.image_url}
                                        onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingProduct(false)}
                                        className="flex-1 p-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 p-4 rounded-xl font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                    >
                                        Save Product
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: React.ReactNode, trend?: string }) {
    return (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800">
                    {icon}
                </div>
                {trend && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">{trend}</span>}
            </div>
            <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
            <h4 className="text-2xl font-bold">{value}</h4>
        </div>
    );
}
