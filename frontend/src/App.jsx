import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Server, 
  Zap, 
  Search, 
  AlertTriangle, 
  TrendingUp, 
  Database,
  Lock,
  Play,
  Pause,
  RefreshCw,
  Cpu,
  Wifi,
  WifiOff
} from 'lucide-react';

// --- CONFIGURATION ---
const CONFIG = {
  refreshRate: 1500,
  attackRefreshRate: 400,
  wsUrl: 'ws://localhost:8000/ws/stream',
  apiUrl: 'http://localhost:8000/api/v1'
};

const USERS = Array.from({ length: 30 }, (_, i) => `User_${1000 + i}`);
const LOCATIONS = ['New York, US', 'London, UK', 'Tokyo, JP', 'Lagos, NG', 'Moscow, RU', 'San Francisco, US', 'Berlin, DE', 'Sydney, AU'];
const MERCHANTS = [
  { name: 'Amazon', risk: 0.1, category: 'Retail' },
  { name: 'Uber', risk: 0.2, category: 'Transport' },
  { name: 'Apple Store', risk: 0.3, category: 'Electronics' },
  { name: 'Crypto.com', risk: 0.9, category: 'Crypto' },
  { name: 'Starbucks', risk: 0.05, category: 'Food' },
  { name: 'Rolex Boutique', risk: 0.8, category: 'Luxury' },
  { name: 'Unknown Service', risk: 0.95, category: 'Misc' }
];

const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();
const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

