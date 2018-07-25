import { TestWindow } from '@stencil/core/dist/testing';
import { ChessBoard } from './chess-board';

describe('chess-board', () => {
  it('should build', () => {
    expect(new ChessBoard()).toBeTruthy();
  });

  describe('rendering', () => {
    let element: HTMLChessBoardElement;
    let testWindow: TestWindow;
    beforeEach(async () => {
      testWindow = new TestWindow();
      element = await testWindow.load({
        components: [ChessBoard],
        html: '<chess-board></chess-board>'
      });
    });

    it('should work without parameters', () => {
      expect(element.textContent.trim()).toEqual("Hello, World! I'm ChessBoard Web Component and my initial chess set is");
    });

    it('should work with a initial chess set', async () => {
      element.chessSet = 'veronika';
      await testWindow.flush();
      expect(element.textContent.trim()).toEqual("Hello, World! I'm ChessBoard Web Component and my initial chess set is veronika");
    });
  });
});
