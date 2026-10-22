// No navegador o app não consegue abrir a página da Sefaz por dentro (o site bloqueia),
// então a pessoa abre a nota em outra aba, copia o texto da página e cola aqui.
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Tela } from '@/components/tela';
import { Ajuda, Botao, Campo, Nota, Pergunta } from '@/components/ui';
import { FONTES, useCores } from '@/theme';
import type { ConsultaNotaProps } from './consulta-nota';

export function ConsultaNota({ url, onHtml }: ConsultaNotaProps) {
  const c = useCores();
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  const passos = [
    'Abra a nota no site da Sefaz (botão abaixo) e confirme que você é humano, se pedir.',
    'Na página da nota, selecione tudo (Ctrl+A) e copie (Ctrl+C).',
    'Volte aqui, cole no campo e toque em “Ler produtos”.',
  ];

  return (
    <Tela>
      <View style={{ marginTop: 12 }}>
        <Pergunta>Ler a nota no computador</Pergunta>
      </View>
      <Ajuda>No celular o app lê a nota sozinho. No navegador, faça assim:</Ajuda>
      <View style={{ gap: 10, marginTop: 14 }}>
        {passos.map((p, i) => (
          <View key={p} style={{ flexDirection: 'row', gap: 12 }}>
            <Text style={{ fontFamily: FONTES.tituloForte, fontSize: 15, color: c.folha, width: 18 }}>{i + 1}.</Text>
            <Text style={{ flex: 1, fontFamily: FONTES.texto, fontSize: 15, lineHeight: 21, color: c.tinta }}>{p}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 16, alignItems: 'flex-start' }}>
        <Botao variante="contorno" icone="link" onPress={() => Linking.openURL(url)}>Abrir a nota</Botao>
      </View>
      <Campo
        value={texto}
        onChangeText={t => { setTexto(t); setErro(''); }}
        multiline
        placeholder="Cole aqui o texto da página da nota"
        accessibilityLabel="Texto da página da nota"
        style={{ marginTop: 16, minHeight: 160, textAlignVertical: 'top', fontFamily: FONTES.mono, fontSize: 13, lineHeight: 19, padding: 12 }}
      />
      {erro ? <Nota aviso>{erro}</Nota> : null}
      <View style={{ marginTop: 14 }}>
        <Botao
          desativado={!texto.trim()}
          onPress={() => {
            if (!onHtml(texto)) setErro('Não encontrei produtos nesse texto. Copie a página inteira da nota, com a lista de itens.');
          }}
        >
          Ler produtos
        </Botao>
      </View>
    </Tela>
  );
}
