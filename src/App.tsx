import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import Dropshipper from './pages/Dropshipper';
import Supplier from './pages/Supplier';
import { parseShippingLabel } from './lib/pdfParser';

const UploadHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Menunggu file share...');

  useEffect(() => {
    const handleSharedFile = async () => {
      if (searchParams.get('shared')) {
        setStatus('File terdeteksi! Mengekstrak data...');
        try {
          const cache = await caches.open('shared-files');
          const response = await cache.match('/shared-pdf');

          if (response) {
            const blob = await response.blob();
            const file = new File([blob], "shared-label.pdf", { type: "application/pdf" });

            // Parse PDF
            const parsedData = await parseShippingLabel(file);

            // Simpan hasil parsing ke sessionStorage agar Dropshipper bisa mengambilnya
            sessionStorage.setItem('pending_resi', JSON.stringify(parsedData));

            setStatus('Parsing sukses! Membuka Dashboard...');
            setTimeout(() => navigate('/dropshipper'), 1000);

            // Bersihkan cache
            await cache.delete('/shared-pdf');
          } else {
            setStatus('Gagal mengambil file dari cache.');
            setTimeout(() => navigate('/dropshipper'), 2000);
          }
        } catch (err) {
          console.error(err);
          setStatus('Error saat memproses file share.');
          setTimeout(() => navigate('/dropshipper'), 2000);
        }
      }
    };

    handleSharedFile();
  }, [searchParams, navigate]);

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
