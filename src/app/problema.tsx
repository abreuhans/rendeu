import { Redirect, router } from 'expo-router';
import { View } from 'react-native';
import { dinheiro } from '@/core';
import { Tela } from '@/components/tela';
import { Ajuda, Botao, Pergunta } from '@/components/ui';
import { useApp } from '@/estado/app';
import { NOME_REF, plural } from '@/lib/textos';

export default function Problema() {
  const { problema, prefs, setPrefs } = useApp();
  if (!problema) return <Redirect href="/" />;

  const editar = () => router.dismissTo('/passo/1');

  if (problema.motivo === 'receitas') {
    const ref = NOME_REF[problema.refeicao].toLowerCase();
    return (
      <Tela>
        <View style={{ marginTop: 20 }}>
          <Pergunta>{`Faltam receitas para o ${ref}`}</Pergunta>
        </View>
        <Ajuda>Nenhuma receita de {ref} combina com todas as escolhas. Libere algum alimento, restrição ou aparelho.</Ajuda>
        <View style={{ gap: 10, marginTop: 22 }}>
          <Botao onPress={editar}>Editar escolhas</Botao>
        </View>
      </Tela>
    );
  }

  const valor = Math.ceil(problema.minimo + 1);
  const dias = Math.max(1, Math.floor((prefs.dias * prefs.orcamento) / problema.minimo));
  return (
    <Tela>
      <View style={{ marginTop: 20 }}>
        <Pergunta>{`Não deu para caber em ${dinheiro(prefs.orcamento)}`}</Pergunta>
      </View>
      <Ajuda>O plano mais barato possível com essas escolhas custa cerca de {dinheiro(problema.minimo)}.</Ajuda>
      <View style={{ gap: 10, marginTop: 22 }}>
        <Botao
          onPress={() => {
            setPrefs(p => ({ ...p, orcamento: valor }));
            router.replace('/gerando');
          }}
        >
          {`Usar R$ ${valor}`}
        </Botao>
        {dias < prefs.dias ? (
          <Botao
            variante="contorno"
            onPress={() => {
              setPrefs(p => ({ ...p, dias }));
              router.replace('/gerando');
            }}
          >
            {`Reduzir para ${dias} ${plural(dias, 'dia', 'dias')}`}
          </Botao>
        ) : null}
        <Botao variante="contorno" onPress={editar}>Editar escolhas</Botao>
      </View>
    </Tela>
  );
}
