import { isAnswerCorrect } from './quiz-scoring';

describe('isAnswerCorrect', () => {
  describe('single', () => {
    it('matches an identical single value', () => {
      expect(isAnswerCorrect('single', 'b', 'b')).toBe(true);
    });

    it('rejects a different single value', () => {
      expect(isAnswerCorrect('single', 'b', 'a')).toBe(false);
    });

    it('matches when correctAnswer is stored as a one-element array (real seed data shape) and submittedAnswer is a bare string', () => {
      expect(isAnswerCorrect('single', ['b'], 'b')).toBe(true);
    });

    it('matches when both correctAnswer and submittedAnswer are one-element arrays', () => {
      expect(isAnswerCorrect('single', ['b'], ['b'])).toBe(true);
    });

    it('still rejects a different value when correctAnswer is array-wrapped', () => {
      expect(isAnswerCorrect('single', ['b'], 'a')).toBe(false);
    });
  });

  describe('multiple', () => {
    it('matches identical sets in the same order', () => {
      expect(isAnswerCorrect('multiple', ['a', 'b'], ['a', 'b'])).toBe(true);
    });

    it('matches identical sets submitted in a different order', () => {
      expect(isAnswerCorrect('multiple', ['a', 'b', 'c'], ['c', 'a', 'b'])).toBe(true);
    });

    it('rejects a set missing an element', () => {
      expect(isAnswerCorrect('multiple', ['a', 'b'], ['a'])).toBe(false);
    });

    it('rejects a set with an extra element', () => {
      expect(isAnswerCorrect('multiple', ['a', 'b'], ['a', 'b', 'c'])).toBe(false);
    });
  });

  describe('text', () => {
    it('matches an exact string', () => {
      expect(isAnswerCorrect('text', 'Paris', 'Paris')).toBe(true);
    });

    it('matches case-insensitively', () => {
      expect(isAnswerCorrect('text', 'Paris', 'paris')).toBe(true);
    });

    it('matches ignoring leading/trailing whitespace', () => {
      expect(isAnswerCorrect('text', 'Paris', '  paris  ')).toBe(true);
    });

    it('rejects a different string', () => {
      expect(isAnswerCorrect('text', 'Paris', 'London')).toBe(false);
    });

    it('rejects a non-string submission', () => {
      expect(isAnswerCorrect('text', 'Paris', 42)).toBe(false);
    });
  });

  describe('unknown question type', () => {
    it('falls back to strict equality rather than crashing', () => {
      expect(isAnswerCorrect('mystery', 'x', 'x')).toBe(true);
      expect(isAnswerCorrect('mystery', 'x', 'y')).toBe(false);
    });
  });
});
