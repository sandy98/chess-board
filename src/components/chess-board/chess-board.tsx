import { Component, Prop, State, Method, Listen, Watch} from '@stencil/core';
import chessSets  from './chess-sets'

const version = '0.1.0'

const row = (sq) => Math.floor(sq / 8)
row(56)

const col = (sq) => sq % 8
col(56)

const even = (sq) => sq % 2 === 0
even(56)

const odd = (sq) => !even(sq)
odd(56)

const lightSq = (sq) => odd(row(sq)) && even(col(sq)) || even(row(sq)) && odd(col(sq))
lightSq(56)
lightSq(63)

const darkSq = (sq) => !lightSq(sq)
darkSq(56)
darkSq(63)

const inv56 = (str: string) => {
  let a64: string[] = str.split('')
  let i64: string[] = a64.map((_, i) => a64[i ^ 56])
  return i64.join('')
}
inv56(`RNBQKBNR${"P".repeat(8)}${"0".repeat(32)}${"p".repeat(8)}rnbqkbnr`)

const addSlashes = (str: string) => {
  return str.replace(/(\w{8})(?=\S)/g, "$1/")
}
addSlashes(inv56(`RNBQKBNR${"P".repeat(8)}${"0".repeat(32)}${"p".repeat(8)}rnbqkbnr`))

