import { motion } from 'framer-motion';
import { Package, Truck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Landing() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-linear-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="text-5xl font-bold bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                    Resilink
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md mx-auto">
                    The magic bridge between Dropshippers and Suppliers. Minimal clicks, maximal speed.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                <RoleCard
                    title="Dropshipper"
                    description="Upload resi, select products, and track orders with zero effort."
                    icon={<Truck className="w-8 h-8 text-blue-500" />}
                    to="/dropshipper"
                    delay={0.1}
                />
                <RoleCard
                    title="Supplier"
                    description="Manage products, print resi, and track your daily earnings."
                    icon={<Package className="w-8 h-8 text-indigo-500" />}
                    to="/supplier"
                    delay={0.2}
                />
            </div>
        </div>
    );
}

function RoleCard({ title, description, icon, to, delay }: { title: string, description: string, icon: React.ReactNode, to: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
        >
            <Link to={to} className="group relative block p-8 rounded-3xl glass hover:bg-white/90 dark:hover:bg-slate-900/90 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                    <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                        {icon}
                    </div>
                    <ArrowRight className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">{title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {description}
                </p>
            </Link>
        </motion.div>
    );
}
