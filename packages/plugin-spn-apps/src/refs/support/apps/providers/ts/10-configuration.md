<!-- spn:restates
{
  "docs": [
    {
      "path": "spn-foundation/docs/04-capabilities/02-support/01-apps/10-providers/ts/10-configuration.md",
      "seen": "7a437091"
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
{CODE}_RESOURCE_{FAM}_{WORLD}_*               ← estate-published connection blocks
{CODE}_ORG_* · {CODE}_PLATFORM_*              ← estate-published identity, read at the point of use
{CODE}_{MODULE}_*                             ← module namespaces
```

**Derive the prefix from the application's declared code**, uppercased with hyphens replaced by underscores. Apply the same normalization to every segment built from a name. **Never hardcode a prefix that could be derived.** The code also namespaces runtime resources, so two applications sharing one cache never collide.

**A service application of a platform passes the platform code**, because that is the shared world the estate publishes into and what platform-wide session sharing requires. A standalone application passes its own.

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

- **The local file is generated against the application's local infrastructure registration**, and its ports come from the hundred local ports the platform declares (`RD.SUPPORT.INFRA.062`): the service's own port at `+30`–`39` from the range's first port, and its health port ten above it.
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
- **Auth** carries the signing secret and its rotation fallback, the auth cache prefix and lifetime, and the sudo-mode freshness windows.

**A signing secret rotates without signing anybody out.** A rotation is two deployments: first set the fallback to the old secret and the secret to a new one, then empty the fallback once every token the old secret signed has expired.

## Resource blocks

**Connections arrive as published blocks, and no connection-name list exists.** The loader opens the application world in every family, the migration world in the database family, and one block per custom schema the application declares.

**Provider selection runs through each block's own selector, and provider keys nest beneath it.** An unrecognized provider fails boot for an expected block.

- **Which credential pair a connection opens is the service's choice at boot** — the migration pair for a migrate run, the read-only pair for reporting, the read-write pair otherwise. The store says what exists and never chooses.
- **The database block's schema list is the grant published as data.** The first entry is the primary schema and the rest are appended to the search path, so unqualified reads resolve. An empty list fails boot with an explicit error.
- **The application cache block also backs the lock provider.**
- **The queue's client id derives from the declared code, and the topic list comes from the application's own declaration** — neither is an environment variable. Each declared topic gets a paired error topic built at boot.
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
- **No secret has a default.** An empty signing secret fails boot by name, because a default would be a secret everyone who reads the source holds.
- **Non-secret configuration and secrets follow the same path scheme in the cloud**, and only the backing store differs.
