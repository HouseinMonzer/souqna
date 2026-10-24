import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../../lib/i18n'
import {
  Avatar, Badge, Breadcrumbs, Button, DataTable, Dialog, DialogContent, DialogTrigger, FormField, IconButton,
  ImageGallery, Input, Pagination, PriceTag, QuantityStepper, Rating, RatingInput, UIProvider, toast,
} from '.'
import { pageWindow } from './pagination'
import { formatPrice } from './price-tag'

describe('Button', () => {
  it('disables itself and announces busy while loading', async () => {
    const onClick = vi.fn()
    render(<Button loading onClick={onClick}>Place order</Button>)
    const button = screen.getByRole('button', { name: 'Place order' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('defaults to type="button" so it never submits forms by accident', () => {
    render(<form><Button>Save</Button></form>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('renders links with button styles via asChild', () => {
    render(<MemoryRouter><Button asChild><a href="/shop">Shop</a></Button></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveClass('bg-primary')
  })

  it('gives icon buttons an accessible name', () => {
    render(<IconButton label="Save to wishlist" icon={<svg />} />)
    expect(screen.getByRole('button', { name: 'Save to wishlist' })).toBeInTheDocument()
  })
})

describe('FormField', () => {
  it('connects label, hint and error to the control', () => {
    const { rerender } = render(
      <FormField label="Email" hint="We never share it">
        <Input type="email" />
      </FormField>,
    )
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAccessibleDescription('We never share it')
    expect(input).not.toHaveAttribute('aria-invalid')

    rerender(
      <FormField label="Email" hint="We never share it" error="Enter a valid email address" required>
        <Input type="email" />
      </FormField>,
    )
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toBeRequired()
    expect(input).toHaveAccessibleDescription('Enter a valid email address')
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address')
  })
})

describe('QuantityStepper', () => {
  function Harness({ initial = 1, max = 3 }) {
    const [value, setValue] = useState(initial)
    return <QuantityStepper value={value} onChange={setValue} max={max} />
  }

  it('steps within bounds and disables the buttons at the limits', async () => {
    render(<Harness />)
    const decrease = screen.getByRole('button', { name: 'Decrease quantity' })
    const increase = screen.getByRole('button', { name: 'Increase quantity' })
    const field = screen.getByRole('spinbutton', { name: 'Quantity' })
    expect(decrease).toBeDisabled()
    await userEvent.click(increase)
    await userEvent.click(increase)
    expect(field).toHaveValue(3)
    expect(increase).toBeDisabled()
  })

  it('clamps typed values', async () => {
    render(<Harness max={5} />)
    const field = screen.getByRole('spinbutton')
    await userEvent.clear(field)
    await userEvent.type(field, '42')
    expect(field).toHaveValue(5)
  })
})

describe('Rating', () => {
  it('describes the value for screen readers', () => {
    render(<Rating value={4.26} count={12} />)
    expect(screen.getByRole('img', { name: 'Rated 4.3 out of 5' })).toBeInTheDocument()
    expect(screen.getByText('(12 reviews)')).toBeInTheDocument()
  })

  it('works as a keyboard radio group, mirrored in RTL', async () => {
    function Harness() {
      const [value, setValue] = useState(3)
      return <div dir="rtl"><RatingInput value={value} onChange={setValue} /></div>
    }
    render(<Harness />)
    const group = screen.getByRole('radiogroup', { name: 'Rating' })
    expect(within(group).getByRole('radio', { name: '3 stars' })).toBeChecked()
    within(group).getByRole('radio', { name: '3 stars' }).focus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(within(group).getByRole('radio', { name: '4 stars' })).toBeChecked()
    await userEvent.click(within(group).getByRole('radio', { name: '1 star' }))
    expect(within(group).getByRole('radio', { name: '1 star' })).toBeChecked()
  })
})

describe('PriceTag', () => {
  it('shows the discount and an accessible previous price', () => {
    render(<PriceTag price={18} comparePrice={22.5} />)
    expect(screen.getByText('$18')).toBeInTheDocument()
    expect(screen.getByText('20% off')).toBeInTheDocument()
    expect(screen.getByText('Was $22.50')).toHaveClass('sr-only')
  })

  it('formats prices the way they are quoted in Lebanon, in either language', async () => {
    expect(formatPrice(1250.5)).toBe('$1,250.50')
    expect(formatPrice(18)).toBe('$18')
    await act(() => i18n.changeLanguage('ar'))
    render(<PriceTag price={1250.5} />)
    expect(screen.getByText('$1,250.50').tagName).toBe('BDI')
    await act(() => i18n.changeLanguage('en'))
  })
})

describe('Pagination', () => {
  it('computes a compact page window', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(pageWindow(10, 20)).toEqual([1, null, 9, 10, 11, null, 20])
    expect(pageWindow(2, 20)).toEqual([1, 2, 3, 4, null, 20])
  })

  it('marks the current page and navigates', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={3} total={100} limit={10} onPageChange={onPageChange} />)
    expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} total={5} limit={10} onPageChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('Breadcrumbs', () => {
  it('links ancestors and marks the current page', () => {
    render(
      <MemoryRouter>
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, { label: 'Olive oil' }]} />
      </MemoryRouter>,
    )
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    expect(within(nav).getAllByRole('link').map(a => a.textContent)).toEqual(['Home', 'Shop'])
    expect(within(nav).getByText('Olive oil')).toHaveAttribute('aria-current', 'page')
  })
})

describe('Dialog', () => {
  it('opens with an accessible name and closes on Escape', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild><Button>Delete</Button></DialogTrigger>
        <DialogContent title="Remove product?" description="This cannot be undone.">body</DialogContent>
      </Dialog>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
    const dialog = screen.getByRole('dialog', { name: 'Remove product?' })
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('ImageGallery', () => {
  const images = [1, 2, 3].map(i => ({ src: `/img-${i}.jpg`, alt: `Photo ${i}` }))

  it('navigates with buttons, thumbnails and the keyboard', async () => {
    render(<ImageGallery images={images} />)
    const main = () => screen.getByRole('region').querySelector('img')!
    expect(main()).toHaveAttribute('alt', 'Photo 1')
    await userEvent.click(screen.getByRole('button', { name: 'Next image' }))
    expect(main()).toHaveAttribute('alt', 'Photo 2')
    await userEvent.click(screen.getByRole('button', { name: 'Show image 3' }))
    expect(main()).toHaveAttribute('alt', 'Photo 3')
    screen.getByRole('region').focus()
    await userEvent.keyboard('{Home}')
    expect(main()).toHaveAttribute('alt', 'Photo 1')
  })

  it('shows a placeholder without images', () => {
    render(<ImageGallery images={[]} />)
    expect(screen.getByText('No image available')).toBeInTheDocument()
  })
})

describe('DataTable', () => {
  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'total', header: 'Total', align: 'end' as const },
  ]

  it('requests the opposite sort direction and exposes aria-sort', async () => {
    const onSortChange = vi.fn()
    render(
      <DataTable columns={columns} data={[{ id: 1, name: 'A', total: 2 }]} rowKey={r => r.id}
        sort={{ key: 'name', direction: 'asc' }} onSortChange={onSortChange} />,
    )
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending')
    await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }))
    expect(onSortChange).toHaveBeenCalledWith({ key: 'name', direction: 'desc' })
  })

  it('shows an empty state', () => {
    render(<DataTable columns={columns} data={[]} rowKey={() => 1} />)
    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument()
  })
})

describe('Badge, Avatar and toasts', () => {
  it('maps legacy badge variants to tones', () => {
    render(<Badge variant="red">Rejected</Badge>)
    expect(screen.getByText('Rejected')).toHaveClass('text-danger')
  })

  it('falls back to initials when there is no image', () => {
    render(<Avatar name="Lina Mansour" />)
    expect(screen.getByRole('img', { name: 'Lina Mansour' })).toHaveTextContent('LM')
  })

  it('shows toasts raised from outside React', async () => {
    render(<UIProvider><span /></UIProvider>)
    act(() => { toast({ title: 'Added to cart', tone: 'success' }) })
    expect(await screen.findByText('Added to cart')).toBeInTheDocument()
  })

  it('translates built-in labels', async () => {
    await act(() => i18n.changeLanguage('ar'))
    render(<Pagination page={1} total={30} limit={10} onPageChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: 'التنقل بين الصفحات' })).toBeInTheDocument()
    await act(() => i18n.changeLanguage('en'))
  })
})
