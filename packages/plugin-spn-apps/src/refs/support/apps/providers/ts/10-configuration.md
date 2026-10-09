<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/10-configuration.md",
      "seen": "05aef126"
    }
  ]
}
-->
# Configuration — how configuration and environment are read

**Source of truth:** the foundation's `10-providers/ts/10-configuration.md`. Read this as the restatement; that chapter governs.

**Every application variable is `{CODE}_<NAMESPACE>_<KEY>`, built left to right from the owning layer.**

```
APP_ENV / APP_MODE / NODE_ENV                 ← bootstrap, unprefixed
{CODE}_LOG_*                                  ← app shell: logging
{CODE}_API_*                                  ← app shell: the API entry
{CODE}_AUTH_*                                 ← app shell: auth defaults
{CODE}_REMOTE_*                               ← app shell: remote calls — the credential, the timeout, where each service is
{CODE}_RESOURCE_{FAM}_{WORLD}_*               ← estate-published connection blocks
{CODE}_ORG_* · {CODE}_PLATFORM_*              ← estate-published identity, read at the point of use
{CODE}_{MODULE}_*                             ← module namespaces
```

**Derive the prefix from the application's declared code**, uppercased with hyphens replaced by underscores. Apply the same normalization to every segment built from a name. **Never hardcode a prefix that could be derived.** The code also namespaces runtime resources, so two applications sharing one cache never collide.

**A service application of a platform passes the platform code**, because that is the shared world the estate publishes into and what platform-wide session sharing requires. **A service in a space passes the platform's code and then the space's code**, joined by an underscore: the sample service, in the space `sas` of `dmo`, passes `'DMO_SAS'` (`RD.SUPPORT.INFRA.112`), so its own keys and the keys the estate publishes for its space start the same way. A prefix is one word for a service on the platform and two words for a service in a space. A standalone application passes its own.

**A service in a space whose row keeps the platform is given both layers.** It reads its own settings under `{SPC}_{SPACE}_`, and its settings file names a platform key by reference, as for a second queue connection that points at the platform's queue: `DMO_SAS_RESOURCE_QUEUE_CONNECTIONS=APP,PLATFORM` and `DMO_SAS_RESOURCE_QUEUE_PLATFORM_ENDPOINTS=${DMO_RESOURCE_QUEUE_APP_ENDPOINTS}`.

## The bootstrap variables

**Read these without the prefix, because they exist before — and select — the application config.**

| Variable | Default | Meaning |
| --- | --- | --- |
| `APP_ENV` | `local` | which `envs/<APP_ENV>.env` file to load, and the environment stamped into the config |
| `APP_MODE` | `ALL` | what the process runs — everything, the API, the queue, one CLI command, or the migration runner. Normalized on read, so lowercase reaches the same branch |
| `NODE_ENV` | — | `production` disables debug |

**Set these on the command line or by the deployment, never in an environment file** — the file has not been loaded when `APP_ENV` is read.

## The `envs/` convention

**An application carries an `envs/` folder with one file per `APP_ENV` value**, loaded if it exists. The entry reads `APP_ENV` through `getEnvGeneric`, like every bootstrap variable, and never through `process.env` (`RD.SUPPORT.APPS.136`). The file is optional by design, because a cloud deployment reads real environment variables from the parameter store.

- **The local file is generated against the application's local infrastructure registration**, and its ports come from the five hundred local ports the platform declares (`RD.SUPPORT.INFRA.062`): the service's own port at `+100`–`149` from the range's first port, its health port at that port plus 50 (`+150`–`199`), its remote port at that port plus 100 (`+200`–`249`), and the engines of its world in that world's ten of the first hundred — the platform's at `+000`–`009`, a space's at `+010`–`099`.
- **The cloud file is the reference**: the same variable set with cloud-shaped values, documenting what a deployment must provide. It may declare reserved slots the loader does not read yet — treat those as names, not live configuration.
- **A comment carries the rationale for every non-obvious value.**

## Reading

**Read the environment only through the helpers, never the raw process environment.** That includes migrations.

| Helper | Reads |
| --- | --- |
| `getEnvPrefix` | the prefixed key, throwing where it is required and missing |
| `getEnvGeneric` | an unprefixed key — only for the bootstrap variables |
| `getEnvString` · `getEnvInt` · `getEnvBool` | one typed value with a default |
| `getEnvArray` | a comma-separated list, trimmed, with empties dropped |

**A comma-separated list is the grammar's only collection form** — connection lists, schema lists, broker lists and topic lists all use it.

## Provider selectors

**A selector value is `UPPER_SNAKE_CASE`**, because it names a platform-owned choice like any other defined code. The loader trims and upper-cases on read, so a file written before the rule keeps deploying unchanged.

**A value an external system defines is exempt** and must be spelled the way that system requires. The queue's authentication mechanism is the live case, and the loader normalizes it downward.

