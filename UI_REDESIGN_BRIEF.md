# Redesign visual do timemob-site — prompt para outra instância de Claude

## Context

O scaffolding da fase 1 do `timemob-site/` foi entregue espelhando 1:1 o stack e a UI do `timemob-hub/`. Decisão consciente pra acelerar, mas o visual ficou idêntico ao hub. Como cada site é vendido como **personalizado** pra imobiliária cliente, o end-customer não pode bater os olhos e sentir "copy-paste do back-office interno" — quebra a percepção de valor.

A task agora: redesenhar **só a aparência** do template, mantendo intacto auth, rotas, services, schemas, comportamento dos forms, integração com a API. A área administrativa (sidebar, futuros forms de account/CRM/etc.) precisa continuar funcional e padronizada entre todos os clientes — o que muda por tenant no futuro é cor/copy/catálogo, via branches.

**Entrega desta sessão de planejamento**: um prompt PT-BR auto-suficiente que o Allan vai colar numa instância de Claude que só enxerga `/Users/allanfernando/Projects/timemob/timemob-site/`. Ela não tem o contexto do hub, do plano anterior nem dessa conversa.

## Decisões fechadas com o Allan

- **Direção visual**: Claude propõe 2–3 móveis (paleta + fontes + tom) via `AskUserQuestion` antes de codar. Allan escolhe.
- **Nav autenticada**: mantém `Sidebar` shadcn — coerente com o futuro CRM/forms de manager+agent. O distintivo vs hub vem de cor, header da sidebar, ícones, densidade.

## Prompt (copiar e colar)

````text
Você está trabalhando no projeto timemob-site. Antes de qualquer coisa, leia o `AGENTS.md` na raiz — ele descreve a stack, regras inegociáveis e o porquê deste projeto existir separado do hub. Comunicação comigo em PT-BR, código/comentários/identifiers em inglês.

# Contexto

O scaffolding deste site foi feito espelhando 1:1 a UI do projeto irmão (back-office interno de outro repo). Foi proposital para acelerar a primeira fase. Agora **a aparência precisa divergir** desse irmão. O motivo é comercial: vendemos sites personalizados para imobiliárias clientes. Se o cliente final entrar e perceber que é "a mesma cara do painel administrativo", quebra a proposta de valor.

Você vai mexer **só no visual**. Comportamento, rotas, auth, services, schemas, forms, integração com a API — tudo intocado.

# O que mudar

## 1. Escolha de identidade visual (faça antes de codar)

Proponha 2 ou 3 móveis distintos com paleta + fontes + tom geral. Use `AskUserQuestion` (3 opções, cada uma com 1 frase de descrição). Exemplos do tipo de proposta que cabem aqui — não copie, use como referência de variedade:

- "Imobiliário sofisticado — verde-sálvia + creme + serif elegante para headings"
- "Costeiro moderno — azul-petróleo + areia + sans humanista, mais respiro"
- "Terroso acolhedor — laranja queimado + off-white + display contemporânea"

Antes de propor, leia os arquivos abaixo para entender o ponto de partida (a paleta neutral atual, Geist Sans/Mono, radius 0.625rem, densidade compacta):
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/(public)/layout.tsx`
- `src/app/(public)/login/page.tsx`
- `src/app/(authenticated)/layout.tsx`
- `src/app/(authenticated)/dashboard/page.tsx`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/topbar.tsx`

Após o Allan escolher, implemente.

## 2. Onde aplicar as mudanças

