/**
 * Text Content Decomposition Algorithm
 * Implements prime decomposition for text content
 */

import { PrimeFactor, PrimeDecomposition, CanonicalRepresentation } from '../core/uor-core';
import { BaseDecompositionAlgorithm } from './decomposition-types';

/**
 * Text content decomposition algorithm
 * Decomposes text into semantic units (sentences, words, characters)
 */
export class TextDecompositionAlgorithm extends BaseDecompositionAlgorithm {
  /** Semantic unit types */
  private static readonly UNIT_TYPES = {
    PARAGRAPH: 'paragraph',
    SENTENCE: 'sentence',
    PHRASE: 'phrase',
    WORD: 'word',
    CHARACTER: 'character'
  };
  
  /**
   * Creates a new text decomposition algorithm
   */
  constructor() {
    super('text-decomposition', 'text');
  }
  
  /**
   * Decompose text into prime factors
   * @param text Text to decompose
   * @returns Prime decomposition of the text
   */
  decompose(text: string): PrimeDecomposition {
    if (typeof text !== 'string') {
      throw new Error('Input must be a string');
    }
    
    const factors: PrimeFactor[] = [];
    
    const uniqueChars = new Set(text.split(''));
    let charIndex = 0;
    
    uniqueChars.forEach(char => {
      const count = (text.match(new RegExp(this.escapeRegExp(char), 'g')) || []).length;
      
      factors.push(this.createPrimeFactor(
        `char-${charIndex++}`,
        { character: char },
        count
      ));
    });
    
    const words = this.extractWords(text);
    let wordIndex = 0;
    
    words.forEach(word => {
      if (word.trim().length > 0) {
        factors.push(this.createPrimeFactor(
          `word-${wordIndex++}`,
          { word: word }
        ));
      }
    });
    
    const sentences = this.extractSentences(text);
    let sentenceIndex = 0;
    
    sentences.forEach(sentence => {
      if (sentence.trim().length > 0) {
        factors.push(this.createPrimeFactor(
          `sentence-${sentenceIndex++}`,
          { sentence: sentence }
        ));
      }
    });
    
    const paragraphs = this.extractParagraphs(text);
    let paragraphIndex = 0;
    
    paragraphs.forEach(paragraph => {
      if (paragraph.trim().length > 0) {
        factors.push(this.createPrimeFactor(
          `paragraph-${paragraphIndex++}`,
          { paragraph: paragraph }
        ));
      }
    });
    
    factors.push(this.createPrimeFactor(
      'structure',
      {
        paragraphCount: paragraphs.length,
        sentenceCount: sentences.length,
        wordCount: words.length,
        charCount: text.length
      }
    ));
    
    return this.createDecomposition(factors, 'semantic-units');
  }
  
  /**
   * Recompose text from prime factors
   * @param decomposition Prime decomposition to recompose
   * @returns Recomposed text
   */
  recompose(decomposition: PrimeDecomposition): string {
    
    const paragraphFactors = decomposition.primeFactors.filter(
      factor => factor.value && 'paragraph' in factor.value
    );
    
    if (paragraphFactors.length > 0) {
      return paragraphFactors
        .sort((a, b) => {
          const aId = parseInt(a.id.split('-')[1]);
          const bId = parseInt(b.id.split('-')[1]);
          return aId - bId;
        })
        .map(factor => (factor.value as any).paragraph)
        .join('\n\n');
    }
    
    const sentenceFactors = decomposition.primeFactors.filter(
      factor => factor.value && 'sentence' in factor.value
    );
    
    if (sentenceFactors.length > 0) {
      return sentenceFactors
        .sort((a, b) => {
          const aId = parseInt(a.id.split('-')[1]);
          const bId = parseInt(b.id.split('-')[1]);
          return aId - bId;
        })
        .map(factor => (factor.value as any).sentence)
        .join(' ');
    }
    
    const wordFactors = decomposition.primeFactors.filter(
      factor => factor.value && 'word' in factor.value
    );
    
    if (wordFactors.length > 0) {
      return wordFactors
        .sort((a, b) => {
          const aId = parseInt(a.id.split('-')[1]);
          const bId = parseInt(b.id.split('-')[1]);
          return aId - bId;
        })
        .map(factor => (factor.value as any).word)
        .join(' ');
    }
    
    const charFactors = decomposition.primeFactors.filter(
      factor => factor.value && 'character' in factor.value
    );
    
    if (charFactors.length > 0) {
      let result = '';
      
      charFactors.forEach(factor => {
        const char = (factor.value as any).character;
        const count = factor.multiplicity || 1;
        
        for (let i = 0; i < count; i++) {
          result += char;
        }
      });
      
      return result;
    }
    
    return '';
  }
  
  /**
   * Compute canonical representation from prime decomposition
   * @param decomposition Prime decomposition
   * @returns Canonical representation
   */
  computeCanonical(decomposition: PrimeDecomposition): CanonicalRepresentation {
    
    const text = this.recompose(decomposition);
    
    const normalized = text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
    
    const words = this.extractWords(text);
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const coherenceNorm = words.length > 0 ? uniqueWords.size / words.length : 1;
    
    return this.createCanonicalRepresentation(
      { normalizedText: normalized },
      'normalized-text',
      coherenceNorm
    );
  }
  
  /**
   * Extract paragraphs from text
   * @param text Text to extract paragraphs from
   * @returns Array of paragraphs
   */
  private extractParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }
  
  /**
   * Extract sentences from text
   * @param text Text to extract sentences from
   * @returns Array of sentences
   */
  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }
  
  /**
   * Extract words from text
   * @param text Text to extract words from
   * @returns Array of words
   */
  private extractWords(text: string): string[] {
    return text.split(/[\s,.!?;:()[\]{}'"]+/).filter(w => w.length > 0);
  }
  
  /**
   * Escape special characters in a string for use in a regular expression
   * @param string String to escape
   * @returns Escaped string
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
