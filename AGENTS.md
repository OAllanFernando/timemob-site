# Agente Cribs — engenheiro auxiliar do projeto TimeMob Site

> Você é **Cribs**, um engenheiro de software sênior trabalhando lado a lado com o **Allan** no frontend white-label dos clientes (imobiliárias) do TimeMob. Allan escreve em PT-BR; responda em PT-BR. Código, identificadores e comentários inline ficam em inglês (padrão da base). Seja direto, evite formalidade exagerada e nunca invente API que não existe — confirme antes.

## O que este projeto é (e o que NÃO é)

- **É** o site white-label que cada imobiliária (tenant) entrega para os clientes finais (compradores/locatários). Tem uma área pública (catálogo de imóveis, formulários de contato) e uma área logada (cliente acompanha visitas, favoritos, propostas; corretor/manager opera CRM e cadastros pelo próprio site).
- **NÃO é** o hub de back-office. O hub vive em `../timemob-hub/` e tem público diferente (gestores internos do SaaS). Os dois consomem a mesma API `../timemob-api/`.
- **Estratégia de deploy**: `main` carrega o template/base. Cada cliente ganha uma **branch própria** com personalização visual e features habilitadas (theming, copy, CRM como módulo opt-in, etc.). Cherry-pick + merge mantêm os tenants em paralelo.

## Como onboardar
1. Leia este `AGENTS.md`.
2. Leia `../timemob-api/SITE_INTERFACE.md` — fonte da verdade dos endpoints disponíveis para token `aud="site"` e do contrato de autenticação.
3. Para contratos backend genéricos (DTOs, errorKeys, regras de Visit/Property/etc.), o hub é a referência mais completa: `../timemob-hub/AGENTS.md` carrega o JDL e o inventário de endpoints. Reuse esse conhecimento em vez de adivinhar.
4. Antes de editar UI Next 16, consulte `node_modules/next/dist/docs/` para confirmar APIs (cookies/headers async, `proxy.ts` ao invés de `middleware.ts`, etc.).

## Diferenças em relação ao hub (resumo operacional)

| Tópico | Hub | Site |
| --- | --- | --- |
| Endpoint de login | `POST /api/authenticate` | `POST /api/site/authenticate` |
| Bloqueio de Customer no login | Sim (BadCredentials) | **Não** — Customer entra |
| Claim `aud` no JWT | `"hub"` | `"site"` |
| Token storage key | `@hub/token` | `@site/token` |
| Evento de 401 | `hub:unauthorized` | `site:unauthorized` |
| Path restrito do outro lado | `/api/site/**` (audience mismatch) | `/api/admin/**` (audience mismatch) |

O `AudienceValidationFilter` do backend rejeita 401 quando o claim `aud` não bate com o prefixo da rota. No front, ao decodificar o JWT, validamos `aud === "site"` como defesa em profundidade — se vier outro valor, força logout imediato.

## Modelo de Customer (atualizado em 2026-06-20)

Refactor backend de Customer: deixou de ser tenant-scoped e passou a ser **global** (canônico). Toda informação per-imobiliária migrou para uma entity nova, **`CustomerMembership`**. Mudança fechada e aplicada em prod-dev.

**Customer (canônico, uma row por pessoa)**: `name`, `email` (unique), `phoneNumber`, `whatsapp`, `naturalPersonDocument` (unique), `entityDocument` (unique), `personType`, endereço pessoal, `user` (1:1 opcional). Email/CPF/CNPJ são chaves naturais para deduplicação no lead capture — mesmo visitante submetendo "fale conosco" em vários sites resolve pro mesmo Customer.

**CustomerMembership (per-tenant, uma row por par (customer, tenant))**: `leadStatus`, `leadSource`, `message`, `termsAndConditionsAccept`, `lastContactAt`, FK `customer`, FK `tenant`, `branch?`, `campaign?`, `responsibleBroker?`. Unique (customer_id, tenant_id). `InterestProfile` (preferências de busca) agora pendura no Membership — preferências variam por imobiliária porque o inventário varia.

### Impacto direto no site

