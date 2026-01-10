import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle2, ChevronRight, Home, Grid, Image as ImageIcon, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parseShippingLabel, type ParsedLabel } from '../lib/pdfParser';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../lib/imageUtils';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Dropshipper() {
    const [activeResi, setActiveResi] = useState<ParsedLabel | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        fetchData();

        // Cek apakah ada resi yang baru dishare dari PWA Share Target
        const pending = sessionStorage.getItem('pending_resi');
        if (pending) {
            setActiveResi(JSON.parse(pending));
            sessionStorage.removeItem('pending_resi');
        }
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        setIsUploadingImage(true);
        try {
            const imageUrl = await uploadImageToSupabase(file, supabase, 'order-images');
            setUploadedImage(imageUrl);
        } catch (error: any) {
            console.error('Image upload error:', error);
            alert('Failed to upload image: ' + error.message);
        } finally {
            setIsUploadingImage(false);
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
            original_price: product.price,
            image_url: uploadedImage
        }]);

        if (error) {
            alert('Gagal menyimpan order: ' + error.message);
        } else {
            setActiveResi(null);
            setUploadedImage(null);
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
                {/* Upload Section - PDF and Image */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PDF Upload */}
                    <section
                        className={cn(
                            "relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-8 text-center",
                            activeResi ? "border-blue-500/50 bg-blue-500/5 dark:border-blue-500/30" : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600"
                        )}
                    >
                        {activeResi ? (
                            <div className="flex flex-col items-center">
                                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-3">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-sm font-bold mb-1 truncate w-full">{activeResi.trackingNumber}</h3>
                                <div className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                                    <p className="flex items-center justify-center gap-1"><CheckCircle2 className="w-3 h-3" /> {activeResi.courier}</p>
                                </div>
                                <button
                                    onClick={() => setActiveResi(null)}
                                    className="mt-3 text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    Ganti File
                                </button>
                            </div>
                        ) : (
                            <label className="cursor-pointer">
                                <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3 inline-block group-hover:scale-110 transition-transform">
                                    {isUploading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Upload className="w-8 h-8 text-blue-500" /></motion.div> : <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />}
                                </div>
                                <h3 className="text-base font-semibold mb-1">Upload PDF</h3>
                                <p className="text-slate-500 text-xs">
                                    Shipping label
                                </p>
                            </label>
                        )}
                    </section>

                    {/* Image Upload */}
                    <section
                        className={cn(
                            "relative group rounded-3xl border-2 border-dashed transition-all duration-300 p-8 text-center",
                            uploadedImage ? "border-emerald-500/50 bg-emerald-500/5 dark:border-emerald-500/30" : "border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600"
                        )}
                    >
                        {uploadedImage ? (
                            <div className="flex flex-col items-center">
                                <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-3">
                                    <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setUploadedImage(null)}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Image uploaded (WebP)</p>
                            </div>
                        ) : (
                            <label className="cursor-pointer">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 mb-3 inline-block group-hover:scale-110 transition-transform">
                                    {isUploadingImage ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><ImageIcon className="w-8 h-8 text-emerald-500" /></motion.div> : <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-emerald-500" />}
                                </div>
                                <h3 className="text-base font-semibold mb-1">Add Image</h3>
                                <p className="text-slate-500 text-xs">
                                    Optional photo
                                </p>
                            </label>
                        )}
                    </section>
                </div>

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

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}

function BottomNav() {
    const location = useLocation();

    // For Dropshipper, Catalog and Wallet are read-only views of Supplier data
    const navItems = [
        { label: 'Upload', path: '/dropshipper', icon: <Home className="w-5 h-5" /> },
        { label: 'Catalog', path: '/supplier/catalog', icon: <Grid className="w-5 h-5" /> }, // Shared for now
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