const removeSlashes = (str: string) => {
  return str.replace(/\//g, "")
}
removeSlashes("12345678/90123456/78901234")

const compressFen = (str: string) => {
  return addSlashes(str).replace(/0+/g, (zeros) => zeros.length.toString())
}
compressFen(inv56(`RNBQKBNR${"P".repeat(8)}${"0".repeat(32)}${"p".repeat(8)}rnbqkbnr`))

const expandFen = (str: string) => {
  return removeSlashes(str).replace(/\d/g, (n) => "0".repeat(parseInt(n)))
}
expandFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')

@Component({
  tag: 'chess-board',
  styleUrl: 'chess-board.css',
  shadow: false
})
export class ChessBoard {

  @Prop() version: string = version
  @Prop() greeting: string = `ChessBoard version ${this.version}`
  @Prop() initialFen: string = `RNBQKBNR${"P".repeat(8)}${"0".repeat(32)}${"p".repeat(8)}rnbqkbnr`
  @Prop() emptyFen: string = `${"0".repeat(64)}`
  @Prop({mutable: true}) chessSet: string = "default"
  @Prop() sets: object = chessSets
  @Prop() schemas: object = {
    brown: {light: '#f0d9b5', dark: '#b58863'},
    blue: {light: '#add8e6', dark: '#6495ed'},
    acqua: {light: '#dfdfdf', dark: '#56b6e2'},
    green: {light: 'beige', oldLight: '#faffBd', dark: '#769656'}
  }
  @Prop({mutable: true}) lightBg: string = this.schemas['brown']['light']
  @Prop({mutable: true}) darkBg: string = this.schemas['brown']['dark']
  @Prop({mutable: true}) selectedBg: string = "#bfd"
  @Prop({mutable: true}) autoPromotion: string = null
  @Watch('autoPromotion')
  validateFigure(newValue: string, _) {
    if (newValue !== null && newValue !== '' && !"NBRQ".match(newValue)) {
      throw new Error('Promotion figure must be one of: N - B - R - Q')
    }
  }
 
  @Prop() modes: object = {
    MODE_SETUP: 'MODE_SETUP',
    MODE_ANALYSIS: 'MODE_ANALYSIS',
    MODE_VIEW: 'MODE_VIEW',
    MODE_PLAY: 'MODE_PLAY'
  }

  @Prop() initialMode: string = this.modes['MODE_PLAY']

  @State() mode: string = this.initialMode
  @State() position: string = this.initialFen
  @State() flipped: boolean = false
  @State() isMounted: boolean = false
  @State() height: string 
  @State() sqFrom: number = -1
  @State() isDragging: boolean = false
  @State() promotionSq: number = -1
  @State() overSized: boolean = false

  componentDidLoad() {
    this.isMounted = true
    console.log('Component has been mounted');
    //let compressed = compressFen(inv56(this.position))
    //console.log(`Compressed FEN: ${compressed}`)
    //console.log(`Expanded and inverted FEN: ${inv56(expandFen(compressed))}`)
  }

  @Listen('window:resize')
  onResize(_: UIEvent) {
    console.log("Window resize. Forcing re-render")
    this.render()
  }

  @Method()
  exportFen() {
    return compressFen(inv56(this.position))
  }

  @Method()
  isWhiteFigure(f: string) {
    return !!"PNBRQK".match(f)
  }

  @Method()
  isBlackFigure(f: string) {
    return !!"pnbrqk".match(f)
  }

  @Method()
  isFriend(sq1: number, sq2: number) {
    return !!("PNBRQK".match(this.position[sq1]) && "PNBRQK".match(this.position[sq2]) ||
           "pnbrqk".match(this.position[sq1]) && "pnbrqk".match(this.position[sq2]))
  }

  @Method()
  isFoe(sq1: number, sq2: number) {
    return !!("PNBRQK".match(this.position[sq1]) && "pnbrqk".match(this.position[sq2]) ||
           "pnbrqk".match(this.position[sq1]) && "PNBRQK".match(this.position[sq2]))
  }

  @Method()
  isPromoting(from: number, to: number) {
    let figure = this.position[from]
    let r = row(to)
    return figure === 'P' && r === 7 || figure === 'p' && r === 0
  }

  @Method()
  isEnPassant(from: number, to: number) {
    let figureFrom = this.position[from]
    let figureTo = this.position[to]
    if (!"Pp".match(figureFrom)) return false
    if (figureTo !== '0') return false
    if (col(from) === col(to)) return false
    return figureFrom === 'P' ? -8 : 8
  }

  @Method()
  setBg(light, dark) {
    this.lightBg = light || this.lightBg
    this.darkBg = dark || this.darkBg
  } 

  @Method()
  setSchema(n: number) {
    if (n < 0 || n > 3 || typeof n === 'undefined') return
    let schema: string = n === 0 ? 'brown' : n === 1 ? 'blue' : n === 2 ? 'acqua' : 'green'
    this.setBg(this.schemas[schema]['light'], this.schemas[schema]['dark'])
  }

  @Method()
  getHeight() {
    if (!this.isMounted) return this.height = '40vw'
    //return '40vw'
    let brd = document.getElementsByClassName('board')[0]
    return brd['offsetWidth'] ? this.height = `${brd['offsetWidth']}px` : this.height = '40vw'
  }

  @Method()
  getCoords() {
    if (!this.isMounted) return {left: -1, top: -1}
    let brd = document.getElementsByClassName('board')[0]
    return {left: brd['offsetLeft'], top: brd['offsetTop']} 
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
    this.position = this.emptyFen
    this.sqFrom = -1
    this.promotionSq = -1
  }

  @Method()
  reset() {
    this.position = this.initialFen
    this.sqFrom = -1
    this.promotionSq = -1
  }

  @Method()
  setSquare(sq: number, figure: string) {
    let arr = this.position.split('')
    arr[sq] = figure
    this.position = arr.join('')
  }

  @Method()
  move(from: number, to: number, promotion: string) {
    let enPass = this.isEnPassant(from, to)
    let figure = promotion ? promotion : this.position[from]

    this.setSquare(to, figure)
    this.setSquare(from, '0')

    if (enPass) {
      this.setSquare(to + enPass, '0')
      return
    }

    if (figure === 'K' && from === 4 && to === 6) {
      this.setSquare(7, '0')
      this.setSquare(5, 'R')
      return
    }
    if (figure === 'K' && from === 4 && to === 2) {
      this.setSquare(0, '0')
      this.setSquare(3, 'R')
      return
    }
    if (figure === 'k' && from === 60 && to === 62) {
      this.setSquare(63, '0')
      this.setSquare(61, 'r')
      return
    }
    if (figure === 'k' && from === 60 && to === 58) {
      this.setSquare(56, '0')
      this.setSquare(59, 'r')
    }
  }

  @Method()
  getPromotionFigures() {
    if (this.sqFrom === -1) return []
    return this.isWhiteFigure(this.position[this.sqFrom]) ? "QRNB".split('') : "qrnb".split('')
  }

  @Method()
  onSqClick(sq: number, _: UIEvent) {
    if (this.sqFrom === -1) {
      if (this.position[sq] !== '0') {
        this.sqFrom = sq 
      }
    } else if (sq === this.sqFrom) {
      this.sqFrom = -1
    } else {
      if (this.isFriend(this.sqFrom, sq)) {
        this.sqFrom = -1
        return
      }
      if (!this.isPromoting(this.sqFrom, sq)) { 
        this.move(this.sqFrom, sq, null)
        this.sqFrom = -1 } else {
          let figure: string = this.position[this.sqFrom]
          if (!!this.autoPromotion) {
            this.move(this.sqFrom, sq, this.isBlackFigure(figure) ? 
                                         this.autoPromotion.toLowerCase() :
                                        this.autoPromotion.toUpperCase())
            return this.sqFrom = -1
          }
          this.promotionSq = sq
          return 
          /*
          let promotion: string
          while (!promotion) {
            promotion = prompt("Choose a figure (Q, R, N, B", "Q")
            if(!"QRNB".match(promotion)) {
              promotion = null
              continue
            }
            promotion = figure === 'p' ? promotion.toLowerCase() : promotion.toUpperCase()
          }
          this.move(this.sqFrom, sq, promotion)
          this.sqFrom = -1
          */
        }
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

  @Method()
  forceUpdate() {
    this.render()
  }

  render() {
    let that = this
    let coords: object = that.getCoords()
    if (parseInt(this.height) >= (document.body.clientHeight * 0.8)) {
      this.overSized = true
    } else {this.overSized = false}
    const getImage = (n) => {
      let size = that.chessSet === 'default' || that.chessSet === 'alt1' ? '100%' : '80%'
      return (<img 
                src={that.sets[that.chessSet][that.position[n]]}
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
    console.log(`Rendering component with position: ${this.exportFen()}`)
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
                        {this.position[idx] === '0' ? '' : getImage(idx)}
                      </div>
                    )
                  })
                } 
              </div>)
    })

    return (
      <div style={{width: '100%', display: 'flex', flexDirection: 'row'}}>
        <div class="board" style={{height: this.height, 
                                   width: '65%', 
                                   marginRight: '1rem'}}
        >
          {rows}
        </div>
        <div class="promotion-panel"
          style={{display: this.promotionSq === -1 ? 'none' : 'flex', 
                  flexDirection: 'row',
                  position: 'absolute',
                  left: `${Math.floor(coords['left'] + 
                        (col(this.promotionSq) ^ (this.flipped ? 7 : 0)) * 
                        (parseInt(this.height) / 8))}px`,
                  top: `${Math.floor(coords['top'] + 
                        (row(this.promotionSq) ^ (this.flipped ? 0 : 7)) * 
                        (parseInt(this.height) / 8))}px`,
                  width: `${parseInt(this.height) / 2}px`, 
                  height: `${parseInt(this.height) / 8}px`, 
                  background: lightSq(this.promotionSq) ? this.lightBg : this.darkBg,
                  border: 'solid 2px',
                  zOrder: '1000'}}
        >
         { 
           this.getPromotionFigures().map(
             (f) => (
               <div key={f} 
                    style={{display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            width: '25%',
                            borderRight: 'solid 1px',
                            cursor: 'pointer'
                          }}
                    onClick={(_: UIEvent) => {
                      this.move(this.sqFrom, this.promotionSq, f)
                      this.sqFrom = -1
                      this.promotionSq = -1
                    }}
               >
                 <img src={this.sets[this.chessSet][f]} style={{width: '80%', height: '80%'}}/>
               </div>
             )
           )
         }
        </div>
        <div style={{width: '35%', display: 'flex', flexDirection: 'column'}}>
          <div class="chess-form">
          </div>
          <div> 
            <slot name="external-contents"></slot>
          </div>
        </div>
      </div>
    )
  }

}
