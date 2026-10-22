@echo off
rem Coleta os precos dos sites dos mercados e publica para o app (branch "precos" do GitHub).
rem Uso: dois cliques neste arquivo. No Agendador de Tarefas: coletar-precos.bat agendado
cd /d "%~dp0"

where node >/dev/null 2>/dev/null || (echo Falta o Node.js: instale a versao LTS em https://nodejs.org & goto :erro)
where git >/dev/null 2>/dev/null || (echo Falta o Git: instale em https://git-scm.com/download/win & goto :erro)

echo Atualizando o projeto...
git pull --ff-only --quiet || echo Nao deu para atualizar o projeto. Seguindo com a versao que ja esta aqui.

if not exist "node_modules\.bin\esbuild.cmd" (
  echo Instalando as dependencias pela primeira vez. Leva alguns minutos...
  call npm install --no-audit --no-fund || goto :erro
)

call npm run robo:publicar || goto :erro
echo.
echo Pronto: precos publicados. O app usa na proxima vez que abrir.
goto :fim

:erro
echo.
echo Nao deu certo. Veja as mensagens acima.
if "%~1"=="" pause
exit /b 1

:fim
if "%~1"=="" pause
exit /b 0
