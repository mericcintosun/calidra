# Security

Calidra is a static-plus-server-rendered Next.js app. It has no accounts, no API keys, no database and no server write route. Sites made on `/new` stay in the visitor's own browser (localStorage).

## 1. Contracts and chain

None. The repo has no `contracts/` directory, deploys no smart contract and reads no chain.

## 2. Wallet permissions

None are requested. There is no wallet code: no `window.ethereum`, no `eth_requestAccounts`, no signing call, and no wallet library (wagmi, viem, ethers) in `package.json`.

## 3. Approvals and spenders

None. Calidra never asks for a token approval and names no spender.

## 4. Source

https://github.com/mericcintosun/calidra

Outbound data: the server calls the keyless Open-Meteo forecast, archive and geocoding APIs (HTTPS, through `lib/http.ts`). Every `/api/*` query is checked with zod (`lib/schemas.ts`), errors return a fixed code and hint, and request bodies and query text are not logged. To report a problem, open an issue on the repo above.
