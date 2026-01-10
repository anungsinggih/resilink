import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parseShippingLabel, type ParsedLabel } from '../lib/pdfParser';
import { supabase } from '../lib/supabase';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Dropshipper() {
    const [activeResi, setActiveResi] = useState<ParsedLabel | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Fetch products
        const { data: prodData } = await supabase.from('products').select('*');
        if (prodData) setProducts(prodData);

        // Fetch recent orders (last 3 days)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data: orderData } = await supabase
            .from('orders')
            .select('*, products(name)')
            .gte('created_at', threeDaysAgo.toISOString())
            .order('created_at', { ascending: false });
        if (orderData) setRecentOrders(orderData);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                const parsedData = await parseShippingLabel(file);
                setActiveResi(parsedData);
            } catch (error) {
                console.error('Failed to parse PDF:', error);
                alert('Gagal membaca PDF. Pastikan label Shopee/Tokopedia valid.');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleProductSelect = async (product: any) => {
        if (!activeResi) return;

        const { error } = await supabase.from('orders').insert([{
            order_id: activeResi.orderId,
            tracking_number: activeResi.trackingNumber,
            courier: activeResi.courier,
            product_id: product.id,
            status: 'pending',
            original_price: product.price
        }]);

        if (error) {
            alert('Gagal menyimpan order: ' + error.message);
        } else {
            setActiveResi(null);
            fetchData(); // Refresh list
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-24">
            <header className="flex justify-between items-center mb-8 max-w-2xl mx-auto">
                <div>
                    <button onClick={() => window.history.back()} className="text-xs text-slate-500 mb-2 flex items-center gap-1 hover:text-blue-500 transition-colors">
                        ← Back to Landing
                    </button>
                    <h1 className="text-2xl font-bold">Dropshipper Panel</h1>
                    <p className="text-slate-500 dark:text-slate-400">Order & Resi Management</p>
                </div>
            </header>

            <main className="max-w-2xl mx-auto space-y-6">
                {/* Upload Section */}
                <section
                    className={cn(
                        "relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-12 text-center",
                        activeResi ? "border-blue-500/50 bg-blue-500/5 dark:border-blue-500/30" : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600"
                    )}
                >
                    {activeResi ? (
                        <div className="flex flex-col items-center">
                            <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                                <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-medium mb-1">RESI: {activeResi.trackingNumber}</h3>
                            <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                                <p className="flex items-center justify-center gap-1"><CheckCircle2 className="w-4 h-4" /> Detected {activeResi.courier}</p>
                                <p className="text-xs opacity-70">Order ID: {activeResi.orderId}</p>
                            </div>
                            <button
                                onClick={() => setActiveResi(null)}
                                className="mt-4 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                Ganti File
                            </button>
                        </div>
                    ) : (
                        <label className="cursor-pointer">
                            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 inline-block group-hover:scale-110 transition-transform">
                                {isUploading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Upload className="w-10 h-10 text-blue-500" /></motion.div> : <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-500" />}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Share or Upload PDF</h3>
                            <p className="text-slate-500 max-w-xs mx-auto text-sm">
                                Labels from Shopee/Tokopedia are automatically parsed by Resilink.
                            </p>
                        </label>
                    )}
                </section>

                {/* Product Selection (Visible when Resi is active) */}
                <AnimatePresence>
                    {activeResi && (
                        <motion.section
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4 overflow-hidden"
                        >
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Select Product for this Resi</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {products.length > 0 ? products.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductSelect(product)}
                                        className="flex items-center gap-4 p-4 rounded-2xl glass hover:bg-white dark:hover:bg-slate-900 border-2 border-transparent hover:border-blue-500 text-left transition-all group"
                                    >
                                        <img src={product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&h=200&fit=crop'} className="w-16 h-16 rounded-xl object-cover" alt={product.name} />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100">{product.name}</h4>
                                            <p className="text-sm text-slate-500">{product.code} • Rp {Number(product.price).toLocaleString('id-ID')}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                )) : (
                                    <div className="p-8 text-center text-slate-400 text-sm">Belum ada produk dari Supplier.</div>
                                )}
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* History / Recent Orders */}
                {!activeResi && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent Resi (Last 3 Days)</h3>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">Auto-destruct enabled</span>
                        </div>
                        <div className="space-y-2">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <div className="text-sm font-medium">{order.tracking_number}</div>
                                            <div className="text-[10px] text-slate-400">
                                                {new Date(order.created_at).toLocaleTimeString()} • {order.products?.name || 'Unknown Product'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "text-[10px] font-semibold px-2 py-1 rounded-lg",
                                        order.status === 'printed' ? "bg-green-500/10 text-green-500" : "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {order.status.toUpperCase()}
                                    </div>
                                </div>
                            ))}
                            {recentOrders.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm italic">Belum ada data resi.</div>
                            )}
                        </div>
                    </section>
                )}
            </main>

            {/* Quick Action Navigation (Mobile First) */}
            <nav className="fixed bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-slate-800 glass z-50">
                <div className="max-w-md mx-auto flex justify-around">
                    <NavItem to="/dropshipper" label="Orders" active />
                    <NavItem to="/catalog" label="Catalog" />
                    <NavItem to="/wallet" label="Wallet" />
                </div>
            </nav>
        </div>
    );
}

function NavItem({ label, active = false, to = "#" }: { label: string, active?: boolean, to?: string }) {
    return (
        <Link to={to} className={cn(
            "px-6 py-2 rounded-xl text-sm font-medium transition-all",
            active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        )}>
            {label}
        </Link>
    );
}
