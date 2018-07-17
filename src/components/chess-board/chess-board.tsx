import { Component, Prop } from '@stencil/core';

@Component({
  tag: 'chess-board',
  styleUrl: 'chess-board.css',
  shadow: true
})
export class ChessBoard {

  @Prop() first: string;
  @Prop() last: string;

  render() {
    return (
      <div>
        Hello, World! I'm {this.first} {this.last}
      </div>
    );
  }
}
