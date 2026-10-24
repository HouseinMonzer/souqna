// Development-only showcase of the design tokens and UI kit (route: /design).
// Labels are English on purpose; sample content switches with the language so
// RTL rendering can be reviewed.
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Heart, LogOut, Moon, Package, Search, Settings, ShoppingBag, Sun, Trash2, User } from 'lucide-react'
import {
  Avatar, Badge, Breadcrumbs, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Checkbox, DataTable, Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger, Drawer, DrawerContent,
  DrawerTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuTrigger, EmptyState, FormField, IconButton, ImageGallery, Input, Pagination, PriceTag,
  ProductCardSkeleton, QuantityStepper, RadioGroup, RadioItem, Rating, RatingInput, Select, Sheet, SheetContent,
  SheetTrigger, Skeleton, Spinner, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Textarea, Tooltip, toast,
  type Column, type SortState,
} from '../components/ui'

const SCALES = ['brand', 'sand', 'accent'] as const
// Literal class names so Tailwind can find them when scanning the source.
const TYPE_SCALE = [
  ['5xl', 'text-5xl font-display font-semibold'],
  ['4xl', 'text-4xl font-display font-semibold'],
  ['3xl', 'text-3xl font-display font-semibold'],
  ['2xl', 'text-2xl font-display font-semibold'],
  ['xl', 'text-xl'],
  ['lg', 'text-lg'],
  ['base', 'text-base'],
  ['sm', 'text-sm'],
  ['xs', 'text-xs'],
] as const
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const ROLES = [
  'bg', 'surface', 'surface-muted', 'surface-sunken', 'border', 'border-strong', 'fg', 'fg-muted', 'fg-subtle',
  'primary', 'primary-soft', 'accent', 'accent-soft', 'success', 'warning', 'danger', 'info',
]

const COPY = {
  en: {
    product: 'Cold-pressed olive oil, 1L',
    vendor: 'Beit Zeitoun',
    city: 'Byblos',
    review: 'Rich, peppery and fresh. Arrived well packed.',
  },
  ar: {
    product: 'زيت زيتون معصور على البارد، ١ لتر',
    vendor: 'بيت زيتون',
    city: 'جبيل',
    review: 'طعم غني ومنعش، ووصل مغلفًا بعناية.',
  },
}

