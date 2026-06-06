import HeroSection from '../components/home/HeroSection'
import StatsBar from '../components/home/StatsBar'
import CategoriesSection from '../components/home/CategoriesSection'
import ProductsSection from '../components/home/ProductsSection'
import VendorsSection from '../components/home/VendorsSection'

function HomePage() {
  document.title = 'SouqNa — Lebanese Multi-Vendor Marketplace'
  return (
    <div style={{ backgroundColor: '#F7F2E8' }}>
      <HeroSection />
      <StatsBar />
      <CategoriesSection />
      <ProductsSection />
      <VendorsSection />
    </div>
  )
}

export default HomePage
