#!/usr/bin/env bash
# Publica a versão mais nova do GitHub no VPS. Rodar como o usuário equiparloc:
#   sudo -u equiparloc /opt/equiparloc/app/deploy/atualizar.sh
# Os dados (produtos, fotos, orçamentos) ficam em /var/lib/equiparloc e não são tocados.
set -euo pipefail

APP=/opt/equiparloc/app
cd "$APP"

echo "1/4 Baixando a versão nova do GitHub..."
git fetch --quiet origin main
git reset --quiet --hard origin/main

echo "2/4 Instalando dependências..."
npm ci --no-audit --no-fund

echo "3/4 Gerando o site..."
# O build lê as variáveis (APP_URL etc.) do mesmo arquivo que o serviço usa
set -a; source /etc/equiparloc.env; set +a
npm run build

# O modo standalone precisa das imagens e dos arquivos estáticos ao lado do server.js
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/

echo "4/4 Reiniciando o site..."
sudo systemctl restart equiparloc
sleep 3
if curl -fsS -o /dev/null http://127.0.0.1:3000/; then
  echo "Pronto: site no ar com a versão $(git log -1 --format='%h %s')."
else
  echo "ATENÇÃO: o site não respondeu. Veja o erro com: sudo journalctl -u equiparloc -n 50"
  exit 1
fi
