import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, Home, Grid, Image as ImageIcon, X, FileText, Eye } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '../lib/supabase';
import { uploadImageToSupabase } from '../lib/imageUtils';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Dropshipper() {
    const [uploadedPdf, setUploadedPdf] = useState<string | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isUploadingPdf, setIsUploadingPdf] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [showProductSelection, setShowProductSelection] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        fetchData();
        handleSharedPdf();
    }, []);

    const handleSharedPdf = async () => {
        if (searchParams.get('shared')) {
            try {
                const cache = await caches.open('shared-files');
                const response = await cache.match('/shared-pdf');

                if (response) {
                    const blob = await response.blob();
                    const file = new File([blob], "shared-label.pdf", { type: "application/pdf" });

                    // Upload to Supabase Storage
                    setIsUploadingPdf(true);
                    const timestamp = Date.now();
                    const randomStr = Math.random().toString(36).substring(7);
                    const fileName = `${timestamp}-${randomStr}.pdf`;

                    const { error } = await supabase.storage
                        .from('order-pdfs')
                        .upload(fileName, file, {
                            contentType: 'application/pdf',
                            upsert: false
                        });

                    if (!error) {
                        const { data: { publicUrl } } = supabase.storage
                            .from('order-pdfs')
                            .getPublicUrl(fileName);

                        setUploadedPdf(publicUrl);
                        setShowProductSelection(true);
                    }

                    setIsUploadingPdf(false);
                    await cache.delete('/shared-pdf');
                }
            } catch (err) {
                console.error('Shared PDF error:', err);
            }
            // Remove query param
            setSearchParams({});
        }
    };

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

    const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        setIsUploadingPdf(true);
        try {
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(7);
            const fileName = `${timestamp}-${randomStr}.pdf`;

            const { error } = await supabase.storage
                .from('order-pdfs')
                .upload(fileName, file, {
                    contentType: 'application/pdf',
                    upsert: false
                });

            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage
                .from('order-pdfs')
                .getPublicUrl(fileName);

            setUploadedPdf(publicUrl);
            setShowProductSelection(true);
        } catch (error: any) {
            console.error('PDF upload error:', error);
            alert('Failed to upload PDF: ' + error.message);
        } finally {
            setIsUploadingPdf(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
        const { error } = await supabase.from('orders').insert([{
            product_id: product.id,
            status: 'pending',
            original_price: product.price,
            pdf_url: uploadedPdf,
            image_url: uploadedImage
        }]);

        if (error) {
            alert('Gagal menyimpan order: ' + error.message);
        } else {
            setUploadedPdf(null);
            setUploadedImage(null);
            setShowProductSelection(false);
            fetchData();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-32">
            <header className="max-w-2xl mx-auto mb-6">
                <button onClick={() => window.history.back()} className="text-xs text-slate-500 mb-2 flex items-center gap-1 hover:text-blue-500 transition-colors">
                    ← Logout
                </button>
                <h1 className="text-2xl font-bold">Dropshipper</h1>
                <p className="text-slate-500 text-sm">Upload & manage orders</p>
            </header>

            <main className="max-w-2xl mx-auto space-y-6">
                {/* Upload Section - PDF and Image */}
                <div className="grid grid-cols-2 gap-3">
                    {/* PDF Upload */}
                    <section
                        className={cn(
                            "relative group rounded-2xl border-2 border-dashed transition-all duration-300 p-6 text-center",
                            uploadedPdf ? "border-blue-500/50 bg-blue-500/5 dark:border-blue-500/30" : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600"
                        )}
                    >
                        {uploadedPdf ? (
                            <div className="flex flex-col items-center">
                                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <p className="text-xs font-bold mb-2">PDF Ready</p>
                                <a href={uploadedPdf} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> Preview
                                </a>
                                <button
                                    onClick={() => setUploadedPdf(null)}
                                    className="mt-2 text-[10px] text-slate-400 hover:text-red-500"
                                >
                                    Remove
                                </button>
                            </div>
                        ) : (
                            <label className="cursor-pointer">
                                <input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-2 inline-block group-hover:scale-110 transition-transform">
                                    {isUploadingPdf ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Upload className="w-6 h-6 text-blue-500" /></motion.div> : <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />}
                                </div>
                                <h3 className="text-sm font-semibold mb-1">PDF Label</h3>
                                <p className="text-slate-500 text-[10px]">
                                    Upload resi
                                </p>
                            </label>
                        )}
                    </section>

                    {/* Image Upload */}
                    <section
                        className={cn(
                            "relative group rounded-2xl border-2 border-dashed transition-all duration-300 p-6 text-center",
                            uploadedImage ? "border-emerald-500/50 bg-emerald-500/5 dark:border-emerald-500/30" : "border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600"
                        )}
                    >
                        {uploadedImage ? (
                            <div className="flex flex-col items-center">
                                <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2">
                                    <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setUploadedImage(null)}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">WebP</p>
                            </div>
                        ) : (
                            <label className="cursor-pointer">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-2 inline-block group-hover:scale-110 transition-transform">
                                    {isUploadingImage ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><ImageIcon className="w-6 h-6 text-emerald-500" /></motion.div> : <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />}
                                </div>
                                <h3 className="text-sm font-semibold mb-1">Photo</h3>
                                <p className="text-slate-500 text-[10px]">
                                    Optional
                                </p>
                            </label>
                        )}
                    </section>
                </div>

                {/* Product Selection */}
                <AnimatePresence>
                    {showProductSelection && uploadedPdf && (
                        <motion.section
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 overflow-hidden"
                        >
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Product</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {products.length > 0 ? products.map((product) => (
                                    <button
                                        key={product.id}
                                        onClick={() => handleProductSelect(product)}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-blue-500 text-left transition-all active:scale-95"
                                    >
                                        <img src={product.image_url || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=200&h=200&fit=crop'} className="w-12 h-12 rounded-xl object-cover" alt={product.name} />
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm truncate">{product.name}</h4>
                                            <p className="text-xs text-slate-500">{product.code} • Rp {Number(product.price).toLocaleString('id-ID')}</p>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-slate-300" />
                                    </button>
                                )) : (
                                    <div className="p-6 text-center text-slate-400 text-xs">No products available.</div>
                                )}
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* Recent Orders */}
                {!showProductSelection && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Orders</h3>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500">Last 3 Days</span>
                        </div>
                        <div className="space-y-2">
                            {recentOrders.map((order, index) => (
                                <div key={order.id} className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                        <span className="text-xs font-black text-blue-600">#{recentOrders.length - index}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold truncate">{order.products?.name || 'Unknown'}</div>
                                        <div className="text-[10px] text-slate-400">
                                            {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {order.pdf_url && (
                                            <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                                                <FileText className="w-3 h-3" />
                                            </a>
                                        )}
                                        {order.image_url && (
                                            <a href={order.image_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                                                <ImageIcon className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                    <div className={cn(
                                        "text-[10px] font-bold px-2 py-1 rounded-lg",
                                        order.status === 'printed' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {order.status.toUpperCase()}
                                    </div>
                                </div>
                            ))}
                            {recentOrders.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm italic">No orders yet.</div>
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

    const navItems = [
        { label: 'Upload', path: '/dropshipper', icon: <Home className="w-5 h-5" /> },
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