- **`src/app/globals.css`** — troque os valores das CSS variables em `:root` e `.dark` (paleta, `--radius`). **Não renomeie nenhuma variável** (`--background`, `--primary`, `--sidebar`, etc.) — todos os componentes shadcn dependem desses nomes. Você está só trocando *valores*. Concentre toda a paleta nesses dois blocos — não espalhe cores hard-coded em componentes. Isso prepara o terreno para uma branch por tenant sobrescrever só `:root`/`.dark` no futuro.
- **`src/app/layout.tsx`** — troque `Geist` + `Geist_Mono` por outra combinação via `next/font/google`. Sugestão: uma sans humanista (Inter, Plus Jakarta Sans, Manrope, DM Sans) + uma display/serif para headings (Fraunces, Instrument Serif, Playfair Display, Cormorant). Adicione uma variável `--font-heading` e referencie em `globals.css` no bloco `@theme inline`.
- **`src/app/page.tsx` (landing pública)** — dê personalidade de site customer-facing. Reformule o hero com hierarquia tipográfica forte (use a display nas headings via classe `font-heading`), respiro generoso, um CTA limpo. Você pode adicionar 2–3 seções abaixo do hero (placeholders "Sobre nós", "Como funciona", "Contato") usando lorem ipsum em PT-BR só para diagramar — **não** adicione catálogo de imóveis, isso é do próximo ciclo. Inclua um footer próprio com placeholders de contato/endereço/redes sociais.
- **`src/app/(public)/layout.tsx`** — o header público pode receber tratamento diferente do `topbar` autenticado: logo + nav horizontal placeholder (sem rotas reais ainda) + LocaleSwitcher + ThemeToggle.
- **`src/app/(public)/login/page.tsx`** — mantém o `Card` shadcn e o `Form` RHF. O que muda: atmosfera ao redor (background com gradiente sutil ou textura via Tailwind, espaçamento mais arejado, headline com `font-heading`). **Não altere fields, validação, lógica de submit nem o redirect.**
- **`src/app/(authenticated)/layout.tsx` + `src/app/(authenticated)/dashboard/page.tsx`** — mantenha a `Sidebar` shadcn (decisão fechada — área administrativa). Distinção vs hub vem de: cor do sidebar (via `--sidebar` e tokens relacionados), header da sidebar com nome da marca em `font-heading` + ícone, eventual escolha de ícones lucide diferentes. O dashboard hoje é só uma `Card` de boas-vindas — pode ganhar mais respiro e, opcionalmente, 2-3 `Skeleton`s diagramando onde futuras estatísticas vão aparecer. Não invente dados.
- **`src/components/layout/{app-sidebar,topbar,user-menu,locale-switcher,theme-toggle}.tsx`** — ajustes mínimos só onde necessário para o tom novo (cor de ícone, font-heading no nome da marca, etc.). Não altere a estrutura nem props.
- **`src/components/ui/*` (shadcn primitives)** — você pode mudar **valores via CSS variables**, mas **não altere a API/props/variantes** dos componentes (button variants, sizes, etc.). Esses componentes precisam continuar portáveis vs o projeto irmão por cherry-pick.

## 3. Densidade

- Área pública (landing + login + forgot-password): pode relaxar densidade — botões maiores (`size="lg"`), padding generoso nos cards, hero amplo. Quem visita aqui é o cliente final.
- Área autenticada (dashboard e tudo que vier depois): mantenha densidade próxima da atual. É ferramenta de trabalho — apertado e eficiente é melhor que arejado e cansativo.

# O que NÃO mudar (proibido tocar)

