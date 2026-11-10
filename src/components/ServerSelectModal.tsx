import React from 'react';
import { X, CheckCircle2, Circle, Activity, Trash2, Globe } from 'lucide-react';
import { Server } from '../types';
import { translations } from '../services/i18n';
import { formatServerLocation } from '../services/protocolParser';

interface ServerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: Server[];
  activeServerId: string | null;
  onSelectServer: (server: Server) => void;
  onDeleteServer?: (id: string) => void;
  language: 'en' | 'ar';
}

export const ServerSelectModal: React.FC<ServerSelectModalProps> = ({
  isOpen,
  onClose,
  servers,
  activeServerId,
  onSelectServer,
  onDeleteServer,
  language,
}) => {
  const t = translations[language];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#0e120e] border border-[#222d20] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1a2318] flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{t.selectServer}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#182115] text-incy-green border border-[#2b3a24]">
              {servers.length}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#6f7c6d] hover:text-white hover:bg-[#1a2318] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {servers.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 flex flex-col items-center justify-center">
              <Globe className="w-10 h-10 mb-2 text-zinc-600 stroke-1" />
              <p className="text-xs font-semibold text-zinc-300">
                {language === 'ar' ? 'لا توجد خوادم مضافة حالياً' : 'No servers available'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1">
                {language === 'ar' ? 'أضف خادمك الخاص للبدء' : 'Add your proxy to get started'}
              </p>
            </div>
          ) : (
            servers.map(srv => {
            const isSelected = srv.id === activeServerId;
            const loc = formatServerLocation(srv, language);

            return (
              <div
                key={srv.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelectServer(srv);
                  onClose();
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectServer(srv);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl cursor-pointer border flex items-center justify-between gap-3 transition-all ${
                  isSelected
                    ? 'bg-[#162114] border-incy-green text-white shadow-sm shadow-lime-950/40'
                    : 'bg-[#111511] border-[#1d261b] hover:bg-[#151c14] hover:border-[#2d3a29] text-[#93a18f]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-incy-green" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#3c4a39]" />
                    )}
                  </div>

                  <span className="text-xl flex-shrink-0">{loc.flag || srv.flag || '🌐'}</span>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {loc.country}
                    </p>
                    <p className="text-xs text-theme-secondary font-medium truncate mt-0.5">
                      {loc.city}
                    </p>
                  </div>
                </div>

                {/* Right: Ping & Delete */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Ping */}
                  <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded-lg bg-[#182116] text-incy-green border border-[#263521] flex-shrink-0">
                    <Activity className="w-3 h-3" />
                    <span>{srv.ping ? `${srv.ping}ms` : '--'}</span>
                  </div>

                  {/* Delete Button */}
                  {onDeleteServer && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteServer(srv.id);
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 transition-all cursor-pointer active:scale-95"
                      title={language === 'ar' ? 'حذف هذا الخادم' : 'Delete Server'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
};
