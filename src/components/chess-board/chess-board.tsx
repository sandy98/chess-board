import { Component, Prop, State, Method, Listen, Watch, Event, EventEmitter} from '@stencil/core'
import chessSets  from 'chess-sets'
import SimpleGame from './simple-game'

const version = '0.9.9'

const v4 = () => Math.round(new Date().getTime()).toString(16)

@Component({
  tag: 'chess-board',
  styleUrl: 'chess-board.css',
  shadow: false
})
export class ChessBoard {

  @Event() newMove: EventEmitter
  @Event() changeCurrent: EventEmitter

  @Prop() version: string = version
  @Prop() uuid: string = v4()
  @Prop() greeting: string = `ChessBoard version ${this.version}`

  @Prop({mutable: true}) game: any = new SimpleGame()
  @Prop() initialPosition: string = this.game.position()
  @Prop() emptyPos: string = `${"0".repeat(64)}`
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

  @Prop() figurines: object = {
    p: {codePoint: '0x265f',	html: '&#9823;'},
    n: {codePoint: '0x265e',	html: '&#9822;'},
    b: {codePoint: '0x265d',	html: '&#9821;'},
    r: {codePoint: '0x265c',	html: '&#9820;'},
    q: {codePoint: '0x265b',	html: '&#9819;'},
    k: {codePoint: '0x265a',	html: '&#9818;'},
    P: {codePoint: '0x2659',	html: '&#9817;'},
    N: {codePoint: '0x2658',	html: '&#9816;'},
    B: {codePoint: '0x2657',	html: '&#9815;'},
    R: {codePoint: '0x2656',	html: '&#9814;'},
    Q: {codePoint: '0x2655',	html: '&#9813;'},
    K: {codePoint: '0x2654',	html: '&#9812;'}
  }

  @Prop() initialMode: string = this.modes['MODE_PLAY']
    
  @State() boardMode: string = this.initialMode
  @Watch('boardMode')
  testMode(newValue: string, oldValue: string) {
    if (!(newValue in this.modes)) {
      console.log(`${newValue} is not an accepted board mode.`)
      this.boardMode = oldValue
    }
  }
  @State() position: string = this.initialPosition
  @State() positions: string[] = [this.initialPosition]
  @State() flipped: boolean = false
  @State() isMounted: boolean = false
  @State() height: string 
  @State() sqFrom: number = -1
  @State() isDragging: boolean = false
  @State() promotionSq: number = -1
  @State() overSized: boolean = false
  @State() current: number = 0

  componentDidLoad() {
    this.isMounted = true
    console.clear()
    //console.log(`Component has been mounted with Id ${this.uuid}`)
    //console.log("defaultFen = "  + SimpleGame.defaultFen())
    console.log(SimpleGame.fen2obj(SimpleGame.defaultFen()))
  }

  /*
  @Listen('changeCurrent')
  chCurHandler(ev: CustomEvent) {
    console.log('Board changeCurrent handler: ' + ev.detail)
  }
  */

  @Listen('newMove')
  moveHandler(event: CustomEvent) {
    //console.log('Received the custom move event: ', event.detail);
    //console.log(`Now board has ${this.positions.length} positions`)
    event.detail
    let notation = document.getElementById(`${this.uuid}-notation`)
    if (notation) {
      console.log("ScrollTop: " + notation.scrollTop + " - ScrollHeight: " + notation.scrollHeight)
      //notation.scrollTop = notation.scrollHeight
      notation.scrollTop = 1000
    }
    else {
      console.log("Couldn't scroll element " + `${this.uuid}-notation`)
    }
  }

  @Listen('window:resize')
  onResize(_: UIEvent) {
    console.log("Window resize. Forcing re-render")
    this.render()
  }

  @Method()
  setGame(g: any) {
    this.game = g
    this.reset()
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
    return SimpleGame.isPromoting(from, to, this.game.position())
  }

  isEnPassant(from: number, to: number) {
    return SimpleGame.isEnPassant(from, to, this.game.position())
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
    this.game.clear()
    this.position = this.game.position()
    this.positions = [this.game.position()]
  }

  @Method()
  reset() {
    this.game.reset()
    this.position = this.game.position()
    this.positions = [this.game.position()]
    this.current = 0
    this.sqFrom = -1
    this.promotionSq = -1
  }

  @Method()
  setSquare(sq: number, figure: string) {
    this.game.put(sq, figure)
    this.position = this.game.position()
    this.positions = this.game.positions()
  }

  @Method()
  move(from, to, promotion: string) {
    if (this.boardMode == 'MODE_SETUP') {
      this.setSquare(to, promotion? promotion : this.position[from])
      this.setSquare(from, '0')
      return true
    }
    let retVal = this.game.move(from, to, promotion)
    if (!retVal) {
      this.sqFrom = -1
      return false
    }
    this.position = this.game.position()
    this.positions = this.game.positions()
    this.current = this.game.positions().length - 1
    this.newMove.emit({from: from, to: to, promotion: promotion})
    return true
  }

