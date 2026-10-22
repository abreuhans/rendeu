// Estado do app: escolhas, plano atual, lista marcada, preços das notas lidas e dos sites.
// Tudo fica guardado no aparelho e volta quando o app abre de novo.
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import {
  finalizar, planejarSemTravar, trocar,
  type FontesPreco, type Nota, type Plano, type PrecoReal, type PrecosSite, type Preferencias, type Problema,
} from '@/core';
import { PADRAO } from '@/lib/textos';
import { gravar, ler } from './armazenamento';
import { CONFERIR_A_CADA_MS, baixarPrecos, guardarPrecos, precosGuardados } from './precos-site';

const CHAVE = 'rendeu.v1';
const CHAVE_PRECOS = 'rendeu.precos.v1';

export interface NotaLida {
  chave?: string;
  mercadoId: string;
  /** Data da compra (como aparece na nota). */
  data: string;
  /** Quando a nota foi lida no app (ISO). */
  lidaEm: string;
  total?: number;
  itens: number;
  reconhecidos: number;
}

interface PlanoSalvo {
  keys: string[];
  mercados: string[];
  custom: Plano['custom'];
  meta: Plano['meta'];
  prefs: Preferencias;
}

interface Salvo {
  prefs: Preferencias;
  semente: number;
  plano: PlanoSalvo | null;
  marcados: Record<string, boolean>;
  metodo: Record<string, string>;
}

interface SalvoPrecos {
  precos: Record<string, PrecoReal>;
  notas: NotaLida[];
}

export type Gerado = Plano | Problema;

/** Situação dos preços dos sites: de quando são e se a última conferência deu certo. */
export interface InfoSite {
  /** Última vez que o app baixou os preços (ISO), ou null se nunca conseguiu. */
  conferidoEm: string | null;
  baixando: boolean;
  /** A última tentativa falhou (sem internet, por exemplo). */
  falhou: boolean;
}

interface AppEstado {
  prefs: Preferencias;
  setPrefs: (f: (p: Preferencias) => Preferencias) => void;
  plano: Plano | null;
  problema: Problema | null;
  marcados: Record<string, boolean>;
  marcar: (id: string, v: boolean) => void;
  metodo: Record<string, string>;
  escolherMetodo: (chave: string, aparelho: string) => void;
  precos: Record<string, PrecoReal>;
  notas: NotaLida[];
  /** Preços dos sites dos mercados (robô, 2× por dia). */
  site: PrecosSite | null;
  infoSite: InfoSite;
  /** Tudo o que entra na conta de preço: notas lidas + sites. */
  fontes: FontesPreco;
  /** Monta o plano aos poucos (a tela continua respondendo). */
  gerar: (op?: { novaSemente?: boolean; prefs?: Preferencias; semente?: number }) => Promise<Gerado>;
  trocarReceita: (i: number) => { plano: Plano; delta: number } | null;
  salvarNota: (mercadoId: string, novos: PrecoReal[], nota: Nota) => void;
  apagarPrecos: () => void;
  /** Volta as escolhas do plano atual para o formulário. */
  editar: () => void;
  aviso: string | null;
  mostrarAviso: (msg: string) => void;
}

const Contexto = createContext<AppEstado | null>(null);

const copia = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

