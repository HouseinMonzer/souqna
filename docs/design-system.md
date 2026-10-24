# Design system

"Modern Levantine Souq": warm, earthy, trustworthy. Editorial type, generous
whitespace, olive brand colour with a terracotta accent.

- Live showcase: run `npm run dev` in `client/` and open `/design`
  (development only; compiled out of production builds).
- Tokens: `client/src/styles/tokens.css`
- Components: `client/src/components/ui/` (import from `components/ui`)

## Tokens

| Layer | Use |
| --- | --- |
| Palette — `brand`, `sand`, `accent` (50–950), `success/warning/danger/info` | Illustration and one-offs: `bg-brand-100`, `text-accent-600` |
| Semantic roles — `bg`, `surface`, `surface-muted`, `border`, `fg`, `fg-muted`, `primary`, `accent`, … | Everything in components: `bg-surface text-fg border-border` |

Semantic roles switch with the theme. Dark mode is enabled by
`data-theme="dark"` on any ancestor (`dark:` utilities follow the same rule).
It is currently used by the showcase only; the app turns it on in Phase 3,
once pages no longer hard-code colours.

`client/src/styles/tokens.test.ts` checks every text/background role pair
against WCAG AA (4.5:1 text, 3:1 UI) in both themes — change a colour and CI
tells you if it breaks contrast.

Typography: Fraunces (Latin display), Inter (text), IBM Plex Sans Arabic
(all Arabic). All self-hosted via Fontsource. Sizes `text-xs`…`text-5xl` are
fluid between 360px and 1280px.

Shape and motion: `rounded-sm|md|lg|xl` (6/10/16/24px), `shadow-sm|md|lg`,
durations `--duration-fast|base|slow` (150/250/400ms) with `--ease-standard`.
All motion is removed under `prefers-reduced-motion`.

## Rules

1. **Logical properties only**: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`,
   `end-*`, `text-start`. Directional icons get `rtl:rotate-180`.
2. **Semantic colours in components**, never hex values or palette steps for
   text and surfaces.
3. **No hard-coded UI strings.** Built-in component labels live under `ui.*`
   in `client/src/locales/{en,ar}.json`.
4. **Prices** use `formatPrice()` / `<PriceTag>`: `$1,250.50` in both
   languages, isolated with `<bdi>` in RTL.
5. **Icons** come from `lucide-react`; emoji are not used as UI icons.
6. **Accessibility is built in, keep it**: `IconButton` requires `label`,
   `DialogContent`/`SheetContent` require `title`, `FormField` wires labels and
   errors. Don't bypass these with raw elements.

## Components

Button, IconButton, Input, Textarea, Select, Label, FormField, Checkbox,
RadioGroup/RadioItem, Switch, Card, Badge, Avatar, Dialog, Sheet, Drawer,
DropdownMenu, Tabs, Tooltip, Toast (`toast()` / `<Toaster>`), Skeleton,
ProductCardSkeleton, EmptyState, Pagination, Breadcrumbs, Rating,
RatingInput, PriceTag, QuantityStepper, ImageGallery, DataTable, Spinner.

Behavioural tests: `client/src/components/ui/ui.test.tsx` (`npm test` in `client/`).
