import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui/GlassCard';
import PublicNav from '@/components/landing/PublicNav';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Star, Shield, Filter, Radio, Map, LayoutGrid, Sparkles, X } from 'lucide-react';
import AvatarMap from '@/components/explore/AvatarMap';
import GlobeMap from '@/components/explore/GlobeMap';

const CATEGORIES = [
  'All', 'City Guide', 'Property Walkthrough', 'Shopping Help', 'Event Attendance',
  'Queue & Errands', 'Family Support', 'Business Inspection', 'Training & Coaching',
  'Campus Help', 'Travel Assistance', 'Custom Request'
];

export default function Explore() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCat = urlParams.get('category') || 'All';
  const initialCity = urlParams.get('city') || '';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCat);
  const [city, setCity] = useState(initialCity);
  const [locationSearch, setLocationSearch] = useState('');
  const [focusCity, setFocusCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

  const { data: avatars = [], isLoading } = useQuery({
    queryKey: ['explore-avatars'],
    queryFn: () => base44.entities.AvatarProfile.filter({ status: 'active' }, '-rating', 50),
  });

  const filtered = avatars.filter(a => {
    const matchSearch = !search || a.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      (a.categories || []).some(c => c.toLowerCase().includes(search.toLowerCase()));
    const matchCat = category === 'All' || (a.categories || []).includes(category);
    const matchCity = !city || a.city?.toLowerCase().includes(city.toLowerCase());
    const matchLocation = !focusCity || a.city?.toLowerCase().includes(focusCity.toLowerCase());
    return matchSearch && matchCat && matchCity && matchLocation;
  });

  const handleLocationSearch = () => {
    if (!locationSearch.trim()) return;
    setFocusCity(locationSearch.trim());
    setViewMode('map');
  };

  return (
    <div className="min-h-screen">
      <PublicNav />
      <div className="pt-20 pb-12 px-4 md:px-6 max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Avatars</h1>
          <p className="text-muted-foreground">Find the perfect avatar for your real-time needs</p>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-3 flex-wrap">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search avatars, categories, skills..."
              className="pl-10 bg-muted/50 border-white/5 h-11"
            />
          </div>
          <Button variant="outline" className="border-white/10" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" /> Filters
          </Button>
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-2 text-sm flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
            <button onClick={() => setViewMode('map')} className={`px-3 py-2 text-sm flex items-center gap-1.5 ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}>
              <Map className="w-4 h-4" /> Globe
            </button>
          </div>
        </div>

        {/* Location Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={locationSearch}
              onChange={e => setLocationSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLocationSearch()}
              placeholder="Search by city or location..."
              className="pl-10 bg-muted/50 border-white/5 h-9 text-sm"
            />
          </div>
          <Button size="sm" onClick={handleLocationSearch} className="h-9">
            <Search className="w-4 h-4 mr-1" /> Find on Globe
          </Button>
          {focusCity && (
            <Button size="sm" variant="ghost" className="h-9 text-muted-foreground" onClick={() => { setFocusCity(''); setLocationSearch(''); }}>
              Clear
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <GlassCard className="p-4 mb-4 flex flex-wrap gap-3">
            <div className="w-48">
              <label className="text-xs text-muted-foreground mb-1 block">City</label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Any city" className="bg-muted/50 border-white/5 h-9 text-sm" />
            </div>
          </GlassCard>
        )}

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                cat === category ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="mb-6">
            <GlobeMap avatars={filtered} focusCity={focusCity} mode="client" />
          </div>
        )}

        {/* Results */}
        {viewMode === 'grid' && isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="glass rounded-xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' && filtered.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(avatar => (
              <Link key={avatar.id} to={`/AvatarView?id=${avatar.id}`}>
                <GlassCard className="p-5 h-full" hover>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                      {avatar.display_name?.[0] || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{avatar.display_name}</h3>
                        {avatar.is_verified && <Shield className="w-4 h-4 text-blue-400" />}
                        {avatar.is_available && <span className="w-2 h-2 rounded-full bg-green-400" />}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" /> {avatar.city || 'Remote'}
                        {avatar.rating > 0 && <>
                          <Star className="w-3 h-3 text-yellow-400 ml-1" />
                          <span>{avatar.rating.toFixed(1)} ({avatar.review_count})</span>
                        </>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{avatar.bio || 'Available for bookings'}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(avatar.categories || []).slice(0, 3).map(c => (
                          <span key={c} className="text-xs bg-muted/50 rounded px-2 py-0.5">{c}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm font-semibold text-primary">${avatar.hourly_rate || 30}/hr</p>
                        {avatar.has_360_camera && <span className="text-xs text-muted-foreground flex items-center gap-1"><Radio className="w-3 h-3" /> 360°</span>}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <GlassCard className="p-12 text-center">
            <Search className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No avatars found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button variant="outline" onClick={() => { setSearch(''); setCategory('All'); setCity(''); }}>
              Clear filters
            </Button>
          </GlassCard>
        ) : null}

        <div className="text-center mt-8 text-sm text-muted-foreground">
          {filtered.length} avatar{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>
    </div>
  );
}