import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, FileText, Eye, X, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PDFDocument } from 'pdf-lib';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Supplier() {
    const [pendingOrders, setPendingOrders] = useState<any[]>([]);
    const [printedOrders, setPrintedOrders] = useState<any[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'printed'>('pending');

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


    const handlePrint = async (order: any) => {
        // Open PDF in new window for printing
        if (order.pdf_url) {
            const printWindow = window.open(order.pdf_url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                };
            }
        }

        // Mark as printed
        const { error } = await supabase
            .from('orders')
            .update({ status: 'printed' })
            .eq('id', order.id);

        if (!error) {
            fetchOrders();
        }
    };


    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrintAll = async () => {
        if (pendingOrders.length === 0 || isPrinting) return;
        setIsPrinting(true);

        try {
            // Create a new PDF document to hold merged pages
            const mergedPdf = await PDFDocument.create();

            // Fetch and merge all PDFs
            for (const order of pendingOrders) {
                if (order.pdf_url) {
                    try {
                        const response = await fetch(order.pdf_url);
                        const arrayBuffer = await response.arrayBuffer();
                        const pdf = await PDFDocument.load(arrayBuffer);
                        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                        copiedPages.forEach((page) => mergedPdf.addPage(page));
                    } catch (err) {
                        console.error('Error merging PDF for order:', order.id, err);
                    }
                }
            }

            // Save the merged PDF and open it
            const pdfBytes = await mergedPdf.save();
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const printWindow = window.open(url, '_blank');
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print();
                    // Optional: revoke URL after print might break functionality in some browsers if done too quickly
                };
            }

            // Mark all as printed
            const { error } = await supabase
                .from('orders')
                .update({ status: 'printed' })
                .in('id', pendingOrders.map(o => o.id));

            if (!error) {
                fetchOrders();
            }

        } catch (error) {
            console.error('Failed to merge PDFs:', error);
            alert('Failed to process print all. Please try again.');
        } finally {
            setIsPrinting(false);
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

            {/* Summary Cards */}
            <div className="max-w-4xl mx-auto mb-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Printer className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black">{pendingOrders.length}</h3>
                        <p className="text-xs text-slate-400 mt-1">Orders to print</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Printed</p>
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-black">{printedOrders.length}</h3>
                        <p className="text-xs text-slate-400 mt-1">Completed today</p>
                    </div>
                </div>
            </div>

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
                </div>
            </div>

            <main className="max-w-4xl mx-auto space-y-6">
                {/* Pending Tab */}
                {activeTab === 'pending' && (
                    <>
                        {pendingOrders.length > 0 && (
                            <button
                                onClick={handlePrintAll}
                                disabled={isPrinting}
                                className={cn(
                                    "w-full py-4 rounded-2xl text-white font-bold transition-all flex items-center justify-center gap-3 shadow-xl",
                                    isPrinting
                                        ? "bg-indigo-400 cursor-not-allowed shadow-none"
                                        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
                                )}
                            >
                                <Printer className={cn("w-5 h-5", isPrinting && "animate-pulse")} />
                                <span>{isPrinting ? "Merging PDFs..." : `Print All (${pendingOrders.length})`}</span>
                            </button>
                        )}

                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Pending Orders ({pendingOrders.length})</h3>
                            {pendingOrders.map((order, index) => (
                                <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-4">
                                    {/* Header */}
                                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <span className="text-sm font-black text-blue-600">#{pendingOrders.length - index}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                                <p className="text-[10px] text-slate-400">#{order.id.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Split View Content */}
                                    <div className="flex bg-slate-100 dark:bg-slate-800 min-h-[300px]">
                                        {/* Left Side: PDF (50%) */}
                                        <div className="w-1/2 border-r border-slate-200 dark:border-slate-700 relative group">
                                            {order.pdf_url ? (
                                                <>
                                                    <iframe
                                                        src={`${order.pdf_url}#toolbar=0&navpanes=0&scrollbar=0`}
                                                        className="w-full h-full bg-white"
                                                        title="PDF Preview"
                                                    />
                                                    {/* Print Button Overlay */}
                                                    <div className="absolute top-2 right-2">
                                                        <button
                                                            onClick={() => handlePrint(order)}
                                                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 transition-all"
                                                            title="Print this order"
                                                        >
                                                            <Printer className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    {/* View Full PDF Overlay */}
                                                    <a
                                                        href={order.pdf_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="absolute bottom-2 left-2 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium hover:bg-black/70 transition-colors flex items-center gap-1"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        Fullscreen
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                                                    <span className="text-xs">No PDF</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Image (50%) */}
                                        <div className="w-1/2 relative bg-slate-200 dark:bg-slate-900/50">
                                            {order.image_url ? (
                                                <button
                                                    onClick={() => setPreviewImage(order.image_url)}
                                                    className="w-full h-full relative group"
                                                >
                                                    <img
                                                        src={order.image_url}
                                                        alt="Order"
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                        <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                    <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-800 flex items-center justify-center mb-2">
                                                        <X className="w-6 h-6 opacity-50" />
                                                    </div>
                                                    <span className="text-xs">No Image</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
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
                        {printedOrders.map((order) => (
                            <div key={order.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 opacity-75 hover:opacity-100 transition-opacity">
                                <div className="flex gap-3">
                                    {/* Image Thumbnail or Icon */}
                                    <div className="flex-shrink-0">
                                        {order.image_url ? (
                                            <button
                                                onClick={() => setPreviewImage(order.image_url)}
                                                className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 relative group bg-slate-100 dark:bg-slate-800"
                                            >
                                                <img
                                                    src={order.image_url}
                                                    alt="Order"
                                                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all"
                                                />
                                            </button>
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-emerald-500/5 flex items-center justify-center border border-emerald-500/10">
                                                <CheckCircle className="w-6 h-6 text-emerald-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div>
                                            <p className="text-sm font-bold flex items-center gap-2 text-slate-500">
                                                {new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600">PRINTED</span>
                                            </p>
                                            <p className="text-xs text-slate-400">Order #{order.id.slice(0, 8)}</p>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            {/* PDF Link */}
                                            {order.pdf_url && (
                                                <a
                                                    href={order.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    View PDF
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {printedOrders.length === 0 && (
                            <div className="p-12 text-center text-slate-400 text-sm italic">No printed orders yet.</div>
                        )}
                    </div>
                )}
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
            </AnimatePresence>
        </div>
    );
}
