import { TranslatePipe } from './translate.pipe';
import { TranslationService } from '../services/translation/translation.service';

describe('TranslatePipe', () => {
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let pipe: TranslatePipe;

  beforeEach(() => {
    translationServiceMock = { instant: vi.fn().mockReturnValue('translated value') };
    pipe = new TranslatePipe(translationServiceMock as unknown as TranslationService);
  });

  it('should return an empty string without calling the service when the key is null/undefined/empty', () => {
    // Act / Assert
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(translationServiceMock.instant).not.toHaveBeenCalled();
  });

  it('should delegate to TranslationService.instant with the key when transform is called', () => {
    // Act
    const result = pipe.transform('SOME.KEY');

    // Assert
    expect(translationServiceMock.instant).toHaveBeenCalledWith('SOME.KEY', undefined);
    expect(result).toBe('translated value');
  });

  it('should forward interpolation params to TranslationService.instant when provided', () => {
    // Act
    pipe.transform('SOME.KEY', { name: 'Ana' });

    // Assert
    expect(translationServiceMock.instant).toHaveBeenCalledWith('SOME.KEY', { name: 'Ana' });
  });
});