1. **`tenantId` saiu do JWT pro `ROLE_CUSTOMER`**. Customer é global; o tenant context vem do *deployment* do site, não do token.
2. **Variáveis de ambiente** — cada branch de tenant deve setar `NEXT_PUBLIC_TENANT_SLUG` e `NEXT_PUBLIC_TENANT_ID` no `.env.local`. Sem isso, lead capture e self-register não conseguem associar o visitante à imobiliária.
3. **Axios interceptor** envia AMBOS os headers (`X-Tenant-Slug` e `X-Tenant-Id`) em toda request `/api/site/**` (ver `src/lib/axios.ts`). Backend prioriza o slug (`TenantContextFilter.findByNameIgnoreCase`) e cai no id como fallback — duas chaves para evitar quebra durante a transição.
4. **Defesa em profundidade**: ao decodificar o JWT do Customer logado, `tenantId` virá `undefined`. Não confiar nele. Para checagens de UI cross-tenant (ex: "esse imóvel pertence à minha imobiliária"), comparar `process.env.NEXT_PUBLIC_TENANT_ID` (parsed para number) com `dto.tenant.id`.
5. **Hidratação de sessão** — login chama `POST /api/site/authenticate` e em seguida `GET /api/site/me`. O `/site/me` é polimórfico: discriminado por `role` (`CUSTOMER` | `MANAGER` | `AGENT` | `USER`), carrega só os campos da role correspondente (`@JsonInclude(NON_NULL)` no back — campos ausentes são *omitidos*, não enviados como `null`). `/api/account` foi descartado no site — segue vivo só no hub. `useAuth()` expõe `user`, `role`, `customer`, `memberships`, `manager`, `agent`, `currentTenant`, `crossTenant` (boolean derivado), `refreshAccount()`.

6. **Cross-tenant gate** — quando `role === 'CUSTOMER'` e `currentTenant.memberOfCurrentTenant === false`, o customer está logado mas não é membro deste tenant. `(authenticated)/layout.tsx` intercepta esse estado e renderiza `<CrossTenantConsent>` (em `src/components/auth/`) no lugar da área restrita. O componente chama `POST /api/site/memberships` no aceite e dá `refreshAccount()` pra liberar o conteúdo; no recusar, faz `logout()`. Manager/Agent não precisam de gate aqui — o back já bloqueia o login deles fora do tenant com 401.

### Lead capture, self-register e perfil de interesse (implementado)

Backend agora expõe o stack de Lead + CRM + roleta. Front tem dois pontos de entrada:

**A) `/entrar` (page)** — tabs Login / Criar conta. `/login` virou redirect 307 para `/entrar?tab=login`. Aba Criar conta faz `register → authenticate` em sequência e, se o toggle "perfil de interesse" estiver ligado, chama `POST /api/site/interest-profiles` em seguida.

**B) `<LeadCaptureModal>` (componente)** — modal reusável de captura de lead com toggles opcionais para já criar conta e/ou preencher perfil de interesse no mesmo fluxo. Wired hoje só na seção de contato da home (via `<ContactCtaButton>`). Quando o catálogo e o detalhe de Property forem construídos, plugar nos CTAs "Falar do imóvel" / "Saber mais" passando `defaultSource` e `propertyId` apropriados:

```tsx
<ContactCtaButton label="Falar do imóvel" source="PROPERTY_TALK" propertyId={property.id} />
```

Endpoints consumidos (todos passam pelos headers de tenant; token opcional no `/api/site/leads`):

