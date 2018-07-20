/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */

import '@stencil/core';

declare global {
  namespace JSX {
    interface Element {}
    export interface IntrinsicElements {}
  }
  namespace JSXElements {}

  interface HTMLElement {
    componentOnReady?: () => Promise<this | null>;
  }

  interface HTMLStencilElement extends HTMLElement {
    componentOnReady(): Promise<this>;

    forceUpdate(): void;
  }

  interface HTMLAttributes {}
}


declare global {

  namespace StencilComponents {
    interface ChessBoard {
      'autoPromotion': string;
      'chessSet': string;
      'darkBg': string;
      'empty': () => void;
      'emptyFen': string;
      'exportFen': () => string;
      'flip': () => void;
      'forceUpdate': () => void;
      'getCoords': () => { left: any; top: any; };
      'getHeight': () => string;
      'getPromotionFigures': () => string[];
      'goto': (n: number) => void;
      'greeting': string;
      'initialFen': string;
      'initialMode': string;
      'isBlackFigure': (f: string) => boolean;
      'isEnPassant': (from: number, to: number) => false | 8 | -8;
      'isFlipped': () => boolean;
      'isFoe': (sq1: number, sq2: number) => boolean;
      'isFriend': (sq1: number, sq2: number) => boolean;
      'isPromoting': (from: number, to: number) => boolean;
      'isWhiteFigure': (f: string) => boolean;
      'lightBg': string;
      'modes': object;
      'move': (from: number, to: number, promotion: string) => void;
      'onDragFigure': (sq: any) => void;
      'onFigureDrop': (sq: number, ev: UIEvent) => void;
      'onSqClick': (sq: number, _: UIEvent) => number;
      'reset': () => void;
      'schemas': object;
      'selectSet': (newSet: string) => void;
      'selectedBg': string;
      'setBg': (light: any, dark: any) => void;
      'setSchema': (n: number) => void;
      'setSquare': (sq: number, figure: string) => void;
      'sets': object;
      'version': string;
    }
  }

  interface HTMLChessBoardElement extends StencilComponents.ChessBoard, HTMLStencilElement {}

  var HTMLChessBoardElement: {
    prototype: HTMLChessBoardElement;
    new (): HTMLChessBoardElement;
  };
  interface HTMLElementTagNameMap {
    'chess-board': HTMLChessBoardElement;
  }
  interface ElementTagNameMap {
    'chess-board': HTMLChessBoardElement;
  }
  namespace JSX {
    interface IntrinsicElements {
      'chess-board': JSXElements.ChessBoardAttributes;
    }
  }
  namespace JSXElements {
    export interface ChessBoardAttributes extends HTMLAttributes {
      'autoPromotion'?: string;
      'chessSet'?: string;
      'darkBg'?: string;
      'emptyFen'?: string;
      'greeting'?: string;
      'initialFen'?: string;
      'initialMode'?: string;
      'lightBg'?: string;
      'modes'?: object;
      'schemas'?: object;
      'selectedBg'?: string;
      'sets'?: object;
      'version'?: string;
    }
  }
}

declare global { namespace JSX { interface StencilJSX {} } }

export declare function defineCustomElements(window: any): void;