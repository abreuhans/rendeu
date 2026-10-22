// Os 6 passos do cadastro: orçamento, mercados, dieta, cozinha, gostos e o plano.
import { useState } from 'react';
import { Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import {
  APARELHOS, COZINHAS, DESPENSA, GRUPOS, ITEM, MERCADOS, ORDEM_REFEICOES,
  dinheiro, type Mercado, type Preferencias,
} from '@/core';
import { Icone } from '@/components/icones';
import { Ajuda, Campo, Chip, Chips, Nota, Opcao, Pergunta, Rotulo } from '@/components/ui';
import { useApp } from '@/estado/app';
import {
  DIETAS, ESTILOS, NOME_REF, RESTR, TIPO_MERCADO,
  alternar, lerValor, mascaraCep, regiaoCep,
} from '@/lib/textos';
import { FONTES, RAIO, useCores } from '@/theme';

export function validarPasso(n: number, p: Preferencias, orcamentoOk: boolean): { ok: boolean; msg?: string } {
  if (n === 1 && (!(p.orcamento >= 20) || !orcamentoOk)) return { ok: false, msg: 'Digite um valor a partir de R$ 20.' };
  if (n === 2 && !p.mercados.length) return { ok: false, msg: 'Escolha pelo menos um mercado.' };
  if (n === 6 && !p.refeicoes.length) return { ok: false, msg: 'Escolha pelo menos uma refeição.' };
  return { ok: true };
}

const textoValor = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ','));

export function PassoOrcamento({ onValido, onPronto }: { onValido: (ok: boolean) => void; onPronto: () => void }) {
  const { prefs, setPrefs } = useApp();
  const c = useCores();
  const [texto, setTexto] = useState(() => textoValor(prefs.orcamento));
  const [focado, setFocado] = useState(false);
  const total = prefs.dias * prefs.refeicoes.length * prefs.pessoas;

  const mudar = (t: string) => {
    const limpo = t.replace(/[^\d,.]/g, '');
    setTexto(limpo);
    const v = lerValor(limpo);
    const ok = v >= 20 && v <= 5000;
    onValido(ok);
    if (ok) setPrefs(p => ({ ...p, orcamento: Math.round(v * 100) / 100 }));
  };
  const escolher = (v: number) => {
    setTexto(String(v));
    onValido(true);
    setPrefs(p => ({ ...p, orcamento: v }));
  };
  const pessoas = (d: number) => setPrefs(p => ({ ...p, pessoas: Math.max(1, Math.min(6, p.pessoas + d)) }));

  return (
    <>
      <Pergunta>Quanto você tem para gastar?</Pergunta>
      <Ajuda>O total da compra nunca passa desse valor.</Ajuda>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, maxWidth: 300, marginTop: 18, borderBottomWidth: 3, borderColor: focado ? c.folha : c.tinta }}>
        <Text style={{ fontFamily: FONTES.tituloForte, fontSize: 32, color: c.tinta2 }}>R$</Text>
        <TextInput
          value={texto}
          onChangeText={mudar}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          onSubmitEditing={onPronto}
          keyboardType="decimal-pad"
          inputMode="decimal"
          returnKeyType="done"
          maxLength={8}
          accessibilityLabel="Orçamento em reais"
          selectionColor={c.folha}
          style={{ flex: 1, minWidth: 0, fontFamily: FONTES.titulo, fontSize: 58, letterSpacing: -1.5, color: c.tinta, paddingVertical: 6, fontVariant: ['tabular-nums'], outlineWidth: 0 }}
        />
      </View>
      <Chips>
        {[100, 150, 200, 300, 500].map(v => (
          <Chip key={v} rotulo={`R$ ${v}`} ativo={prefs.orcamento === v} onPress={() => escolher(v)} />
        ))}
      </Chips>

      <Rotulo>Quantas pessoas vão comer?</Rotulo>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 }} accessibilityRole="adjustable" accessibilityLabel={`Pessoas: ${prefs.pessoas}`}>
        <BotaoRedondo rotulo="Menos uma pessoa" texto="−" desativado={prefs.pessoas <= 1} onPress={() => pessoas(-1)} />
        <Text style={{ fontFamily: FONTES.titulo, fontSize: 30, minWidth: 36, textAlign: 'center', color: c.tinta, fontVariant: ['tabular-nums'] }}>{prefs.pessoas}</Text>
        <BotaoRedondo rotulo="Mais uma pessoa" texto="+" desativado={prefs.pessoas >= 6} onPress={() => pessoas(1)} />
      </View>
      <Text style={{ fontFamily: FONTES.texto, fontSize: 14, color: c.tinta2, marginTop: 18, fontVariant: ['tabular-nums'] }}>
        ≈ {dinheiro(prefs.orcamento / Math.max(1, total))} por refeição por pessoa ({prefs.dias} dias × {prefs.refeicoes.length} refeições)
      </Text>
    </>
  );
}