**Every selector is validated into an enum at boot, never cast.** A value outside the accepted set fails immediately, naming the key, the value and what was accepted. Casting would let a typo through as a valid-typed lie and surface later somewhere deep in boot.

| Family | Accepted | Has `NONE` |
| --- | --- | --- |
| log | `BUNYAN` · `CONSOLE` | no — a running application always logs |
| database | `POSTGRESQL` | no — the migration connection requires one |
| cache | `REDIS` | yes |
| queue | `KAFKA` | yes |
| seal | `AWS_KMS` · `LOCAL` | no — a service that seals nothing leaves the family out of its declaration |
| API | `FASTIFY` | yes |
| CLI | `COMMANDER` | yes |

**An unset selector is not `NONE`.** A missing key fails at boot naming the key and listing what is accepted. Defaulting it would collapse two different states into one: somebody forgot the variable, and somebody decided this application has no cache. Only the second is a decision.

## The app-shell namespaces

**These belong to the service-application shell.** An application inherits them by using the boot manager and never redeclares them.

- **Logging** takes a provider, and an unset provider fails boot naming the key.
- **The API entry** carries the provider alone; the listener, CORS, rate-limit and cookie fields live on the provider-specific variant, because a base naming one implementation's needs makes `NONE` unrepresentable. The API reads its token from the authorization header alone, and every cookie a handler writes is host-only and unsigned.
- **The health listener binds its own port**, read once before any entry starts, and never as routes on the serving port. Unset means no health server, and a deployment receives the published default from the deploy render rather than a code default.
- **The API entry's remote and proxy settings:** `{CODE}_API_REMOTE_PORT` is the remote listener, which serves the mounted modules' contract services to the platform's other services (unset: no remote listener opens, and the service serves no contract to others); `{CODE}_API_TRUSTED_PROXIES` and `{CODE}_API_REMOTE_TRUSTED_PROXIES` say how many proxies stand in front of each listener, so the person's address is the entry that many places from the right of the forwarded-address header (default `0`).
- **Auth is in two parts.** Every service reads the first: the auth cache and the sudo-mode freshness windows. Only a service that signs people in sets the issuer's part, read into `config.auth.issuer`: the signing secret (`{CODE}_AUTH_JWT_SECRET`, which signs tokens and every passport's proof), its rotation fallback, the cache prefix and the lifetime. **The four are set together or not at all.** A service that sets none has `config.auth.issuer` as `null`: it signs no token and holds no secret. A service that builds `SPAuthProviderIAMIssuer` refuses to start by the key's name when it is `null`; one that builds the Verifier or the default provider sets none of them.
- **`{CODE}_REMOTE_*` is remote calls**, the service's own block under no entry, so a service whose `{CODE}_API_PROVIDER` is `NONE` reads it too: `_CREDENTIAL_PROVIDER` (`KUBERNETES` · `LOCAL`; unset means the service makes no remote call and serves none, and there is no `NONE`), `_CREDENTIAL_KUBERNETES_TOKEN_PATH` · `_AUDIENCE` (`spn-remote`) · `_NAMESPACES` (`prd,plt,vnd`) · `_ISSUER` (all required under `KUBERNETES`), `_CREDENTIAL_LOCAL_SERVICE` (the application's `kindCode`, required under `LOCAL`), `_TIMEOUT_MS` (default `10000`), `_REMOTE_SERVICE_{NAME}_ENDPOINTS` (published by the estate) and `{CODE}_{MODULE}_REMOTE_ENDPOINTS` (where a module held remotely lives; required for each, and refused when it lists more than one address). A missing fact is refused at boot by the key's name. A service that publishes its modules' contracts sets the remote port; one that consumes another's sets one `_REMOTE_ENDPOINTS` line for each module it holds remotely, written as a reference to what the estate publishes (`DMO_IAM_REMOTE_ENDPOINTS=${DMO_REMOTE_SERVICE_API_ENDPOINTS}`), so moving a module to another service is a change of one settings line and no code (`RD.SUPPORT.INFRA.111`). A worker that only reads the queue sets `{CODE}_API_PROVIDER=NONE` and no remote port. On a machine the provider is `LOCAL` and the address is plain HTTP on the service's local host and remote port.

**A signing secret rotates without signing anybody out.** A rotation is two deployments: first set the fallback to the old secret and the secret to a new one, then empty the fallback once every token the old secret signed has expired. A passport's proof is signed with the same secret and work can wait in a queue longer than a token lives, so keep the fallback for as long as work can wait there.

## Resource blocks

**Connections arrive as published blocks, and no connection-name list exists.** The loader opens the application world in every family, the migration world in the database family, and one block per custom schema the application declares.

**Provider selection runs through each block's own selector, and provider keys nest beneath it.** An unrecognized provider fails boot for an expected block.

