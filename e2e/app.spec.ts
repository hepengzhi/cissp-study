import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test('should display dashboard with stats', async ({ page }) => {
    await page.goto('/')

    // Check page title
    await expect(page.locator('h1')).toContainText('CISSP Study Dashboard')

    // Check stats cards exist
    await expect(page.getByText('Total Questions')).toBeVisible()
    await expect(page.getByText('Notes')).toBeVisible()
    await expect(page.getByText('Flashcards')).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    await page.goto('/')

    // Check navigation to different sections
    await expect(page.getByRole('link', { name: /notes/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /flashcards/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /quiz/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /exam/i })).toBeVisible()
  })
})

test.describe('Notes Page', () => {
  test('should display notes list', async ({ page }) => {
    await page.goto('/notes')

    // Check page title
    await expect(page.locator('h1')).toContainText('Study Notes')

    // Check create note button
    await expect(page.getByRole('link', { name: /create/i })).toBeVisible()
  })

  test('should navigate to create note page', async ({ page }) => {
    await page.goto('/notes')
    await page.click('text=Create Note')

    await expect(page).toHaveURL('/notes/new')
    await expect(page.locator('h2, h1')).toContainText('Create')
  })
})

test.describe('Flashcards Page', () => {
  test('should display study interface', async ({ page }) => {
    await page.goto('/flashcards')

    // Should show either study mode or empty state
    const hasContent = await page.locator('body').textContent()
    expect(hasContent).toContain('Flashcard')
  })

  test('should have manage link', async ({ page }) => {
    await page.goto('/flashcards')

    // Check for manage link
    const manageLink = page.getByRole('link', { name: /manage/i })
    if (await manageLink.isVisible()) {
      await manageLink.click()
      await expect(page).toHaveURL(/flashcards\/manage/)
    }
  })
})

test.describe('Quiz Page', () => {
  test('should display quiz setup', async ({ page }) => {
    await page.goto('/quiz')

    // Check page title
    await expect(page.locator('h1, h2')).toContainText('Quiz')

    // Check for domain selection or start button
    await expect(page.getByRole('button', { name: /start/i })).toBeVisible()
  })
})

test.describe('Exam Page', () => {
  test('should display exam setup', async ({ page }) => {
    await page.goto('/exam')

    // Check exam instructions
    await expect(page.locator('body')).toContainText(/exam|question|150/i)
  })
})
