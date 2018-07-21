import { Component, Prop, State, Method, Listen, Watch, Event, EventEmitter} from '@stencil/core'
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

const v4 = () => Math.round(new Date().getTime()).toString(16)

@Component({
  tag: 'chess-board',
  styleUrl: 'chess-board.css',
  shadow: false
})
export class ChessBoard {

  @Event() moveEmitter: EventEmitter

  @Prop() version: string = version
  @Prop() uuid: string = v4()
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
  @Prop({mutable: true}) rightPanel: boolean = true
  @Prop({mutable: true}) autoPromotion: string = null
  @Watch('autoPromotion')
  validateFigure(newValue: string, oldValue) {
    if (newValue !== null && newValue !== '' && !"NBRQ".match(newValue)) {
      console.log('Promotion figure must be one of: N - B - R - Q')
      this.autoPromotion = oldValue
    }
  }
 
  @Prop() modes: object = {
    MODE_SETUP: 'MODE_SETUP',
    MODE_ANALYSIS: 'MODE_ANALYSIS',
    MODE_VIEW: 'MODE_VIEW',
    MODE_PLAY: 'MODE_PLAY'
  }

  @Prop() initialMode: string = this.modes['MODE_PLAY']
  @Prop() initialTurn: string = 'w'
    
  @State() turn: string = this.initialTurn
  @State() boardMode: string = this.initialMode
  @Watch('boardMode')
  testMode(newValue: string, oldValue: string) {
    if (!(newValue in this.modes)) {
      console.log(`${newValue} is not an accepted board mode.`)
      this.boardMode = oldValue
    }
  }
  @State() position: string = this.initialFen
  @State() positions: string[] = [this.initialFen]
  @State() flipped: boolean = false
  @State() isMounted: boolean = false
  @State() height: string 
  @State() sqFrom: number = -1
  @State() isDragging: boolean = false
  @State() promotionSq: number = -1
  @State() overSized: boolean = false

  componentDidLoad() {
    this.isMounted = true
    console.clear()
    console.log(`Component has been mounted with Id ${this.uuid}`)
  }

  @Listen('moveEmitter')
  moveHandler(event: CustomEvent) {
    console.log('Received the custom move event: ', event.detail);
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

  isWhiteFigure(f: string) {
    return !!"PNBRQK".match(f)
  }

  isBlackFigure(f: string) {
    return !!"pnbrqk".match(f)
  }

  isFriend(sq1: number, sq2: number) {
    return !!("PNBRQK".match(this.position[sq1]) && "PNBRQK".match(this.position[sq2]) ||
           "pnbrqk".match(this.position[sq1]) && "pnbrqk".match(this.position[sq2]))
  }

  isFoe(sq1: number, sq2: number) {
    return !!("PNBRQK".match(this.position[sq1]) && "pnbrqk".match(this.position[sq2]) ||
           "pnbrqk".match(this.position[sq1]) && "PNBRQK".match(this.position[sq2]))
  }

  isPromoting(from: number, to: number) {
    let figure = this.position[from]
    let r = row(to)
    return figure === 'P' && r === 7 || figure === 'p' && r === 0
  }

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
    let brd = document.getElementById(this.uuid)
    return brd['offsetWidth'] ? this.height = `${brd['offsetWidth']}px` : this.height = '40vw'
  }

  @Method()
  getCoords() {
    if (!this.isMounted) return {left: -1, top: -1}
    let brd = document.getElementById(this.uuid)
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
    this.reset()
    this.position = this.emptyFen
  }

  @Method()
  reset() {
    this.position = this.initialFen
    this.positions = [this.initialFen]
    this.sqFrom = -1
    this.promotionSq = -1
    this.turn = this.initialTurn
  }

  @Method()
  setSquare(sq: number, figure: string) {
    let arr = this.position.split('')
    arr[sq] = figure
    this.position = arr.join('')
  }