const swatch = (hue: number, label: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 45% 62%)"/><stop offset="1" stop-color="hsl(${hue + 30} 40% 32%)"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="215" font-family="sans-serif" font-size="44" fill="white" text-anchor="middle">${label}</text></svg>`,
  )}`

interface Row {
  id: string
  order: string
  customer: string
  total: number
  status: 'pending' | 'shipped' | 'delivered'
}

const ROWS: Row[] = [
  { id: '1', order: 'ORD-1042', customer: 'Lina Mansour', total: 64.5, status: 'delivered' },
  { id: '2', order: 'ORD-1043', customer: 'Omar Hassan', total: 18, status: 'shipped' },
  { id: '3', order: 'ORD-1044', customer: 'Sara Ahmad', total: 129.99, status: 'pending' },
]
const STATUS_TONE = { pending: 'warning', shipped: 'info', delivered: 'success' } as const

function Section({ title, children, description }: { title: string; children: ReactNode; description?: string }) {
  return (
    <section className="grid grid-cols-[minmax(0,1fr)] gap-5 border-t border-border py-10">
      <div className="grid gap-1">
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description && <p className="max-w-2xl text-sm text-fg-muted">{description}</p>}
      </div>
      {children}
    </section>
  )
}

function Row({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="grid gap-2">
      {label && <span className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{label}</span>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export default function DesignSystemPage() {
  const { i18n } = useTranslation()
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const copy = COPY[lang]
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [qty, setQty] = useState(2)
  const [stars, setStars] = useState(4)
  const [page, setPage] = useState(5)
  const [loadingTable, setLoadingTable] = useState(false)
  const [sort, setSort] = useState<SortState>({ key: 'total', direction: 'desc' })
  const [email, setEmail] = useState('lina@')

  const sorted = useMemo(() => {
    const factor = sort.direction === 'asc' ? 1 : -1
    return [...ROWS].sort((a, b) => (a[sort.key as keyof Row] > b[sort.key as keyof Row] ? factor : -factor))
  }, [sort])

  const columns: Column<Row>[] = [
    { key: 'order', header: 'Order', sortable: true, cell: row => <span className="font-semibold">{row.order}</span> },
    { key: 'customer', header: 'Customer', cell: row => <span className="flex items-center gap-2"><Avatar name={row.customer} size="xs" />{row.customer}</span> },
    { key: 'status', header: 'Status', cell: row => <Badge tone={STATUS_TONE[row.status]}>{row.status}</Badge> },
    { key: 'total', header: 'Total', sortable: true, align: 'end', cell: row => <PriceTag price={row.total} size="sm" /> },
  ]

  const images = [swatch(85, '1'), swatch(30, '2'), swatch(140, '3'), swatch(200, '4')].map((src, i) => ({ src, alt: `${copy.product} — ${i + 1}` }))

  return (
    <div data-theme={theme} className="min-h-screen bg-bg text-fg">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <p className="font-display text-xl font-semibold">SouQna UI</p>
            <p className="text-xs text-fg-muted">Design tokens &amp; components</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => i18n.changeLanguage(lang === 'en' ? 'ar' : 'en')}>
              {lang === 'en' ? 'العربية' : 'English'}
            </Button>
            <IconButton
              variant="outline"
              size="icon-sm"
              label={theme === 'light' ? 'Dark theme' : 'Light theme'}
              icon={theme === 'light' ? <Moon /> : <Sun />}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="grid gap-3 py-12">
          <Badge tone="accent" className="w-fit">Phase 2</Badge>
          <h1 className="text-5xl font-semibold">Modern Levantine Souq</h1>
          <p className="max-w-2xl text-lg text-fg-muted">
            Warm, earthy and trustworthy. Every colour pair below is contrast-checked in CI, every component works in
            both reading directions, and motion respects reduced-motion settings.
          </p>
        </div>

        <Section title="Colour" description="Palette scales for illustration; semantic roles for components. Roles switch with the theme.">
          {SCALES.map(scale => (
            <div key={scale} className="grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-fg-subtle">{scale}</span>
              <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
                {STEPS.map(step => (
                  <div key={step} className="grid gap-1">
                    <div className="h-12 rounded-md border border-black/5" style={{ background: `var(--color-${scale}-${step})` }} />
                    <span className="text-[10px] tabular-nums text-fg-subtle">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {ROLES.map(role => (
              <div key={role} className="overflow-hidden rounded-md border border-border">
                <div className="h-12" style={{ background: `var(--${role})` }} />
                <p className="bg-surface px-2 py-1.5 font-mono text-[11px] text-fg-muted">{role}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography" description="Fraunces for Latin display, Inter for text, IBM Plex Sans Arabic for Arabic. Sizes are fluid between 360px and 1280px.">
          <div className="grid gap-3">
            {TYPE_SCALE.map(([size, classes]) => (
              <div key={size} className="flex min-w-0 items-baseline gap-4">
                <span className="w-10 shrink-0 font-mono text-xs text-fg-subtle">{size}</span>
                <span className={`${classes} min-w-0 truncate`}>
                  {lang === 'ar' ? 'سوقنا — السوق اللبناني' : 'Shop the Lebanese souq'}
                </span>
              </div>
            ))}
          </div>
          <Row label="Radius & elevation">
            {['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl'].map((r, i) => (
              <div key={r} className={`flex size-24 items-center justify-center bg-surface text-xs text-fg-muted ${r} ${['shadow-sm', 'shadow-md', 'shadow-lg', 'border border-border'][i]}`}>
                {r.replace('rounded-', '')}
              </div>
            ))}
          </Row>
        </Section>

        <Section title="Buttons">
          <Row label="Variants">
            <Button>Primary</Button>
            <Button variant="accent">Add to cart</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Delete</Button>
            <Button variant="link">Link</Button>
          </Row>
          <Row label="Sizes, icons, states">
            <Button size="sm">Small</Button>
            <Button size="lg" startIcon={<ShoppingBag />}>Large</Button>
            <Button endIcon={<Search />} variant="outline">Search</Button>
            <Button loading>Placing order</Button>
            <Button disabled>Disabled</Button>
            <IconButton label="Save to wishlist" icon={<Heart />} variant="outline" />
            <IconButton label="Delete" icon={<Trash2 />} variant="ghost" />
          </Row>
        </Section>

        <Section title="Form controls" description="FormField wires label, hint, error and aria-describedby automatically.">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-4">
              <FormField label="Full name" required hint="As it should appear on the delivery.">
                <Input placeholder="Lina Mansour" />
              </FormField>
              <FormField label="Email" required error={email.includes('.') ? undefined : 'Enter a valid email address'}>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </FormField>
              <FormField label="Search">
                <Input startIcon={<Search />} placeholder={copy.product} />
              </FormField>
              <FormField label="City">
                <Select defaultValue="beirut">
                  <option value="beirut">Beirut</option>
                  <option value="byblos">Byblos</option>
                  <option value="tripoli">Tripoli</option>
                </Select>
              </FormField>
              <FormField label="Delivery note">
                <Textarea placeholder="Call before arriving" />
              </FormField>
            </div>
            <div className="grid content-start gap-5">
              <Checkbox label="Save this address" description="Use it next time you check out." defaultChecked />
              <Checkbox label="Disabled option" disabled />
              <RadioGroup defaultValue="cash" aria-label="Payment method">
                <RadioItem value="cash" label="Cash on delivery" />
                <RadioItem value="wish" label="Wish Money" description="Upload proof of payment." />
                <RadioItem value="omt" label="OMT" />
              </RadioGroup>
              <Switch label="Email me order updates" defaultChecked />
              <Switch label="Auto-approve vendors" />
            </div>
          </div>
        </Section>

        <Section title="Badges, avatars & cards">
          <Row label="Soft">
            {(['neutral', 'brand', 'accent', 'success', 'warning', 'danger', 'info'] as const).map(tone => <Badge key={tone} tone={tone}>{tone}</Badge>)}
          </Row>
          <Row label="Solid & outline">
            <Badge tone="brand" appearance="solid">Verified</Badge>
            <Badge tone="accent" appearance="solid">-20%</Badge>
            <Badge tone="success" appearance="outline">In stock</Badge>
            <Badge tone="danger" appearance="outline">Sold out</Badge>
          </Row>
          <Row label="Avatars">
            <Avatar name="Lina Mansour" size="xs" />
            <Avatar name="Omar Hassan" size="sm" />
            <Avatar name={copy.vendor} size="md" />
            <Avatar name="Sara Ahmad" size="lg" src={swatch(20, 'SA')} />
            <Avatar name={copy.vendor} size="xl" shape="square" src="https://invalid.example/missing.png" />
          </Row>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card interactive className="overflow-hidden">
              <img src={images[0].src} alt="" className="aspect-[4/3] w-full object-cover" />
              <CardContent className="grid gap-2">
                <p className="text-xs text-fg-muted">{copy.vendor} · {copy.city}</p>
                <p className="font-semibold leading-snug">{copy.product}</p>
                <Rating value={4.6} count={128} size={14} />
                <PriceTag price={18} comparePrice={22.5} />
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Order summary</CardTitle>
                <CardDescription>2 items from {copy.vendor}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <div className="flex justify-between"><span className="text-fg-muted">Subtotal</span><span>$36.00</span></div>
                <div className="flex justify-between"><span className="text-fg-muted">Delivery</span><span>$3.50</span></div>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="font-semibold">Total</span>
                <PriceTag price={39.5} size="sm" />
              </CardFooter>
            </Card>
            <Card variant="muted">
              <CardContent className="grid gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name="Lina Mansour" />
                  <div>
                    <p className="text-sm font-semibold">Lina M.</p>
                    <Rating value={5} size={12} />
                  </div>
                </div>
                <p className="text-sm text-fg-muted">{copy.review}</p>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Overlays" description="Dialogs trap focus and close on Escape. Sheets open from the reading start or end.">
          <Row>
            <Dialog>
              <DialogTrigger asChild><Button variant="outline">Open dialog</Button></DialogTrigger>
              <DialogContent title="Remove this product?" description="It will disappear from your storefront. Orders already placed are not affected.">
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <DialogClose asChild><Button variant="danger" startIcon={<Trash2 />}>Remove</Button></DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild><Button variant="outline">Sheet (end)</Button></SheetTrigger>
              <SheetContent title="Your cart" description={`2 items · ${copy.vendor}`} footer={<Button fullWidth variant="accent">Checkout</Button>}>
                <div className="grid gap-4 py-2">
                  {[1, 2].map(i => (
                    <div key={i} className="flex gap-3">
                      <img src={images[i].src} alt="" className="size-16 rounded-md object-cover" />
                      <div className="grid flex-1 gap-1.5">
                        <p className="text-sm font-medium">{copy.product}</p>
                        <QuantityStepper value={qty} onChange={setQty} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <Sheet>
              <SheetTrigger asChild><Button variant="outline">Sheet (start)</Button></SheetTrigger>
              <SheetContent side="start" title="Filters">
                <div className="grid gap-4 py-2">
                  <Checkbox label="In stock only" />
                  <Checkbox label="Verified vendors" defaultChecked />
                  <Switch label="On sale" />
                </div>
              </SheetContent>
            </Sheet>
            <Drawer>
              <DrawerTrigger asChild><Button variant="outline">Bottom drawer</Button></DrawerTrigger>
              <DrawerContent title="Sort by">
                <RadioGroup defaultValue="newest" className="pb-6" aria-label="Sort">
                  <RadioItem value="newest" label="Newest" />
                  <RadioItem value="price-asc" label="Price: low to high" />
                  <RadioItem value="popular" label="Most popular" />
                </RadioGroup>
              </DrawerContent>
            </Drawer>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" startIcon={<User />}>Account</Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>lina@souqna.com</DropdownMenuLabel>
                <DropdownMenuItem icon={<Package />}>My orders</DropdownMenuItem>
                <DropdownMenuItem icon={<Heart />}>Wishlist</DropdownMenuItem>
                <DropdownMenuItem icon={<Settings />}>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem icon={<LogOut />} destructive>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip content="Saved items sync across devices">
              <Button variant="ghost">Hover for tooltip</Button>
            </Tooltip>
          </Row>
          <Row label="Toasts">
            <Button variant="secondary" onClick={() => toast({ title: 'Added to cart', description: copy.product, tone: 'success', action: { label: 'Undo', onClick: () => {} } })}>Success</Button>
            <Button variant="secondary" onClick={() => toast({ title: 'Payment proof uploaded' })}>Neutral</Button>
            <Button variant="secondary" onClick={() => toast({ title: 'Out of stock', description: 'Someone just bought the last one.', tone: 'danger' })}>Error</Button>
          </Row>
        </Section>

        <Section title="Tabs">
          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="reviews">Reviews (128)</TabsTrigger>
            </TabsList>
            <TabsContent value="products" className="text-sm text-fg-muted">Product grid goes here.</TabsContent>
            <TabsContent value="about" className="text-sm text-fg-muted">Store story and location.</TabsContent>
            <TabsContent value="reviews" className="text-sm text-fg-muted">{copy.review}</TabsContent>
          </Tabs>
          <Tabs defaultValue="week" variant="pills">
            <TabsList>
              <TabsTrigger value="week">7 days</TabsTrigger>
              <TabsTrigger value="month">30 days</TabsTrigger>
              <TabsTrigger value="year">12 months</TabsTrigger>
            </TabsList>
          </Tabs>
        </Section>

        <Section title="Commerce">
          <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Food & Grocery', to: '/shop' }, { label: copy.product }]} />
          <div className="grid gap-8 md:grid-cols-2">
            <ImageGallery images={images} />
            <div className="grid content-start gap-5">
              <div className="grid gap-2">
                <p className="text-sm text-fg-muted">{copy.vendor}</p>
                <h3 className="text-3xl font-semibold">{copy.product}</h3>
                <Rating value={4.6} count={128} showValue />
              </div>
              <PriceTag price={18} comparePrice={22.5} size="lg" />
              <div className="flex flex-wrap items-center gap-3">
                <QuantityStepper value={qty} onChange={setQty} max={8} />
                <Button variant="accent" size="lg" startIcon={<ShoppingBag />} className="flex-1">Add to cart</Button>
                <IconButton label="Save to wishlist" icon={<Heart />} variant="outline" size="icon" />
              </div>
              <div className="grid gap-2">
                <span className="text-sm font-medium">Your rating</span>
                <RatingInput value={stars} onChange={setStars} />
              </div>
            </div>
          </div>
          <ImageGallery images={[]} className="max-w-48" />
          <Pagination page={page} total={400} limit={20} onPageChange={setPage} />
        </Section>

        <Section title="Data & feedback">
          <Row>
            <Switch label="Loading state" checked={loadingTable} onCheckedChange={setLoadingTable} />
            <Spinner label="Loading" />
          </Row>
          <DataTable columns={columns} data={sorted} rowKey={row => row.id} loading={loadingTable} sort={sort} onSortChange={setSort} caption="Recent orders" />
          <DataTable columns={columns} data={[]} rowKey={row => row.id} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <Card className="grid content-start gap-3 p-5">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </Card>
            <Card>
              <EmptyState icon={<Heart />} title="No saved items" message="Tap the heart on any product to save it here." action={() => {}} actionLabel="Browse the shop" />
            </Card>
          </div>
        </Section>
      </main>
    </div>
  )
}
