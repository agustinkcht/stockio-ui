# Contactos — Clientes & Proveedores

> Module: `/contactos/clientes` and `/contactos/proveedores`
> Files: `app/contactos/clientes/page.tsx`, `app/contactos/proveedores/page.tsx`
> Last verified against implementation: this revision

---

## At a glance

Contactos is the address book of the app: two near-identical CRUD screens, one for **Clientes** (customers) and one for **Proveedores** (suppliers). Each page renders a searchable, filterable, sortable list of contacts with row-level selection, single and bulk delete, and modal-based create/edit. The two pages are structural twins — same layout skeleton, same search/filter/sort/selection machinery, same modal pattern — differing only in the entity they manage, the hook that persists it (`useClientes` vs `useProveedores`), the transaction source they read for context (`useVentas` vs `useCompras`), and the id prefix they mint (`CLI-` vs `PROV-`).

Both entities share an **identical TypeScript shape** (`Cliente` and `Proveedor` are field-for-field the same interface), so the two pages can be understood as one module parameterized by entity. Data is per-account localStorage (`stockio-clientes-{account}` / `stockio-proveedores-{account}`), seeded from account-specific initial datasets on first load. There is **no detail route** — a contact is only ever viewed/edited through its modal.

---

## Quick facts

| Fact | Clientes | Proveedores |
|------|----------|-------------|
| Route | `/contactos/clientes` | `/contactos/proveedores` |
| Page file | `app/contactos/clientes/page.tsx` | `app/contactos/proveedores/page.tsx` |
| Data hook | `useClientes` | `useProveedores` |
| Transaction hook (read-only context) | `useVentas` | `useCompras` |
| Grid component | `ClientesGrid` | `ProveedoresGrid` |
| Storage key | `stockio-clientes-{account}` | `stockio-proveedores-{account}` |
| Seed (invino / noire) | `initial-clientes-{account}` | `initial-proveedores-{account}` |
| Id format | `CLI-###` / `CLI-{timestamp}` | `PROV-###` |
| Type | `Cliente` (`lib/data/clientes.ts`) | `Proveedor` (`lib/data/proveedores.ts`) |
| Detail route | none (modal only) | none (modal only) |

---

## File & component map

| Path | Role |
|------|------|
| `app/contactos/clientes/page.tsx` | Clientes list page (wrapped in `<Suspense>` via `ClientesContent`) |
| `app/contactos/proveedores/page.tsx` | Proveedores list page (twin structure) |
| `hooks/use-clientes.ts` | Cliente CRUD + per-account localStorage persistence |
| `hooks/use-proveedores.ts` | Proveedor CRUD (same shape, memoized with `useCallback`) |
| `components/clientes/clientes-grid.tsx` | Renders the cliente rows + row checkboxes / edit / delete triggers |
| `components/proveedores/proveedores-grid.tsx` | Twin grid for proveedores |
| `components/modals/nuevo-cliente-modal.tsx` | Create-cliente modal |
| `components/modals/editar-cliente-modal.tsx` | Edit-cliente modal |
| `components/modals/nuevo-proveedor-modal.tsx` | Create-proveedor modal |
| `components/modals/editar-proveedor-modal.tsx` | Edit-proveedor modal |
| `lib/data/clientes.ts` | `Cliente` interface + static `CLIENTES` sample |
| `lib/data/proveedores.ts` | `Proveedor` interface + static `PROVEEDORES` sample |

---

## Data model

Both interfaces are identical:

```ts
interface Cliente /* === Proveedor */ {
  id: string
  nombre: string
  apellido: string
  razonSocial?: string
  cuit?: string
  dni?: string
  email?: string
  telefono?: string
  direccion?: string
  ciudad?: string
  provincia?: string
  codigoPostal?: string
  condicionIva: "Consumidor Final" | "Responsable Inscripto" | "Monotributista" | "Exento"
  tipo: "particular" | "empresa"
  transactionCount: number
}
```

**Invariants & conventions**
- **Display name is derived, not stored.** For `tipo === "empresa"` with a `razonSocial`, the name is `razonSocial`; otherwise it is `` `${nombre} ${apellido}` ``. Empresa contacts routinely have empty `nombre`/`apellido`.
- **`transactionCount` is a stored counter, not a live aggregate.** It is a field on the record, incremented explicitly via `incrementTransactionCount` / `incrementProveedorTransaction` (called by the ventas/compras flows), and used directly for the "transacciones" sort. It is **not** recomputed from `useVentas`/`useCompras` on render.
- **`condicionIva` and `tipo` are the only two filterable dimensions.**

---

## State & data flow

**Persistence (both hooks)**
- Data lives in localStorage under a per-account key; on first load (no key yet) the hook lazy-imports the account-specific seed (`invino` / `noire`) and writes it back.
- Every mutation goes through a private `saveClientes` / `saveProveedores` that both `setState` and writes localStorage in one step.
- `useProveedores` wraps all its callbacks in `useCallback`; `useClientes` does not — behaviorally equivalent, just a memoization difference.