  @Method()
  move(from: number, to: number, promotion: string) {
    if (this.position !== this.positions[this.positions.length - 1]) return

    let figure = promotion ? promotion : this.position[from]
    if (this.isWhiteFigure(figure) && this.turn === 'b' || 
        this.isBlackFigure(figure) && this.turn === 'w') {
      if (this.boardMode !== 'MODE_SETUP') return
    }

    let enPass = this.isEnPassant(from, to)
    

    this.setSquare(to, figure)
    this.setSquare(from, '0')

    if (enPass) {
      this.setSquare(to + enPass, '0')
    }

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
    if (this.boardMode !== 'MODE_SETUP') {
      this.positions = [...this.positions, this.position]
      this.turn = this.turn === 'w' ? 'b' : 'w'
    } else {
      this.positions = [this.position]
    }
    this.moveEmitter.emit({from: from, to: to, promotion: promotion})
  }

  @Method()
  goto(n: number) {
    if (n < 0) n = 0
    if (n >= this.positions.length) n = this.positions.length - 1
    this.position = this.positions[n]
  }

  getPromotionFigures() {
    if (this.sqFrom === -1) return []
    return this.isWhiteFigure(this.position[this.sqFrom]) ? "QRNB".split('') : "qrnb".split('')
  }

  isTurnConflict(figure: string) {
    return this.turn === 'w' && this.isBlackFigure(figure) ||
           this.turn === 'b' && this.isWhiteFigure(figure)
  }

