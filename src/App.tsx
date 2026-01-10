import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Dropshipper from './pages/Dropshipper';
import Supplier from './pages/Supplier';
import Catalog from './pages/Catalog';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dropshipper" element={<Dropshipper />} />
        <Route path="/supplier" element={<Supplier />} />
        <Route path="/supplier/catalog" element={<Catalog />} />
      </Routes>
    </Router>
  );
}

export default App;
