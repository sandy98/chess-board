  interface fenObj {
    pos: string
    fenPos: string
    turn: string
    castling: string
    enPassant: string
    halfMoveClock: number
    fullMoveNumber: number
  }
  
  interface iMoveInfo {
    turn: string  
    from: number
    to: number
    figureFrom: string
    figureTo: string
    promotion: string
    capture: boolean
    check?: boolean
    checkmate?: boolean
    stalemate?: boolean
    castling: boolean
    san: string
    fullMoveNumber: number
    enPassant: boolean
  }

  interface iGame {
    fens: string[]
    sans: iMoveInfo[]
    move(from: any, to: any, promotion: string): boolean
    fen(): string
  }

  interface iSevenTags {
    Event: string
    Site: string
    Date: string
    Round: string
    White: string
    Black: string
    Result: string
  }

  interface iResults {
    white: string
    black: string
    draw: string
    unterminated: string
  }

  export default class Game implements iGame {
    static PgnDate(dt: Date = new Date()): string {
      let y = dt.getFullYear()
      let m = (dt.getMonth() + 1).toString().replace(/^(\d)$/, '0$1')
      let d = (dt.getDate()).toString().replace(/^(\d)$/, '0$1')
      return `${y}.${m}.${d}`
    }

    static row(sq: number): number {
      return Math.floor(sq / 8)
    }
    static col(sq: number): number {
      return sq % 8
    }
    static isEven(sq: number): boolean {
      return sq % 2 === 0
    }
    static isOdd(sq: number): boolean {
      return !Game.isEven(sq)
    }
    static isLight(sq: number): boolean {
      const orec = Game.isOdd(Game.row(sq)) && Game.isEven(Game.col(sq))
      const eroc = Game.isEven(Game.row(sq)) && Game.isOdd(Game.col(sq))
      return orec || eroc
    }
    static isDark(sq: number): boolean {
      return !Game.isLight(sq)
    }

    static compressFenPos(pos: string = Game.fen2obj()['pos']): string {
      let splitted = pos.split('')
      let inverted = splitted.map((_, i) => splitted[i ^ 56]).join('')
      return inverted.replace(/(\w{8})(?=\S)/g, "$1/")
      .replace(/(0+)/g, zeros => zeros.length.toString())
    }
  
    static expandFenPos(fenPos: string = Game.fen2obj()['fenPos']): string {
      let expanded = fenPos.replace(/\//g, '')
      .replace(/\d/g, (i) => '0'.repeat(parseInt(i)))
      let splitted = expanded.split('')
      return splitted.map((_, i) => splitted[i ^ 56]).join('')
    }
  
    static fen2obj(fen: string = Game.defaultFen): fenObj {
      let [fenPos, turn, castling, enPassant, shalfMoveClock, sfullMoveNumber] = fen.split(/\s+/)
      let pos = Game.expandFenPos(fenPos)
      let halfMoveClock: number  = parseInt(shalfMoveClock)
      let fullMoveNumber: number = parseInt(sfullMoveNumber)
      return {pos, fenPos, turn, castling, enPassant, halfMoveClock, fullMoveNumber}
    }
  
    static obj2fen(fenObj: fenObj): string {
      let {pos, fenPos, turn, castling, enPassant, halfMoveClock, fullMoveNumber} = fenObj
      if (typeof fenPos === 'undefined') {
        fenPos = Game.compressFenPos(pos)
      }
      return [fenPos, turn, castling, enPassant, halfMoveClock, fullMoveNumber].join(' ')
    }
  
    static isWhiteFigure(figure: string): boolean {
        return 'PNBRQK'.indexOf(figure) !== -1
    }

    static isBlackFigure(figure: string): boolean {
        return 'pnbrqk'.indexOf(figure) !== -1
    }

    static isFriend(fig1: string, fig2: string): boolean {
        return (Game.isWhiteFigure(fig1) && Game.isWhiteFigure(fig2))
          || (Game.isBlackFigure(fig1) && Game.isBlackFigure(fig2))
    }

    static isFoe(fig1: string, fig2: string): boolean {
        return (Game.isWhiteFigure(fig1) && Game.isBlackFigure(fig2))
          || (Game.isBlackFigure(fig1) && Game.isWhiteFigure(fig2))
    }

    static san2sq(san: string): number {
        if (!san.match(/^[a-h][1-8]$/)) return -1
        return san.charCodeAt(0) - 97 + (san.charCodeAt(1) - 49) * 8
    }

    static sq2san(sq: number): string {
        if (sq < 0 || sq > 63) return '-'
        return `${String.fromCharCode((sq % 8) + 97)}${Math.floor(sq / 8) + 1}`
    }

    static results: iResults = {
      white: '1-0',
      black: '0-1',
      draw: '1/2-1/2',
      unterminated: '*'
    }
    static defaultFen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    static emptyFen: string = '8/8/8/8/8/8/8/8 w - - 0 1'
  
    static sicilianFen: string = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 1'
    static indiareyFen: string = 'r1bq1rk1/pppnn1bp/3p4/3Pp1p1/P1P1Pp2/2N2P2/1P2BBPP/R2QNRK1 b - a3 0 13'
    static yugoslavFen: string = 'r1bq1rk1/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPPQ2PP/R3KB1R w KQ - 3 9'
    static berlinFen: string = 'r1bk1b1r/ppp2ppp/2p5/4Pn2/8/5N2/PPP2PPP/RNB2RK1 w - - 0 9'

    fens: string[] = []
    sans: iMoveInfo[] = []
    tags: iSevenTags = <iSevenTags>{
      Event: 'Internet Game',
      Site: 'Internet',
      Date: Game.PgnDate(),
      Round: '?',
      White: 'White Player',
      Black: 'Black Player',
      Result: Game.results.unterminated
    }

    constructor(fen: string = Game.defaultFen) {
      this.reset(fen)
    }
  
    reset(fen: string = Game.defaultFen) {
      this.fens = [fen]
      this.sans = [<iMoveInfo>{}]
    }
  
    getMaxPos() {return this.fens.length - 1}

    _getWhat(n: number = this.getMaxPos(), what: string = 'pos'): string {
      n = n < 0 ? 0 : n >= this.fens.length ? this.getMaxPos() : n
      return Game.fen2obj(this.fens[n])[what]
    }
  
    getPos(n: number = this.getMaxPos()): string {
      return this._getWhat(n, 'pos')
    }
  
    getFenPos(n: number = this.getMaxPos()): string {
      return this._getWhat(n, 'fenPos')
    }
  
    getTurn(n: number = this.getMaxPos()): string {
      return this._getWhat(n, 'turn')
    }
  
    getCastling(n: number = this.getMaxPos()): string {
      return this._getWhat(n, 'castling')
    }
  
    getEnPassant(n: number = this.getMaxPos()): string {
      return this._getWhat(n, 'enPassant')
    }
  
    getHalfMoveClock(n: number = this.getMaxPos()): number {
      return parseInt(this._getWhat(n, 'halfMoveClock'))
    }
  
    getFullMoveNumber(n: number = this.getMaxPos()): number {
      return parseInt(this._getWhat(n, 'fullMoveNumber'))
    }

    isShortCastling(from: number, to: number, npos: number = this.getMaxPos()): boolean {
        let pos: string = this.getPos(npos)
        return (from === 4 && to === 6 && pos[4] === 'K')
          || (from === 60 && to === 62 && pos[60] === 'k')
    } 

    isLongCastling(from: number, to: number, npos: number = this.getMaxPos()): boolean {
        let pos: string = this.getPos(npos)
        return (from === 4 && to === 2 && pos[4] === 'K')
          || (from === 60 && to === 58 && pos[60] === 'k')
    } 

    isEnPassant(from: number, to: number, npos: number = this.getMaxPos()): boolean {
        let pos: string = this.getPos(npos)
        return Game.col(from) !== Game.col(to) 
          && !!pos[from].match(/[Pp]/) 
          && pos[to] === '0'
    }

    isTwoSteps(from: number, to: number, npos: number = this.getMaxPos()): boolean {
        let pos: string = this.getPos(npos)
        return Math.abs(Game.row(from) - Game.row(to)) === 2
          && !!pos[from].match(/[Pp]/)
    }

    isPromoting(from: number, to: number, npos: number = this.getMaxPos()): boolean {
        let pos: string = this.getPos(npos)
        return (pos[from] == 'P' && Game.row(to) === 7) 
          || (pos[from] == 'p' && Game.row(to) === 0)
    }

    moveInfo2san(info: iMoveInfo): string {
        if (this.isShortCastling(info.from, info.to)) return 'O-O'
        if (this.isLongCastling(info.from, info.to)) return 'O-O-O'
        let figure: string = !info.figureFrom.match(/[Pp]/)
          ? info.figureFrom.toUpperCase()
          : info.capture
          ? Game.sq2san(info.from)[0]
          : ''

        let capture: string = info.capture ? 'x' : '' 
        let dest: string = Game.sq2san(info.to)
        let promotion: string = info.promotion ? `=${info.promotion.toUpperCase()}` : ''
        let checkInfo: string = info.checkmate
          ? '++'
          : info.check
          ? '+'
          : '' 

        return `${figure}${capture}${dest}${promotion}${checkInfo}`
    }

    canMove(moveInfo: iMoveInfo) {
      let { figureFrom, figureTo, turn } = moveInfo

      if ("pnbrqkPNBRQK".indexOf(figureFrom) === -1) return false
      if (Game.isFriend(figureFrom, figureTo)) return false
      if ((Game.isWhiteFigure(figureFrom) && turn === 'b')
        || (Game.isBlackFigure(figureFrom) && turn === 'w')) return false
      
      return true
    }

    move(from: any, to: any, promotion: string = null): boolean {
        let fObj: fenObj = Game.fen2obj(this.fens[this.getMaxPos()])
        let pos: string[] = fObj.pos.split('')
        let turn: string = fObj.turn
        let figFrom: string = pos[from]
        let figInTo: string = pos[to]
        let figTo: string = promotion ? promotion : figFrom

        let moveInfo = <iMoveInfo>{enPassant: false}

        moveInfo.turn = turn
        moveInfo.from = from
        moveInfo.to = to
        moveInfo.figureFrom = figFrom
        moveInfo.figureTo = figInTo
        moveInfo.promotion = promotion
        moveInfo.capture = figInTo !== '0' || (this.isEnPassant(from, to) 
          && to === Game.san2sq(fObj.enPassant))
        moveInfo.san = this.moveInfo2san(moveInfo)
        moveInfo.fullMoveNumber = fObj.fullMoveNumber
        moveInfo.castling = this.isShortCastling(from, to) || this.isLongCastling(from, to)

        let bCan = this.canMove(moveInfo)

        if (!bCan) return false

        pos[from] = '0'
        pos[to] = figTo
        if (figFrom === 'K' && from === 4 && to === 6) {
            pos[7] = '0'
            pos[5] = 'R'
        }
        if (figFrom === 'K' && from === 4 && to === 2) {
            pos[0] = '0'
            pos[3] = 'R'
        }
        if (figFrom === 'k' && from === 60 && to === 62) {
            pos[63] = '0'
            pos[61] = 'r'
        }
        if (figFrom === 'k' && from === 60 && to === 58) {
            pos[56] = '0'
            pos[59] = 'R'
        }

        if (this.isEnPassant(from, to)) {
            //console.log("En passant move from " + from + " to " + to)
            if (to !== Game.san2sq(fObj.enPassant)) {
                //console.log(`Destination is ${to} and en-passant is ${Game.san2sq(fObj.enPassant)}`)
            } else {
                let sunk: number = Game.san2sq(fObj.enPassant) + 8 * (figFrom === 'P' ? -1 : 1)
                //console.log("En passant sunk pawn at " + sunk) 
                pos[sunk] = '0'
                moveInfo.enPassant = true
            }
        }

        switch(from) {
            case 4:
            fObj.castling = fObj.castling.replace(/[KQ]/g, '')
            break
            case 60:
            fObj.castling = fObj.castling.replace(/[kq]/g, '')
            break
            case 0:
            fObj.castling = fObj.castling.replace('Q', '')
            break
            case 7:
            fObj.castling = fObj.castling.replace('K', '')
            break
            case 56:
            fObj.castling = fObj.castling.replace('q', '')
            break
            case 63:
            fObj.castling = fObj.castling.replace('k', '')
            break
            default:
        }
        fObj.castling = fObj.castling === '' ? '-' : fObj.castling

        if (this.isTwoSteps(from, to)) {
            fObj.enPassant = Game.sq2san(figFrom === 'P' ? to - 8 : to + 8)
        } else {
            fObj.enPassant = '-'
        }

        fObj.halfMoveClock = !!figFrom.match(/[Pp]/) || moveInfo.capture ? 0 : ++fObj.halfMoveClock
        fObj.fullMoveNumber = turn === 'w' ? fObj.fullMoveNumber : ++ fObj.fullMoveNumber
        
        fObj = {
            ...fObj, 
            pos: pos.join(''), 
            fenPos: Game.compressFenPos(pos.join('')),
            turn: turn === 'w' ? 'b' : 'w'
            }
        this.fens = [...this.fens, Game.obj2fen(fObj)]
        this.sans = [...this.sans, moveInfo]
        return true
    }

    fen(): string {return this.fens[this.getMaxPos()]}

    history(options: object = {verbose: false}): any[] {
        if (options['verbose']) {
            return this.sans.slice(1)
        } else {
            return this.sans.slice(1).map( mi => mi.san)
        }
    }

    pgnHeaders(): string {
      let arr = []
      for (let t in this.tags) {
        arr = [...arr, `[${t} "${this.tags[t]}"]`]
      }
      return arr.join('\n')
    }

    pgnMoves(): string {
        let resp: string = this.history({verbose: true}).map(mi => {
            let info: iMoveInfo = <iMoveInfo>mi
            let prefix: string = info.turn === 'w' ? `${info.fullMoveNumber}. ` : ''
            let ep: string = info.enPassant ? ' e.p.' : ''
            return `${prefix}${info.san}${ep}`
        })
        .join('  ')
        return resp
    }

    pgn(): string {
      return [this.pgnHeaders(), this.pgnMoves()].join('\n\n')
    }

    undo(): boolean {
      if (this.getMaxPos() < 1) return false
      this.fens.pop()
      this.sans.pop()
      return true
    }
  }
  
export class ChessGame extends Game {

  canMove(moveInfo: iMoveInfo): boolean {
    return super.canMove(moveInfo)
  }
}

