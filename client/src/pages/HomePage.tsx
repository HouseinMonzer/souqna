import HeroSection from '../components/home/HeroSection'
import StatsBar from '../components/home/StatsBar'
import CategoriesSection from '../components/home/CategoriesSection'
import ProductsSection from '../components/home/ProductsSection'
import VendorsSection from '../components/home/VendorsSection'
import Footer from '../components/home/Footer'

function HomePage() {
  return (
    <div style={{ backgroundColor: '#F7F2E8', minHeight: '100vh' }}>
      <HeroSection />
      <StatsBar />
      <CategoriesSection />
      <ProductsSection />
      <VendorsSection />
      <Footer />
    </div>
  )
}

export default HomePage