**Page-local UI state (identical on both pages)**
- `searchQuery`, `activeFilters` (`{ tipo, condicionIva }`), `sortField` (`"nombre" | "transacciones"`), `sortDir` (`"asc" | "desc"`).
- `contactoSelected: boolean[]` — a positional selection array aligned to the **filtered** list, plus an indeterminate "select all" checkbox ref.
- Modal state: `showNuevo`, `contactoToEdit`, `contactoToDelete`, `showBatchDeleteModal`, `showSaveSuccess`.

**Derived list**
`filtered = clientes → search filter → tipo filter → condicionIva filter → sort`. Search matches nombre / apellido / razonSocial / cuit / dni / email (case-insensitive). Recomputed via `useMemo` on any input change.

---

## Layout & structure

Both pages share the app shell: left `Sidebar`, a dark (`#1B1C20`) utility bar with `Breadcrumb` + centered `UserPanel` + a transient "Cambios guardados" success pill, then a scrollable panel containing:

1. **Title row** — page title (`Clientes` / `Proveedores`) + primary "Nuevo …" button.
2. **Sticky bar (2 rows):**
   - Row 1: search input + active filter tags + Filtrar popover + Ordenar split control (direction toggle + field select) + result count.
   - Row 2: bulk-action strip (select-all checkbox, selected count, bulk delete) sitting above the grid header.
3. **Grid** — `ClientesGrid` / `ProveedoresGrid` renders the rows.
4. **Modals** — create / edit / delete-confirm / batch-delete-confirm.

---

## Behaviors

- **Search** — free-text across the identity fields listed above.
- **Filter** — `tipo` (Particular / Empresa) and `condicionIva` (4 fixed options from `CONDICIONES_IVA`); active filters render as removable tags and can be cleared in-popover.
- **Sort** — by derived name or by `transactionCount`, asc/desc via the direction toggle.
- **Selection** — positional `boolean[]` over the filtered list; select-all sets every visible row; the array **resets whenever `filtered.length` changes** (see gotcha).
- **Create** — modal collects a full record; page mints the id (`CLI-###` / `PROV-###`, zero-padded from list length) and calls `addCliente`/`addProveedor` with `transactionCount: 0`.
- **Edit** — modal edits an existing record via `updateCliente`/`updateProveedor(id, updates)`.
- **Delete** — single (confirm modal) or bulk (collects selected ids, deletes each, clears selection); both flash the success pill for 3s.

---

## Public API (hooks)

`useClientes()` → `{ clientes, isLoading, addCliente, updateCliente, deleteCliente, getClienteById, incrementTransactionCount }`

`useProveedores()` → `{ proveedores, isLoading, addProveedor, updateProveedor, deleteProveedor, getProveedorById, incrementProveedorTransaction }`

Note the **asymmetry in `add`**: `addCliente(Omit<Cliente,"id"|"transactionCount">)` mints its own id (`CLI-{Date.now()}`) and returns the new record; `addProveedor(Proveedor)` expects a **fully-formed** object (id included). The pages paper over this by always passing a complete object with a `###`-style id, so in practice `addCliente` ignores its internal id path — worth knowing if you call the hooks directly.

---

## Gotchas & edge cases

1. **`transactionCount` is a denormalized counter.** It is only correct if every venta/compra flow remembers to call the corresponding `increment…` method. It does not self-heal from the transaction lists, so a contact deleted-and-recreated, or a transaction created outside the normal flow, can drift. Do not treat it as a source of truth for "how many sales does this customer have".
2. **Selection is positional and resets on list change.** `contactoSelected[i]` maps to `filtered[i]`, and a `useEffect` clears the whole array whenever `filtered.length` changes. Typing in search or toggling a filter therefore drops the current selection — intended, but easy to break if you refactor the list.
3. **Two id-minting conventions coexist.** Pages use `CLI-###`/`PROV-###` (padded from list length), but `useClientes.addCliente` internally uses `CLI-{Date.now()}`. Padding from `length` can collide after deletes (e.g. delete #2 of 3, next add is `#003` again). Prefer a monotonic scheme if you touch this.
4. **`addCliente` vs `addProveedor` signatures differ** (see Public API) — don't assume they're interchangeable.
5. **No detail page.** All viewing/editing is modal-based; there is no `/contactos/clientes/[id]` route to link to.
6. **Clientes reads `useVentas`, Proveedores reads `useCompras`** — the imported transaction hook is currently context/plumbing; the visible count comes from the stored `transactionCount`, not these lists.

---

## Change-safety checklist

- [ ] Changing the `Cliente`/`Proveedor` shape? Update **both** `lib/data/*.ts` interfaces (they are meant to stay identical) and every modal.
- [ ] Touching selection? Preserve the positional `boolean[]` ↔ `filtered` alignment and the reset-on-length-change effect.
- [ ] Changing id minting? Reconcile the page (`###`) and hook (`Date.now()`) conventions; guard against post-delete collisions.
- [ ] Adding a filter/sort dimension? Wire it into `activeFilters`, the `useMemo` derived list, the popover, the tags, and the sort `<select>`.
- [ ] Relying on `transactionCount`? Confirm the write path (venta/compra `increment…`) actually fires; don't assume it reflects the live transaction lists.
- [ ] Editing one page? Apply the mirror change to its twin unless the divergence is intentional.
