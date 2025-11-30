/// <reference types="jest" />
import { render, screen } from '@testing-library/react'
import { BreadcrumbNav } from '@/components/dashboard/breadcrumb-nav'

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}))

import { usePathname, useSearchParams } from 'next/navigation'

describe('BreadcrumbNav Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render on dashboard root', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    const { container } = render(<BreadcrumbNav />)
    expect(container.firstChild).toBeNull()
  })

  it('should render breadcrumbs for planung page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard/planung')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    render(<BreadcrumbNav />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Monatliche Planung')).toBeInTheDocument()
  })

  it('should render breadcrumbs with month for planung page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard/planung')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('month=2025-11'))

    render(<BreadcrumbNav />)

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Monatliche Planung')).toBeInTheDocument()
    expect(screen.getByText('November 2025')).toBeInTheDocument()
  })

  it('should mark last breadcrumb as current page', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard/ergebnisse')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    render(<BreadcrumbNav />)

    const lastItem = screen.getByText('Monatliche Ergebnisse')
    expect(lastItem).toHaveAttribute('aria-current', 'page')
  })

  it('should have correct href on navigation links', () => {
    ;(usePathname as jest.Mock).mockReturnValue('/dashboard/therapien')
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())

    render(<BreadcrumbNav />)

    const homeLink = screen.getByText('Home')
    expect(homeLink.closest('a')).toHaveAttribute('href', '/dashboard')
  })
})
