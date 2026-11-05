# Loja — front-end (React + Vite) e back-end (Node + Express + Sequelize)

Banco de dados: **PostgreSQL ou MySQL** (escolha no `backend/.env`).

```
loja/
├── docker-compose.yml   PostgreSQL e MySQL (opcional, se você não tiver o banco instalado)
├── backend/             API REST em /v1 (porta 3000)
└── frontend/            React + Vite (porta 5173)
```

## Requisitos
- Node.js 18 ou superior
- PostgreSQL 12+ **ou** MySQL 8

## 1. Banco de dados (escolha um)

### Opção A — PostgreSQL que você já tem (ex.: o do trabalho)
1. No DBeaver, crie a conexão **PostgreSQL** (host, porta, usuário e senha do seu servidor).
2. Abra um **SQL Editor** nessa conexão e rode: `CREATE DATABASE loja;`
3. Aperte **F5** na conexão para atualizar.
4. Abra `backend/.env` e confira `DB_HOST`, `DB_PORT`, `DB_USER` e `DB_PASS`.

### Opção B — PostgreSQL com Docker
```bash
docker compose --profile postgres up -d
```
Já cria o banco `loja` com usuário `postgres` e senha `postgres` (o `.env` já está assim).
Se a porta 5432 já estiver em uso por outro Postgres, use a Opção A.

### Opção C — MySQL
- Com Docker: `docker compose --profile mysql up -d`
- Sem Docker: instale o MySQL e crie o banco: `CREATE DATABASE loja;`
- Troque o arquivo de configuração: `cd backend && cp .env.mysql.example .env`

## 2. Back-end
```bash
cd backend
npm install
npm run seed      # cria as tabelas e dados de exemplo (usuário admin@mail.com / 123@123)
npm run dev       # http://localhost:3000
```
`npm run seed -- --reset` apaga tudo e recria os dados de exemplo.

## 3. Front-end (em outro terminal)
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

## 4. Testes do back-end
```bash
cd backend
npm test
```

## Trocar de banco
Edite `backend/.env`:

| | PostgreSQL | MySQL |
|---|---|---|
| `DB_DIALECT` | `postgres` | `mysql` |
| `DB_PORT` | `5432` | `3306` |
| `DB_USER` | `postgres` | `root` |

Depois rode `npm run seed` de novo (cada banco começa vazio). Senha vazia é aceita (`DB_PASS=`).

## Testando a API na mão
```bash
# 1) Gerar token
curl -s -X POST localhost:3000/v1/user/token -H "Content-Type: application/json" \
  -d '{"email":"admin@mail.com","password":"123@123"}'

# 2) Usar o token (substitua TOKEN)
curl -s -X POST localhost:3000/v1/category \
  -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Acessórios","slug":"acessorios","use_in_menu":true}'

# 3) Rotas públicas
curl -s "localhost:3000/v1/category/search?use_in_menu=true&limit=-1&fields=name,slug"
curl -s "localhost:3000/v1/product/search?limit=3&fields=id,name,price&match=Tênis"
curl -s "localhost:3000/v1/product/search?category_ids=1&price-range=100-300"
curl -s "localhost:3000/v1/product/1"
```
Filtro por opção: `option[ID_DA_OPCAO]=39,40` (ID da opção, não do produto).

## Decisões onde o documento era ambíguo
| Ponto | O que foi feito |
|---|---|
| Token ausente/inválido: a Seção 05 diz 400, os endpoints dizem 401 | **401** (como em cada endpoint) |
| `POST /v1/user` e `POST /v1/user/token` exigiriam token pela regra geral | **Públicos** (senão não há como obter o 1º token) |
| `price_with_discount` é obrigatório, mas o PUT de exemplo envia `0` | Padrão `0` = sem desconto; não pode ser maior que `price` |
| `radius` é INTEGER na tabela, mas o payload envia `"4px"` | Aceita `4`, `"4"` e `"4px"`; a API devolve inteiro |
| `values` é texto separado por vírgula no banco, array no payload (e às vezes `value`) | Aceita array ou string, e `values` ou `value`; a API devolve array |
| `stars`, `rating` e `reference` não existem no back-end | O BuyBox omite o que não vier |
| E-mail | Único e salvo em minúsculas |
| Imagens | Base64 → arquivo em `backend/media`, servido em `/media`; `path` guarda o caminho relativo |

