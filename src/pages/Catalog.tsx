import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Trash2, Home, Grid } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link, useLocation } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Catalog() {
    const [products, setProducts] = useState<any[]>([]);
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', price: '', code: '', image_url: '' });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
        if (data) setProducts(data);
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
            fetchProducts();
        }
    };

    const deleteProduct = async (id: string) => {
        if (confirm('Hapus produk ini?')) {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (!error) fetchProducts();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 pb-32">
            <header className="max-w-4xl mx-auto mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold">Catalog</h1>
                    <p className="text-slate-500">Manage your collections</p>
                </div>
                <button
                    onClick={() => setIsAddingProduct(true)}
                    className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-5 h-5" />
                    <span>Add Item</span>
                </button>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {products.map((product) => (
                        <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex gap-4 items-center"
                        >
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Package className="w-6 h-6 text-slate-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-900 dark:text-white truncate">{product.name}</h3>
                                <p className="text-xs text-slate-400 font-mono uppercase tracking-tighter">{product.code}</p>
                                <p className="text-sm font-semibold mt-1">Rp {product.price.toLocaleString('id-ID')}</p>
                            </div>
                            <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </motion.div>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-full py-20 text-center text-slate-400 italic">No products found.</div>
                    )}
                </div>
            </main>

            {/* Add Product Modal */}
            <AnimatePresence>
                {isAddingProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/20 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800"
                        >
                            <h2 className="text-2xl font-bold mb-6">New Catalog Item</h2>
                            <form onSubmit={handleAddProduct} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Name</label>
                                    <input
                                        required
                                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Product Name"
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Price</label>
                                        <input
                                            required
                                            type="number"
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newProduct.price}
                                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">Code</label>
                                        <input
                                            required
                                            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-blue-500"
                                            value={newProduct.code}
                                            onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setIsAddingProduct(false)} className="flex-1 p-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">Cancel</button>
                                    <button type="submit" className="flex-1 p-4 rounded-xl font-bold bg-blue-600 text-white">Save</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                    <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">{item.label}</span>
                </Link>
            ))}
        </div>
    );
}
