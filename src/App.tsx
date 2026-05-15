import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Home, PortfolioPage } from '@/pages'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/portfolio/:id" element={<PortfolioPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
