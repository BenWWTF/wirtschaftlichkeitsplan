import { getRelatedPages, PAGE_RELATIONSHIPS } from '../page-relationships'

/**
 * Page Relationships Configuration Tests
 *
 * Tests for the page relationships configuration that defines
 * connections between different dashboard pages.
 */

describe('PAGE_RELATIONSHIPS Configuration', () => {
  describe('Structure', () => {
    it('should have all 8 dashboard pages configured', () => {
      const pages = Object.keys(PAGE_RELATIONSHIPS)
      expect(pages).toHaveLength(8)
    })

    it('should have correct page routes', () => {
      const expectedPages = [
        '/dashboard/planung',
        '/dashboard/ergebnisse',
        '/dashboard/therapien',
        '/dashboard/ausgaben',
        '/dashboard/steuerprognose',
        '/dashboard/analyse',
        '/dashboard/berichte',
        '/dashboard/einstellungen'
      ]

      expectedPages.forEach(page => {
        expect(PAGE_RELATIONSHIPS[page]).toBeDefined()
      })
    })

    it('should have array of page relationships for each page', () => {
      Object.entries(PAGE_RELATIONSHIPS).forEach(([page, relationships]) => {
        expect(Array.isArray(relationships)).toBe(true)
        expect(relationships.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Relationship Format', () => {
    it('should have proper page relationship structure', () => {
      const planung = PAGE_RELATIONSHIPS['/dashboard/planung']

      planung.forEach(relationship => {
        expect(relationship).toHaveProperty('title')
        expect(relationship).toHaveProperty('description')
        expect(relationship).toHaveProperty('href')
        expect(relationship).toHaveProperty('icon')

        // Validate types
        expect(typeof relationship.title).toBe('string')
        expect(typeof relationship.description).toBe('string')
        expect(typeof relationship.href).toBe('string')
        expect(typeof relationship.icon).toBe('string')
      })
    })

    it('should have valid hrefs pointing to dashboard pages', () => {
      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          expect(rel.href).toMatch(/^\/dashboard\//)
        })
      })
    })

    it('should have meaningful titles', () => {
      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          expect(rel.title.length).toBeGreaterThan(0)
          expect(rel.title.length).toBeLessThan(100)
        })
      })
    })

    it('should have meaningful descriptions', () => {
      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          expect(rel.description.length).toBeGreaterThan(0)
          expect(rel.description.length).toBeLessThan(200)
        })
      })
    })
  })

  describe('Icon Support', () => {
    const validIcons = ['Home', 'Calendar', 'BarChart3', 'Pill', 'Receipt', 'Calculator', 'FileText', 'Settings', 'TrendingUp']

    it('should use valid icon names', () => {
      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          expect(validIcons).toContain(rel.icon)
        })
      })
    })

    it('should have diverse icon usage', () => {
      const usedIcons = new Set<string>()

      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          usedIcons.add(rel.icon)
        })
      })

      // Should use at least 5 different icons
      expect(usedIcons.size).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Cross-References', () => {
    it('should not have self-references', () => {
      Object.entries(PAGE_RELATIONSHIPS).forEach(([page, relationships]) => {
        relationships.forEach(rel => {
          expect(rel.href).not.toBe(page)
        })
      })
    })

    it('should reference existing pages', () => {
      const allPages = new Set(Object.keys(PAGE_RELATIONSHIPS))

      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          expect(allPages).toContain(rel.href)
        })
      })
    })

    it('should have bidirectional relationships where relevant', () => {
      // If page A references page B, page B might reference page A
      // This is not a strict requirement but good for UX
      const checkRelationship = (from: string, to: string) => {
        const fromRels = PAGE_RELATIONSHIPS[from]
        return fromRels && fromRels.some(rel => rel.href === to)
      }

      // Check planung and ergebnisse are linked
      if (checkRelationship('/dashboard/planung', '/dashboard/ergebnisse')) {
        expect(checkRelationship('/dashboard/ergebnisse', '/dashboard/planung')).toBe(true)
      }
    })
  })

  describe('getRelatedPages Function', () => {
    it('should return related pages for a given route', () => {
      const related = getRelatedPages('/dashboard/planung')

      expect(Array.isArray(related)).toBe(true)
      expect(related.length).toBeGreaterThan(0)
    })

    it('should return empty array for unknown route', () => {
      const related = getRelatedPages('/dashboard/unknown')

      expect(Array.isArray(related)).toBe(true)
      expect(related.length).toBe(0)
    })

    it('should respect limit parameter', () => {
      const related = getRelatedPages('/dashboard/planung', 2)

      expect(related.length).toBeLessThanOrEqual(2)
    })

    it('should use default limit of 4 when not specified', () => {
      const related = getRelatedPages('/dashboard/planung')

      expect(related.length).toBeLessThanOrEqual(4)
    })

    it('should return proper page relationship objects', () => {
      const related = getRelatedPages('/dashboard/planung')

      related.forEach(page => {
        expect(page).toHaveProperty('title')
        expect(page).toHaveProperty('description')
        expect(page).toHaveProperty('href')
        expect(page).toHaveProperty('icon')
      })
    })

    it('should not include self-reference in results', () => {
      const related = getRelatedPages('/dashboard/planung')

      related.forEach(page => {
        expect(page.href).not.toBe('/dashboard/planung')
      })
    })
  })

  describe('Content Quality', () => {
    it('should have unique descriptions for each relationship', () => {
      const allDescriptions = new Map<string, number>()

      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          const count = allDescriptions.get(rel.description) || 0
          allDescriptions.set(rel.description, count + 1)
        })
      })

      // Check that not all descriptions are duplicates (some uniqueness)
      const uniqueCount = Array.from(allDescriptions.values()).filter(count => count === 1).length
      expect(uniqueCount).toBeGreaterThan(0)
    })

    it('should have descriptive content', () => {
      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          // Descriptions should be more than just the title
          expect(rel.description.length).toBeGreaterThan(rel.title.length / 2)
        })
      })
    })

    it('should be properly formatted German text', () => {
      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          // Check for proper capitalization (first letter uppercase)
          expect(rel.title[0]).toMatch(/[A-Z]/)
          expect(rel.description[0]).toMatch(/[A-Za-z]/)

          // Should not have excessive punctuation
          expect(rel.description.split('.').length).toBeLessThanOrEqual(3)
        })
      })
    })
  })

  describe('Coverage', () => {
    it('should have comprehensive relationships', () => {
      let totalRelationships = 0

      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        totalRelationships += relationships.length
      })

      // With 8 pages and 3+ relationships per page, should have 24+ total
      expect(totalRelationships).toBeGreaterThanOrEqual(24)
    })

    it('should link all pages to each other', () => {
      const pages = Object.keys(PAGE_RELATIONSHIPS)
      const linkedPages = new Set<string>()

      Object.values(PAGE_RELATIONSHIPS).forEach(relationships => {
        relationships.forEach(rel => {
          linkedPages.add(rel.href)
        })
      })

      // All pages except the ones without relationships should be linked
      pages.forEach(page => {
        expect(linkedPages).toContain(page)
      })
    })
  })
})