function BotaoRedondo({ texto, rotulo, onPress, desativado }: { texto: string; rotulo: string; onPress: () => void; desativado?: boolean }) {
  const c = useCores();
  return (
    <Pressable
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      aria-disabled={!!desativado}
      style={({ pressed }) => ({
        width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: c.linha, backgroundColor: c.superficie,
        alignItems: 'center', justifyContent: 'center', opacity: desativado ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontFamily: FONTES.textoForte, fontSize: 22, color: c.tinta, marginTop: -2 }}>{texto}</Text>
    </Pressable>
  );
}

export function PassoMercados() {
  const { prefs, setPrefs } = useApp();
  const c = useCores();
  const { width } = useWindowDimensions();
  const reg = regiaoCep(prefs.cep);
  return (
    <>
      <Pergunta>Onde você quer comprar?</Pergunta>
      <Text style={{ fontFamily: FONTES.textoForte, fontSize: 14, color: c.tinta, marginTop: 16 }}>Seu CEP</Text>
      <Campo
        value={prefs.cep}
        onChangeText={t => setPrefs(p => ({ ...p, cep: mascaraCep(t) }))}
        placeholder="00000-000"
        keyboardType="number-pad"
        inputMode="numeric"
        autoComplete="postal-code"
        textContentType="postalCode"
        maxLength={9}
        accessibilityLabel="Seu CEP"
        style={{ marginTop: 6, maxWidth: 220 }}
      />
      <Nota aviso={!!reg && !reg.ok}>
        {reg ? reg.texto : 'O CEP serve para mostrar os mercados perto de você. Por enquanto a lista abaixo é fixa.'}
      </Nota>
      <View style={{ gap: 8, marginTop: 16 }}>
        {MERCADOS.map(m => (
          <CartaoMercado
            key={m.id}
            mercado={m}
            ativo={prefs.mercados.includes(m.id)}
            onPress={() => setPrefs(p => ({ ...p, mercados: alternar(p.mercados, m.id) }))}
          />
        ))}
      </View>
      <Rotulo>Como comprar</Rotulo>
      <View style={{ flexDirection: width >= 420 ? 'row' : 'column', gap: 10, marginTop: 12 }}>
        <View style={{ flex: width >= 420 ? 1 : undefined }}>
          <Opcao titulo="Um mercado só" descricao="O app escolhe o mais barato entre os marcados" ativo={prefs.modo === 'um'} onPress={() => setPrefs(p => ({ ...p, modo: 'um' }))} />
        </View>
        <View style={{ flex: width >= 420 ? 1 : undefined }}>
          <Opcao titulo="Dividir entre mercados" descricao="Cada item onde for mais barato (mais paradas)" ativo={prefs.modo === 'dividir'} onPress={() => setPrefs(p => ({ ...p, modo: 'dividir' }))} />
        </View>
      </View>
    </>
  );
}

function CartaoMercado({ mercado: m, ativo, onPress }: { mercado: Mercado; ativo: boolean; onPress: () => void }) {
  const c = useCores();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      aria-checked={ativo}
      accessibilityLabel={`${m.nome}, ${TIPO_MERCADO[m.tipo]}, nível de preço ${m.nivel} de 3`}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 16, paddingRight: 14,
        borderWidth: 1.5, borderColor: ativo ? c.folha : c.linha, borderRadius: RAIO.m, borderCurve: 'continuous',
        backgroundColor: c.superficie, opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONTES.tituloForte, fontSize: 17, color: c.tinta }}>{m.nome}</Text>
        <Text style={{ fontFamily: FONTES.texto, fontSize: 13, color: c.tinta2 }}>
          {TIPO_MERCADO[m.tipo]}{m.grupo ? ' · ' + m.grupo : ''}
        </Text>
      </View>
      <Text style={{ fontFamily: FONTES.monoMedio, fontSize: 11, letterSpacing: 1.5, color: c.linha }}>
        <Text style={{ color: c.tinta }}>{'●'.repeat(m.nivel)}</Text>
        {'●'.repeat(3 - m.nivel)}
      </Text>
      <View
        style={{
          width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
          borderColor: ativo ? c.folha : c.linha, backgroundColor: ativo ? c.folha : 'transparent',
        }}
      >
        {ativo ? <Icone nome="ok" cor={c.folhaTinta} tamanho={15} /> : null}
      </View>
    </Pressable>
  );
}

export function PassoDieta() {
  const { prefs, setPrefs } = useApp();
  return (
    <>
      <Pergunta>Como você quer comer?</Pergunta>
      <View style={{ gap: 10, marginTop: 14 }}>
        {DIETAS.map(([id, t, d]) => (
          <Opcao key={id} titulo={t} descricao={d} ativo={prefs.dieta === id} onPress={() => setPrefs(p => ({ ...p, dieta: id }))} />
        ))}
      </View>
      <Rotulo>Restrições</Rotulo>
      <Chips>
        {RESTR.map(([id, t]) => (
          <Chip key={id} rotulo={t} ativo={prefs.restricoes.includes(id)} onPress={() => setPrefs(p => ({ ...p, restricoes: alternar(p.restricoes, id) }))} />
        ))}
      </Chips>
      <Nota>As restrições são aplicadas de forma conservadora. Em caso de alergia, confira sempre o rótulo.</Nota>
    </>
  );
}