  @Method()
  takeBack() {
    if (this.boardMode !== 'MODE_ANALYSIS') return false;
    let ret = this.game.undo()
    if (ret) {
      this.positions = this.game.positions()
      this.position = this.game.position()
      this.current = this.positions.length - 1
    }
    return ret
  } 

  @Method()
  remoteMove(...args) {
    if (this.boardMode === 'MODE_SETUP') return false
    return this.move.apply(this, args)
  }

  @Method()
  goto(n: number) {
    if (n < 0) n = 0
    if (n >= this.positions.length) n = this.positions.length - 1
    this.current = n
    this.position = this.positions[n]
    this.changeCurrent.emit(this.current)
  }

  getPromotionFigures() {
    if (this.sqFrom === -1) return []
    return SimpleGame.isWhiteFigure(this.position[this.sqFrom]) ? "QRNB".split('') : "qrnb".split('')
  }

  isTurnConflict(figure: string) {
    return this.game.fenObj().turn === 'w' && SimpleGame.isBlackFigure(figure) ||
           this.game.fenObj().turn === 'b' && SimpleGame.isWhiteFigure(figure)
  }

  onSqClick(sq: number, ev: UIEvent) {
    if (this.boardMode === 'MODE_VIEW') {
      ev.preventDefault()
      return false
    }
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
      this.sqFrom = -1
      return
    }
    if (this.sqFrom === -1) {
      if (this.position[sq] !== '0' && !this.isTurnConflict(this.position[sq])) {
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
        this.sqFrom = -1 
      } else {
          if (!!this.autoPromotion) {
            this.move(this.sqFrom, sq, SimpleGame.isBlackFigure(figure) ? 
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

  onDragFigure(sq: number, ev: UIEvent) {
  
    if (this.boardMode == 'MODE_VIEW' || this.isTurnConflict(this.position[sq])) {
      ev.preventDefault()
      return false
    }
    this.isDragging = true
    this.sqFrom = sq
    return true
  }

  @Method()
  forceUpdate() {
    this.render()
  }

  @Method()
  setup() {
    console.log("Entering setup mode")
    this.boardMode = this.modes['MODE_SETUP']
    this.game.reset(this.game.fen())
    this.positions = this.game.positions()
  }

  @Method()
  view() {
    console.log("Entering view mode")
    this.boardMode = this.modes['MODE_VIEW']
  }

  @Method()
  play() {
    console.log("Entering play mode")
    this.boardMode = this.modes['MODE_PLAY']
  }

  @Method()
  analyze() {
    console.log("Entering analyze mode")
    this.boardMode = this.modes['MODE_ANALYSIS']
  }

  @Method()
  getSets() {return this.sets}
  
  @Method()
  getMode() {return this.boardMode}

  @Method()
  getLength() {return this.positions.length}

  @Method()
  getTurn() {return this.game.fenObj().turn}

  @Method()
  togglePanel() {
    this.rightPanel = !this.rightPanel
  }

  getRows() {
    const getImage = (n) => {
      let size = this.chessSet === 'default' || this.chessSet === 'alt1' ? '100%' : '80%'
      return (<img 
                src={this.sets[this.chessSet][this.position[n]]}
                style={{
                  width: size,
                  height: size,
                  cursor: 'pointer',
                  opacity: n === this.sqFrom && this.isDragging ? '0' : '1' 
                  }}
                onDragStart={(ev: UIEvent) => this.onDragFigure(n, ev)}
                onDragEnd={() => this.isDragging = false}
                onDblClick={(ev: UIEvent) => {ev.preventDefault(); ev.cancelBubble = true}}
              />)
    }

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
                                                         SimpleGame.lightSq(idx) ? this.lightBg : this.darkBg}}
                            key={y * 8 + x}
                            data-id={idx.toString()}
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
    return rows
  }

  getSetup() {
    return (
      <div 
      class="board-setup"
      style={{
              display: this.boardMode === 'MODE_SETUP' ? 'flex' : 'none', background: this.lightBg
            }}
     >
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

        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', marginTop: '0.5rem'}}>
          <label>Turn to play: </label>
          <input 
            name="turn" 
            type="radio" 
            value="w"
            checked={this.game.fenObj().turn === 'w'}
            onChange={(ev: UIEvent) => this.game.fenObj().turn = ev.target['value']} 
          />
          <label>White</label>
          <input 
            name="turn" 
            type="radio" 
            value="b" 
            checked={this.game.fenObj().turn === 'b'} 
            onChange={(ev: UIEvent) => this.game.fenObj().turn = ev.target['value']} 
          />
          <label>Black</label>
        </div>

        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-evenly', marginTop: '0.5rem'}}>
        <button onClick={() => this.empty()}>Empty Board</button>
        <button onClick={() => this.reset()}>Start Position</button>
        <button onClick={() => {
            this.boardMode = this.initialMode
            this.sqFrom = -1
            this.positions = [this.position]
          }}>Done</button>
        </div>
     </div>
    )
  }

  getNotation() {
    let getSanHtml = (san, i) => {
       let number = this.game.fenObjs()[i].turn === 'w' ? `${this.game.fenObjs()[i].fullMoveNumber}. ` : 
         i === 0 ? `${this.game.fenObjs()[i].fullMoveNumber}. ... ` : ''
       let ma = san.match(/[NBRQK]/)
       if (!ma) {
         return `<span>${number}</span><span>${san}</span>`
       }
       let rf = this.game.fenObjs()[i].turn === 'w' ? ma[0] : ma[0].toLowerCase()
       /*
       if (ma.index === 0) {
         return `<span>${number}</span>
                 <span style="font-size: 2rem;">${this.figurines[rf].html}</span>
                 <span>${san.slice(1)}</span>`
       } else {
        return `<span>${number}</span>
                <span>${san.slice(0, ma.index).replace('=', '')}</span>
                <span style="font-size: 2rem;">${this.figurines[rf].html}</span>
                <span>${san.slice(ma.index + 1, san.length)}<span>`
       }
       */
       if (ma.index === 0) {
        return `<span>${number}</span>
                <span><img style="height: 1.5rem; width: 1.5rem;" src="${this.sets['default'][rf]}" /></span>
                <span>${san.slice(1)}</span>`
      } else {
       return `<span>${number}</span>
               <span>${san.slice(0, ma.index).replace('=', '')}</span>
               <span><img style="height: 1.5rem; width: 1.5rem;" src="${this.sets['default'][rf]}" /></span>
               <span>${san.slice(ma.index + 1, san.length)}<span>`
      }
   }

    return ([
      <div class="notation-row" id={`${this.uuid}-notation`}>
        <div style={{color: this.darkBg, fontWeight: 'bold'}}>
          White
        </div>
        <div>{this.game.getWhite()}</div>
      </div>,
      <div class="notation-row">
        <div style={{color: this.darkBg, fontWeight: 'bold'}}>
          Black
        </div>
        <div>{this.game.getBlack()}</div>
    </div>,
    <div class="notation-row">
      <div style={{color: this.darkBg, fontWeight: 'bold'}}>
        Date
      </div>
      <div>{this.game.date}</div>
    </div>,
    <div class="notation-row">
      <div style={{color: this.darkBg, fontWeight: 'bold'}}>
        Result
      </div>
      <div>{this.game.result}</div>
    </div>,
    <div>&nbsp;</div>,
    <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap'
        }}
      >
      {[
        <div
          key={0}
          style={{
            background: 0 === this.current ? this.lightBg : 'inherit', 
            paddingRight: '0.5rem',
            paddingLeft: '0.5rem',
            cursor: 'pointer',
            border: 'dotted 1px'
          }}
          onClick={() => this.goto(0)}
        >
          &nbsp;
        </div>,
        <br/>, 
        this.game.history().slice(1).map((m, i) => {
          return (
            <div 
              key={i + 1}
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                background: (i + 1) === this.current ? this.lightBg : 'inherit',
                paddingRight: '0.5rem',
                paddingLeft: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                height: '2rem',
                minHeight: '2rem'
              }}
              onClick={() => this.goto(i + 1)}
              innerHTML={getSanHtml(m, i)}
            >
            </div>
          )
        })
      ]}  
    </div>
   ])
  }

  getPromotionPanel() {
    let coords = this.getCoords()
    return (
          <div class="promotion-panel"
                style={{
                  display: this.promotionSq === -1 ? 'none' : 'flex',
                  left: `${Math.floor(coords['left'] + 
                        (SimpleGame.col(this.promotionSq) ^ (this.flipped ? 7 : 0)) * 
                        (parseInt(this.height) / 8))}px`,
                  top: `${Math.floor(coords['top'] + 
                        (SimpleGame.row(this.promotionSq) ^ (this.flipped ? 0 : 7)) * 
                        (parseInt(this.height) / 8))}px`,
                  width: `${parseInt(this.height) / 2}px`, 
                  height: `${parseInt(this.height) / 8}px`, 
                  background: SimpleGame.lightSq(this.promotionSq) ? this.lightBg : this.darkBg,
                }}
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
    )
  }

  render() {
    this.getHeight()
    return (
      <div
        id={`${this.uuid}-parent`}
        class="board-parent"
        style={{
          flexDirection: window.innerHeight > window.innerWidth ? 'column': 'row', 
        }}
      >
        <div
          class="board"
          id={this.uuid}
          style={{
            width: window.innerHeight > window.innerWidth ? '100%' : '65%',
            height: this.height,
          }}
        >
          {this.getRows()}
        </div>
        <div
          class="lateral-panel"
          style={{
            display: this.rightPanel ? 'flex' : 'none', 
            height: this.height,
            width: window.innerHeight > window.innerWidth ? '100%' : '35%'
          }}
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
            class="setup-or-form"
          >
            <div 
              class="setup"
              style={{
                display: this.boardMode === 'MODE_SETUP' ? 'flex' : 'none',
                background: this.lightBg
              }}
            >
              {this.getSetup()}
            </div>
            <div 
              class="chess-form"
              style={{
                display: this.boardMode !== 'MODE_SETUP' ? 'flex' : 'none'
              }}
            >
              {this.getNotation()}
            </div>
          </div>
          <div class="external-contents">
            <slot name="external-contents"></slot>
          </div>  
        </div>
        {this.getPromotionPanel()}
      </div>
    )
  }

}
