// Publicação no branch "precos" pelo git (funciona no Windows, macOS e Linux), sem mexer na sua cópia de trabalho.
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const git = (args: string[], cwd?: string) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/** precos.json publicado hoje no remoto (ou null se o branch ainda não existe). */
export function precosPublicados(repo = process.cwd()): { existe: boolean; anterior: unknown } {
  try {
    git(['fetch', '--quiet', 'origin', 'precos'], repo);
  } catch {
    return { existe: false, anterior: null };
  }
  try {
    return { existe: true, anterior: JSON.parse(git(['show', 'FETCH_HEAD:precos.json'], repo)) };
  } catch {
    return { existe: true, anterior: null };
  }
}

/** Grava os arquivos num commit novo do branch "precos" e envia para o GitHub. */
export function publicarNoBranch(arquivos: Record<string, string>, mensagem: string, existe: boolean, repo = process.cwd()) {
  const marca = `${Date.now()}-${process.pid}`;
  const pasta = join(tmpdir(), `rendeu-precos-${marca}`);
  const temporario = `precos-publicar-${marca}`;
  try {
    if (existe) git(['worktree', 'add', '--detach', pasta, 'FETCH_HEAD'], repo);
    else {
      git(['worktree', 'add', '--detach', pasta], repo);
      git(['checkout', '--quiet', '--orphan', temporario], pasta);
      git(['rm', '-rfq', '--ignore-unmatch', '.'], pasta);
    }
    for (const [nome, conteudo] of Object.entries(arquivos)) writeFileSync(join(pasta, nome), conteudo);
    git(['add', ...Object.keys(arquivos)], pasta);
    git(['commit', '--quiet', '-m', mensagem], pasta);
    git(['push', '--quiet', 'origin', 'HEAD:refs/heads/precos'], pasta);
  } finally {
    try { git(['worktree', 'remove', '--force', pasta], repo); } catch { if (existsSync(pasta)) rmSync(pasta, { recursive: true, force: true }); }
    if (!existe) try { git(['branch', '-D', temporario], repo); } catch { /* não chegou a existir */ }
  }
}
