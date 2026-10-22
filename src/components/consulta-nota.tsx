// Abre a página da nota no site da Sefaz dentro do app. A pessoa passa pela
// verificação do site (Cloudflare) e o app lê a tabela de produtos da página.
import { useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { FONTES, useCores } from '@/theme';

export interface ConsultaNotaProps {
  url: string;
  /** Recebe o HTML da página; devolve true se achou produtos. */
  onHtml: (html: string) => boolean;
}

// Roda dentro da página: espera a tabela de itens aparecer e manda o HTML para o app.
const LEITOR = `(function () {
  if (window.__rendeuLendo) return;
  window.__rendeuLendo = true;
  var tentativas = 0;
  function enviar() {
    tentativas++;
    var html = document.documentElement ? document.documentElement.outerHTML : '';
    var pronto = /tabResult|Valor a pagar|Vl\\. ?Unit/i.test(html);
    window.ReactNativeWebView.postMessage(JSON.stringify({ pronto: pronto, html: pronto ? html : '' }));
    if (!pronto && tentativas < 120) setTimeout(enviar, 1000);
  }
  enviar();
})();
true;`;

/** Só deixa navegar em sites do governo (a verificação do Cloudflare roda em iframes). */
function podeAbrir(url: string, principal: boolean): boolean {
  if (!principal) return true;
  const m = url.match(/^https?:\/\/([^/?#:]+)/i);
  return !!m && /(^|\.)gov\.br$/i.test(m[1]);
}

export function ConsultaNota({ url, onHtml }: ConsultaNotaProps) {
  const c = useCores();
  // WebView<object>: com o padrão (undefined) as props viram `never` no TypeScript estrito.
  const ref = useRef<WebView<object>>(null);
  const [estado, setEstado] = useState<'abrindo' | 'esperando' | 'erro'>('abrindo');
  const achou = useRef(false);

  const aoMensagem = (e: WebViewMessageEvent) => {
    if (achou.current) return;
    try {
      const d = JSON.parse(e.nativeEvent.data) as { pronto: boolean; html: string };
      if (d.pronto && onHtml(d.html)) achou.current = true;
      else setEstado('esperando');
    } catch {
      setEstado('esperando');
    }
  };

  const textos = {
    abrindo: 'Abrindo a nota no site da Sefaz…',
    esperando: 'Se o site pedir, confirme que você é humano. O app lê os produtos assim que a nota aparecer.',
    erro: 'Não deu para abrir o site da Sefaz. Confira a internet e tente de novo.',
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.fundo }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: c.folhaSuave }}>
        {estado !== 'erro' ? <ActivityIndicator color={c.folha} /> : null}
        <Text accessibilityLiveRegion="polite" style={{ flex: 1, fontFamily: FONTES.textoMedio, fontSize: 14, lineHeight: 20, color: estado === 'erro' ? c.tomate : c.tinta }}>
          {textos[estado]}
        </Text>
      </View>
      <WebView<object>
        ref={ref}
        source={{ uri: url }}
        style={{ flex: 1 }}
        originWhitelist={['https://*', 'http://*']}
        injectedJavaScript={LEITOR}
        onLoadEnd={() => ref.current?.injectJavaScript(LEITOR)}
        onMessage={aoMensagem}
        onError={() => setEstado('erro')}
        onShouldStartLoadWithRequest={r => podeAbrir(r.url, r.isTopFrame !== false)}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        setSupportMultipleWindows={false}
      />
    </View>
  );
}
