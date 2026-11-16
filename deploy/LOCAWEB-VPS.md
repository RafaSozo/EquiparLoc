# Mudança do site para o VPS da Locaweb

Guia para colocar o site EquiparLoc num VPS (ou Cloud Server) da Locaweb, com o domínio
`equiparloc.com.br` também na Locaweb. Leva umas 2 horas na primeira vez.

**Como fica no servidor**

| O quê | Onde |
|---|---|
| Código do site (vem do GitHub) | `/opt/equiparloc/app` |
| Dados: banco, fotos, cópias diárias internas | `/var/lib/equiparloc` |
| Senhas e chaves | `/etc/equiparloc.env` |
| Cópias de segurança diárias | `/var/backups/equiparloc` |

O site roda como serviço (`equiparloc`), e o nginx recebe os visitantes e cuida do HTTPS.

> Nada de senha neste arquivo nem no GitHub. As senhas vão só em `/etc/equiparloc.env`, no servidor.

---

## 0. Antes de começar

- [ ] VPS contratado na Locaweb com **Ubuntu 22.04 ou 24.04**, pelo menos **2 GB de memória**.
- [ ] O **IP do VPS** e o acesso **root** (aparecem no painel da Locaweb).
- [ ] Acesso ao GitHub do projeto (RafaSozo/EquiparLoc).
- [ ] **Não mexer nos registros de e-mail (MX)** do domínio. Só vamos trocar o endereço do site.

## 1. Preparar o servidor

No seu computador, entre no VPS (troque `IP_DO_VPS`):

```bash
ssh root@IP_DO_VPS
```

Atualize e instale o necessário (Node.js 20, git, nginx, certbot):

```bash
apt update && apt upgrade -y
apt install -y git nginx certbot python3-certbot-nginx curl ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v
```

Memória extra em disco (swap), necessária em VPS de 1 GB para gerar o site:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

Firewall: deixe passar só SSH e o site:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 2. Usuário e pastas do site

```bash
adduser --system --group --home /opt/equiparloc --shell /bin/bash equiparloc
mkdir -p /var/lib/equiparloc /var/backups/equiparloc
chown equiparloc:equiparloc /var/lib/equiparloc
chmod 700 /var/lib/equiparloc
```

## 3. Baixar o código do GitHub

O repositório é privado. Crie uma chave só de leitura para o servidor:

```bash
install -d -m 700 -o equiparloc -g equiparloc /opt/equiparloc/.ssh
sudo -u equiparloc ssh-keygen -t ed25519 -N "" -f /opt/equiparloc/.ssh/id_ed25519
sudo -u equiparloc sh -c 'ssh-keyscan github.com >> /opt/equiparloc/.ssh/known_hosts'
cat /opt/equiparloc/.ssh/id_ed25519.pub
```

Copie a linha que aparecer e cadastre no GitHub: repositório **EquiparLoc → Settings → Deploy keys →
Add deploy key** (nome: "VPS Locaweb", **sem** marcar "Allow write access").

Depois:

```bash
sudo -u equiparloc git clone git@github.com:RafaSozo/EquiparLoc.git /opt/equiparloc/app
chmod +x /opt/equiparloc/app/deploy/*.sh
```

## 4. Senhas e configurações

Crie o arquivo de configuração (use `nano /etc/equiparloc.env`) com este conteúdo, trocando os valores:

```
APP_URL=https://equiparloc.com.br
NEXTAUTH_URL=https://equiparloc.com.br
NEXTAUTH_SECRET=COLE_AQUI_UMA_CHAVE_NOVA
ADMIN_EMAIL=email-do-administrador
ADMIN_PASSWORD=senha-forte-do-painel
ADMIN_NAME=Administrador
DATA_DIR=/var/lib/equiparloc
TRUSTED_IP_HEADER=x-real-ip
GEMINI_API_KEY=chave-do-gemini-se-usar
```

Gere a chave do `NEXTAUTH_SECRET` com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Proteja o arquivo (só o root e o site leem):

```bash
chown root:equiparloc /etc/equiparloc.env
chmod 640 /etc/equiparloc.env
```

## 5. Trazer os dados do site atual

1. No **painel do site atual** (Hostinger), entre em **Dados da empresa** e clique em
   **Baixar cópia de segurança**. Vem um arquivo `equiparloc-copia-....json`.
2. Envie o arquivo para o VPS (no seu computador, na pasta onde ele foi salvo):

   ```bash
   scp equiparloc-copia-*.json root@IP_DO_VPS:/root/
   ```

3. No VPS, restaure na pasta de dados:

   ```bash
   cd /opt/equiparloc/app
   sudo -u equiparloc node scripts/restaurar-copia.mjs /root/equiparloc-copia-*.json /var/lib/equiparloc
   ```

   Aparece algo como "Pronto: 52 produtos, 12 categorias, ... e 44 fotos restaurados".

