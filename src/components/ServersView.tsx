import React, { useState, useMemo } from 'react';
import { Search, Zap, Plus, Trash2, CheckCircle2, Circle, Activity, Globe, RefreshCw, Tv } from 'lucide-react';
import { Server, ProtocolType } from '../types';
import { translations } from '../services/i18n';
import { formatServerLocation } from '../services/protocolParser';

interface ServersViewProps {
  servers: Server[];
  activeServerId: string | null;
  onSelectServer: (server: Server) => void;
  onDeleteServer: (id: string) => void;
  onPingAll: () => Promise<void>;
  onPingSingle: (server: Server) => Promise<void>;
  onOpenAddModal: () => void;
  onOpenTvSync?: () => void;
  language: 'en' | 'ar';
  isPingingAll: boolean;
}

export const ServersView: React.FC<ServersViewProps> = ({
  servers,
  activeServerId,
  onSelectServer,
  onDeleteServer,
  onPingAll,
  onPingSingle,
  onOpenAddModal,
  onOpenTvSync,
  language,
  isPingingAll,
}) => {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('all');
  const [pingingId, setPingingId] = useState<string | null>(null);

  const filteredServers = useMemo(() => {
    return servers.filter(srv => {
      const matchSearch =
        srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (srv.country && srv.country.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchProto =
        protocolFilter === 'all' || srv.protocol.toLowerCase() === protocolFilter.toLowerCase();

      return matchSearch && matchProto;
    });
  }, [servers, searchQuery, protocolFilter]);

  const handlePingSingle = async (e: React.MouseEvent, srv: Server) => {
    e.stopPropagation();
    setPingingId(srv.id);
    await onPingSingle(srv);
    setPingingId(null);
  };

  const getPingColor = (ping: number | null) => {
    if (ping === null) return 'text-zinc-300 bg-zinc-800/80 border-zinc-700/80';
    if (ping < 50) return 'text-incy-green bg-emerald-950/60 border-emerald-500/40 shadow-xs shadow-emerald-500/20';
    if (ping < 120) return 'text-amber-300 bg-amber-950/60 border-amber-500/40 shadow-xs shadow-amber-500/20';
    return 'text-rose-300 bg-rose-950/60 border-rose-500/40 shadow-xs shadow-rose-500/20';
  };

  return (
    <div className="flex-1 h-full flex flex-col p-3.5 sm:p-6 overflow-hidden bg-theme-app text-theme-primary transition-colors duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl font-bold text-theme-primary flex items-center gap-2">
            <span>{t.serversList}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-theme-card text-theme-accent border border-theme-card">
              {servers.length}
            </span>
          </h1>
        </div>

        {/* Action Buttons: TV Sync, Ping All & Add */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {onOpenTvSync && (
            <button
              onClick={onOpenTvSync}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-950/70 hover:bg-teal-900 border border-teal-500/50 text-xs font-extrabold text-teal-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              title={language === 'ar' ? 'مزامنة مع التلفزيون' : 'Sync with TV'}
            >
              <Tv className="w-4 h-4 text-teal-400" />
              <span>{language === 'ar' ? 'مزامنة TV' : 'TV Sync'}</span>
            </button>
          )}

          <button
            onClick={onPingAll}
            disabled={isPingingAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-incy-green/60 text-xs font-extrabold text-white transition-all active:scale-95 disabled:opacity-50 shadow-sm cursor-pointer"
            title={t.pingAll}
          >
            <Zap className={`w-4 h-4 text-incy-green ${isPingingAll ? 'animate-bounce' : ''}`} />
            <span>{isPingingAll ? '...' : t.pingAll}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-accent hover:opacity-90 text-white text-xs font-black transition-all shadow-lg shadow-theme-accent/25 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t.buttonAdd}</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Filter Chips */}
      <div className="space-y-3 mb-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-theme-muted absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t.searchServers}
            className="w-full bg-theme-card border border-theme-card focus:border-theme-accent rounded-xl pl-10 pr-4 rtl:pl-4 rtl:pr-10 py-2.5 text-xs sm:text-sm text-theme-primary placeholder-theme-muted outline-none transition-colors shadow-sm select-text"
          />
        </div>

        {/* Protocol Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {['all', 'http', 'vless', 'hysteria2', 'trojan', 'vmess', 'ss'].map(proto => (
            <button
              key={proto}
              onClick={() => setProtocolFilter(proto)}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold tracking-wider transition-all cursor-pointer ${
                protocolFilter === proto
                  ? 'bg-theme-accent text-white border border-theme-accent shadow-xs scale-[1.02]'
                  : 'bg-theme-card text-theme-secondary hover:text-theme-primary hover:bg-theme-subtle border border-theme-card'
              }`}
            >
              {proto === 'all' ? t.allProtocols : proto.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Servers List Scrollable Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 pb-24 md:pb-4">
        {filteredServers.length === 0 ? (
          <div className="h-72 flex flex-col items-center justify-center text-center p-6 bg-theme-card/60 border border-dashed border-theme-card rounded-3xl animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-theme-subtle border border-theme-card flex items-center justify-center text-theme-secondary mb-3 shadow-inner">
              <Globe className="w-8 h-8 stroke-1 text-teal-400" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-theme-primary mb-1">
              {searchQuery ? t.noServersFound : (language === 'ar' ? 'لا توجد خوادم مضافة حالياً' : 'No servers added yet')}
            </h4>
            <p className="text-xs text-theme-secondary max-w-xs mb-4 leading-relaxed">
              {searchQuery
                ? (language === 'ar' ? 'جرب البحث بكلمات أخرى' : 'Try searching with other keywords')
                : (language === 'ar' ? 'يمكنك إضافة خادمك يدوياً أو لصق رابط بروكسي أو الاستيراد من التلفزيون' : 'Add your proxy manually, paste a link, or sync from TV')}
            </p>
            {!searchQuery && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>{language === 'ar' ? 'إضافة خادم جديد' : 'Add Server'}</span>
                </button>
                {onOpenTvSync && (
                  <button
                    type="button"
                    onClick={onOpenTvSync}
                    className="px-4 py-2.5 rounded-xl bg-theme-subtle hover:bg-theme-card-hover text-teal-400 border border-teal-500/30 font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Tv className="w-4 h-4" />
                    <span>{language === 'ar' ? 'مزامنة TV' : 'TV Sync'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          filteredServers.map(srv => {
            const isSelected = srv.id === activeServerId;
            const isSinglePinging = pingingId === srv.id;
            const loc = formatServerLocation(srv, language);

            return (
              <div
                key={srv.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectServer(srv)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectServer(srv);
                  }
                }}
                className={`group p-4 rounded-2xl cursor-pointer border transition-all duration-200 flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-theme-card border-2 border-theme-accent shadow-lg ring-1 ring-theme-accent/50'
                    : 'bg-theme-card border border-theme-card hover:border-theme-accent/60 hover:bg-theme-subtle/50'
                }`}
              >
                {/* Left: Radio & Country/City Only */}
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Select radio check */}
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-theme-muted group-hover:text-theme-primary" />
                    )}
                  </div>

                  {/* Flag */}
                  <span className="text-2xl flex-shrink-0">{loc.flag || srv.flag || '🌐'}</span>

                  {/* Only Country and City */}
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-extrabold text-theme-primary truncate group-hover:text-theme-accent transition-colors">
                      {loc.country}
                    </h4>
                    <p className="text-xs text-theme-secondary font-semibold truncate mt-0.5">
                      {loc.city}
                    </p>
                  </div>
                </div>

                {/* Right: Ping & Delete Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Ping Badge / Button */}
                  <button
                    onClick={e => handlePingSingle(e, srv)}
                    disabled={isSinglePinging}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer ${getPingColor(
                      srv.ping
                    )}`}
                    title={t.testSpeed}
                  >
                    {isSinglePinging ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                    <span>{srv.ping !== null ? `${srv.ping} ms` : '--'}</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteServer(srv.id);
                    }}
                    className="p-2 rounded-xl text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 transition-all cursor-pointer active:scale-95 shadow-xs"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