export function PassoCozinha() {
  const { prefs, setPrefs } = useApp();
  const c = useCores();
  return (
    <>
      <Pergunta>O que tem na sua cozinha?</Pergunta>
      <Ajuda>O passo a passo das receitas usa só os aparelhos que você marcar.</Ajuda>
      <Chips>
        {APARELHOS.map(a => (
          <Chip key={a.id} rotulo={a.nome} ativo={prefs.aparelhos.includes(a.id)} onPress={() => setPrefs(p => ({ ...p, aparelhos: alternar(p.aparelhos, a.id) }))} />
        ))}
      </Chips>
      {prefs.aparelhos.length ? null : <Nota aviso>Sem nenhum aparelho, só entram receitas que não vão ao fogo.</Nota>}
      <Rotulo>Já tenho em casa</Rotulo>
      <Ajuda>Esses itens não entram na compra. Sal e água já contam como “de casa”.</Ajuda>
      {DESPENSA.map(g => (
        <View key={g.titulo}>
          <Text style={{ fontFamily: FONTES.textoForte, fontSize: 13, color: c.tinta, marginTop: 16 }}>{g.titulo}</Text>
          <Chips junto>
            {g.itens.map(id => (
              <Chip
                key={id}
                rotulo={ITEM[id].nome.replace(/ \(.*\)$/, '')}
                ativo={prefs.despensa.includes(id)}
                onPress={() => setPrefs(p => ({ ...p, despensa: alternar(p.despensa, id) }))}
              />
            ))}
          </Chips>
        </View>
      ))}
    </>
  );
}

export function PassoGostos() {
  const { prefs, setPrefs } = useApp();
  const naoCome = (id: string) => setPrefs(p => ({ ...p, naoCome: alternar(p.naoCome, id), adora: p.adora.filter(x => x !== id) }));
  const adora = (id: string) => setPrefs(p => ({ ...p, adora: alternar(p.adora, id), naoCome: p.naoCome.filter(x => x !== id) }));
  return (
    <>
      <Pergunta>Do que você gosta?</Pergunta>
      <Rotulo>Não como</Rotulo>
      <Chips>
        {GRUPOS.map(g => <Chip key={g.id} tipo="nao" rotulo={g.nome} ativo={prefs.naoCome.includes(g.id)} onPress={() => naoCome(g.id)} />)}
      </Chips>
      <Rotulo>Adoro</Rotulo>
      <Chips>
        {GRUPOS.map(g => <Chip key={g.id} tipo="sim" rotulo={g.nome} ativo={prefs.adora.includes(g.id)} onPress={() => adora(g.id)} />)}
      </Chips>
      <Rotulo>Estilos favoritos</Rotulo>
      <Chips>
        {COZINHAS.map(k => (
          <Chip key={k.id} tipo="sim" rotulo={k.nome} ativo={prefs.cozinhas.includes(k.id)} onPress={() => setPrefs(p => ({ ...p, cozinhas: alternar(p.cozinhas, k.id) }))} />
        ))}
      </Chips>
    </>
  );
}

export function PassoPlano() {
  const { prefs, setPrefs } = useApp();
  const c = useCores();
  return (
    <>
      <Pergunta>Quantos dias e refeições?</Pergunta>
      <Rotulo>Dias</Rotulo>
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 12, maxWidth: 420 }}>
        {[1, 2, 3, 4, 5, 6, 7].map(d => {
          const ativo = prefs.dias === d;
          return (
            <Pressable
              key={d}
              onPress={() => setPrefs(p => ({ ...p, dias: d }))}
              accessibilityRole="radio"
              aria-checked={ativo}
              accessibilityLabel={`${d} ${d === 1 ? 'dia' : 'dias'}`}
              style={({ pressed }) => ({
                flex: 1, height: 48, borderRadius: 12, borderCurve: 'continuous', borderWidth: 1.5,
                borderColor: ativo ? c.folha : c.linha, backgroundColor: ativo ? c.folha : c.superficie,
                alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ fontFamily: FONTES.tituloForte, fontSize: 18, color: ativo ? c.folhaTinta : c.tinta }}>{d}</Text>
            </Pressable>
          );
        })}
      </View>
      <Rotulo>Refeições por dia</Rotulo>
      <Chips>
        {ORDEM_REFEICOES.map(r => (
          <Chip key={r} rotulo={NOME_REF[r]} ativo={prefs.refeicoes.includes(r)} onPress={() => setPrefs(p => ({ ...p, refeicoes: ORDEM_REFEICOES.filter(x => (x === r ? !p.refeicoes.includes(r) : p.refeicoes.includes(x))) }))} />
        ))}
      </Chips>
      <Rotulo>Estilo do cardápio</Rotulo>
      <View style={{ gap: 10, marginTop: 12 }}>
        {ESTILOS.map(([id, t, d]) => (
          <Opcao key={id} titulo={t} descricao={d} ativo={prefs.estilo === id} onPress={() => setPrefs(p => ({ ...p, estilo: id }))} />
        ))}
      </View>
    </>
  );
}