## Cadastro e login de clientes
- Páginas: `/register` (criar conta) e `/login` (entrar). O cabeçalho mostra "Entrar", "Criar conta" e, logado, o e-mail e o botão "Sair".
- Cadastro: `POST /v1/user` (público). Campos: `firstname`, `surname`, `email`, `password`, `confirmPassword`. A senha é salva com hash bcrypt.
- Login: `POST /v1/user/token`. O token JWT fica no `localStorage` do navegador (chave `token`) e é enviado automaticamente nas rotas protegidas.
- Para ver os clientes no DBeaver: `SELECT id, firstname, surname, email, password FROM users;` (a coluna `password` mostra o hash, nunca a senha de verdade).

## Filtros e busca
- **Busca no topo** ("O que você procura?"): vai para `/products?match=termo` e usa `GET /v1/product/search?match=termo` (nome ou descrição).
- **Barra lateral** em `/products`: Categoria (caixas de seleção com contagem, busca interna e "Ver todos"), uma seção por opção de produto (Tamanho em caixinhas, Cor em bolinhas) e Preço (mín–máx). Os filtros ficam na URL, então dá para copiar e compartilhar o link.
- Novidades da API:
  - `GET /v1/product/filters` → categorias com contagem, opções (título, tipo, valores com contagem) e faixa de preço.
  - `GET /v1/product/search?option_values[Tamanho]=39,40` → filtra pelo **título** da opção (vale entre produtos). O `option[ID]` original continua funcionando.
- As imagens de exemplo (`backend/media`) não vão no zip. Se o banco já tem produtos e a pasta `media` é nova, o back-end recria os placeholders sozinho ao iniciar (ou rode `npm run seed`).

## Carrinho e checkout (Carrinho → Entrega → Pagamento → Confirmação)
- **COMPRAR** na página do produto exige escolher as opções (tamanho, cor) e leva para `/cart`. O carrinho fica no navegador (`localStorage`) e funciona sem login.
- **Carrinho** (`/cart`): quantidade, remover, compartilhar por WhatsApp / copiar link, frete por CEP e cupom. **Continuar** pede login se necessário e volta para a etapa certa.
- **Entrega** (`/checkout/delivery`), **Pagamento** (`/checkout/payment`) e **Confirmação** (`/checkout/confirmation/:id`) exigem login.
- Tudo é **recalculado no servidor** (nunca confia em preço do navegador): preço, desconto, cupom, frete, estoque e Pix.
- Regras (exemplos): Pix com 5% de desconto sobre os produtos (não sobre o frete); frete **simulado** por faixa de CEP, grátis a partir de R$ 200; cupons `BEMVINDO10` (10%), `DESCONTO20` (R$ 20 acima de R$ 100) e `FRETEGRATIS`.
- Pagamento **simulado**: cartão é aprovado na hora e nenhum dado de cartão é pedido; Pix e boleto geram um código de mentira e o pedido fica "aguardando pagamento".
- Estoque: a compra desconta do `stock` do produto. Produtos criados pela API sem `stock` não podem ser comprados.
- Novas tabelas (criadas sozinhas ao iniciar o back-end): `orders` e `order_items`.

### Endpoints novos
| Método | Rota | Acesso |
|---|---|---|
| POST | `/v1/cart/quote` — `{ items:[{product_id, quantity, options}], coupon?, cep? }` | público |
| POST | `/v1/order` — `{ items, coupon?, payment_method: "pix"\|"card"\|"boleto", address }` | token |
| GET | `/v1/order/:id` (só o dono vê) | token |

## Busca com sugestões e CEP automático
- **Sugestões na busca**: a partir de 2 letras, a barra do topo mostra até 5 produtos (foto, nome com o trecho destacado e preço) usando `GET /v1/product/search?match=`. Setas ↑/↓ navegam, Enter abre, Esc fecha, e a tecla **/** foca a busca. Se a API falhar, a busca normal continua funcionando.
- **CEP automático** (tela de Entrega): ao completar o CEP, rua, bairro, cidade e UF são preenchidos e o cursor vai para o número. Usa o **ViaCEP** (`viacep.com.br`), chamado direto do navegador, então o CEP digitado é enviado a esse serviço de terceiros. Se ele estiver fora do ar, o formulário segue manual.
