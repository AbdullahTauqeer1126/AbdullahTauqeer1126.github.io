'use client'
import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button, Badge } from '@/components/ui'
import { Heart, MapPin, Truck, Star } from 'lucide-react'
import Link from 'next/link'
import { formatPKR } from '@/lib/mock-data'

export default function CustomerFavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('raftaar_favorites')
    if (saved) {
      try {
        setFavorites(JSON.parse(saved))
      } catch (e) {
        setFavorites([])
      }
    }
  }, [])

  const removeFavorite = (id: string) => {
    const updated = favorites.filter(f => f.id !== id)
    setFavorites(updated)
    localStorage.setItem('raftaar_favorites', JSON.stringify(updated))
  }

  return (
    <DashboardLayout title="Saved Trucks">
      <div className="flex flex-col gap-6">
        <p className="text-sm text-[#666]">{favorites.length} saved trucks</p>

        {favorites.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
            <Heart size={48} className="text-gray-200 mx-auto mb-4" />
            <h3 className="font-black text-[#212121] mb-2">No Saved Trucks</h3>
            <p className="text-[#999] text-sm mb-6">Browse available trucks and book directly from search.</p>
            <Link href="/search"><Button>Browse Trucks</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(truck => (
              <div key={truck.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition-shadow relative">
                <button 
                  onClick={() => removeFavorite(truck.id)}
                  className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:scale-110 transition-transform shadow-sm"
                >
                  <Heart size={16} fill="currentColor" />
                </button>
                <div className="h-48 bg-gray-100 relative">
                  <img src={truck.image_url || 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80'} alt={truck.type} className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <Badge variant="primary">{truck.type || 'Flatbed'}</Badge>
                    <Badge variant="success" className="flex items-center gap-1"><Star size={10} fill="currentColor" />{truck.rating || 4.8}</Badge>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-black text-[#212121] text-lg mb-1">{truck.name || `${truck.make} ${truck.model}`}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#666] mb-4">
                    <MapPin size={12} className="text-[#1B5E20]" /> <span>Based in {truck.base_city || 'Karachi'}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-[10px] font-black text-[#999] uppercase mb-0.5">Capacity</p>
                      <p className="text-sm font-bold text-[#212121]">{truck.capacity_tons || 10} Tons</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#999] uppercase mb-0.5">Base Fare</p>
                      <p className="text-sm font-black text-[#1B5E20]">{formatPKR(truck.base_rate || 5000)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <Link href={`/trucks/${truck.id}`} className="block w-full">
                      <Button fullWidth size="lg">Book Now</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
