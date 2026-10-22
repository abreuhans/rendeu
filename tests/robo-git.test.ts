import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { git, precosPublicados, publicarNoBranch } from '../robo/git';

describe('robô: publicação no branch precos', () => {
  it('cria o branch na primeira vez, depois só acrescenta commits e não mexe na cópia de trabalho', () => {
    const base = mkdtempSync(join(tmpdir(), 'rendeu-git-'));
    const remoto = join(base, 'remoto.git');
    const repo = join(base, 'repo');
    git(['init', '--quiet', '--bare', remoto]);
    git(['init', '--quiet', repo]);
    git(['config', 'user.email', 'teste@exemplo.com'], repo);
    git(['config', 'user.name', 'Teste'], repo);
    writeFileSync(join(repo, 'app.txt'), 'app');
    git(['add', '.'], repo);
    git(['commit', '--quiet', '-m', 'app'], repo);
    git(['remote', 'add', 'origin', remoto], repo);
    git(['push', '--quiet', 'origin', 'HEAD:refs/heads/main'], repo);

    let p = precosPublicados(repo);
    expect(p.existe).toBe(false);
    publicarNoBranch({ 'precos.json': '{"v":1}', 'README.md': 'leia' }, 'primeira', p.existe, repo);
    p = precosPublicados(repo);
    expect(p).toEqual({ existe: true, anterior: { v: 1 } });
    publicarNoBranch({ 'precos.json': '{"v":2}', 'README.md': 'leia' }, 'segunda', p.existe, repo);
    expect(precosPublicados(repo).anterior).toEqual({ v: 2 });

    expect(git(['ls-tree', '--name-only', 'precos'], remoto).split('\n').sort()).toEqual(['README.md', 'precos.json']);
    expect(git(['log', '--format=%s', 'precos'], remoto).split('\n')).toEqual(['segunda', 'primeira']);
    expect(git(['status', '--porcelain'], repo)).toBe('');
    expect(git(['branch', '--list', 'precos-publicar-*'], repo)).toBe('');
    expect(git(['worktree', 'list'], repo).split('\n')).toHaveLength(1);
  });
});
