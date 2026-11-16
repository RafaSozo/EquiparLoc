'use client';

import React, { useMemo, useState } from 'react';
import { Mail, MessageSquare, Phone, Search, Trash2, Archive, CheckCircle2, RotateCcw, Inbox, Save } from 'lucide-react';
import type { ContactMessage, ContactStatus } from '@/lib/types';
import { CONTACT_STATUS_LABELS } from '@/lib/types';
import { telHref, waHref } from '@/lib/company';

interface ContactManagerProps {
  messages: ContactMessage[];
  onChange: (messages: ContactMessage[]) => void;
  isAdmin: boolean;
  showToast: (msg: string) => void;
}

type Filter = 'todas' | ContactStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'novo', label: 'Novas' },
  { id: 'respondido', label: 'Respondidas' },
  { id: 'arquivado', label: 'Arquivadas' },
  { id: 'todas', label: 'Todas' },
];

const STATUS_STYLE: Record<ContactStatus, string> = {
  novo: 'text-amber-800 bg-amber-50 border-amber-200',
  respondido: 'text-emerald-800 bg-emerald-50 border-emerald-200',
  arquivado: 'text-slate-600 bg-slate-100 border-slate-200',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const btnLight =
  'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50';

/** Mensagens enviadas pelo formulário da página Contato. */
export function ContactManager({ messages, onChange, isAdmin, showToast }: ContactManagerProps) {
  const [filter, setFilter] = useState<Filter>(() => (messages.some((m) => m.status === 'novo') ? 'novo' : 'todas'));
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { todas: messages.length, novo: 0, respondido: 0, arquivado: 0 };
    messages.forEach((m) => (c[m.status] += 1));
    return c;
  }, [messages]);

  const term = search.trim().toLowerCase();
  const list = messages.filter((m) => {
    if (filter !== 'todas' && m.status !== filter) return false;
    if (!term) return true;
    return [m.name, m.email, m.phone, m.subject, m.equipment || '', m.message].some((v) => v.toLowerCase().includes(term));
  });

  const selected = messages.find((m) => m.id === selectedId) || null;

  const open = (m: ContactMessage) => {
    setSelectedId(m.id);
    setNote(m.note || '');
    setConfirmDelete(false);
  };

  const save = async (changes: { status?: ContactStatus; note?: string }, okMsg: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contatos/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || 'Não foi possível salvar. Tente de novo.');
        return;
      }
      onChange(messages.map((m) => (m.id === data.id ? (data as ContactMessage) : m)));
      showToast(okMsg);
    } catch {
      showToast('Sem conexão com o servidor. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/contatos/${selected.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Não foi possível excluir.');
        return;
      }
      onChange(messages.filter((m) => m.id !== selected.id));
      setSelectedId(null);
      showToast('Mensagem excluída.');
    } catch {
      showToast('Sem conexão com o servidor. Tente de novo.');
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const firstName = selected?.name.split(' ')[0] || '';

  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Mensagens de contato</h2>
        <p className="text-xs text-slate-500">
          O que os visitantes enviam pelo formulário da página Contato. Depois de responder, marque como respondida.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === f.id ? 'bg-[#101820] text-white border-[#101820]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label} <span className="opacity-70">({counts[f.id]})</span>
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nome, e-mail, assunto..."
            aria-label="Buscar mensagens"
            className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500] focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-4 items-start">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {list.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <Inbox className="w-6 h-6 mx-auto text-slate-300 mb-2" aria-hidden="true" />
              {messages.length === 0
                ? 'Nenhuma mensagem ainda. Quando alguém usar o formulário da página Contato, ela aparece aqui.'
                : 'Nenhuma mensagem neste filtro.'}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {list.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => open(m)}
                    aria-current={selectedId === m.id}
                    className={`w-full text-left px-4 py-3 transition-colors ${selectedId === m.id ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm truncate ${m.status === 'novo' ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {m.name}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">{formatDate(m.createdAt).split(',')[0]}</span>
                    </div>
                    <div className="text-xs text-slate-600 truncate">{m.subject}</div>
                    <div className="text-[11px] text-slate-400 truncate">{m.message}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 min-h-[16rem]">
          {!selected ? (
            <p className="text-xs text-slate-500">Escolha uma mensagem na lista para ler e responder.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selected.name}</h3>
                  <p className="text-xs text-slate-500">Recebida em {formatDate(selected.createdAt)}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[selected.status]}`}>
                  {CONTACT_STATUS_LABELS[selected.status]}
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <dt className="text-slate-500">Assunto</dt>
                  <dd className="font-semibold text-slate-800">{selected.subject}</dd>
                </div>
                {selected.equipment && (
                  <div>
                    <dt className="text-slate-500">Equipamento de interesse</dt>
                    <dd className="font-semibold text-slate-800">{selected.equipment}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-500">E-mail</dt>
                  <dd className="text-slate-800 break-all">{selected.email}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Telefone</dt>
                  <dd className="text-slate-800">{selected.phone}</dd>
                </div>
              </dl>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selected.message}
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-700 mb-2">Responder</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}&body=${encodeURIComponent(`Olá, ${firstName}!\n\n`)}`}
                    className={btnLight}
                  >
                    <Mail className="w-3.5 h-3.5" /> Por e-mail
                  </a>
                  <a
                    href={waHref(selected.phone, `Olá, ${firstName}! Aqui é da EquiparLoc, sobre a sua mensagem pelo site (${selected.subject}).`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnLight}
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Pelo WhatsApp
                  </a>
                  <a href={telHref(selected.phone)} className={btnLight}>
                    <Phone className="w-3.5 h-3.5" /> Ligar
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                {selected.status !== 'respondido' && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => save({ status: 'respondido' }, 'Mensagem marcada como respondida.')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-[#FF6500] hover:bg-[#E55B00] rounded-lg disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como respondida
                  </button>
                )}
                {selected.status !== 'arquivado' && (
                  <button type="button" disabled={busy} onClick={() => save({ status: 'arquivado' }, 'Mensagem arquivada.')} className={btnLight}>
                    <Archive className="w-3.5 h-3.5" /> Arquivar
                  </button>
                )}
                {selected.status !== 'novo' && (
                  <button type="button" disabled={busy} onClick={() => save({ status: 'novo' }, 'Mensagem voltou para Novas.')} className={btnLight}>
                    <RotateCcw className="w-3.5 h-3.5" /> Marcar como nova
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="contato-anotacao" className="block text-xs font-semibold text-slate-700 mb-1">
                  Anotação interna
                </label>
                <textarea
                  id="contato-anotacao"
                  rows={3}
                  maxLength={2000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex.: liguei dia 12, vai fechar semana que vem. Só a equipe vê."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF6500] focus:outline-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    disabled={busy || note === (selected.note || '')}
                    onClick={() => save({ note }, 'Anotação salva.')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#101820] rounded-lg disabled:opacity-40"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar anotação
                  </button>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-slate-100">
                  {confirmDelete ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-red-700 font-semibold">Excluir esta mensagem? Não dá para desfazer.</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={remove}
                        className="px-3 py-1.5 font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                      >
                        Excluir
                      </button>
                      <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 font-semibold text-slate-600">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:underline"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Excluir mensagem
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