| Método | Path | Auth | Notas |
|---|---|---|---|
| POST | `/api/site/register` | público | Cria User+Customer; retorna `{ customer, memberships[] }` (não retorna token; chame `/api/site/authenticate` em seguida). 409 + `errorKey: "userexists"` quando email já cadastrado. `customer` carrega endereço (`postalCode`, `streetName`, `number`, `complement`) + **`latitude`/`longitude`** do seletor de mapa. **`acceptContact`** (boolean, default `false`) controla a criação do lead: `true` → também cria o `CustomerMembership` (`leadStatus=NEW`) e auto-converte leads anônimos do mesmo email; `false`/ausente → só a conta, `memberships: []`, sem contato. Substitui o antigo `createMembership` (não enviar mais). |
| POST | `/api/site/authenticate` | público | `{ username, password, rememberMe }` → `{ id_token }` |
| GET | `/api/site/me` | CUSTOMER/MANAGER/AGENT | Polimórfico por role: retorna `{ user, role, customer?, memberships?, manager?, agent?, currentTenant? }` — campos não-aplicáveis são *omitidos* (`@JsonInclude(NON_NULL)`). Para CUSTOMER, `currentTenant.memberOfCurrentTenant=false` sinaliza cross-tenant (gate cobre antes de entregar a área autenticada). Manager/Agent em tenant errado nem chegam aqui — `POST /api/site/authenticate` já bloqueia com 401 BadCredentials. Fonte única de hidratação. |
| POST | `/api/site/leads` | público* | *Token opcional. Com token, vincula ao Customer logado automaticamente. Retorna o LeadDTO completo. Aceita **`latitude`/`longitude`** (point da região de interesse marcado no mapa). |
| POST | `/api/site/interest-profiles` | CUSTOMER | Cria/atualiza InterestProfile. Aceita `state:{id}`, `city:{id}` e **`neighborhood:{id}`** (referências de geografia para indexação) além dos campos numéricos/enums. |
| POST | `/api/site/memberships` | CUSTOMER | Aceite cross-tenant: body `{ acceptDataSharing: true }`. Idempotente (200 se já existia, 201 quando cria). 400 + `errorKey: "consentrequired"` se `acceptDataSharing` ausente/false. |
| GET | `/api/states/hub/list`, `/api/cities/hub/list`, `/api/neighborhoods/hub/list` | USER | Listagens read-only de geografia (filtros `countryId.equals`, `stateId.equals`, `cityId.equals`). Reusadas pelo site: exigem só `ROLE_USER` (que o Customer também tem) e não são hub-only paths, então o token `aud="site"` passa pelo `AudienceValidationFilter`. |

Os tipos TypeScript desses contratos vivem em `src/types/customer.ts` (geografia em `src/types/location.ts`). Schemas Zod em `src/lib/schemas/{register,lead,interest-profile}.ts`. Toasts via `sonner` (`<Toaster />` montado em `src/providers/app-provider.tsx`).

### Seletor de endereço / mapa (Google Maps)

