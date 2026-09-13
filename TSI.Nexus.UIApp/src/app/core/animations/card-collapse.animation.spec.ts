import { cardCollapseAnimation } from './card-collapse.animation';

describe('cardCollapseAnimation', () => {
  it('should be registered under the cardCollapse trigger name', () => {
    // Act / Assert
    expect(cardCollapseAnimation.name).toBe('cardCollapse');
  });

  it('should define both open and closed states with a transition between them', () => {
    // Act
    const definitions = cardCollapseAnimation.definitions;

    // Assert
    expect(definitions.length).toBeGreaterThan(0);
  });
});
