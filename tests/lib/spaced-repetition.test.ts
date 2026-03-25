import { calculateNextReview, getDueCards, SM2Quality } from '../../lib/spaced-repetition';

describe('SM-2 Spaced Repetition Algorithm', () => {
  describe('calculateNextReview', () => {
    it('should set interval to 1 day for first correct review', () => {
      const result = calculateNextReview({
        quality: SM2Quality.GOOD,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });

      expect(result.interval).toBe(1);
      expect(result.easeFactor).toBe(2.5);
      expect(result.repetitions).toBe(1);
    });

    it('should set interval to 6 days for second review', () => {
      const result = calculateNextReview({
        quality: SM2Quality.GOOD,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      });

      expect(result.interval).toBe(6);
      expect(result.easeFactor).toBe(2.5);
      expect(result.repetitions).toBe(2);
    });

    it('should decrease ease factor for poor response (quality 1)', () => {
      const result = calculateNextReview({
        quality: SM2Quality.HARD,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      expect(result.easeFactor).toBeLessThan(2.5);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should reset card for "Again" (quality 0)', () => {
      const result = calculateNextReview({
        quality: SM2Quality.AGAIN,
        easeFactor: 2.5,
        interval: 21,
        repetitions: 5,
      });

      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
      expect(result.easeFactor).toBe(2.5);
    });

    it('should calculate correct interval based on ease factor', () => {
      const result = calculateNextReview({
        quality: SM2Quality.GOOD,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      expect(result.interval).toBe(Math.round(6 * 2.5)); // 15
      expect(result.repetitions).toBe(3);
    });

    it('should increase ease factor for easy response (quality 3)', () => {
      const result = calculateNextReview({
        quality: SM2Quality.EASY,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      expect(result.easeFactor).toBeGreaterThan(2.5);
    });

    it('should maintain ease factor for good response (quality 2)', () => {
      const result = calculateNextReview({
        quality: SM2Quality.GOOD,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });

      expect(result.easeFactor).toBe(2.5);
    });

    it('should never let ease factor drop below 1.3', () => {
      const result = calculateNextReview({
        quality: SM2Quality.AGAIN,
        easeFactor: 1.3,
        interval: 10,
        repetitions: 3,
      });

      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should calculate next review date correctly', () => {
      const now = new Date('2026-03-25T00:00:00Z');
      const result = calculateNextReview(
        {
          quality: SM2Quality.GOOD,
          easeFactor: 2.5,
          interval: 6,
          repetitions: 2,
        },
        now
      );

      expect(result.nextReview).toEqual(new Date('2026-04-09T00:00:00Z')); // 15 days later
    });
  });

  describe('getDueCards', () => {
    it('should return cards with nextReview in the past', () => {
      const cards = [
        { id: '1', nextReview: new Date('2026-03-24T00:00:00Z') },
        { id: '2', nextReview: new Date('2026-03-25T12:00:00Z') }, // future
        { id: '3', nextReview: new Date('2026-03-25T00:00:00Z') }, // now
        { id: '4', nextReview: new Date('2026-03-23T00:00:00Z') },
      ];

      const now = new Date('2026-03-25T00:00:00Z');
      const dueCards = getDueCards(cards as any, now);

      expect(dueCards).toHaveLength(3);
      expect(dueCards.map((c) => c.id)).toEqual(['1', '3', '4']);
    });

    it('should handle empty array', () => {
      const dueCards = getDueCards([], new Date());
      expect(dueCards).toHaveLength(0);
    });

    it('should return all cards as due if all have past review dates', () => {
      const cards = [
        { id: '1', nextReview: new Date('2026-03-24T00:00:00Z') },
        { id: '2', nextReview: new Date('2026-03-23T00:00:00Z') },
      ];

      const now = new Date('2026-03-25T00:00:00Z');
      const dueCards = getDueCards(cards as any, now);

      expect(dueCards).toHaveLength(2);
    });

    it('should return empty array if no cards are due', () => {
      const cards = [
        { id: '1', nextReview: new Date('2026-03-26T00:00:00Z') },
        { id: '2', nextReview: new Date('2026-03-27T00:00:00Z') },
      ];

      const now = new Date('2026-03-25T00:00:00Z');
      const dueCards = getDueCards(cards as any, now);

      expect(dueCards).toHaveLength(0);
    });
  });
});
