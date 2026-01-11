import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Printer, Home, Grid, Image as ImageIcon, FileText, Eye, X, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Supplier() {
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [printedOrders, setPrintedOrders] = useState<any[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'printed' | 'catalog'>('pending');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch pending orders
        const { data: pending } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'pending')
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });

        // Fetch printed orders
        const { data: printed } = await supabase
            .from('orders')
            .select('*')
            .eq('status', 'printed')
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });

        if (pending) setPendingOrders(pending);
        if (printed) setPrintedOrders(printed);
    };

    const handlePrint = async (orderId: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: 'printed' })
            .eq('id', orderId);

        if (!error) {
            fetchOrders();
        }
    };

    const handlePrintAll = async () => {
        if (pendingOrders.length === 0) return;

        const { error } = await supabase
            .from('orders')
            .update({ status: 'printed' })
            .in('id', pendingOrders.map(o => o.id));

        if (!error) {
            fetchOrders();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-32">
            <header className="max-w-4xl mx-auto mb-6">
                <button onClick={() => window.history.back()} className="text-xs text-slate-500 mb-2 flex items-center gap-1 hover:text-blue-500 transition-colors">
                    ← Back
                </button>
                <h1 className="text-2xl font-bold">Supplier</h1>
                <p className="text-slate-500 text-sm">Process orders</p>
            </header>

            {/* Tabs */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all relative",
                            activeTab === 'pending' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Pending
                        {pendingOrders.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                {pendingOrders.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('printed')}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all",
                            activeTab === 'printed' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Printed
                    </button>
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-xl text-sm font-bold transition-all",
                            activeTab === 'catalog' ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-600"
                        )}
                    >
                        Catalog
                    </button>
                </div>
            </div>

            <main className="max-w-4xl mx-auto space-y-6">
                {/* Pending Tab */}
                {activeTab === 'pending' && (
                    <>
                        {pendingOrders.length > 0 && (
                            <button
                                onClick={handlePrintAll}
                                className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
                            >
                                <Printer className="w-5 h-5" />
                                <span>Print All ({pendingOrders.length})</span>
                            </button>
                        )}

                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Pending Orders ({pendingOrders.length})</h3>
                            {pendingOrders.map((order, index) => (
                                <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-black text-blue-600">#{pendingOrders.length - index}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                            <p className="text-xs text-slate-400">Order #{order.id.slice(0, 8)}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mb-3">
                                        {order.pdf_url && (
                                            <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors text-xs font-medium">
                                                <FileText className="w-4 h-4" />
                                                <span>PDF</span>
                                                <Eye className="w-3 h-3" />
                                            </a>
                                        )}
                                        {order.image_url && (
                                            <button onClick={() => setPreviewImage(order.image_url)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors text-xs font-medium">
                                                <ImageIcon className="w-4 h-4" />
                                                <span>Image</span>
                                                <Eye className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handlePrint(order.id)}
                                        className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>Print</span>
                                    </button>
                                </div>
                            ))}
                            {pendingOrders.length === 0 && (
                                <div className="p-12 text-center text-slate-400 text-sm italic">No pending orders.</div>
                            )}
                        </div>
                    </>
                )}

                {/* Printed Tab */}
                {activeTab === 'printed' && (
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Printed Orders ({printedOrders.length})</h3>
                        {printedOrders.map((order, index) => (
                            <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                        <p className="text-xs text-slate-400">Order #{order.id.slice(0, 8)}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        {order.pdf_url && (
                                            <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                                                <FileText className="w-4 h-4" />
                                            </a>
                                        )}
                                        {order.image_url && (
                                            <button onClick={() => setPreviewImage(order.image_url)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                                                <ImageIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {printedOrders.length === 0 && (
                            <div className="p-12 text-center text-slate-400 text-sm italic">No printed orders yet.</div>
                        )}
                    </div>
                )}

                {/* Catalog Tab */}
                {activeTab === 'catalog' && (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-400">Catalog view coming soon...</p>
                    </div>
                )}
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
        { label: 'Orders', path: '/supplier', icon: <Home className="w-5 h-5" /> },
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
