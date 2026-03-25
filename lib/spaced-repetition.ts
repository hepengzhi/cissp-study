/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 *
 * Quality ratings:
 * 0 - Again: Reset card, study again immediately
 * 1 - Hard: Decrease ease factor slightly
 * 2 - Good: Maintain ease factor
 * 3 - Easy: Increase ease factor slightly
 */

export enum SM2Quality {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3
}

export interface CardState {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface ReviewResult extends CardState {
  nextReview: Date;
}

export interface CardWithReview {
  id: string;
  nextReview: Date;
  [key: string]: any;
}

/**
 * Calculate the next review parameters for a card based on the user's quality rating.
 *
 * @param params - Current card state and quality rating
 * @param now - Reference date for calculating next review (defaults to current time)
 * @returns Updated card state with next review date
 */
export function calculateNextReview(
  params: CardState & { quality: SM2Quality },
  now: Date = new Date()
): ReviewResult {
  const { quality, easeFactor, interval, repetitions } = params;

  // Validate inputs
  if (quality < 0 || quality > 3) {
    throw new Error(`Quality must be between 0 and 3, got ${quality}`);
  }
  if (easeFactor < 1.3) {
    throw new Error(`Ease factor must be at least 1.3, got ${easeFactor}`);
  }
  if (interval < 0) {
    throw new Error(`Interval cannot be negative, got ${interval}`);
  }
  if (repetitions < 0) {
    throw new Error(`Repetitions cannot be negative, got ${repetitions}`);
  }

  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Quality 0 means the user wants to see the card again (reset)
  if (quality === 0) {
    newInterval = 0;
    newRepetitions = 0;
  } else {
    // Update ease factor based on quality
    // Formula: EF' = EF + (0.1 - (3 - q) * (0.08 + (3 - q) * 0.02))
    const qualityDiff = 3 - quality;
    newEaseFactor = easeFactor + (0.1 - qualityDiff * (0.08 + qualityDiff * 0.02));

    // Ensure ease factor never goes below 1.3
    newEaseFactor = Math.max(1.3, newEaseFactor);

    // Calculate new interval based on repetitions
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }

    newRepetitions = repetitions + 1;
  }

  // Calculate next review date
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview,
  };
}

/**
 * Get cards that are due for review.
 *
 * @param cards - Array of cards with nextReview property
 * @param now - Reference date for checking if cards are due (defaults to current time)
 * @returns Array of cards that are due for review
 */
export function getDueCards<T extends CardWithReview>(
  cards: T[],
  now: Date = new Date()
): T[] {
  return cards.filter((card) => card.nextReview <= now);
}
