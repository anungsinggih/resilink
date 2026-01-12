import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, X, FileText, Eye, Send, Trash2, History } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
    const [orders, setOrders] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    // Separate today's orders from history
    const todayOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
    });

    const historyOrders = orders.filter(order => {
        const orderDate = new Date(order.created_at);
        const today = new Date();
        return orderDate.toDateString() !== today.toDateString();
    });

    useEffect(() => {
        fetchOrders();
        handleSharedFile();
    }, []);

    const handleSharedFile = async () => {
        if (searchParams.get('shared')) {
            try {
                const cache = await caches.open('shared-files');
                const response = await cache.match('/shared-file');

                if (response) {
                    const blob = await response.blob();

                    if (blob.type === 'application/pdf') {
                        const file = new File([blob], "shared-label.pdf", { type: "application/pdf" });
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
                        }
                        setIsUploadingPdf(false);

                    } else if (blob.type.startsWith('image/')) {
                        const file = new File([blob], "shared-image.png", { type: blob.type });
                        setIsUploadingImage(true);

                        const publicUrl = await uploadImageToSupabase(file, 'order-images');

                        if (publicUrl) {
                            setUploadedImage(publicUrl);
                        }
                        setIsUploadingImage(false);
                    }

                    await cache.delete('/shared-file');
                }
            } catch (err) {
                console.error('Shared File error:', err);
            }
            setSearchParams({});
        }
    };

    const fetchOrders = async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const { data } = await supabase
            .from('orders')
            .select('*')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false });

        if (data) setOrders(data);
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

    const handleSend = async () => {
        if (!uploadedPdf) {
            alert('Please upload a PDF first');
            return;
        }

        const { error } = await supabase.from('orders').insert([{
            pdf_url: uploadedPdf,
            image_url: uploadedImage,
            status: 'pending'
        }]);

        if (error) {
            alert('Failed to send order: ' + error.message);
        } else {
            // Reset form
            setUploadedPdf(null);
            setUploadedImage(null);
            fetchOrders();
        }
    };

    const handleDeleteOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to delete this order?')) return;

        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', orderId);

        if (error) {
            alert('Failed to delete order: ' + error.message);
        } else {
            fetchOrders();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 pb-32">
            <header className="max-w-2xl mx-auto mb-6">
                <button onClick={() => window.history.back()} className="text-xs text-slate-500 mb-2 flex items-center gap-1 hover:text-blue-500 transition-colors">
                    ← Back
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Dropshipper</h1>
                        <p className="text-slate-500 text-sm">Upload orders</p>
                    </div>
                    {historyOrders.length > 0 && (
                        <button
                            onClick={() => setShowHistory(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <History className="w-4 h-4" />
                            <span className="text-sm font-bold">History</span>
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">{historyOrders.length}</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="max-w-2xl mx-auto space-y-6">
                {/* Upload Section */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-4">
                    <h3 className="font-bold text-sm">Upload New Order</h3>

                    <div className="grid grid-cols-2 gap-3">
                        {/* PDF Upload */}
                        <div className={cn(
                            "relative group rounded-2xl border-2 border-dashed transition-all p-6 text-center",
                            uploadedPdf ? "border-blue-500/50 bg-blue-500/5" : "border-slate-200 dark:border-slate-800 hover:border-blue-400"
                        )}>
                            {uploadedPdf ? (
                                <div className="flex flex-col items-center">
                                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <p className="text-xs font-bold mb-2">PDF Ready</p>
                                    <a href={uploadedPdf} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline flex items-center gap-1">
                                        <Eye className="w-3 h-3" /> Preview
                                    </a>
                                    <button onClick={() => setUploadedPdf(null)} className="mt-2 text-[10px] text-slate-400 hover:text-red-500">
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer">
                                    <input type="file" className="hidden" accept=".pdf" onChange={handlePdfUpload} />
                                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-2 inline-block group-hover:scale-110 transition-transform">
                                        {isUploadingPdf ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Upload className="w-6 h-6 text-blue-500" /></motion.div> : <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />}
                                    </div>
                                    <h3 className="text-sm font-semibold mb-1">PDF</h3>
                                    <p className="text-slate-500 text-[10px]">Required</p>
                                </label>
                            )}
                        </div>

                        {/* Image Upload */}
                        <div className={cn(
                            "relative group rounded-2xl border-2 border-dashed transition-all p-6 text-center",
                            uploadedImage ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-200 dark:border-slate-800 hover:border-emerald-400"
                        )}>
                            {uploadedImage ? (
                                <div className="flex flex-col items-center">
                                    <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2">
                                        <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                                        <button onClick={() => setUploadedImage(null)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-emerald-600 font-medium">WebP</p>
                                </div>
                            ) : (
                                <label className="cursor-pointer">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-2 inline-block group-hover:scale-110 transition-transform">
                                        {isUploadingImage ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><ImageIcon className="w-6 h-6 text-emerald-500" /></motion.div> : <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />}
                                    </div>
                                    <h3 className="text-sm font-semibold mb-1">Image</h3>
                                    <p className="text-slate-500 text-[10px]">Optional</p>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Send Button */}
                    <button
                        onClick={handleSend}
                        disabled={!uploadedPdf}
                        className={cn(
                            "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all",
                            uploadedPdf
                                ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        <Send className="w-5 h-5" />
                        <span>Send Order</span>
                    </button>
                </div>

                {/* Today's Orders Only */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Today's Orders ({todayOrders.length})</h3>
                    {todayOrders.map((order, index) => (
                        <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-black text-blue-600">#{todayOrders.length - index}</span>
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
                            <div className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-lg",
                                order.status === 'printed' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                                {order.status.toUpperCase()}
                            </div>
                            <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                                title="Delete order"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {todayOrders.length === 0 && (
                        <div className="p-12 text-center text-slate-400 text-sm italic">No orders today.</div>
                    )}
                </div>
            </main>

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

                {/* History Modal */}
                {showHistory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowHistory(false)}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-2xl w-full max-h-[80vh] bg-white dark:bg-slate-900 rounded-3xl overflow-hidden"
                        >
                            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between z-10">
                                <div>
                                    <h2 className="text-xl font-bold">Order History</h2>
                                    <p className="text-sm text-slate-500">Last 6 days</p>
                                </div>
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)] space-y-6">
                                {(() => {
                                    // Group history orders by date
                                    const groupedOrders = historyOrders.reduce((groups: any, order: any) => {
                                        const date = new Date(order.created_at).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        });
                                        if (!groups[date]) {
                                            groups[date] = [];
                                        }
                                        groups[date].push(order);
                                        return groups;
                                    }, {});

                                    return Object.entries(groupedOrders).map(([date, dateOrders]: [string, any]) => (
                                        <div key={date} className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                                                <h4 className="text-xs font-bold text-slate-500">{date}</h4>
                                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
                                            </div>
                                            {dateOrders.map((order: any, index: number) => (
                                                <div key={order.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-2 text-sm">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-xs font-black text-blue-600">#{dateOrders.length - index}</span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                                        <p className="text-[10px] text-slate-400">#{order.id.slice(0, 8)}</p>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {order.pdf_url && (
                                                            <a href={order.pdf_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                                                                <FileText className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                        {order.image_url && (
                                                            <button onClick={() => { setShowHistory(false); setPreviewImage(order.image_url); }} className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                                                                <ImageIcon className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className={cn(
                                                        "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                                        order.status === 'printed' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                                                    )}>
                                                        {order.status.toUpperCase()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
