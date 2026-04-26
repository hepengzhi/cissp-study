import { test, expect } from '@playwright/test'

test.describe('Mind Maps Page', () => {
  test('should display mind maps domain list', async ({ page }) => {
    await page.goto('/mindmaps')

    // Check page title
    await expect(page.locator('h1')).toContainText('Mind Maps')

    // Check all 8 domain cards exist
    await expect(page.getByText('Security & Risk Management')).toBeVisible()
    await expect(page.getByText('Asset Security')).toBeVisible()
    await expect(page.getByText('Security Architecture')).toBeVisible()
    await expect(page.getByText('Communication & Network Security')).toBeVisible()
    await expect(page.getByText('Identity & Access Management')).toBeVisible()
    await expect(page.getByText('Security Assessment')).toBeVisible()
    await expect(page.getByText('Security Operations')).toBeVisible()
    await expect(page.getByText('Software Development Security')).toBeVisible()
  })

  test('should navigate to mind map canvas on click', async ({ page }) => {
    await page.goto('/mindmaps')

    // Click the first domain card
    await page.getByText('Security & Risk Management').first().click()

    // Should be on canvas page — check toolbar buttons exist
    await expect(page.getByTitle('Add Node')).toBeVisible()
    await expect(page.getByTitle('Delete Node')).toBeVisible()
    await expect(page.getByTitle('Fit View')).toBeVisible()
  })

  test('should have mindmaps in navigation', async ({ page }) => {
    await page.goto('/')

    // Check nav link
    await expect(page.getByRole('link', { name: /mind maps/i })).toBeVisible()
  })
})

test.describe('Mind Map Canvas', () => {
  test('should show empty state for domain with no nodes', async ({ page }) => {
    await page.goto('/mindmaps/SECURITY_RISK_MANAGEMENT')

    // Should show the empty domain message
    await expect(page.getByText('No nodes yet')).toBeVisible()
  })

  test('should create a node on double-click', async ({ page }) => {
    await page.goto('/mindmaps/SECURITY_RISK_MANAGEMENT')

    // Double-click the canvas
    const canvas = page.locator('.react-flow__pane')
    await canvas.dblclick({ position: { x: 400, y: 300 } })

    // Wait for the node to appear
    await expect(page.locator('.react-flow__node')).toBeVisible({ timeout: 5000 })
  })

  test('should delete selected node with Delete key', async ({ page }) => {
    await page.goto('/mindmaps/SECURITY_RISK_MANAGEMENT')

    // Create a node first
    const canvas = page.locator('.react-flow__pane')
    await canvas.dblclick({ position: { x: 400, y: 300 } })
    await expect(page.locator('.react-flow__node')).toBeVisible({ timeout: 5000 })

    // Click the node to select it
    await page.locator('.react-flow__node').first().click()

    // Press Delete
    await page.keyboard.press('Delete')

    // Node should be gone
    await expect(page.locator('.react-flow__node')).not.toBeVisible({ timeout: 5000 })
  })
})