  onSqClick(sq: number, _: UIEvent) {
    if (this.boardMode === 'MODE_SETUP' && this.sqFrom < -1) {
      let fig = '0'
      switch (this.sqFrom) {
        case -2:
          fig = 'p'
          break
        case -3:
          fig = 'n'
          break
          case -4:
          fig = 'b'
          break
        case -5:
          fig = 'r'
          break
          case -6:
          fig = 'q'
          break
        case -7:
          fig = 'k'
          break
          case -8:
          fig = 'P'
          break
        case -9:
          fig = 'N'
          break
          case -10:
          fig = 'B'
          break
        case -11:
          fig = 'R'
          break
          case -12:
          fig = 'Q'
          break
        case -13:
          fig = 'K'
          break
      
        default:
          this.sqFrom = -1
          return
      }

      this.setSquare(sq, fig)
      this.positions = [this.position]
      this.sqFrom = -1
      return
    }
    if (this.sqFrom === -1) {
      if (this.position[sq] !== '0') {
        this.sqFrom = sq 
      }
    } else if (sq === this.sqFrom) {
      this.sqFrom = -1
    } else {
      if (this.isFriend(this.sqFrom, sq) && this.boardMode !== 'MODE_SETUP') {
        this.sqFrom = -1
        return
      }
      let figure: string = this.position[this.sqFrom]
      if (!(this.boardMode === 'MODE_SETUP') && this.isTurnConflict(figure)) {
        this.sqFrom = -1
        return              
      }
      if (!this.isPromoting(this.sqFrom, sq)) { 
        this.move(this.sqFrom, sq, null)
        this.sqFrom = -1 } else {
          if (!!this.autoPromotion) {
            this.move(this.sqFrom, sq, this.isBlackFigure(figure) ? 
                                         this.autoPromotion.toLowerCase() :
                                        this.autoPromotion.toUpperCase())
            return this.sqFrom = -1
          }
          this.promotionSq = sq
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

  onFigureDrop(sq: number, ev: UIEvent) {
    this.onSqClick(sq,ev)
  }

  onDragFigure(sq) {
    this.isDragging = true
    this.sqFrom = sq
  }

  @Method()
  forceUpdate() {
    this.render()
  }

  @Method()
  setup() {
    console.log("Entering setup mode")
    this.boardMode = this.modes['MODE_SETUP']
    this.positions = [this.position]
  }

  @Method()
  getSets() {return this.sets}
  
  @Method()
  getMode() {return this.boardMode}

  @Method()
  getLength() {return this.positions.length}

  @Method()
  getTurn() {return this.turn}

  @Method()
  togglePanel() {
    this.rightPanel = !this.rightPanel
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
    // console.log(`Rendering component with position: ${this.exportFen()}`)
    let enumerator = [...new Array(8)].map((_, idx) => idx)
    let rows = enumerator.map((y) => {
      return (<div 
                style={{display: 'flex', 
                        flexDirection: 'row', 
                        height: '12.5%'}} 
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
      <div
        id={`${this.uuid}-parent`} 
        style={{width: '100%', 
                display: 'flex', 
                flexDirection: window.innerHeight > window.innerWidth ? 'column': 'row', 
                border: 'dotted 1px silver', 
                padding: '0'}}
      >
        <div id={this.uuid} class="board" style={{height: this.height, 
                                   width: '65%', 
                                   marginRight: '0'}}
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
        <div 
          style={{
            width: '35%', 
            display: this.rightPanel ? 'flex' : 'none', 
            flexDirection: 'column',
            marginLeft: '0',
            paddingLeft: '0', 
            paddingRight: '0.5rem', 
    }}
        >
          <div class="complements" 
            onDragEnter={(ev: UIEvent) => ev.preventDefault()} 
            onDragOver={(ev: UIEvent) => ev.preventDefault()}
            onDrop={
              () => {
                if (this.boardMode === 'MODE_SETUP' && this.sqFrom > -1) {
                  this.setSquare(this.sqFrom, '0')
                  this.sqFrom = -1
                }
              }
            }
          >
            <div 
              class="chess-form" 
              style={{display: this.boardMode === 'MODE_SETUP' ? 'none' : 'flex'}}
            >
              Game Annotation
            </div>
            <div 
              class="board-setup"
              style={{display: this.boardMode === 'MODE_SETUP' ? 'flex' : 'none', background: this.lightBg}}
            >
             <div>
             <div style={{display: 'flex', flexDirection: 'row'}}>
              {
                "pnbrqk".split('').map((fig, i) => {
                  return (
                   <div key={i} style={{width: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                                height: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                                background: this.lightBg, 
                                border: 'solid 1px silver', 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center'}}
                   >
                    <img 
                      src={this.sets[this.chessSet][fig]}
                      style={{width: this.chessSet === 'alt1' || this.chessSet === 'default' ? '100%' : '80%', 
                      height: this.chessSet === 'alt1' || this.chessSet === 'default' ? '100%' : '80%'}}
                      onDragStart={() => {
                        this.sqFrom = -2 - (i + 0)
                      }}
                      onClick={() => {
                        this.sqFrom = -2 - (i + 0)
                      }}
                    />
                   </div>
                  )
                })
              }
             </div>
             <div style={{display: 'flex', flexDirection: 'row'}}>
              {
                "PNBRQK".split('').map((fig, i) => {
                  return (
                   <div key={i + 6} style={{width: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                                height: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                                background: this.lightBg, 
                                border: 'solid 1px silver', 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center'}}
                   >
                    <img 
                      src={this.sets[this.chessSet][fig]}
                      style={{width: this.chessSet === 'alt1' || this.chessSet === 'default' ? '100%' : '80%', 
                      height: this.chessSet === 'alt1' || this.chessSet === 'default' ? '100%' : '80%'}}
                      onDragStart={() => {
                        this.sqFrom = -2 - (i + 6)
                      }}
                      onClick={() => {
                        this.sqFrom = -2 - (i + 6)
                      }}
                    />
                   </div>
                  )
                })
              }
             </div>
             </div> 
             <div>
               <label>Turn to play: </label>
               <input 
                 name="turn" 
                 type="radio" 
                 value="w"
                 checked={this.turn === 'w'}
                 onChange={(ev: UIEvent) => this.turn = ev.target['value']} 
                />
                <label>White</label>
               <input 
                 name="turn" 
                 type="radio" 
                 value="b" 
                 checked={this.turn === 'b'} 
                 onChange={(ev: UIEvent) => this.turn = ev.target['value']} 
                />
                <label>Black</label>
             </div>
             <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly'}}>
              <button onClick={() => this.empty()}>Empty Board</button>
              <button onClick={() => this.reset()}>Start Position</button>
              <button onClick={() => {
                 this.boardMode = this.initialMode
                 this.sqFrom = -1
                 this.positions = [this.position]
                }}>Done</button>
             </div>
            </div>
          </div>
          <div> 
            <slot name="external-contents"></slot>
          </div>
        </div>
      </div>
    )
  }

}