function restaurarPlano(s: PlanoSalvo | null | undefined, fontes: FontesPreco): Plano | null {
  if (!s) return null;
  try {
    const p = finalizar(s.prefs, s.keys, s.mercados, s.custom || {}, s.meta, fontes);
    return Object.values(p.vmap).every(Boolean) ? p : null;
  } catch {
    // Receitas mudaram numa versão nova do app: o plano antigo é descartado.
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Lido uma vez só, quando o app abre.
  const [{ salvo, precos: precosSalvos, guardado }] = useState(() => ({
    salvo: ler<Salvo>(CHAVE), precos: ler<SalvoPrecos>(CHAVE_PRECOS), guardado: precosGuardados(),
  }));

  const [precos, setPrecos] = useState<Record<string, PrecoReal>>(() => precosSalvos?.precos ?? {});
  const [notas, setNotas] = useState<NotaLida[]>(() => precosSalvos?.notas ?? []);
  const [site, setSite] = useState<PrecosSite | null>(() => guardado?.site ?? null);
  const [infoSite, setInfoSite] = useState<InfoSite>(() => ({ conferidoEm: guardado?.conferidoEm ?? null, baixando: false, falhou: false }));
  const fontes = useMemo<FontesPreco>(() => ({ reais: precos, site }), [precos, site]);

  const [prefs, setPrefsState] = useState<Preferencias>(() => ({ ...copia(PADRAO), ...(salvo?.prefs ?? {}) }));
  const [semente, setSemente] = useState(() => salvo?.semente ?? 1);
  const [plano, setPlano] = useState<Plano | null>(() => restaurarPlano(salvo?.plano, { reais: precosSalvos?.precos ?? {}, site: guardado?.site }));
  const [problema, setProblema] = useState<Problema | null>(null);
  const [marcados, setMarcados] = useState<Record<string, boolean>>(() => (plano ? salvo?.marcados ?? {} : {}));
  const [metodo, setMetodo] = useState<Record<string, string>>(() => salvo?.metodo ?? {});
  const tentadas = useRef<Record<number, string[]>>({});

  const [aviso, setAviso] = useState<string | null>(null);
  const timerAviso = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mostrarAviso = useCallback((msg: string) => {
    setAviso(msg);
    if (timerAviso.current) clearTimeout(timerAviso.current);
    timerAviso.current = setTimeout(() => setAviso(null), 3800);
  }, []);

  // Preços novos (nota lida ou site atualizado): refaz a conta do plano atual com eles.
  const primeiraVez = useRef(true);
  useEffect(() => {
    if (primeiraVez.current) { primeiraVez.current = false; return; }
    setPlano(p => (p ? finalizar(p.prefs, p.keys, p.mercados, p.custom, p.meta, fontes) : p));
  }, [fontes]);

  // Confere os preços dos sites ao abrir e ao voltar para o app (em segundo plano, sem segurar nada).
  const siteRef = useRef(site);
  const conferidoRef = useRef(guardado ? Date.parse(guardado.conferidoEm) : 0);
  useEffect(() => {
    let vivo = true;
    let baixando = false;
    const conferir = async () => {
      if (baixando) return;
      baixando = true;
      setInfoSite(i => ({ ...i, baixando: true }));
      const novo = await baixarPrecos();
      baixando = false;
      if (!vivo) return;
      if (novo) {
        const g = guardarPrecos(novo);
        conferidoRef.current = Date.parse(g.conferidoEm);
        if (!siteRef.current || novo.geradoEm !== siteRef.current.geradoEm) {
          siteRef.current = novo;
          setSite(novo);
        }
        setInfoSite({ conferidoEm: g.conferidoEm, baixando: false, falhou: false });
      } else {
        setInfoSite(i => ({ ...i, baixando: false, falhou: true }));
      }
    };
    conferir();
    const sub = AppState.addEventListener('change', estado => {
      if (estado === 'active' && Date.now() - conferidoRef.current > CONFERIR_A_CADA_MS) conferir();
    });
    return () => {
      vivo = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const p: PlanoSalvo | null = plano
      ? { keys: plano.keys, mercados: plano.mercados, custom: plano.custom, meta: plano.meta, prefs: plano.prefs }
      : null;
    gravar(CHAVE, { prefs, semente, plano: p, marcados, metodo } satisfies Salvo);
  }, [prefs, semente, plano, marcados, metodo]);

  useEffect(() => {
    gravar(CHAVE_PRECOS, { precos, notas } satisfies SalvoPrecos);
  }, [precos, notas]);

  // Refs com os valores mais recentes: uma tela pode mudar as escolhas e logo em seguida
  // abrir "Montando o plano", que gera com o que acabou de ser escolhido.
  const prefsRef = useRef(prefs);
  const sementeRef = useRef(semente);
  const fontesRef = useRef(fontes);
  useEffect(() => {
    fontesRef.current = fontes;
  }, [fontes]);

  const setPrefs = useCallback((f: (p: Preferencias) => Preferencias) => {
    const novo = f(prefsRef.current);
    prefsRef.current = novo;
    setPrefsState(novo);
  }, []);

  const gerar = useCallback<AppEstado['gerar']>(async (op = {}) => {
    const p = op.prefs ?? prefsRef.current;
    const s = op.semente ?? (op.novaSemente ? sementeRef.current + 1 : sementeRef.current);
    const r = await planejarSemTravar(p, s, fontesRef.current);
    setSemente(s);
    sementeRef.current = s;
    if (op.prefs) {
      prefsRef.current = op.prefs;
      setPrefsState(op.prefs);
    }
    if (r.ok) {
      setPlano(r);
      setProblema(null);
      setMarcados({});
      setMetodo({});
      tentadas.current = {};
    } else {
      setProblema(r);
    }
    return r;
  }, []);

  const trocarReceita = useCallback((i: number) => {
    if (!plano) return null;
    const atual = plano.vmap[plano.keys[i]].rid;
    const lista = tentadas.current[i] ?? [];
    if (!lista.includes(atual)) lista.push(atual);
    tentadas.current[i] = lista;
    let novo = trocar(plano, i, lista, fontes);
    if (!novo && lista.length > 1) {
      tentadas.current[i] = [atual];
      novo = trocar(plano, i, tentadas.current[i], fontes);
    }
    if (!novo) return null;
    setPlano(novo);
    return { plano: novo, delta: novo.custo.total - plano.custo.total };
  }, [plano, fontes]);

  const marcar = useCallback((id: string, v: boolean) => setMarcados(m => ({ ...m, [id]: v })), []);
  const escolherMetodo = useCallback((chave: string, aparelho: string) => setMetodo(m => ({ ...m, [chave]: aparelho })), []);

  const salvarNota = useCallback((mercadoId: string, novos: PrecoReal[], nota: Nota) => {
    setPrecos(atual => {
      const out = { ...atual };
      for (const p of novos) out[`${mercadoId}:${p.itemId}`] = { ...p, mercadoId };
      return out;
    });
    setNotas(ns => [
      {
        chave: nota.chave,
        mercadoId,
        data: nota.data || new Date().toLocaleDateString('pt-BR'),
        lidaEm: new Date().toISOString(),
        total: nota.total,
        itens: nota.itens.length,
        reconhecidos: novos.length,
      },
      ...ns.filter(n => !nota.chave || n.chave !== nota.chave),
    ].slice(0, 50));
  }, []);

  const apagarPrecos = useCallback(() => {
    setPrecos({});
    setNotas([]);
  }, []);

  const editar = useCallback(() => {
    if (plano) setPrefs(() => ({ ...copia(PADRAO), ...copia(plano.prefs) }));
  }, [plano, setPrefs]);

  const valor = useMemo<AppEstado>(() => ({
    prefs, setPrefs, plano, problema, marcados, marcar, metodo, escolherMetodo,
    precos, notas, site, infoSite, fontes, gerar, trocarReceita, salvarNota, apagarPrecos, editar, aviso, mostrarAviso,
  }), [prefs, setPrefs, plano, problema, marcados, marcar, metodo, escolherMetodo,
    precos, notas, site, infoSite, fontes, gerar, trocarReceita, salvarNota, apagarPrecos, editar, aviso, mostrarAviso]);

  return <Contexto value={valor}>{children}</Contexto>;
}

export function useApp(): AppEstado {
  const v = use(Contexto);
  if (!v) throw new Error('useApp precisa estar dentro de <AppProvider>');
  return v;
}
