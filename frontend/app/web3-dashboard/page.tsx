import React from 'react';
import { 
  Search, 
  Home, 
  Compass, 
  Calendar, 
  List, 
  Anchor, 
  BarChart2, 
  User, 
  Layers, 
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  LayoutGrid,
  List as ListIcon,
  CircleDot,
  Moon,
  Twitter,
  MessageCircle,
  Hash
} from 'lucide-react';

export default function Web3Dashboard() {
  return (
    <div className="h-screen w-full bg-[#0d0d0d] text-white font-sans flex flex-col overflow-hidden selection:bg-blue-500/30">
      {/* 1. Top Navigation Bar */}
      <nav className="h-16 border-b border-white/5 flex items-center justify-between px-4 shrink-0 bg-[#0d0d0d] z-10 relative">
        <div className="flex items-center gap-6 flex-1">
          {/* Search */}
          <div className="relative group max-w-[480px] w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-white transition-colors" />
            <input 
              type="text" 
              placeholder="Search OpenSea..." 
              className="w-full bg-[#1a1a1a] border border-white/5 hover:border-white/10 rounded-xl pl-10 pr-12 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 transition-all placeholder:text-gray-500 text-gray-200"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/5 rounded px-2 py-0.5 text-[10px] text-gray-400 font-mono border border-white/5">
              /
            </div>
          </div>

          {/* Filters */}
          <div className="hidden lg:flex items-center gap-1">
            {['All', 'Gaming', 'Art', 'PFPs', 'More'].map((filter, i) => (
              <button 
                key={filter}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  i === 0 
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Chain Toggles */}
          <div className="hidden xl:flex items-center gap-2.5 pl-6 border-l border-white/10">
            {[
              { color: 'bg-blue-500' }, 
              { color: 'bg-purple-500' }, 
              { color: 'bg-gray-400' }
            ].map((chain, idx) => (
              <button key={idx} className="w-7 h-7 rounded-full bg-[#1a1a1a] hover:bg-[#252525] border border-white/5 transition-all flex items-center justify-center group">
                <div className={`w-3.5 h-3.5 rounded-full ${chain.color} group-hover:scale-110 transition-transform`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side Nav */}
        <div className="flex items-center gap-4 pl-4">
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            Connect Wallet
          </button>
          <button className="w-10 h-10 rounded-full bg-[#1a1a1a] hover:bg-[#252525] transition-colors flex items-center justify-center border border-white/5 group">
            <User className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>
      </nav>

      {/* Main Layout Wrapper */}
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-6rem)]">
        
        {/* 2. Left Vertical Sidebar */}
        <aside className="w-[72px] border-r border-white/5 bg-[#090909] flex flex-col items-center py-6 gap-6 shrink-0 z-10 overflow-y-auto custom-scrollbar hidden sm:flex">
          <button className="p-2.5 text-white bg-white/10 rounded-xl shadow-sm"><Home className="w-[22px] h-[22px]" /></button>
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Compass className="w-[22px] h-[22px]" /></button>
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Calendar className="w-[22px] h-[22px]" /></button>
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><List className="w-[22px] h-[22px]" /></button>
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Anchor className="w-[22px] h-[22px]" /></button>
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><BarChart2 className="w-[22px] h-[22px]" /></button>
          <div className="flex-1" />
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Layers className="w-[22px] h-[22px]" /></button>
          <button className="p-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"><Settings className="w-[22px] h-[22px]" /></button>
        </aside>

        {/* 3. Center Main Content Area */}
        <main className="flex-1 overflow-y-auto relative p-6 lg:p-10 custom-scrollbar scroll-smooth">
          <div className="max-w-[1400px] mx-auto space-y-12 pb-16">
            
            {/* Hero Carousel */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-950/80 via-purple-900/30 to-black border border-white/10 aspect-[3/1] min-h-[340px] flex flex-col justify-end p-8 lg:p-12 group shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-color-dodge transition-transform duration-700 group-hover:scale-105"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
              
              <div className="relative z-10 max-w-2xl transform transition-transform duration-500 translate-y-4 group-hover:translate-y-0">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-2xl">dTelecom Origin IDs</h1>
                  <CheckCircle className="w-8 h-8 text-blue-500 fill-white drop-shadow-md" />
                </div>
                <p className="text-xl text-gray-300 font-medium mb-8">By dTelecom</p>
                
                {/* Info Box */}
                <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl p-5 inline-block shadow-xl">
                  <div className="flex items-center gap-10 mb-4">
                    <div>
                      <p className="text-gray-400 text-xs font-bold tracking-widest mb-1.5">MINT PRICE</p>
                      <p className="text-white font-bold text-xl">0.0804 ETH</p>
                    </div>
                    <div className="w-px h-10 bg-white/10"></div>
                    <div>
                      <p className="text-gray-400 text-xs font-bold tracking-widest mb-1.5">TOTAL ITEMS</p>
                      <p className="text-white font-bold text-xl">OPEN EDITION</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium tracking-wide">ITEMS MINTED</span>
                      <span className="text-white font-bold bg-white/10 px-3 py-1 rounded-full">13,122</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/80 hover:scale-110">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/80 hover:scale-110">
                <ChevronRight className="w-6 h-6" />
              </button>

              {/* Pagination */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20">
                <div className="w-10 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                <div className="w-10 h-1.5 rounded-full bg-white/20 hover:bg-white/50 cursor-pointer transition-colors"></div>
                <div className="w-10 h-1.5 rounded-full bg-white/20 hover:bg-white/50 cursor-pointer transition-colors"></div>
                <div className="w-10 h-1.5 rounded-full bg-white/20 hover:bg-white/50 cursor-pointer transition-colors"></div>
              </div>
            </div>

            {/* Trending Tokens */}
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-1.5 flex items-center gap-2">
                  Trending Tokens
                  <span className="relative flex h-2.5 w-2.5 ml-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                </h2>
                <p className="text-gray-400 text-sm">Tokens with momentum today</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: "Orca", change: "+12.9%", up: true, vol: "$113.6M", color: "from-cyan-400 to-blue-600", spark: [20, 30, 25, 45, 60, 85] },
                  { name: "Pepe", change: "-2.8%", up: false, vol: "$842.1M", color: "from-green-400 to-emerald-600", spark: [80, 75, 60, 50, 45, 30] },
                  { name: "Render", change: "+5.4%", up: true, vol: "$241.9M", color: "from-pink-400 to-purple-600", spark: [30, 35, 40, 35, 55, 65] },
                  { name: "Fetch.ai", change: "+8.1%", up: true, vol: "$189.2M", color: "from-yellow-400 to-orange-600", spark: [40, 45, 50, 70, 80, 95] },
                  { name: "Bonk", change: "-1.5%", up: false, vol: "$312.4M", color: "from-orange-400 to-red-500", spark: [60, 55, 65, 50, 45, 40] },
                  { name: "Singularity", change: "+4.2%", up: true, vol: "$98.3M", color: "from-blue-400 to-indigo-600", spark: [20, 30, 40, 45, 55, 60] },
                  { name: "Worldcoin", change: "-5.6%", up: false, vol: "$156.8M", color: "from-gray-300 to-gray-600", spark: [90, 80, 70, 50, 30, 20] },
                  { name: "Arbitrum", change: "+1.2%", up: true, vol: "$428.5M", color: "from-blue-300 to-blue-600", spark: [40, 35, 45, 40, 50, 55] },
                ].map((token, idx) => (
                  <div key={idx} className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-[#181818] hover:border-white/10 transition-all duration-300 cursor-pointer group shadow-lg">
                    <div className="flex items-center gap-3.5">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${token.color} flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform`}></div>
                      <div>
                        <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors">{token.name}</h3>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <span className="text-gray-500 font-medium">{token.vol}</span>
                          <span className={`font-semibold ${token.up ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                            {token.change}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Sparkline Custom Component */}
                    <div className="w-16 h-8 flex items-end justify-between gap-[2px] opacity-70 group-hover:opacity-100 transition-opacity">
                      {token.spark.map((val, i) => (
                        <div 
                          key={i} 
                          className={`w-2 rounded-t-sm ${token.up ? 'bg-[#00ff88]' : 'bg-[#ff3366]'}`}
                          style={{ height: `${val}%` }}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* 4. Right Sidebar (Leaderboard) */}
        <aside className="w-80 lg:w-[400px] border-l border-white/5 bg-[#0a0a0a] shrink-0 hidden xl:flex flex-col z-10">
          <div className="p-5 border-b border-white/5 bg-[#0d0d0d]">
            <div className="flex items-center justify-between mb-5">
              <div className="bg-[#1a1a1a] p-1 rounded-xl flex items-center border border-white/5">
                <button className="px-5 py-2 bg-[#2a2a2a] text-white text-sm font-bold rounded-lg shadow-md">NFTs</button>
                <button className="px-5 py-2 text-gray-400 hover:text-white text-sm font-semibold transition-colors">Tokens</button>
              </div>
              <div className="flex items-center gap-2">
                <button className="bg-[#1a1a1a] text-gray-300 text-xs font-bold px-3 py-2 rounded-lg hover:text-white hover:bg-[#252525] transition-colors border border-white/5">
                  1d
                </button>
                <div className="flex items-center bg-[#1a1a1a] rounded-lg border border-white/5 p-1">
                  <button className="p-1.5 bg-[#2a2a2a] rounded-md text-white shadow"><ListIcon className="w-4 h-4" /></button>
                  <button className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"><LayoutGrid className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 tracking-widest px-3">
              <span>COLLECTION</span>
              <span>FLOOR</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            {[
              { rank: 1, name: "CryptoPunks", verified: true, floor: "32.83 ETH", change: "+8.2%", up: true, img: "from-orange-500 to-amber-300" },
              { rank: 2, name: "Bored Ape Yacht Club", verified: true, floor: "12.45 ETH", change: "-4.7%", up: false, img: "from-zinc-700 to-zinc-400" },
              { rank: 3, name: "Pudgy Penguins", verified: true, floor: "10.20 ETH", change: "+1.5%", up: true, img: "from-blue-400 to-cyan-200" },
              { rank: 4, name: "Mutant Ape YC", verified: true, floor: "2.15 ETH", change: "-1.2%", up: false, img: "from-green-600 to-emerald-400" },
              { rank: 5, name: "Milady Maker", verified: true, floor: "4.88 ETH", change: "+12.4%", up: true, img: "from-pink-500 to-rose-300" },
              { rank: 6, name: "Azuki", verified: true, floor: "5.30 ETH", change: "+3.1%", up: true, img: "from-red-600 to-red-400" },
              { rank: 7, name: "DeGods", verified: true, floor: "1.42 ETH", change: "-8.5%", up: false, img: "from-purple-600 to-violet-400" },
              { rank: 8, name: "Mad Lads", verified: true, floor: "98.5 SOL", change: "+5.6%", up: true, img: "from-orange-600 to-red-500" },
              { rank: 9, name: "Doodles", verified: true, floor: "1.25 ETH", change: "-0.5%", up: false, img: "from-sky-300 to-indigo-300" },
              { rank: 10, name: "Clone X", verified: true, floor: "0.85 ETH", change: "+0.2%", up: true, img: "from-slate-600 to-slate-400" },
            ].map((collection) => (
              <div key={collection.rank} className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm font-bold w-5 text-center">{collection.rank}</span>
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${collection.img} shrink-0 shadow-md group-hover:scale-105 transition-transform`}></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-bold text-[15px] text-gray-200 group-hover:text-white transition-colors">{collection.name}</span>
                      {collection.verified && <CheckCircle className="w-4 h-4 text-blue-500 fill-white" />}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[15px] font-bold text-white mb-0.5">{collection.floor}</div>
                  <div className={`text-xs font-bold ${collection.up ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                    {collection.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* 5. Bottom Status Bar */}
      <footer className="h-10 border-t border-white/5 bg-[#090909] shrink-0 flex items-center justify-between px-5 text-[11px] font-semibold text-gray-500 z-20">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 bg-green-500/10 px-2.5 py-1 rounded-full border border-green-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]"></span>
            </span>
            <span className="text-[#00ff88] uppercase tracking-wider text-[9px]">Live</span>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <button className="hover:text-white transition-colors">Aggregating</button>
          <button className="hover:text-white transition-colors">Networks</button>
          <button className="hover:text-white transition-colors">Terms of Service</button>
          <button className="hover:text-white transition-colors">Privacy Policy</button>
          <div className="flex items-center gap-2.5 ml-2">
            <button className="text-gray-500 hover:text-white transition-colors"><MessageCircle className="w-3.5 h-3.5" /></button>
            <button className="text-gray-500 hover:text-white transition-colors"><Hash className="w-3.5 h-3.5" /></button>
            <button className="text-gray-500 hover:text-white transition-colors"><Twitter className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 uppercase tracking-wider text-[9px]">Vol 24h:</span>
            <span className="text-white font-bold tracking-wide">$2,176.76M</span>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <div className="flex items-center gap-1.5 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
            <CircleDot className="w-3 h-3" />
            <span className="font-bold tracking-wide">0.12 GWEI</span>
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <button className="hover:text-white transition-colors">Support</button>
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-white transition-colors bg-[#1a1a1a] p-1.5 rounded-md border border-white/5"><Moon className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-md px-3 py-1.5 border border-white/5">
            <span className="hover:text-white cursor-pointer transition-colors">Collector Pro</span>
            <span className="text-white/20">|</span>
            <span className="hover:text-white cursor-pointer transition-colors">Crypto</span>
            <span className="text-white/20">|</span>
            <span className="text-white font-bold cursor-pointer">USD</span>
          </div>
        </div>
      </footer>

      {/* Global CSS overrides inside component */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 10px;
          border: 2px solid #0d0d0d;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}} />
    </div>
  );
}