export default function App() {
  const [isLive, setIsLive] = useState(true);
  const [isDriftMode, setIsDriftMode] = useState(false);
  const [isAttackMode, setIsAttackMode] = useState(false);
  const [wsStatus, setWsStatus] = useState('disconnected');
  
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [metrics, setMetrics] = useState({
    processed: 0,
    blocked: 0,
    volume: 0,
    latency: 12,
    modelVersion: "IsolationForest v1.0"
  });

  const ws = useRef(null);

  // --- WEBSOCKET CONNECTION ---
  useEffect(() => {
    const connectWs = () => {
      ws.current = new WebSocket(CONFIG.wsUrl);
      
      ws.current.onopen = () => setWsStatus('connected');
      ws.current.onclose = () => {
        setWsStatus('disconnected');
        setTimeout(connectWs, 3000); // Auto-reconnect
      };
      
      ws.current.onmessage = (event) => {
        const newTx = JSON.parse(event.data);
        setTransactions(prev => [newTx, ...prev].slice(0, 50));
        
        // Update stats from API every few messages to keep in sync with DB
        if (Math.random() > 0.8) fetchStats();
      };
    };

    connectWs();
    fetchHistory();
    fetchStats();
    
    return () => ws.current?.close();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${CONFIG.apiUrl}/stats`);
      const data = await res.json();
      setMetrics(prev => ({
        ...prev,
        processed: data.total_processed,
        blocked: data.total_blocked
      }));
    } catch (e) { console.error("Stats error", e); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${CONFIG.apiUrl}/history`);
      const data = await res.json();
      const formatted = data.map(t => ({
        ...t,
        isFraud: t.is_fraud === 1,
        score: t.risk_score,
        reasons: t.reasons ? t.reasons.split(',') : []
      }));
      setTransactions(formatted);
    } catch (e) { console.error("History error", e); }
  };

  // --- SIMULATION LOOP (SENDING TO BACKEND) ---
  useEffect(() => {
    if (!isLive) return;

    const tick = setInterval(async () => {
      const isAttacker = isAttackMode && Math.random() > 0.4;
      const rawTx = {
        id: generateId(),
        user_id: isAttacker ? 'User_ATTACKER_99' : USERS[Math.floor(Math.random() * USERS.length)],
        amount: isDriftMode 
          ? Math.floor(Math.random() * 8000) + 1000 
          : Math.floor(Math.random() * (Math.random() > 0.95 ? 6000 : 300)) + 10,
        merchant: MERCHANTS[Math.floor(Math.random() * MERCHANTS.length)].name,
        location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
        timestamp: new Date().toISOString()
      };

      try {
        await fetch(`${CONFIG.apiUrl}/infer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rawTx)
        });
        
        setMetrics(prev => ({ ...prev, volume: prev.volume + rawTx.amount }));
      } catch (err) {
        console.error("Inference failed", err);
      }

      // Drift Monitoring
      if (isDriftMode && Math.random() > 0.8) {
        if (!systemAlerts.some(a => a.type === 'drift')) {
          setSystemAlerts(prev => [...prev, { id: generateId(), type: 'drift', msg: 'Data Drift Detected: Avg Transaction Value > Baseline (+300%)' }]);
        }
      } else if (!isDriftMode) {
        setSystemAlerts(prev => prev.filter(a => a.type !== 'drift'));
      }

    }, isAttackMode ? CONFIG.attackRefreshRate : CONFIG.refreshRate);

    return () => clearInterval(tick);
  }, [isLive, isDriftMode, isAttackMode, systemAlerts]);

  const getScoreColor = (score) => {
    if (score > 80) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (score > 50) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <div className="leading-tight">
              <h1 className="font-bold text-lg text-white tracking-tight">Sentinel <span className="text-blue-500">AI</span></h1>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Enterprise Fraud Engine</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 text-xs font-mono border-r border-slate-800 pr-4 mr-2">
              <div className={`flex items-center gap-1.5 ${wsStatus === 'connected' ? 'text-emerald-400' : 'text-red-400'}`}>
                {wsStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
                WS_{wsStatus.toUpperCase()}
              </div>
              <div className="flex items-center gap-1.5 text-blue-400">
                <Server size={12} /> DB_SQLITE_LIVE
              </div>
            </div>

            <button 
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs transition-all border ${
                isLive 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/20' 
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {isLive ? <Pause size={14} /> : <Play size={14} />}
              {isLive ? 'LIVE' : 'PAUSED'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KpiCard label="AI Latency" value={`${metrics.latency}ms`} icon={Cpu} color="text-blue-400" />
            <KpiCard label="Historical Txns" value={metrics.processed} icon={Database} color="text-slate-200" />
            <KpiCard label="Fraud Blocked" value={metrics.blocked} icon={Lock} color="text-red-400" sub={`${((metrics.blocked/metrics.processed || 0)*100).toFixed(1)}%`} />
            <KpiCard label="Total Volume" value={`$${(metrics.volume / 1000).toFixed(1)}k`} icon={TrendingUp} color="text-emerald-400" />
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
              <Zap size={14} className="text-yellow-500"/> Adversarial Simulation
            </h3>
            <div className="flex flex-wrap gap-3">
              <ControlButton 
                isActive={isAttackMode} 
                onClick={() => setIsAttackMode(!isAttackMode)}
                activeColor="bg-red-500 border-red-400 text-white"
                label={isAttackMode ? "HALT VELOCITY ATTACK" : "INJECT VELOCITY ATTACK"}
                icon={Activity}
              />
              <ControlButton 
                isActive={isDriftMode} 
                onClick={() => setIsDriftMode(!isDriftMode)}
                activeColor="bg-orange-500 border-orange-400 text-white"
                label={isDriftMode ? "STABILIZE DRIFT" : "TRIGGER DATA DRIFT"}
                icon={TrendingUp}
              />
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col flex-1 min-h-[400px]">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                Real-Time AI Inference Stream
              </h3>
              <span className="text-xs text-slate-500 font-mono">mode::production-v1</span>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-2 max-h-[500px]">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-60 py-20">
                  <RefreshCw className="animate-spin" />
                  <p className="text-sm">Awaiting WebSocket payload...</p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div 
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`group flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTx?.id === tx.id 
                        ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                        : 'bg-slate-800/40 border-slate-800/60 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                        tx.isFraud ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      }`}>
                        {tx.isFraud ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200 text-sm">{tx.merchant}</span>
                          <span className="text-[10px] text-slate-500 font-mono bg-slate-800 px-1.5 rounded">{tx.id}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                           <span className={tx.user_id.includes('ATTACKER') ? 'text-red-400 font-bold' : ''}>{tx.user_id}</span>
                           <span className="text-slate-600">•</span>
                           <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-mono font-medium text-slate-200">{formatCurrency(tx.amount)}</div>
                      <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block border ${getScoreColor(tx.score)}`}>
                        RISK: {Math.round(tx.score)}/100
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
          {systemAlerts.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 animate-in slide-in-from-top-4 fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <h4 className="font-bold text-red-400 text-sm">System Alert Active</h4>
                  {systemAlerts.map(a => (
                    <p key={a.id} className="text-xs text-red-300/80 mt-1 leading-relaxed">{a.msg}</p>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col flex-1 sticky top-24 h-[calc(100vh-120px)] overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900">
              <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <Search size={16} className="text-blue-500" />
                Inference Inspector
              </h3>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              {selectedTx ? (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className={`p-4 rounded-lg border flex items-center gap-3 ${
                    selectedTx.isFraud ? 'bg-red-500/10 border-red-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    {selectedTx.isFraud ? <Lock className="text-red-500" size={20} /> : <ShieldCheck className="text-emerald-500" size={20} />}
                    <div>
                      <div className={`font-bold text-sm ${selectedTx.isFraud ? 'text-red-400' : 'text-emerald-400'}`}>
                        {selectedTx.isFraud ? 'ACTION: BLOCKED' : 'ACTION: APPROVED'}
                      </div>
                      <div className="text-xs text-slate-400">Model: {metrics.modelVersion}</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-white tracking-tight mb-1">{formatCurrency(selectedTx.amount)}</div>
                    <div className="text-sm text-blue-400">{selectedTx.merchant}</div>
                    <div className="text-xs text-slate-500 mt-1">{selectedTx.location}</div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center justify-between">
                      <span>Neural Risk Factors</span>
                      <span>Score: {Math.round(selectedTx.score)}</span>
                    </h4>
                    
                    <div className="space-y-2">
                      {selectedTx.reasons.length > 0 ? (
                        selectedTx.reasons.map((reason, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-slate-800/50 border border-slate-800 p-2.5 rounded">
                            <span className="text-slate-300">{reason}</span>
                            <span className="text-red-400 font-mono font-bold">CRITICAL</span>
                          </div>
                        ))
                      ) : (
                         <div className="text-xs text-slate-500 italic text-center py-6 border border-dashed border-slate-800 rounded">
                           Transaction matched user baseline profile.
                         </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
                     <MetaItem label="Entity ID" value={selectedTx.user_id} />
                     <MetaItem label="Persistence" value="SQLITE_STORED" />
                     <MetaItem label="Network Latency" value={`${metrics.latency}ms`} />
                     <MetaItem label="Decision Engine" value="XGB/IForest" />
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 opacity-60">
                  <div className="bg-slate-800/50 p-4 rounded-full">
                    <Search size={32} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-center max-w-[200px]">Select a real-time event to inspect the AI's decision vector.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const KpiCard = ({ label, value, sub, icon: Icon, color }) => (
  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <Icon size={14} className={`opacity-80 ${color}`} />
    </div>
    <div className="flex items-end gap-2">
      <span className="text-xl font-mono font-medium text-slate-200">{value}</span>
      {sub && <span className="text-[10px] text-slate-500 mb-1">{sub}</span>}
    </div>
  </div>
);

const ControlButton = ({ isActive, onClick, activeColor, label, icon: Icon }) => (
  <button 
    onClick={onClick}
    className={`flex-1 min-w-[140px] px-3 py-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
      isActive 
        ? `${activeColor} shadow-[0_0_15px_rgba(0,0,0,0.3)]` 
        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
    }`}
  >
    <Icon size={14} />
    {label}
  </button>
);

const MetaItem = ({ label, value }) => (
  <div className="bg-slate-900/50 p-2 rounded border border-slate-800/50">
    <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    <div className="text-xs text-slate-300 font-mono truncate" title={value}>{value}</div>
  </div>
);