- **Which credential pair a connection opens is the service's choice at boot** — the migration pair for a migrate run, the read-only pair for reporting, the read-write pair otherwise. The store says what exists and never chooses.
- **The database block's schema list is the grant published as data.** The first entry is the primary schema and the rest are appended to the search path, so unqualified reads resolve. An empty list fails boot with an explicit error.
- **The application cache block also backs the lock provider.**
- **The queue's client id derives from the declared code, and a queue connection lists no topics** — no environment variable names either. Each module makes its topics by its own `*-queue-topics` migration, and each topic the migration makes gets a paired error topic. No setting turns automatic topic creation on: the service app's boot builds the provider with it off, so publishing or subscribing to a topic that does not exist is an error that names the topic (RD.SUPPORT.APPS.178).
- **No bucket fact publishes for storage.** The bucket is the world's derived store name, and a key never names one.

**The seal block is a selector and, in the cloud, one key id** (`RD.SUPPORT.APPS.166`). The seal is the family that encrypts a stored secret before the row is saved.

```
{CODE}_RESOURCE_SEAL_APP_PROVIDER=AWS_KMS
{CODE}_RESOURCE_SEAL_APP_AWS_KMS_KEY_ID      # the id of the environment's key for stored secrets — plain, not a secret

{CODE}_RESOURCE_SEAL_APP_PROVIDER=LOCAL      # a machine: the selector is the whole block
```

- **The key id is published, never typed.** The environment apply reads it from the cloud and publishes it (`RD.SUPPORT.INFRA.109`). On a machine the block is one line in the service's own `envs/local.env`.
- **No credential pair and no endpoints key publish.** In the cloud the service calls the key service as its own workload role; `LOCAL` uses a fixed constant inside the local provider.
- **The block is opened only for a service that lists `SEAL` in its `connections`.** A service that lists it and has no block fails boot by the missing key's name.
- **A wrong setting stops boot** — a selector outside the accepted set, a missing `KEY_ID` under `AWS_KMS`, or a key the service's role may not use. Boot checks that the service can use its key before the service takes traffic.

## Module namespaces

**A module reads its own variables under the application code followed by the module code**, both normalized the same way. That is what lets the same module class run under any application code.

**Module configuration is contributed at boot by the module itself.** The shell never enumerates module variables, and which variables a module reads is that module's own documentation.

**A module's key whose value the estate publishes is written as a reference in `envs/cloud.env`** (`RD.SUPPORT.INFRA.111`). The estate's key carries no module's name, the module reads its own key, and the app's cloud settings join the two. One comment above the block says who publishes the facts:

```
# The estate publishes the six facts of the tenant edge. The identity module reads its own keys.
DMO_IAM_EDGE_TYPE=${DMO_PLATFORM_INTEGRATION_EDGE_TYPE}
DMO_IAM_EDGE_ROUTE_STORE_ARN=${DMO_PLATFORM_INTEGRATION_EDGE_ROUTE_STORE_ARN}
DMO_IAM_EDGE_TARGET=${DMO_PLATFORM_INTEGRATION_EDGE_TARGET}
DMO_IAM_EDGE_DISTRIBUTION_ID=${DMO_PLATFORM_INTEGRATION_EDGE_DISTRIBUTION_ID}
DMO_IAM_EDGE_CERTIFICATE_REGION=${DMO_PLATFORM_INTEGRATION_EDGE_CERTIFICATE_REGION}
DMO_IAM_EDGE_CUSTOM_DOMAINS=${DMO_PLATFORM_INTEGRATION_EDGE_CUSTOM_DOMAINS}
```

`envs/local.env` carries the module's own keys as literals, because no estate publishes an edge on a machine. The module's code reads `{CODE}_IAM_EDGE_*` in both files and never the published key.

## The platform namespace

**Platform-namespace variables are bootstrap and setup values read at the point of use** by seed migrations and module bootstrap, never parsed into structural configuration. The loader does not read them at all.

- **Runtime code never reads them directly.** The one read is the composition-root parse into the application config, and everything else consumes that config. A migration is the deliberate exception, because a migration must stay self-contained.
- **The prefix is never hardcoded.** A platform package derives it at runtime, so one migration seeds every deployment from its own values.
- **A migration fails fast with an explicit error** on a missing required value, and an optional field falls back to its default.

## Secrets

- **A committed file carries no secret value.** Give a secret variable an empty value and a comment saying it is required in the shell profile locally, and injected from the secret store in the cloud.
- **The secret variables in the standard namespaces** are the signing secret, its rotation fallback, and every user and password pair in a resource block.
- **No secret has a default.** An empty signing secret fails boot by name in a service that sets any of the issuer's four keys (a service that signs nobody in sets none and holds no secret), because a default would be a secret everyone who reads the source holds.
- **Non-secret configuration and secrets follow the same path scheme in the cloud**, and only the backing store differs.
