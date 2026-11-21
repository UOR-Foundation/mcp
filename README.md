![UOR MCP preliminary banner: protocol core. Generic UOR placeholder, not approved](assets/readme-banner-PLACEHOLDER.png)

*Illustrative generic UOR placeholder artwork, pending UOR Foundation brand approval.*

# UOR MCP protocol core

**Define how MCP requests should behave, and make those rules checkable.**

## Why this exists

Apps that connect AI assistants to tools need agreement about the messages
they send, the errors they return, and what happens when a task continues
across more than one request. Small differences between implementations
can create confusing failures or unexpected behavior.

This repository models a **server-side core for the Model Context Protocol
(MCP)** using [LexLean](https://github.com/UOR-Foundation/lexlean). It
describes protocol messages and decisions in a precise form, so those
rules can be examined and tested rather than reimplemented from scratch.

**Important:** This is source code for a protocol core, not a hosted MCP
server or a production-ready connection. The README's own
[conformance status](#status) explicitly limits what has been tested
against MCP's external specification.

## What you can find here

- [Protocol models](src/): typed requests, results, errors, and handling rules.
- [Tasks and longer-running work](TASKS.md): task state and lifecycle rules.
- [Tool behavior](TOOLS.md): tool catalogs, calls, and related checks.
- [Transport details](TRANSPORT.md): Streamable HTTP decisions and limits.
- [Current conformance evidence](CONFORMANCE-RUN.md): which outside checks
  have actually been exercised, and what remains unsupported.

## Start here

1. Read [Status](#status) to distinguish implemented models from validated
   interoperability.
2. Use the [module index](#status) to find a specific protocol behavior.
3. See [CI.md](CI.md) and [VERIFICATION.md](VERIFICATION.md) for the
   repository's actual verification boundary.

The project is not yet bound to a released PrismPM SDK, so the usual
`just vv` and devcontainer workflow are unavailable until its locks are
in place. Do not treat that absence as a passing acceptance test.

## Contents

- [Why this exists](#why-this-exists)
- [What you can find here](#what-you-can-find-here)
- [Start here](#start-here)
- [Technical scope](#technical-scope)
- [Status](#status)
- [Repository](#repository)

## Technical scope

The [Model Context Protocol](https://modelcontextprotocol.io) revision
`2026-07-28`, implemented as a server protocol core in
[LexLean](https://github.com/UOR-Foundation/lexlean).

Conformance to MCP is established only by MCP's own oracles: the
`2026-07-28` schema and the `modelcontextprotocol/conformance` suite, run
against a conformance build of this core with the suite's fixture tools. The
same core artifact, by digest, is linked unchanged by
[UOR-Foundation/lexlean-mcp](https://github.com/UOR-Foundation/lexlean-mcp)
and by any other LexLean-authored MCP server.
## Status

The protocol core is modeled in LexLean language 1.2 under `src/` (project
`lexlean.toml`, module prefix `UorMcp`, locked by `lexlean.lock`). It
type-checks, builds and verifies under Lean 4.32.1 with an exact axiom policy
on every declaration and no `sorry`. Nothing in it is yet checked against
MCP's own oracles, so this repository makes no conformance claim.

| Module | Source of |
| --- | --- |
| `Json` | the closed JSON value type, object member lookup and the typed accessors every decoder uses |
| `JsonRpc` | the JSON-RPC 2.0 envelope: request, notification, result and error responses, ids, and the error codes `-32700`, `-32600` to `-32603`, `-32020` to `-32022` |
| `Common` | shared schema types: roles, logging levels, icons, `Implementation`, annotations, progress tokens, and the `ttlMs` and `cacheScope` cache hint |
| `Capabilities` | client and server capabilities and the `io.modelcontextprotocol/tasks` extension identifier |
| `Content` | content blocks, resources, resource templates, prompts and tools |
| `Input` | multi-round-trip input: elicitation, sampling and roots requests and responses, `InputRequiredResult`, and the capability each request needs |
| `Tasks`, `TaskJson`, `TaskServe`, `TaskFixture`, `TaskLaws` | the tasks extension: the task state machine (`DetailedTask`, `CreateTaskResult`, the plan a task follows, `settle`, `answer` and `cancel`), the wire form of a task and of the host's task table, `tasks/get`, `tasks/update`, `tasks/cancel` and the decision of `tools/call` to answer a task, the seven fixture tools of the tasks scenarios, and the theorems of the lifecycle ([TASKS.md](TASKS.md)) |
| `Meta` | the request `_meta` keys (`protocolVersion`, `clientCapabilities`, `clientInfo`, `logLevel`, `progressToken`), `resultType` and the result `_meta` with `serverInfo` |
| `Methods` | the server method names, typed params and results for `server/discover`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `resources/templates/list`, `prompts/list`, `prompts/get`, `completion/complete`, `tasks/get`, `tasks/update` and `tasks/cancel`, and which methods may answer `input_required` or `task` |
| `Refusal` | the typed, closed refusals (`-32602`, `-32601`, `-32020`, `-32022`, `-32021`, `-32603`) and their JSON-RPC error objects |
| `Decode` | decoding a validated `params` object into the typed params of each method |
| `Validation` | per-request validation: the required `_meta` keys, header and body agreement, version support, and the order in which refusals are chosen |
| `Extension` | the interface through which a tool layer contributes tools, resources, resource templates and prompts (the `Provider` record) |
| `Dispatch` | dispatch from a validated request to a reply or a typed refusal, parameterized over the `Provider` |
| `Utf8`, `JsonText`, `JsonRead`, `JsonWrite`, `JsonCodec` | the JSON text codec: RFC 3629 validation, a parser from bytes to `Json` and an encoder back, with typed refusals, against the pinned JSONTestSuite ([JSON-CODEC.md](JSON-CODEC.md)) |
| `JsonGate`, `JsonExamples`, `JsonRoundTrip` | theorems about the codec |
| `Envelope` | the result envelope: `resultType` and `_meta` `io.modelcontextprotocol/serverInfo` |
| `Param`, `Base64`, `Http`, `HeaderLaws` | the HTTP exchange as data: header fields read without regard to case, repeated and malformed fields refused, the Base64 sentinel decoded, `Mcp-Param` headers compared by kind, and theorems about them ([LIFECYCLE.md](LIFECYCLE.md)) |
| `RpcWire`, `ResultJson`, `Status`, `Frame` | JSON-RPC faults before a request exists, the result bodies of `server/discover`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `resources/templates/list`, `prompts/list`, `prompts/get` and `completion/complete` as JSON, the HTTP status of every outcome with kernel-checked theorems, and the first-order frame that is the boundary encoding |
| `Serve`, `Fixture`, `Crowd` | the pipeline from an encoded request to an encoded response, and its production roots `fixtureRun` over the tool catalog of the conformance fixture and `crowdRun` over a catalog of 60 tools ([LIFECYCLE.md](LIFECYCLE.md), [TOOLS.md](TOOLS.md)) |
| `Sha256`, `Hmac`, `RequestState`, `InputGuard`, `Interact`, `InputFixture`, `InputLaws` | input-required results (SEP-2322): SHA-256 and HMAC-SHA-256 with the RFC 4231 test cases as theorems, the tamper-evident `requestState` sealed and opened under the host's key, the guard that opens a presented state and validates `inputResponses` before a tool runs and seals the state a tool hands out, the interactive tool engine, the eight input-required tools of the conformance fixture, and their theorems ([INPUT-REQUIRED.md](INPUT-REQUIRED.md)) |
| `Numeric`, `JsonEq`, `Schema`, `Admission`, `Sanitize`, `Tools`, `ToolLaws` | the tools layer: number comparison, JSON equality, a JSON Schema 2020-12 validator, catalog admission and the parameter rules derived from `x-mcp-header`, output sanitization, `tools/list` and `tools/call`, the rate-limit decision, and their theorems ([TOOLS.md](TOOLS.md)) |
| `Resources`, `ResourceFixture`, `ResourceLaws` | the resources layer: `resources/list`, `resources/read`, `resources/templates/list`, `prompts/list`, `prompts/get` and `completion/complete`, their refusals and cache hints, the catalogs of the conformance fixture, and their theorems ([RESOURCES.md](RESOURCES.md)) |
| `Transport`, `TransportLaws` | the Streamable HTTP transport: the response event stream and its framing, the `Accept` negotiation, the `Origin` and `Host` allow-list against DNS rebinding, and their theorems ([TRANSPORT.md](TRANSPORT.md)) |
| `ConformanceFixture` | the root of the conformance build, `conformanceRun`: the step serve over the fixture provider, which asks the host to store the task table ([TASKS.md](TASKS.md), [CONFORMANCE-RUN.md](CONFORMANCE-RUN.md)) |
| `HostEffect`, `StepServe`, `StepFixture`, `StepLaws` | a provider's request for a host effect as a typed outcome (`CallOutcome.perform`, `ReadOutcome.perform`, `PromptOutcome.perform`), the step serve that reads PrismPM's turn and writes its step, the fixture root `stepFixtureRun`, and their theorems ([PROVIDER-EFFECTS.md](PROVIDER-EFFECTS.md)) |

What is not modeled: the `subscriptions/listen` stream (its params and result types are declared,
but the method is not dispatched), server notifications other than progress and task
status, and host effects (sockets, the loopback binding, closing a stream). The core keeps no
state: the host holds the task table ([TASKS.md](TASKS.md)).

- The claim registers in `model/` hold the JSON text codec (JC-01 to JC-14), the
  stateless lifecycle and HTTP header capabilities of #7 (LC-01 to LC-16, HH-01 to HH-13),
  the tools of #8 (TL-01 to TL-18), the resources, resource templates, prompts,
  completion and caching capabilities of #9 (RP-01 to RP-19), the Streamable HTTP
  transport of #11 (SH-01 to SH-10), the input-required results of #10
  (IR-01 to IR-19) and the tasks extension of #12 (TK-01 to TK-16).
  The conformance build and the oracle run of #13 (CF-01 to CF-07) are in
  [CONFORMANCE-RUN.md](CONFORMANCE-RUN.md): the pinned suite's server scenarios and the
  2026-07-28 schema are run over the served core, and that file lists, scenario by scenario,
  what passes and what does not. No other protocol capability is registered and none is
  claimed.
- The repository is not bound to a PrismPM SDK release (#4): `prismpm.lock` and
  `template.lock` are absent, so `just vv` and the devcontainer cannot run.
- v0.1.0 is tracked in #16.

v0.1 is scoped to Streamable HTTP. stdio servers, MCP Apps and resource-server
authorization have no executable oracle at the pinned revisions, so no
conformance claim is made for them (#15).

## Repository

This is an instance of the [UOR template](https://github.com/UOR-Foundation/template).

- [AGENTS.md](AGENTS.md) sets the rules every change follows (R1–R6).
- [TEMPLATE-CONTRACT.md](TEMPLATE-CONTRACT.md) defines inherited policy and the
  SDK and template update process.
- [VERIFICATION.md](VERIFICATION.md) defines the acceptance boundary; `just vv`
  is the complete gate.
- [CI.md](CI.md) describes the workflow that runs every gate that works without
  the SDK, and how to read its failures.

Licensed under [MIT](LICENSE-MIT) or [Apache-2.0](LICENSE-APACHE).
