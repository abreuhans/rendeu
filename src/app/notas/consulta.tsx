import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import {
  ITEM, MERCADOS, dinheiro, lerHtmlNfce, mercadoDaNota, precosDaNota, textoLimpo,
  type ItemNota, type Nota as NotaLida, type PrecoReal,
} from '@/core';
import { ConsultaNota } from '@/components/consulta-nota';
import { Tela } from '@/components/tela';
import { Ajuda, Botao, Cartao, Chip, Chips, Nota, Pergunta, Rotulo } from '@/components/ui';
import { useApp } from '@/estado/app';
import { ehLinkDeNota, precoLido } from '@/lib/notas';
import { nomeMercado, plural } from '@/lib/textos';
import { FONTES, useCores } from '@/theme';

interface Lida {
  nota: NotaLida;
  mercadoId: string | null;
  precos: PrecoReal[];
  naoReconhecidos: ItemNota[];
}

export default function Consulta() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [lida, setLida] = useState<Lida | null>(null);

  const aoHtml = useCallback((html: string) => {
    const nota = lerHtmlNfce(html);
    if (!nota.itens.length) return false;
    const r = precosDaNota(nota);
    // Texto colado (sem o HTML) não traz o nome da loja separado: procura no começo do texto.
    const mercadoId = r.mercadoId ?? mercadoDaNota(textoLimpo(html).slice(0, 400));
    setLida({ nota, ...r, mercadoId });
    return true;
  }, []);

  if (!url || !ehLinkDeNota(url)) return <Redirect href="/notas" />;
  if (!lida) return <ConsultaNota url={url} onHtml={aoHtml} />;
  return <Resultado lida={lida} />;
}

function Resultado({ lida }: { lida: Lida }) {
  const { salvarNota, mostrarAviso } = useApp();
  const c = useCores();
  const [mercado, setMercado] = useState<string | null>(lida.mercadoId);
  const { nota, precos, naoReconhecidos } = lida;

  const salvar = () => {
    if (!mercado || !precos.length) return;
    salvarNota(mercado, precos, nota);
    mostrarAviso(`${precos.length} ${plural(precos.length, 'preço salvo', 'preços salvos')} para ${nomeMercado(mercado)}.`);
    router.back();
  };

  return (
    <Tela
      rodape={
        <View style={{ gap: 8 }}>
          <Botao desativado={!mercado || !precos.length} onPress={salvar}>
            {precos.length ? `Salvar ${precos.length} ${plural(precos.length, 'preço', 'preços')}` : 'Nenhum preço para salvar'}
          </Botao>
          <Botao variante="contorno" onPress={() => router.back()}>Descartar</Botao>
        </View>
      }
    >
      <View style={{ marginTop: 12 }}>
        <Pergunta>Nota lida</Pergunta>
      </View>
      <Ajuda>
        {[nota.emitente.nome, nota.data?.split(' ')[0], nota.total ? dinheiro(nota.total) : ''].filter(Boolean).join(' · ')}
      </Ajuda>
      <Text style={{ fontFamily: FONTES.textoNegrito, fontSize: 16, color: c.folha, marginTop: 10 }}>
        {precos.length} de {nota.itens.length} produtos reconhecidos
      </Text>

      <Rotulo>Mercado</Rotulo>
      {lida.mercadoId ? (
        <Ajuda>{nomeMercado(lida.mercadoId)}</Ajuda>
      ) : (
        <>
          <Ajuda aviso>Não reconheci o mercado desta nota. Qual é?</Ajuda>
          <Chips>
            {MERCADOS.map(m => <Chip key={m.id} rotulo={m.nome} ativo={mercado === m.id} onPress={() => setMercado(m.id)} />)}
          </Chips>
        </>
      )}

      {precos.length ? (
        <Cartao style={{ marginTop: 18, padding: 16 }}>
          {precos.map((p, i) => (
            <View key={p.itemId + i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: i < precos.length - 1 ? 1 : 0, borderStyle: 'dashed', borderColor: c.linha }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTES.textoForte, fontSize: 15, color: c.tinta }}>{ITEM[p.itemId].nome}</Text>
                <Text numberOfLines={1} style={{ fontFamily: FONTES.mono, fontSize: 11.5, color: c.tinta2 }}>{p.descricao}</Text>
              </View>
              <Text style={{ fontFamily: FONTES.monoMedio, fontSize: 13, color: c.tinta, fontVariant: ['tabular-nums'] }}>{precoLido(p)}</Text>
            </View>
          ))}
        </Cartao>
      ) : null}

      {naoReconhecidos.length ? (
        <>
          <Rotulo>{`Fora do catálogo (${naoReconhecidos.length})`}</Rotulo>
          <Text style={{ fontFamily: FONTES.mono, fontSize: 12.5, lineHeight: 19, color: c.tinta2, marginTop: 8 }}>
            {naoReconhecidos.map(x => x.descricao).join(' · ')}
          </Text>
        </>
      ) : null}
      <Nota>O app guarda só produto, preço, mercado e data. Os preços valem para os próximos planos com esse mercado.</Nota>
    </Tela>
  );
}