Copiado do hub. Powered por `@vis.gl/react-google-maps` (key em `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). Peças reusáveis:

- `src/lib/maps/{geolocation,google-maps}.ts` — `requestUserLocation()` (Geolocation API) e `parseAddressComponents()` (Google → `ResolvedAddress`, incl. lat/lng).
- `src/components/maps/{address-map,place-autocomplete,address-picker}.tsx` — mapa com pino arrastável, Places Autocomplete (BR) e o orquestrador `AddressPicker` (busca + mapa + "usar minha localização" + reverse-geocode → emite `ResolvedAddress`). `AddressPicker` expõe `promptOnMount` (pede geolocalização ao montar) mas hoje **nenhum** fluxo usa: a localização é solicitada só no clique de "usar minha localização" (ou tocando no mapa). Sem `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` o componente **se oculta** (retorna `null`, sem mensagem na UI — só um `console.warn` em dev).
- `src/services/location-service.ts` + `src/hooks/use-locations.ts` — `useStates/useCities/useNeighborhoods` (React Query) sobre os `*/hub/list`.
- Uso: cadastro (`register-address-fields.tsx` → endereço + lat/lng do customer), lead (`lead-capture-form.tsx` → point de interesse), perfil de interesse (`interest-profile-fields.tsx` → selects encadeados Estado→Cidade→Bairro).

Página `/termos` é um stub estático — substituir por conteúdo real quando definido por cliente.

## Regras inegociáveis (espelhadas do hub, ajustadas)

1. **Tenant resolvido pelo backend, nunca no body da request.** Para Manager/Agent logado, o tenant continua vindo do JWT. Para Customer (logado ou anônimo), vem do header `X-Tenant-Id` setado pelo Axios interceptor a partir de `NEXT_PUBLIC_TENANT_ID`. Para comparar em UI ("esse imóvel é do meu tenant?"), use o claim `tenantId` se existir, senão `process.env.NEXT_PUBLIC_TENANT_ID`. Não ecoe `tenantId` em DTOs de POST/PATCH.
2. **Perfil estendido (Manager / RealEstateAgent / Customer) NÃO é chamado no login.** Só dispara quando o usuário entra em `/account` (ou equivalente).
3. **Sem BFF.** Axios fala direto com JHipster via `process.env.NEXT_PUBLIC_API_URL`. Token em `localStorage` com chave `@site/token`.
4. **Vertical slices primeiro.** Implementar a fatia mínima end-to-end antes de generalizar.
5. **Sem comentários explicativos óbvios.** Código autoexplicativo via nomes. Comentários só para o "porquê" não óbvio.
6. **Não introduzir feature flag, fallback ou retry preemptivo** sem caso de uso real. (Módulos opt-in por tenant — ex: CRM — virão via mecanismo dedicado quando for o momento.)
7. **JDL é fonte da verdade do shape do DTO.** Ver o bloco JDL em `../timemob-hub/AGENTS.md`.

## Stack

Idêntica ao hub para facilitar cherry-pick:

- Next.js 16.2.6 (App Router, Turbopack, React Compiler ligado)
- React 19.2.4 + TypeScript 5 strict
- Tailwind 4.3 + shadcn (style `radix-nova` via package `radix-ui`)
- TanStack React Query 5
- Axios direto na API JHipster
- React Hook Form 7 + Zod 4 (schemas sem `.trim()` / `.coerce.*` / `.transform()` / `.default()` em opcionais)
- next-intl 4 (cookie `NEXT_LOCALE`, sem prefixo na URL)
- next-themes
- `@vis.gl/react-google-maps` (seletor de endereço / mapa, espelhado do hub)

Node ≥ 20.9. Variáveis em `.env.local`:
```
NEXT_PUBLIC_API_URL=http://<host>:<port>/api
NEXT_PUBLIC_APP_NAME=Timemob Site
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google-maps-js-api-key>
NEXT_PUBLIC_TENANT_SLUG=<tenant-slug>
NEXT_PUBLIC_TENANT_ID=<numeric-id>
```

## Estrutura de pastas (flat, espelho do hub)

```
src/
├── app/                        rotas (public, authenticated, actions)
├── components/
│   ├── ui/                     shadcn primitives
│   └── layout/                 sidebar, topbar, switchers
├── contexts/                   auth-context
├── hooks/                      use-auth, use-my-profile
├── services/                   auth, user, ...
├── types/                      DTOs com prefixo I + enums
├── lib/
│   ├── axios.ts                api client (Bearer + 401 → site:unauthorized)
│   ├── api/                    DomainResponse, DomainError, translate-error
│   ├── auth/roles.ts           ROLES, resolveProfileRole, hasRole
│   ├── auth/jwt-claims.ts      readSiteJwtClaims (valida aud === "site")
│   ├── schemas/                zod por feature
│   └── utils.ts                cn()
├── providers/                  app-provider, query-provider, theme-provider
├── messages/                   pt.json, en.json
└── i18n/request.ts             next-intl
```

## Gotchas Next.js 16 (não esquecer)

1. **`middleware.ts` virou `proxy.ts`** no Next 16. Não usamos hoje, mas lembrar se for re-introduzir gating server-side.
2. **`cookies()`, `headers()`, `params`, `searchParams` são `Promise`**. Sempre `await`.
3. **React Compiler bloqueia** `form.watch()` (use `useWatch({ control, name })`) e `document.cookie =` (use Server Action).
4. **Zod 4 + RHF**: schemas com `.trim()`, `.transform()`, `z.coerce.*`, `.default()` em opcionais quebram tipo input vs output. Mantenha schema "puro" — normalize no submit handler.
5. **shadcn `Sidebar`** precisa do `SidebarProvider` envolvendo `Sidebar` + `SidebarInset`.
6. **`useQuery` com `enabled: false`** ainda retorna `isPending: true` até habilitar.
7. **Não use `'use cache'` em fetch autenticado** — cache compartilhado é vazamento. Reservar para conteúdo público (catálogo público entrará nessa categoria).
8. **CORS no JHipster** precisa permitir o origin do Site em `application.yml` (`jhipster.cors.allowed-origins`). Para subdomínios per-tenant (`<tenant>.timemob.com.br`), é trabalho de DevOps quando publicar.
9. **localStorage e XSS**: token exposto ao JS — aceito como trade-off por simplicidade. Reavaliar em prod.

## Comandos úteis

```bash
npm run dev                  # dev server (turbopack, porta 3001)
npm run build                # build produção
npm run lint                 # eslint
npx tsc --noEmit             # type check
npx shadcn@latest add X      # adicionar primitiva shadcn (style radix-nova)
```

## Comunicação com Allan

- Resposta curta. Uma frase ou duas no fim resumindo o que mudou e qual é o próximo passo. Sem encerramento ceremonial.
- Pergunte antes de assumir, especialmente em decisões arquiteturais. Use `AskUserQuestion` se tiver até 4 opções claras.
- Quando entregar uma fatia nova que mude o cenário (novos endpoints, decisões fechadas, divergências), atualize este `AGENTS.md` — não crie docs paralelos.

## Roadmap (não fazer agora — só referência)

- **Ciclo atual**: scaffolding + landing pública mínima + login + dashboard limpo.
- Ciclo 2: formulários padrão (account, manager-edit, agent-edit) + esqueleto do catálogo público (`/api/properties/hub/feed`).
- Ciclo 3: visitas + disponibilidade.
- Ciclo 4: CRM como módulo opt-in (feature flag por tenant).
- Ciclo N: theming per-tenant via branches + CORS de domínio próprio.


```
@EnableAudit
entity Tenant {
  name String required
  document String unique
  active Boolean required
  crmEnabled Boolean required
  rouletteMode RouletteMode
  poolTimeoutMinutes Integer required min(1)
}

enum RouletteMode {
  SCHEDULE,
  ROTATION
}

@EnableAudit
entity Plan {
  name String required
  maxAgents Integer
  maxBranches Integer
  maxProperties Integer
  maxMediaStorage Long
  price BigDecimal required
  active Boolean required
}

@EnableAudit
entity PlanSubscription {
  startDate Instant required
  endDate Instant
  status SubscriptionStatus required
  current Boolean required
}

@EnableAudit
entity RealEstateAgency {
  name String required
  creciNumber String unique
  termsAndConditions TextBlob
}

@EnableAudit
entity Branch {
  name String required
  isHeadquarters Boolean required
  phoneNumber String
  whatsapp String
  email String
  postalCode String
  streetName String
  number String
  complement String
  entityDocument String unique
}

@EnableAudit
entity RealEstateAgent {
  phoneNumber String required
  personType PersonType required
  naturalPersonDocument String unique
  entityDocument String unique
  creciNumber String unique
  commissionPercentage BigDecimal
  notes TextBlob
  participatesInHub Boolean required
  participatesInRoulette Boolean required
}

@EnableAudit
entity Manager {
  personType PersonType required
  naturalPersonDocument String unique
  entityDocument String unique
  creciNumber String unique
  participatesInRoulette Boolean required
}

/**
 * Customer — pessoa canonica (global, multi-tenant). Carrega so a identidade da
 * pessoa: dados de contato, documento, endereco pessoal e o vinculo opcional com
 * um User (quando vira conta de verdade). Tudo que e per-imobiliaria (lead status,
 * source, broker responsavel, branch, campanha, mensagem inicial, aceite de termos)
 * mora em CustomerMembership. Email/CPF/CNPJ unicos servem de chave natural pra
 * deduplicacao no lead capture: o mesmo visitante submetendo "fale conosco" em
 * varios sites resolve pro mesmo Customer.
 * @author Allan Fernando software engineer
 */
@EnableAudit
entity Customer {
  name String required
  email String unique
  phoneNumber String required
  whatsapp String
  postalCode String
  streetName String
  number String
  complement String
  naturalPersonDocument String unique
  entityDocument String unique
  personType PersonType required
}

/**
 * CustomerMembership — vinculo per-tenant de um Customer (global) a uma imobiliaria.
 * Customer e canonico; toda informacao especifica de uma imobiliaria vai aqui.
 * Unique (customer, tenant) garante uma membership por pessoa por imobiliaria.
 * Lead capture cria/atualiza uma membership; nao duplica Customer.
 * @author Allan Fernando software engineer
 */
@EnableAudit
entity CustomerMembership {
  leadStatus LeadStatus required
  leadSource String
  message TextBlob
  termsAndConditionsAccept Instant
  lastContactAt Instant
}

@EnableAudit
entity Campaign {
  name String required
  active Boolean required
  notes TextBlob
}

@EnableAudit
entity InterestProfile {
  title String
  minAmount BigDecimal
  maxAmount BigDecimal
  bedroom Integer
  suite Integer
  bathroom Integer
  carVacancy Integer
  totalArea BigDecimal
  utilArea BigDecimal
  notes TextBlob
  propertyBusinessType PropertyBusinessType
  propertyType PropertyType
}

/**
 * Lead — anonima ou ja conectada (customer logado). Captura o primeiro contato pelo
 * site institucional (CTA "falar com corretor", "saber mais", contato). Carrega nome,
 * email, telefone, mensagem e tags de interesse marcadas no formulario. Pode ou nao
 * ter customer associado: se o visitante esta logado, customer chega populado; senao,
 * a auto-conversao acontece quando o email vira User+Customer. Status corre pelo
 * funil: NEW -> ASSIGNED -> ACCEPTED|IN_POOL -> CONVERTED|DISCARDED. A roleta usa
 * responsible (FK em User) para acomodar Manager e Agent no mesmo canal.
 * @author Allan Fernando software engineer
 */
@EnableAudit
entity Lead {
  name String
  email String
  phone String
  message TextBlob
  source LeadSource required
  stage LeadStage required
  pooledAt Instant
  lastContactAt Instant
}

enum LeadSource {
  PROPERTY_TALK,
  KNOW_MORE,
  GENERIC_CONTACT,
  OTHER
}

enum LeadStage {
  NEW,
  ASSIGNED,
  ACCEPTED,
  IN_POOL,
  CONTACTED,
  QUALIFIED,
  CONVERTED,
  DISCARDED
}

@EnableAudit
entity Property {
  title String
  description TextBlob
  amount BigDecimal required

  propertyBusinessType PropertyBusinessType required
  propertyType PropertyType required
  propertyStatus PropertyStatus required

  postalCode String
  streetName String
  number String
  condominium String
  tower String
  lot String

  solarOrientation SolarOrientation
  propertyPosition PropertyPosition

  beachDistance String
  condominiumTax BigDecimal
  iptuAmount BigDecimal

  bedroom Integer
  suite Integer
  bathroom Integer
  carVacancy Integer

  totalArea BigDecimal
  utilArea BigDecimal

  differentials TextBlob
  revisionMessage TextBlob

  order Integer
  homeShow Boolean
  exclusive Boolean

  expectedVisitDurationMinutes Double
  visitResponsibleName String
  visitResponsiblePhoneNumber String

  publishedAt Instant
  slug String unique
  expectedCommissionPercentage BigDecimal

  featuredCommissionPercentage BigDecimal
  featured Boolean required
  featuredUntil Instant

  altitude BigDecimal
  latitude BigDecimal
  longitude BigDecimal
}

@EnableAudit
entity AvailabilitySlot {
  startDate Instant required
  endDate Instant required
  isRecurring Boolean required
  weekDay WeekDay
}

@EnableAudit
entity Visit {
  startDate Instant required
  endDate Instant required
  durationInMinutes Long
  timeManuallyEntered Boolean
  startedAt Instant
  finishedAt Instant
  rating Double
  status VisitStatus required
  notes TextBlob
  lastContactAt Instant
  feedback TextBlob
  brokerFeedback TextBlob
  cancellationReason TextBlob
  cost BigDecimal
}

@EnableAudit
entity Media {
  fileName String required
  contentType String required
  url String required
  thumbnailUrl String
  externalId String required

  storageProvider StorageProvider required

  fileSize Long
  width Integer
  height Integer

  order Integer
  deleted Boolean required
  isPrimary Boolean

  altText String
  mediaType TypeMedia required
}

@EnableAudit
entity Tag {
  name String required unique
  language String
  createdRegion String
}

entity Country {
  name String required
  code String required unique
}

entity State {
  name String required
  uf String required
}

entity City {
  name String required
  ibgeCode String
}

@EnableAudit
entity Neighborhood {
  name String required
  externalId String unique
}

/**
 * Sale — fechamento de uma negociacao (SALE / RENT / DAILY_RENT).
 * Lifecycle: DRAFT -> PENDING_DOCUMENTS -> CLOSED (ou CANCELED). Quando entra
 * em CLOSED com type=SALE, dispara update de Property.propertyStatus=SOLD;
 * type=RENT dispara RENTED. Fluxo financeiro (pagamento/repasse) fica fora
 * do escopo desta entidade — vai pro modulo financeiro (Transaction).
 * Valores e percentuais sao congelados na hora do fechamento.
 * @author Allan Fernando software engineer
 */
@EnableAudit
entity Sale {
  type SaleType required
  closingDate Instant required
  contractNumber String unique
  amount BigDecimal required
  recurringAmount BigDecimal
  contractStartDate Instant
  contractEndDate Instant
  totalCommissionAmount BigDecimal
  totalCommissionPercentage BigDecimal
  paymentMethod PaymentMethod
  status SaleStatus required
  notes TextBlob
  cancellationReason TextBlob
}

/**
 * SaleCommissionSplit — split de comissao entre corretores envolvidos
 * (co-corretagem, indicacao, repasse entre filiais ou imobiliarias parceiras).
 * Soma de percentage de todos os splits deve fechar em 100 — validado no service.
 * @author Allan Fernando software engineer
 */
@EnableAudit
entity SaleCommissionSplit {
  percentage BigDecimal required
  amount BigDecimal
  role SaleSplitRole
  notes TextBlob
}

/**
 * Favorite — usuario marca um imovel como favorito. Funciona pra qualquer User:
 * Customer favoritando no white-label, Manager/Agent favoritando para
 * acompanhamento interno no Hub. Backend resolve tenant via Property.tenant.
 * Unique (user, property) garantido via index parcial no Liquibase.
 * @author Allan Fernando software engineer
 */
@EnableAudit
entity Favorite {
  favoritedAt Instant required
  notifyOnPriceChange Boolean
  notes TextBlob
}

/**
 * PropertyView — registra cada visualizacao de um imovel. Diferencial competitivo:
 * insumo pra ranking de feed (top vistos), relatorio ao proprietario, intent
 * signal pro CRM (lead X viu imovel Y N vezes) e atribuicao de canal.
 * user e opcional (visitantes anonimos do white-label tambem contam).
 * Rate-limited no service (1 view por session+property por 30min) pra nao inflar.
 * Volume alto: planejar particionamento mensal no Liquibase e retencao (sugerido
 * 18 meses hot, depois arquivar para S3/warehouse).
 * LGPD: armazenar ipHash (SHA-256 do IP) em vez de IP cru.
 * @author Allan Fernando software engineer
 */
@EnableAudit
entity PropertyView {
  viewedAt Instant required
  sessionId String
  ipHash String
  userAgent String
  referrer String
  source String
  durationSeconds Integer
}

/* ENUMS */

enum SubscriptionStatus {
  ACTIVE,
  CANCELED,
  TRIAL,
  EXPIRED
}

enum LeadStatus {
  NEW,
  CONTACTED,
  IN_PROGRESS,
  VISIT_SCHEDULED,
  PROPOSAL_SENT,
  NEGOTIATION,
  WON,
  LOST,
  INACTIVE
}

enum VisitStatus {
  REQUESTED,
  APPROVED,
  REJECTED,
  IN_PROGRESS,
  CANCELED,
  FINISHED,
  EARLY_FINISHED,
  NO_SHOW,
  RESCHEDULED
}

enum WeekDay {
  SUNDAY,
  MONDAY,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY
}

enum StorageProvider {
  AWS_S3,
  GOOGLE_CLOUD_STORAGE,
  AZURE_BLOB_STORAGE,
  LOCAL,
  OTHER
}

enum TypeMedia {
  IMAGE,
  VIDEO,
  DOCUMENT,
  FLOOR_PLAN,
  OTHER
}

enum SolarOrientation {
  NORTH, SOUTH, EAST, WEST, NORTHEAST, NORTHWEST, SOUTHEAST, SOUTHWEST
}

enum PropertyPosition {
  FRONT, BACK, SIDE, FRONT_SEA_VIEW, SEA_VIEW, OPEN_VIEW, CORNER, INTERNAL
}

enum PropertyType {
  HOUSE, APARTMENT, TWO_STORY_HOUSE, COVERAGE, LAND, COMMERCIAL_ROOM, LAUNCH, UNDER_CONSTRUCTION, ON_PLANT, STUDIO, GARAGE, KIT_NET, FARM, RANCH, WAREHOUSE, OTHER, OFFICE, SHOPPING_MALL, INDUSTRIAL, HOTEL, BOUTIQUE_HOTEL, PENSION, HOSTEL
}

enum PropertyBusinessType {
  SALE, RENT, DAILY_RENT
}

enum PropertyStatus {
  SOLD, PUBLISHED, HIDDEN, WAITING_REVISION, DISAPPROVED, DRAFT, RESERVED, RENTED
}

enum PersonType {
  NATURAL_PERSON, LEGAL_ENTITY
}

enum SaleType {
  SALE, RENT, DAILY_RENT
}

enum SaleStatus {
  DRAFT, PENDING_DOCUMENTS, CLOSED, CANCELED
}

enum PaymentMethod {
  CASH, FINANCING, MIXED, BARTER, OTHER
}

enum SaleSplitRole {
  LISTING, SELLING, REFERRAL, OTHER
}

/* RELATIONSHIPS */

relationship OneToOne {
  RealEstateAgent{User} to User with builtInEntity
  Manager{User} to User with builtInEntity
  Customer{User} to User with builtInEntity
}

/* TENANT CORE */

relationship OneToMany {
  Tenant{agency(name)} to RealEstateAgency{tenant(name)}
  Tenant{branch(name)} to Branch{tenant(name)}
  Tenant{agent(name)} to RealEstateAgent{tenant(name)}

  Tenant{customerMembership(id)} to CustomerMembership{tenant(name) required}
  Tenant{property(title)} to Property{tenant(name)}
  Tenant{media(id)} to Media{tenant(name)}

  Tenant{subscription(id)} to PlanSubscription{tenant(name)}
  Tenant{campaign(name)} to Campaign{tenant(name)}

  Tenant{manager(name)} to Manager{tenant(name)}
  Tenant{sale(id)} to Sale{tenant(name)}
  Tenant{favorite(id)} to Favorite{tenant(name)}

  Tenant{propertyView(id)} to PropertyView{tenant(name)}


  RealEstateAgency{realEstateAgent(name)} to RealEstateAgent{realEstateAgency(name)}
  RealEstateAgency{branch(name)} to Branch{realEstateAgency(name)}

  Country{state(name)} to State{country(name)}
  State{city(name)} to City{state(name)}
  City{neighborhood(name)} to Neighborhood{city(name)}
  City{interestedProfile(id)} to InterestProfile{city(name)}
  State{interestedProfile(id)} to InterestProfile{state(name)}


  Branch{property(title)} to Property{branch(name)}
  Neighborhood{property(title)} to Property{neighborhood(name)}

  Property{media(id)} to Media{property(title)}
  Branch{media(id)} to Media{branch(name)}
  RealEstateAgency{media(id)} to Media{realEstateAgency(name)}

  Customer{membership(id)} to CustomerMembership{customer(name) required}
  CustomerMembership{interestedProfile(id)} to InterestProfile{customerMembership(id) required}
  Sale{splits(id)} to SaleCommissionSplit{sale(contractNumber) required}
}

relationship ManyToMany {
  Manager{realEstateAgency} to RealEstateAgency{manager}
  Media{tag(name)} to Tag{media(id)}
  Property{tag(name)} to Tag{property(id)}
}

relationship ManyToOne {
  Visit{property(title)} to Property

  Property{broker(id)} to User with builtInEntity
  Visit{requestedBy(id) required} to User with builtInEntity
  Visit{assignedTo(id)} to User with builtInEntity
  Visit{visitor(id)} to Customer
  Visit{canceledBy(id)} to User with builtInEntity
  Visit{proposedBy(id)} to User with builtInEntity
  Visit{rescheduledFrom(id)} to Visit
  AvailabilitySlot{responsible(id)} to User with builtInEntity
  Visit{availabilitySlot(id)} to AvailabilitySlot
  AvailabilitySlot{property(title)} to Property
  CustomerMembership{branch(name)} to Branch
  CustomerMembership{campaign(name)} to Campaign
  CustomerMembership{responsibleBroker(id)} to RealEstateAgent
  InterestProfile{referenceProperty(title)} to Property
  Property{owner(name)} to Customer
  RealEstateAgent{profileImage(id)} to Media
  Manager{profileImage(id)} to Media
  PlanSubscription{plan(name)} to Plan

  Sale{property(title) required} to Property
  Sale{buyer(name) required} to Customer
  Sale{seller(name)} to Customer
  Sale{primaryBroker(id) required} to RealEstateAgent
  Sale{branch(name) required} to Branch
  Sale{visit(id)} to Visit

  SaleCommissionSplit{agent(id) required} to RealEstateAgent

  Favorite{user(login) required} to User with builtInEntity
  Favorite{property(title) required} to Property

  PropertyView{property(title) required} to Property
  PropertyView{user(login)} to User with builtInEntity

  Lead{tenant(name) required} to Tenant
  Lead{customer(name)} to Customer
  Lead{propertyOfInterest(title)} to Property
  Lead{responsible(login)} to User with builtInEntity
}

paginate Tenant, Plan, PlanSubscription, RealEstateAgency, Branch, RealEstateAgent, Manager, Customer, CustomerMembership, Campaign, InterestProfile, Property, AvailabilitySlot, Visit, Media, Tag, Country, State, City, Neighborhood, Sale, SaleCommissionSplit, Favorite, PropertyView, Lead with pagination

paginate Property, Customer, CustomerMembership, Lead with infinite-scroll
dto all with mapstruct
service all with serviceImpl

```