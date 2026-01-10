import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import Dropshipper from './pages/Dropshipper';
import Supplier from './pages/Supplier';

const UploadHandler = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Menyiapkan magic parsing...');

  useEffect(() => {
    // Logic: Share Target POST akan mengirim file ke URL ini.
    // Di PWA modern, kita bisa menangkapnya via Service Worker atau 
    // mengecek data di searchParams jika menggunakan GET (tapi untuk file wajib POST).

    // Untuk demo/testing: kita arahkan kembali ke dropshipper setelah delay
    const timer = setTimeout(() => {
      setStatus('File terdeteksi! Mengalihkan ke Dashboard...');
      setTimeout(() => navigate('/dropshipper'), 1500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950 text-slate-500">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6 mx-auto"></div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Processing Share</h1>
      <p>{status}</p>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dropshipper" element={<Dropshipper />} />
        <Route path="/supplier" element={<Supplier />} />
        <Route path="/upload" element={<UploadHandler />} />
      </Routes>
    </Router>
  );
}

export default App;
