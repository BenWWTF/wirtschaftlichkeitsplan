import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RelatedPages } from '../related-pages'

/**
 * RelatedPages Component Tests
 *
 * Tests for the RelatedPages navigation component that displays
 * related pages on each dashboard page.
 */

// Mock the page relationships config
jest.mock('@/lib/config/page-relationships', () => ({
  getRelatedPages: (currentPage: string) => {
    const mockRelationships: Record<string, any[]> = {
      '/dashboard/planung': [
        {
          title: 'Monatliche Ergebnisse',
          description: 'See actual vs planned sessions',
          href: '/dashboard/ergebnisse',
          icon: 'BarChart3'
        },
        {
          title: 'Therapiearten',
          description: 'Manage therapy types and pricing',
          href: '/dashboard/therapien',
          icon: 'Pill'
        },
        {
          title: 'Ausgaben',
          description: 'Track fixed and variable costs',
          href: '/dashboard/ausgaben',
          icon: 'Receipt'
        }
      ],
      '/dashboard/unknown': [] // Test empty state
    }
    return mockRelationships[currentPage] || []
  }
}))

describe('RelatedPages Component', () => {
  describe('Rendering', () => {
    it('should render related pages section when pages exist', () => {
      render(<RelatedPages currentPage="/dashboard/planung" />)

      expect(screen.getByText('Related Pages')).toBeInTheDocument()
      expect(screen.getByText('Monatliche Ergebnisse')).toBeInTheDocument()
      expect(screen.getByText('Therapiearten')).toBeInTheDocument()
      expect(screen.getByText('Ausgaben')).toBeInTheDocument()
    })

    it('should return null when no related pages exist', () => {
      const { container } = render(<RelatedPages currentPage="/dashboard/unknown" />)

      expect(container.firstChild).toBeNull()
    })

    it('should render correct number of related page cards', () => {
      render(<RelatedPages currentPage="/dashboard/planung" />)

      const links = screen.getAllByRole('link')
      // Should have 3 links (one per related page)
      expect(links).toHaveLength(3)
    })
  })

  describe('Content', () => {
    it('should display page titles', () => {
      render(<RelatedPages currentPage="/dashboard/planung" />)

      expect(screen.getByText('Monatliche Ergebnisse')).toBeInTheDocument()
      expect(screen.getByText('Therapiearten')).toBeInTheDocument()
      expect(screen.getByText('Ausgaben')).toBeInTheDocument()
    })

    it('should display page descriptions', () => {
      render(<RelatedPages currentPage="/dashboard/planung" />)

      expect(screen.getByText('See actual vs planned sessions')).toBeInTheDocument()
      expect(screen.getByText('Manage therapy types and pricing')).toBeInTheDocument()
      expect(screen.getByText('Track fixed and variable costs')).toBeInTheDocument()
    })

    it('should have correct href attributes', () => {
      render(<RelatedPages currentPage="/dashboard/planung" />)

      const ergebnisseLink = screen.getByRole('link', { name: /Monatliche Ergebnisse/ })
      expect(ergebnisseLink).toHaveAttribute('href', '/dashboard/ergebnisse')

      const therapienLink = screen.getByRole('link', { name: /Therapiearten/ })
      expect(therapienLink).toHaveAttribute('href', '/dashboard/therapien')

      const ausgabenLink = screen.getByRole('link', { name: /Ausgaben/ })
      expect(ausgabenLink).toHaveAttribute('href', '/dashboard/ausgaben')
    })
  })

  describe('Styling', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(<RelatedPages currentPage="/dashboard/planung" />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1')
      expect(grid).toHaveClass('md:grid-cols-2')
      expect(grid).toHaveClass('lg:grid-cols-3')
    })

    it('should have dark mode classes', () => {
      const { container } = render(<RelatedPages currentPage="/dashboard/planung" />)

      const cards = container.querySelectorAll('[class*="dark:"]')
      expect(cards.length).toBeGreaterThan(0)
    })

    it('should have hover effect classes on cards', () => {
      const { container } = render(<RelatedPages currentPage="/dashboard/planung" />)

      const cards = container.querySelectorAll('a')
      cards.forEach(card => {
        expect(card).toHaveClass('hover:shadow-md')
        expect(card).toHaveClass('dark:hover:shadow-lg')
        expect(card).toHaveClass('transition-shadow')
      })
    })

    it('should have border styling', () => {
      const { container } = render(<RelatedPages currentPage="/dashboard/planung" />)

      const cards = container.querySelectorAll('a')
      cards.forEach(card => {
        expect(card).toHaveClass('border')
        expect(card).toHaveClass('border-neutral-200')
        expect(card).toHaveClass('dark:border-neutral-700')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have semantic heading', () => {
      render(<RelatedPages currentPage="/dashboard/planung" />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('Related Pages')
    })

    it('should have proper link structure', () => {
      render(<RelatedPages currentPage="/dashboard/planung" />)

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('href')
        expect(link.textContent).toBeTruthy()
      })
    })

    it('should have proper contrast text classes', () => {
      const { container } = render(<RelatedPages currentPage="/dashboard/planung" />)

      // Check that cards have proper text color classes for light and dark modes
      const heading = container.querySelector('h2')
      expect(heading).toHaveClass('text-neutral-900')
      expect(heading).toHaveClass('dark:text-white')
    })
  })

  describe('Props', () => {
    it('should accept currentPage prop', () => {
      render(<RelatedPages currentPage="/dashboard/planung" />)
      expect(screen.getByText('Related Pages')).toBeInTheDocument()
    })

    it('should accept optional limit prop', () => {
      // The limit prop controls how many related pages to show
      // In this test, we verify it doesn't cause errors
      render(<RelatedPages currentPage="/dashboard/planung" limit={2} />)
      expect(screen.getByText('Related Pages')).toBeInTheDocument()
    })

    it('should use default limit if not provided', () => {
      render(<RelatedPages currentPage="/dashboard/planung" />)
      // Should render all 3 related pages (default limit is 4)
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('Integration', () => {
    it('should work on different pages', () => {
      const { rerender } = render(<RelatedPages currentPage="/dashboard/planung" />)

      expect(screen.getByText('Related Pages')).toBeInTheDocument()

      // Switch to a page with no relationships
      rerender(<RelatedPages currentPage="/dashboard/unknown" />)

      expect(screen.queryByText('Related Pages')).not.toBeInTheDocument()
    })

    it('should handle missing page gracefully', () => {
      const { container } = render(<RelatedPages currentPage="/dashboard/nonexistent" />)

      // Should render nothing without errors
      expect(container.firstChild).toBeNull()
    })
  })
})
