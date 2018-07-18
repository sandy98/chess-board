import { Component, Prop, State, Method, Listen} from '@stencil/core';
import chessSets  from './chess-sets'

const row = (sq) => Math.floor(sq / 8)
console.log(row(56))

const col = (sq) => sq % 8
console.log(col(56))

const even = (sq) => sq % 2 === 0
console.log(even(56))

const odd = (sq) => !even(sq)
console.log(odd(56))

const lightSq = (sq) => odd(row(sq)) && even(col(sq)) || even(row(sq)) && odd(col(sq))
console.log(lightSq(56))
console.log(lightSq(63))

const darkSq = (sq) => !lightSq(sq)
console.log(darkSq(56))
console.log(darkSq(63))

@Component({
  tag: 'chess-board',
  styleUrl: 'chess-board.css',
  shadow: false
})
export class ChessBoard {


  @Prop({mutable: true}) lightBg: string = "#f0d9b5"
  @Prop({mutable: true}) darkBg: string = "#b58863"
  @Prop({mutable: true}) selectedBg: string = "#bde6ed"
  @Prop({mutable: true}) chessSet: string = "default"
  @Prop() sets: object = chessSets
  @Prop() initialFen: string = `RNBQKBNR${"P".repeat(8)}${"0".repeat(32)}${"p".repeat(8)}rnbqkbnr`
  @Prop() emptyFen: string = `${"0".repeat(64)}`

  @Prop() greeting: string = `Hello, World! I'm ChessBoard Web Component and my initial chess set is ${this.chessSet}`

  @State() fen: string = this.initialFen
  @State() flipped: boolean = false
  @State() isMounted: boolean = false
  @State() height: string 
  @State() sqFrom: number = -1
  @State() isDragging: boolean = false

  componentDidLoad() {
    this.isMounted = true
    console.log('Component has been mounted');
  }

  @Listen('window:resize')
  onResize(ev: UIEvent) {
    ev
    console.log("Window resize. Forcing re-render")
    this.render()
  }

  @Method()
  getHeight() {
    if (!this.isMounted) return this.height = '40vw'
    //return '40vw'
    let brd = document.getElementsByClassName('board')[0]
    return brd['offsetWidth'] ? this.height = `${brd['offsetWidth']}px` : this.height = '40vw'
  }

  @Method()
  flip() {this.flipped = !this.flipped}

  @Method()
  isFlipped() {return this.flipped}

  @Method()
  selectSet(newSet: string) {
    this.chessSet = newSet
  }

  @Method()
  empty() {
    this.fen = this.emptyFen;
  }

  @Method()
  reset() {
    this.fen = this.initialFen;
  }

  @Method()
  setSquare(sq: number, figure: string) {
    let arr = this.fen.split('')
    arr[sq] = figure
    this.fen = arr.join('')
  }

  @Method()
  move(from: number, to: number, promotion: string) {
    let figure = promotion ? promotion : this.fen[from]
    this.setSquare(to, figure)
    this.setSquare(from, '0')
    if (figure === 'K' && from === 4 && to === 6) {
      this.setSquare(7, '0')
      this.setSquare(5, 'R')
    }
    if (figure === 'K' && from === 4 && to === 2) {
      this.setSquare(0, '0')
      this.setSquare(3, 'R')
    }
    if (figure === 'k' && from === 60 && to === 62) {
      this.setSquare(63, '0')
      this.setSquare(61, 'r')
    }
    if (figure === 'k' && from === 60 && to === 58) {
      this.setSquare(56, '0')
      this.setSquare(59, 'r')
    }
  }

  @Method()
  onSqClick(sq: number, _: UIEvent) {
    if (this.sqFrom === -1) {
      if (this.fen[sq] !== '0') {
        this.sqFrom = sq 
      }
    } else if (sq === this.sqFrom) {
      this.sqFrom = -1
    } else {
      this.move(this.sqFrom, sq, null)
      this.sqFrom = -1
    }
  }

  @Method()
  onFigureDrop(sq: number, ev: UIEvent) {
    this.onSqClick(sq,ev)
  }

  @Method()
  onDragFigure(sq) {
    this.isDragging = true
    this.sqFrom = sq
  }

  render() {
    let that = this
    const getImage = (n) => {
      let size = that.chessSet === 'default' || that.chessSet === 'alt1' ? '100%' : '80%'
      return (<img 
                src={that.sets[that.chessSet][that.fen[n]]}
                style={{
                  width: size,
                  height: size,
                  cursor: 'pointer',
                  opacity: n === this.sqFrom && this.isDragging ? '0' : '1' 
                  }}
                onDragStart={() => this.onDragFigure(n)}
                onDragEnd={() => this.isDragging = false}
                onDblClick={(ev: UIEvent) => {ev.preventDefault(); ev.cancelBubble = true}}
              />)
    }
    this.getHeight()
    console.log("Rendering component")
    let enumerator = [...new Array(8)].map((_, idx) => idx)
    let rows = enumerator.map((y) => {
      return (<div 
                style={{display: 'flex', flexDirection: 'row', height: '12.5%'}} 
                key={y}
                onDblClick={(ev: UIEvent) => {
                                              ev.preventDefault()
                                              ev.cancelBubble = true
                                              this.flip() 
                                              this.sqFrom = -1
                                             }}
              >
                {
                  enumerator.map((x) => {
                    let idx = y * 8 + x ^ (this.flipped ? 7 : 56)
                    return (
                      <div style={{display: 'flex', 
                                   justifyContent: 'center',
                                   alignItems: 'center',
                                   width: '12.5%', 
                                   border: 'none',
                                   background: idx === this.sqFrom ? this.selectedBg : 
                                                         lightSq(idx) ? this.lightBg : this.darkBg}}
                            key={y * 8 + x}
                            title={idx.toString()}
                            onClick={(ev: UIEvent) => this.onSqClick(idx, ev)}
                            onDragEnter={(ev: UIEvent) => ev.preventDefault()}
                            onDragOver={(ev: UIEvent) => ev.preventDefault()}
                            onDrop={(ev: UIEvent) => this.onFigureDrop(idx, ev)}
                      >
                        {this.fen[idx] === '0' ? '' : getImage(idx)}
                      </div>
                    )
                  })
                } 
              </div>)
    })

    return (
      <div style={{width: '100%'}}>
        <div class="board" style={{height: this.height}}>
          {rows}
        </div>
        <div>
          <slot name="greeting"></slot>
        </div>
      </div>
    )
  }
}