- **Auth e segurança**: nada em `src/lib/axios.ts`, `src/lib/auth/`, `src/contexts/auth-context.tsx`, `src/services/`, `src/hooks/use-auth.ts`, `src/hooks/use-user-role.ts`, `src/types/`, `src/lib/schemas/`, `src/lib/api/`. Endpoint continua `POST /api/site/authenticate`. Token em `localStorage["@site/token"]`. Evento `site:unauthorized`. Validação de `aud === "site"`.
- **Rotas e estrutura de pastas**: não renomeie nem mova arquivos sob `src/app/`. Não troque route groups. Não converta páginas client em server (ou vice-versa).
- **Comportamento dos forms**: o login form em `src/app/(public)/login/page.tsx` mantém os mesmos campos (`username`, `password`, `rememberMe`), o mesmo schema Zod, o mesmo `onSubmit`, o mesmo handling de erro. Visual ao redor pode mudar, lógica não.
- **i18n**: pode **adicionar** chaves novas em `src/messages/pt.json` e `src/messages/en.json` (precisa adicionar em ambos), mas **não remova** chaves existentes. Use `useTranslations` / `getTranslations` como já é feito.
- **Stack**: não adicione libs novas pesadas (motion frameworks tipo framer-motion, design systems alternativos, CSS-in-JS). Use o que já está em `package.json`: Tailwind 4, shadcn, `tw-animate-css`, `lucide-react`. Se precisar de animação, `tw-animate-css` está disponível.
- **Config files**: `next.config.ts`, `package.json` (deps), `eslint.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `components.json` — não tocar, exceto se precisar declarar uma família de fonte nova (caso em que só `src/app/layout.tsx` muda, via `next/font/google`).

# Regras inegociáveis (do AGENTS.md)

- Sem `.trim()`, `.transform()`, `z.coerce.*`, `.default()` em opcionais nos schemas Zod. (Não é relevante pra esse trabalho mas mantenha o radar.)
- Sem feature flag, fallback ou retry preemptivo sem caso de uso real.
- Sem comentários explicativos do óbvio.
- Mantenha a decisão de pasta flat — não migre para feature folders.
- `useWatch({ control, name })` ao invés de `form.watch('name')` (React Compiler bloqueia o segundo).
- Não use `'use cache'` em código autenticado.

# Como entregar

1. Leia os arquivos do ponto de partida (listados na seção 1).
2. Proponha 2–3 móveis via `AskUserQuestion`. Aguarde a escolha.
3. Implemente todas as mudanças.
4. Rode `npm run lint && npm run build` na raiz do `timemob-site/`. Precisa passar com **zero erros e zero warnings**.
5. Rode `npm run dev` (porta 3001) — sobe em background. Abra `http://localhost:3001` no navegador e confirme visualmente:
   - `/` (landing) — hero + CTA "Entrar" + footer próprio
   - `/login` — form funciona, atmosfera distinta
   - `/forgot-password` — placeholder coerente com o resto
   - (Não dá pra ver `/dashboard` sem login válido — visualize só pelo código.)
6. Resuma em 3–5 bullets o que mudou (paleta escolhida, fontes, principais decisões de layout). Cita arquivos editados.

# Sobre theming per-tenant (não fazer agora — só nortear)

Cada cliente terá uma branch própria onde a paleta/fontes/copy serão sobrescritas. Não implemente esse mecanismo agora. Mas **estruture a paleta inteira em CSS variables nos blocos `:root` e `.dark` de `src/app/globals.css`** — assim, no futuro, uma branch por tenant troca só esses blocos e cobre 90% da personalização sem encostar em componentes.
````

## Verificação

Você (Allan) copia o bloco entre ```` ```text ```` acima e cola na outra instância de Claude (aquela que enxerga só o `timemob-site/`). Ela vai:

1. Ler `AGENTS.md` + arquivos do ponto de partida.
2. Te perguntar (via `AskUserQuestion`) qual dos 2-3 móveis você prefere.
3. Implementar.
4. Rodar lint+build e o dev server na porta 3001 pra você ver no browser.
5. Te dar um resumo curto do que mudou.

Se quiser ajustar a direção visual depois de ver o resultado, é só pedir ajustes incrementais na mesma sessão dela — todas as restrições do prompt continuam valendo.

## O que NÃO faz parte desta task (segue para ciclo futuro)

- Catálogo público de imóveis (`/api/properties/hub/feed`) — ciclo 2 do roadmap original.
- Formulários de account/manager/agent — ciclo 2.
- Implementar mecanismo de theming per-tenant via branches — quando subir o primeiro site real.
- CRM modular — ciclo 4.
- CORS de subdomínio próprio por tenant — DevOps na hora de publicar.
