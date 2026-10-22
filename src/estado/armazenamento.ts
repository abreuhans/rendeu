// Guarda as escolhas, o plano e os preços das notas no próprio aparelho.
import './instalar-armazenamento';

export function ler<T>(chave: string): T | null {
  try {
    const v = globalThis.localStorage?.getItem(chave);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function gravar(chave: string, valor: unknown): void {
  try {
    globalThis.localStorage?.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem armazenamento: o app continua funcionando, só não lembra depois.
  }
}