4. Apague o arquivo da cópia do VPS (ele tem dados de clientes):

   ```bash
   shred -u /root/equiparloc-copia-*.json
   ```

## 6. Ligar o site

Instale o serviço:

```bash
cp /opt/equiparloc/app/deploy/equiparloc.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable equiparloc
```

Permita que o usuário do site reinicie só o próprio serviço (usado pelo `atualizar.sh`):

```bash
echo 'equiparloc ALL=(root) NOPASSWD: /usr/bin/systemctl restart equiparloc' > /etc/sudoers.d/equiparloc
chmod 440 /etc/sudoers.d/equiparloc
```

Gere e ligue o site (demora uns minutos):

```bash
sudo -u equiparloc /opt/equiparloc/app/deploy/atualizar.sh
```

No fim deve aparecer **"Pronto: site no ar com a versão ..."**.

## 7. nginx (o "porteiro" do site)

```bash
cp /opt/equiparloc/app/deploy/nginx-equiparloc.conf /etc/nginx/sites-available/equiparloc
ln -s /etc/nginx/sites-available/equiparloc /etc/nginx/sites-enabled/equiparloc
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Teste pelo próprio VPS:

```bash
curl -s -H "Host: equiparloc.com.br" http://127.0.0.1/ | grep -o "<title>[^<]*"
```

## 8. Conferir antes de trocar o domínio (opcional, recomendado)

Para ver o site novo no seu computador antes de todo mundo, edite o arquivo **hosts**
(Windows: `C:\Windows\System32\drivers\etc\hosts`, abrir o Bloco de Notas como administrador) e
acrescente a linha:

```
IP_DO_VPS equiparloc.com.br www.equiparloc.com.br
```

Abra `http://equiparloc.com.br`, confira páginas, fotos e o login do painel. **Depois apague essa linha.**

## 9. Apontar o domínio para o VPS (painel da Locaweb)

1. **Congele o site antigo:** avise a equipe para não editar nada no painel da Hostinger a partir de agora.
2. Se alguém mexeu desde o passo 5, baixe uma cópia nova e restaure de novo:

   ```bash
   systemctl stop equiparloc
   sudo -u equiparloc node /opt/equiparloc/app/scripts/restaurar-copia.mjs /root/equiparloc-copia-NOVA.json /var/lib/equiparloc --substituir
   systemctl start equiparloc
   ```

3. No painel da Locaweb, em **DNS** do domínio `equiparloc.com.br`:
   - registro **A** para `@` (ou `equiparloc.com.br`) → `IP_DO_VPS`
   - registro **A** para `www` → `IP_DO_VPS`
   - **não altere** registros MX, TXT de e-mail (SPF/DKIM) nem outros.
4. Espere a mudança valer (de minutos a algumas horas). Teste no computador:

   ```bash
   nslookup equiparloc.com.br
   ```

   Quando mostrar o IP do VPS, siga para o HTTPS.

## 10. HTTPS (cadeado)

```bash
certbot --nginx -d equiparloc.com.br -d www.equiparloc.com.br --redirect -m email-do-responsavel --agree-tos -n
```

O certificado renova sozinho. Teste: `https://equiparloc.com.br`.

## 11. Cópia de segurança diária

```bash
(crontab -l 2>/dev/null; echo "15 3 * * * /opt/equiparloc/app/deploy/copia-diaria.sh") | crontab -
```

Todo dia às 3h15 ele guarda banco + fotos em `/var/backups/equiparloc` (últimos 14 dias). De vez em
quando, baixe também a cópia pelo painel e guarde fora do servidor.

## 12. Depois da mudança

- [ ] Abra o site, o painel (`/admin`) e envie uma mensagem de teste pela página Contato.
- [ ] No painel, confira **Dados da empresa** (telefone, WhatsApp, redes sociais).
- [ ] No Google Search Console, cadastre `https://equiparloc.com.br` e envie o sitemap
      `https://equiparloc.com.br/sitemap.xml`.
- [ ] Só cancele a Hostinger depois de uns dias com tudo funcionando.

## Publicar mudanças futuras

A Hostinger publicava sozinha a cada envio ao GitHub. No VPS, depois de cada envio rode:

```bash
ssh root@IP_DO_VPS "sudo -u equiparloc /opt/equiparloc/app/deploy/atualizar.sh"
```

## Se algo der errado

| Sintoma | O que fazer |
|---|---|
| Site fora do ar | `systemctl status equiparloc` e `journalctl -u equiparloc -n 50` |
| Erro 502 no navegador | O serviço caiu: `systemctl restart equiparloc` |
| Não consigo entrar no painel | Confira `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `NEXTAUTH_URL` em `/etc/equiparloc.env`, depois `systemctl restart equiparloc` |
| Voltar para o site antigo | No DNS da Locaweb, aponte os registros A de volta para o IP da Hostinger |
