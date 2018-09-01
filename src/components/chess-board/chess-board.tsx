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
  @Prop() trashbin: string = 'data:image/jpeg;base64,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'

  @Prop({mutable: true}) game: any = new SimpleGame()
  @Prop() initialCastling: string = 'KQkq'
  @Prop() initialPosition: string = this.game.position()
  @Prop({mutable: true}) canMove: string = 'wb'
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
  @State() castling: string = this.initialCastling
  @Watch('castling')
  changeCastling(newCastling: string, oldCastling: string) {
    if (newCastling.match(/[^-KQkq]/)) {
      this.castling = oldCastling
      return
    }
    this.setCastling(newCastling)
  }
    

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
    return (this.game.fenObj().turn === 'w' && SimpleGame.isBlackFigure(figure) ||
           this.game.fenObj().turn === 'b' && SimpleGame.isWhiteFigure(figure)) &&
           this.boardMode !== 'MODE_SETUP'
  }

  isCanMoveConflict(figure: string) {
    return (!this.canMove.match(/b/) && SimpleGame.isBlackFigure(figure) ||
           !this.canMove.match(/w/) && SimpleGame.isWhiteFigure(figure)) &&
           this.boardMode !== 'MODE_SETUP' && this.boardMode !== 'MODE_ANALYSIS'
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
      if (this.position[sq] !== '0' && 
          (!this.isTurnConflict(this.position[sq]) || this.boardMode == 'MODE_PLAY') && 
          !this.isCanMoveConflict(this.position[sq])) {
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
  
    if (this.boardMode === 'MODE_VIEW' || 
        (this.isTurnConflict(this.position[sq]) && this.boardMode !== 'MODE_PLAY') || 
        this.isCanMoveConflict(this.position[sq])) {
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

  @Method()
  getCastling() {
    if (this.castling != this.game.fenObj()['castling']) this.castling = this.game.fenObj()['castling']
    return this.castling
  }

  @Method()
  setCastling(castling) {
    return this.game.setCastling(castling)
  }

  @Method()
  getCastlingBg(fig: string) {
    return this.getCastling().match(fig) ? this.darkBg : this.lightBg
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
    const onClickPermissions = (fig: string, _)  => {
      let castling = this.game.fenObj().castling
      if (castling.match(fig)) {
        castling = castling.replace(fig, '')
        if (!castling) castling = '-'
      } else {
        if (castling === '-') {
          castling = fig
        } else {
          switch(fig) {
            case 'K':
              castling = `${fig}${castling}`
              break
            case 'Q':
              if (castling.match('K')) {
                castling = `KQ${castling.slice(1)}`
              } else {
                castling = `Q${castling}`
              }
              break
            case 'k':
              let revCas = castling.split('').reverse().join('')
              if (revCas.match('q')) {
                revCas = `qk${revCas.slice(1)}`
              } else {
                revCas = `k${revCas}`
              }
              castling = revCas.split('').reverse().join('')
              break
            case 'q':
              castling = `${castling}${fig}`
              break
            default:
              castling = '-'
          }
        }
      }
      console.log(castling)
      this.castling = castling
      return this.setCastling(castling)
    }

    //let trashHeight = `${document.getElementById(this.uuid + "-board-setup").offsetHeight / 4}px`

    return (
      <div
      id={`${this.uuid}-board-setup`} 
      class="board-setup"
      style={{
              display: this.boardMode === 'MODE_SETUP' ? 'flex' : 'none', 
              background: this.lightBg
            }}
     >
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <label style={{border: 'solid 1px silver', borderBottom: 'none'}}>Black Figures</label>
        {
          "pnbrqk".split('').map((fig, i) => {
            return (
              <div key={i} 
                   style={{
                          width: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                          height: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                          background: this.lightBg, 
                          border: 'solid 1px silver', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center'
                         }}
              >
              <img 
                src={this.sets[this.chessSet][fig]}
                style={{cursor: 'pointer', width: this.chessSet === 'alt1' || this.chessSet === 'default' ? '100%' : '80%', 
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
        <label style={{border: 'solid 1px silver'}}>White Figures</label>
        {
          "PNBRQK".split('').map((fig, i) => {
            return (
              <div key={i + 6} 
                   style={{
                          width: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                          height: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                          background: this.lightBg, 
                          border: 'solid 1px silver', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center'
                         }}
              >
              <img 
                src={this.sets[this.chessSet][fig]}
                style={{cursor: 'pointer', width: this.chessSet === 'alt1' || this.chessSet === 'default' ? '100%' : '80%', 
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
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          height: '5rem',
          minHeight: '5rem',
          maxHeight: '5rem',
          paddingTop: '0.5rem'
        }}
      >
        <span
          title={this.sqFrom < -1 ?
            "Discard figure" : 
            "Drag a figure to the trashbin to remove it from board"}
          onDrop={
              () => {
                if (this.boardMode === 'MODE_SETUP' && this.sqFrom > -1) {
                  this.setSquare(this.sqFrom, '0')
                  this.sqFrom = -1
                }
              }
            }
        >
          <img 
            src={this.trashbin}
            title={this.sqFrom < -1 ?
                "Discard figure" : 
                "Drag a figure to the trashbin to remove it from board"}
            style={{
              width: '4rem',
              maxWidth: '4rem',
              minWidth: '4rem',
              height: '4rem',
              maxHeight: '4rem',
              minHeight: '4rem',
              background: this.lightBg
            }} 
          />
        </span>
      </div>
      <div style={{margin: '1em', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <label style={{border: 'solid 1px silver'}}>Castling</label>
          {
            "KQkq".split('').map((fig) => {
              return (
                <div key={fig} 
                     style={{
                            width: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                            height: `${Math.round(parseInt(this.height) / 8 * 0.66)}px`, 
                            background: this.getCastlingBg(fig),
                            border: 'solid 1px silver', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            cursor: 'pointer'
                           }}
                     onClick={(ev: UIEvent) => {
                       ev.preventDefault()
                       return onClickPermissions(fig, ev)
                     }}
                        >
                <img 
                  src={this.sets[this.chessSet][fig]}
                  style={{width: this.chessSet === 'alt1' || this.chessSet === 'default' ? '100%' : '80%', 
                  height: this.chessSet === 'alt1' || this.chessSet === 'default' ? '100%' : '80%'}}
                  onDragStart={(ev: UIEvent) => {
                    ev.preventDefault()
                    ev.cancelBubble = true
                    return false
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
            width: window.innerHeight > window.innerWidth ? '100%' : '60%',
            minWidth: window.innerHeight > window.innerWidth ? '100%' : '60%',
            maxWidth: window.innerHeight > window.innerWidth ? '100%' : '60%',
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
            width: window.innerHeight > window.innerWidth ? '100%' : '40%',
            minWidth: window.innerHeight > window.innerWidth ? '100%' : '40%',
            maxWidth: window.innerHeight > window.innerWidth ? '100%' : '40%'
          }}
          onDragEnter={(ev: UIEvent) => ev.preventDefault()} 
          onDragOver={(ev: UIEvent) => ev.preventDefault()}
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
