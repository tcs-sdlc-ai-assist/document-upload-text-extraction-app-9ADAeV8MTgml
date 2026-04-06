import { describe, it, expect } from 'vitest';
import { cleanText } from '../services/TextCleaner';

describe('TextCleaner', () => {
  describe('empty and falsy input', () => {
    it('returns empty string for empty input', () => {
      expect(cleanText('')).toBe('');
    });

    it('returns empty string for whitespace-only input', () => {
      expect(cleanText('   ')).toBe('');
    });

    it('returns empty string for newline-only input', () => {
      expect(cleanText('\n\n\n')).toBe('');
    });

    it('returns empty string for tab-only input', () => {
      expect(cleanText('\t\t\t')).toBe('');
    });
  });

  describe('null byte removal', () => {
    it('removes null bytes from text', () => {
      expect(cleanText('hello\0world')).toBe('hello world');
    });

    it('removes multiple null bytes', () => {
      expect(cleanText('\0\0hello\0\0world\0\0')).toBe('hello world');
    });
  });

  describe('control character stripping', () => {
    it('strips control characters except newline, carriage return, and tab', () => {
      const input = 'hello\x01\x02\x03world';
      expect(cleanText(input)).toBe('helloworld');
    });

    it('strips backspace character', () => {
      expect(cleanText('hello\x08world')).toBe('helloworld');
    });

    it('strips vertical tab and form feed', () => {
      expect(cleanText('hello\x0Bworld\x0Ctest')).toBe('helloworld test');
    });

    it('strips DEL character (0x7F)', () => {
      expect(cleanText('hello\x7Fworld')).toBe('helloworld');
    });

    it('preserves newlines while stripping other control characters', () => {
      expect(cleanText('hello\x01\nworld')).toBe('hello\nworld');
    });
  });

  describe('line break normalization', () => {
    it('normalizes \\r\\n to \\n', () => {
      expect(cleanText('hello\r\nworld')).toBe('hello\nworld');
    });

    it('normalizes standalone \\r to \\n', () => {
      expect(cleanText('hello\rworld')).toBe('hello\nworld');
    });

    it('handles mixed line breaks', () => {
      expect(cleanText('line1\r\nline2\rline3\nline4')).toBe(
        'line1\nline2\nline3\nline4',
      );
    });
  });

  describe('tab replacement', () => {
    it('replaces tabs with a single space', () => {
      expect(cleanText('hello\tworld')).toBe('hello world');
    });

    it('replaces multiple tabs with single spaces then collapses', () => {
      expect(cleanText('hello\t\tworld')).toBe('hello world');
    });
  });

  describe('whitespace collapsing', () => {
    it('collapses multiple spaces into one', () => {
      expect(cleanText('hello    world')).toBe('hello world');
    });

    it('collapses mixed whitespace (spaces and tabs) into one space', () => {
      expect(cleanText('hello \t  world')).toBe('hello world');
    });

    it('trims leading and trailing whitespace from each line', () => {
      expect(cleanText('  hello  \n  world  ')).toBe('hello\nworld');
    });
  });

  describe('blank line collapsing', () => {
    it('collapses three or more consecutive newlines into two', () => {
      expect(cleanText('hello\n\n\nworld')).toBe('hello\n\nworld');
    });

    it('collapses many consecutive newlines into two', () => {
      expect(cleanText('hello\n\n\n\n\n\nworld')).toBe('hello\n\nworld');
    });

    it('preserves a single blank line (two newlines)', () => {
      expect(cleanText('hello\n\nworld')).toBe('hello\n\nworld');
    });

    it('preserves single newlines', () => {
      expect(cleanText('hello\nworld')).toBe('hello\nworld');
    });
  });

  describe('leading and trailing whitespace trimming', () => {
    it('trims leading whitespace', () => {
      expect(cleanText('   hello world')).toBe('hello world');
    });

    it('trims trailing whitespace', () => {
      expect(cleanText('hello world   ')).toBe('hello world');
    });

    it('trims leading and trailing newlines', () => {
      expect(cleanText('\n\nhello world\n\n')).toBe('hello world');
    });
  });

  describe('combined cleaning scenarios', () => {
    it('handles text with mixed issues', () => {
      const input = '  \r\n  hello\x00\x01   \t  world  \r\n\r\n\r\n  foo  \n  bar  ';
      const result = cleanText(input);
      expect(result).toBe('hello world\n\nfoo\nbar');
    });

    it('handles realistic PDF extraction output', () => {
      const input =
        '   Document Title   \n\n\n\n   This is paragraph one.   \n   This is paragraph two.   \n\n\n\n\n   End of document.   ';
      const result = cleanText(input);
      expect(result).toBe(
        'Document Title\n\nThis is paragraph one.\nThis is paragraph two.\n\nEnd of document.',
      );
    });

    it('handles text with only control characters', () => {
      expect(cleanText('\x00\x01\x02\x03')).toBe('');
    });

    it('preserves normal text unchanged', () => {
      expect(cleanText('Hello, world!')).toBe('Hello, world!');
    });

    it('handles single word input', () => {
      expect(cleanText('hello')).toBe('hello');
    });

    it('handles multiline text with proper formatting', () => {
      const input = 'Line one\nLine two\n\nParagraph two';
      expect(cleanText(input)).toBe('Line one\nLine two\n\nParagraph two');
    });
  });
});