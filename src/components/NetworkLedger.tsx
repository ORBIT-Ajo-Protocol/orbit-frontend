import React, { useState } from 'react';
import { LogEvent } from '../types';
import { Activity, ShieldCheck, RefreshCw, Radio, Wallet, Globe, ArrowRight, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NetworkLedgerProps {
  logs: LogEvent[];
  clearLogs: () => void;
  theme?: 'dark' | 'light';
}

export default function NetworkLedger({ logs, clearLogs, theme }: NetworkLedgerProps) {
  const [filter, setFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'ledger':
        return <Globe className="w-4 h-4 text-cyan-500" />;
      case 'contract':
        return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      case 'sep24':
        return <RefreshCw className="w-4 h-4 text-emerald-500" />;
      case 'indexer':
        return <Activity className="w-4 h-4 text-amber-500" />;
      case 'websocket':
        return <Radio className="w-4 h-4 text-pink-500" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-indigo-500" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'ledger':
        return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      case 'contract':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'sep24':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'indexer':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'websocket':
        return 'bg-pink-500/10 text-pink-600 border-pink-500/20';
      case 'wallet':
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20';
    }
  };

  const isLight = theme === 'light';

  return (
    <div id="network-ledger" className={`border rounded-2xl overflow-hidden shadow-2xl font-mono text-xs transition-all duration-300 ${
      isLight ? 'bg-white border-zinc-200 text-zinc-850' : 'bg-[#050505] border-white/10 text-[#E0E0E0]'
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b transition-colors duration-300 ${
        isLight ? 'border-zinc-200 bg-zinc-50' : 'border-white/10 bg-[#0A0A0A]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
          </div>
          <div>
            <h3 className={`font-serif italic text-sm tracking-wider transition-colors duration-300 ${isLight ? 'text-zinc-950' : 'text-white'}`}>Orbit Ledger Monitor</h3>
            <p className={`text-[10px] transition-colors duration-300 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>Real-time simulation of Stellar network state & postgres indexer</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-2.5 py-1 rounded-md border text-[11px] transition-all uppercase tracking-wider font-bold ${
              filter === 'all' 
                ? (isLight ? 'bg-zinc-900 text-white border-transparent' : 'bg-white text-black border-transparent') 
                : (isLight ? 'text-zinc-400 border-transparent hover:text-zinc-800' : 'text-white/40 border-transparent hover:text-white/80')
            }`}
          >
            All Logs
          </button>
          <button 
            onClick={() => setFilter('ledger')} 
            className={`px-2.5 py-1 rounded-md border text-[11px] transition-all uppercase tracking-wider font-bold ${
              filter === 'ledger' 
                ? (isLight ? 'bg-zinc-200 text-zinc-900 border-zinc-300' : 'bg-white/10 text-white border-white/20') 
                : (isLight ? 'text-zinc-400 border-transparent hover:text-zinc-800' : 'text-white/40 border-transparent hover:text-white/80')
            }`}
          >
            Stellar Chain
          </button>
          <button 
            onClick={() => setFilter('contract')} 
            className={`px-2.5 py-1 rounded-md border text-[11px] transition-all uppercase tracking-wider font-bold ${
              filter === 'contract' 
                ? (isLight ? 'bg-zinc-200 text-zinc-900 border-zinc-300' : 'bg-white/10 text-white border-white/20') 
                : (isLight ? 'text-zinc-400 border-transparent hover:text-zinc-800' : 'text-white/40 border-transparent hover:text-white/80')
            }`}
          >
            Contracts
          </button>
          <button 
            onClick={() => setFilter('sep24')} 
            className={`px-2.5 py-1 rounded-md border text-[11px] transition-all uppercase tracking-wider font-bold ${
              filter === 'sep24' 
                ? (isLight ? 'bg-zinc-200 text-zinc-900 border-zinc-300' : 'bg-white/10 text-white border-white/20') 
                : (isLight ? 'text-zinc-400 border-transparent hover:text-zinc-800' : 'text-white/40 border-transparent hover:text-white/80')
            }`}
          >
            SEP-24
          </button>
          <button 
            onClick={() => setFilter('indexer')} 
            className={`px-2.5 py-1 rounded-md border text-[11px] transition-all uppercase tracking-wider font-bold ${
              filter === 'indexer' 
                ? (isLight ? 'bg-zinc-200 text-zinc-900 border-zinc-300' : 'bg-white/10 text-white border-white/20') 
                : (isLight ? 'text-zinc-400 border-transparent hover:text-zinc-800' : 'text-white/40 border-transparent hover:text-white/80')
            }`}
          >
            Indexer
          </button>
          <button 
            onClick={() => setFilter('websocket')} 
            className={`px-2.5 py-1 rounded-md border text-[11px] transition-all uppercase tracking-wider font-bold ${
              filter === 'websocket' 
                ? (isLight ? 'bg-zinc-200 text-zinc-900 border-zinc-300' : 'bg-white/10 text-white border-white/20') 
                : (isLight ? 'text-zinc-400 border-transparent hover:text-zinc-800' : 'text-white/40 border-transparent hover:text-white/80')
            }`}
          >
            WebSockets
          </button>
          <button 
            onClick={clearLogs} 
            className={`ml-auto sm:ml-4 text-[10px] transition-colors px-2 py-1 rounded font-bold uppercase tracking-wider ${
              isLight ? 'text-zinc-400 hover:text-red-500 hover:bg-zinc-100' : 'text-white/40 hover:text-red-400 hover:bg-white/5'
            }`}
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Log list container — was a fixed h-64 (256px) regardless of viewport,
          leaving most of the page empty below a small scrolling box. */}
      <div className={`h-[65vh] min-h-[360px] overflow-y-auto p-4 space-y-3 select-text transition-colors duration-300 ${
        isLight ? 'bg-white' : 'bg-[#020202]'
      }`}>
        <AnimatePresence initial={false}>
          {filteredLogs.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full gap-1 font-sans ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
              <Activity className={`w-8 h-8 opacity-40 animate-pulse ${isLight ? 'text-zinc-300' : 'text-white/20'}`} />
              <p className={`text-xs mt-2 ${isLight ? 'text-zinc-500' : 'text-white/40'}`}>No system logs in this category yet</p>
              <p className={`text-[10px] ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>Interact with the mobile app or web portal to trigger real-time ledger events</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`flex items-start gap-3 pb-2.5 last:border-0 border-b ${
                  isLight ? 'border-zinc-100' : 'border-white/5'
                }`}
              >
                <div className={`text-[10px] shrink-0 select-none pt-0.5 ${isLight ? 'text-zinc-400' : 'text-white/30'}`}>
                  {log.timestamp}
                </div>
                <div className="shrink-0 mt-0.5">
                  {getIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold tracking-wider uppercase shrink-0 select-none ${getBadgeStyle(log.type)}`}>
                      {log.type}
                    </span>
                    <span className={`font-medium break-words leading-relaxed ${isLight ? 'text-zinc-900' : 'text-white/90'}`}>
                      {log.message}
                    </span>
                  </div>
                  {log.details && (
                    <div className={`mt-1.5 flex items-start gap-1 text-[11px] leading-relaxed select-text font-mono p-2 rounded border transition-colors duration-300 ${
                      isLight 
                        ? 'text-zinc-655 bg-zinc-50 border-zinc-205' 
                        : 'text-white/40 bg-white/5 border-white/5'
                    }`}>
                      <CornerDownRight className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isLight ? 'text-zinc-400' : 'text-white/20'}`} />
                      <pre className={`whitespace-pre-wrap break-all font-mono text-[10px] w-full ${isLight ? 'text-zinc-700' : 'text-white/60'}`}>
                        {log.details}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
