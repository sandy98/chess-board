
  interface IFenObj {
    pos: string
    fenPos: string
    turn: string
    castling: string
    enPassant: string
    halfMoveClock: number
    fullMoveNumber: number
  }
  
  interface IResults {
    white: string
    black: string
    draw: string
    unterminated: string
  }

  interface ISevenTags {
    Event: string
    Site: string
    Date: string
    Round: string
    White: string
    Black: string
    Result: string
  }

  interface IMoveInfo {
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

  interface IGame {
    tags: ISevenTags
    fens: string[]
    sans: IMoveInfo[]
    ascii(flipBoard: boolean, n: number): string
    clear(): void
    fen(index: number): string
    game_over(): boolean
    get(square: any, index: number): string
    in_check(index: number): boolean
    in_checkmate(index: number): boolean
    in_draw(index: number): boolean
    in_stalemate(index: number): boolean
    in_threefold_repetition(index: number): boolean
    move(...args: any[]): boolean
    moves(options: object): string[]
    pgn(): string
    header(...args: string[]): ISevenTags
    insufficient_material(n: number): boolean
    load(fen: string): boolean
    load_pgn(pgn: string): boolean  
    put(figure: string, square: any, index: number): boolean
    remove(square: any, index: number): boolean

    square_color(square: any): string
    turn(index: number): string
    undo(): boolean
    validate_fen(fen: string): boolean    
  }

  export default class Game implements IGame {
    static capitalize(word: string): string {
      return `${word[0].toUpperCase()}${word.split('').slice(1).join('').toLowerCase()}`
    }

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
  
    static fen2obj(fen: string = Game.defaultFen): IFenObj {
      let [fenPos, turn, castling, enPassant, shalfMoveClock, sfullMoveNumber] = fen.split(/\s+/)
      let pos = Game.expandFenPos(fenPos)
      let halfMoveClock: number  = parseInt(shalfMoveClock)
      let fullMoveNumber: number = parseInt(sfullMoveNumber)
      return {pos, fenPos, turn, castling, enPassant, halfMoveClock, fullMoveNumber}
    }
  
    static obj2fen(fenObj: IFenObj): string {
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

    static isEqualPos(fen1: string, fen2: string): boolean {
      let [fen_obj1, fen_obj2] = [Game.fen2obj(fen1), Game.fen2obj(fen2)]
      return fen_obj1.fenPos === fen_obj2.fenPos
        && fen_obj1.turn === fen_obj2.turn
        && fen_obj1.castling === fen_obj2.castling
        && fen_obj1.enPassant === fen_obj2.enPassant
    }

    static results: IResults = {
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
    sans: IMoveInfo[] = []
    tags: ISevenTags = <ISevenTags>{
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
      this.sans = [<IMoveInfo>{}]
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

    moveInfo2san(info: IMoveInfo): string {
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

    san2MoveInfo(san: string): IMoveInfo {
      //Not implemented. To be implemented by derived classes
      if (!san.length) return <IMoveInfo>null
      return <IMoveInfo>null
    }

    canMove(moveInfo: IMoveInfo) {
      //Must override
      let { figureFrom, figureTo, turn } = moveInfo

      if ("pnbrqkPNBRQK".indexOf(figureFrom) === -1) return false
      if (Game.isFriend(figureFrom, figureTo)) return false
      if ((Game.isWhiteFigure(figureFrom) && turn === 'b')
        || (Game.isBlackFigure(figureFrom) && turn === 'w')) return false
      
      return true
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
            let info: IMoveInfo = <IMoveInfo>mi
            let prefix: string = info.turn === 'w' ? `${info.fullMoveNumber}. ` : ''
            let ep: string = info.enPassant ? ' e.p.' : ''
            return `${prefix}${info.san}${ep}`
        })
        .join('  ')
        return resp
    }

// Beginning of public interface methods

    ascii(flipBoard: boolean = false, n: number = this.getMaxPos()): string {
      let dottedPos = this.getPos(n).replace(/0/g, '.')
      let header = '   +------------------------+'
      let blank =  ' '.repeat(header.length)
      let footer= flipBoard ? '     h  g  f  e  d  c  b  a' : '     a  b  c  d  e  f  g  h'
      let rows = []
      for (let y = 0; y < 8; y++) {
          let r = flipBoard ? ` ${y + 1} |` : ` ${8 - y} |`
          for (let x = 0; x < 8; x++) {
              r += ` ${dottedPos[(y * 8 + x) ^ (flipBoard ? 7 : 56)]} `
          }
          r += '|'
          rows.push([r, blank].join('\n'))
      }
      return [header, blank, ...rows, header, blank, footer].join('\n')
    }

    clear(): void {
      this.reset(Game.emptyFen)
    }

    fen(index: number = this.getMaxPos()): string {return this.fens[index]}

    history(options: object = {verbose: false}): any[] {
        if (options['verbose']) {
            return this.sans.slice(1)
        } else {
            return this.sans.slice(1).map( mi => mi.san)
        }
    }

    game_over(): boolean {
      //Must override
      return false
    }

    get(square: any, index: number = this.getMaxPos()): string {
      if (typeof square === 'string') square = Game.san2sq(square)
      return this.getPos(index)[square]
    }

    in_check(index: number = this.getMaxPos()): boolean {
      //Must override
      if (index < 0 || index > this.getMaxPos()) return false
      return false
    }

    in_checkmate(index: number = this.getMaxPos()): boolean {
      //Must override
      if (index < 0 || index > this.getMaxPos()) return false
      return false
    }

    in_draw(index: number = this.getMaxPos()): boolean {
      //Must override
      if (index < 0 || index > this.getMaxPos()) return false
      return false
    }

    in_stalemate(index: number = this.getMaxPos()): boolean {
      //Must override
      if (index < 0 || index > this.getMaxPos()) return false
      return false
    }

    in_threefold_repetition(index: number = this.getMaxPos()): boolean {
      if (index < 0 || index > this.getMaxPos()) return false
        let sliced: string[] = this.fens.map(fen => fen.split(/\s+/).slice(0, 4).join(' '))
        // console.log(sliced)
        for (let i = 0; i <= index; i++ ) {
          let reps = 1
          for (let j = i + 1; j <= index; j++) {
            if (sliced[i] === sliced[j]) {
              reps++
              console.log(`Position ${sliced[j]} has repeated ${reps} times`)
              if (reps >= 3) {
                return true
              }
            }
          }
        }
      return false
    }

    header(...args: string[]): ISevenTags {
      if (Game.isOdd(args.length)) args = args.slice(0, args.length - 1)
      if (!args.length) return this.tags
      let [keys, values] = [args.filter((_, i) => Game.isEven(i)).map(Game.capitalize),
        args.filter((_, i) => Game.isOdd(i))]
      for (let n: number = 0; n < keys.length; n++) {
        this.tags[keys[n]] = values[n]
      }
      return this.tags
    }

    insufficient_material(_: number = this.getMaxPos()): boolean
    {
      //Must override
      return false
    }

    load(fen: string = Game.defaultFen): boolean {
      this.reset(fen)
      return true
    }

    load_pgn(pgn: string): boolean {
      if (!pgn.length) return false
      //Must override
      return false
    }

      

    move(...args: any[]): boolean {
        let moveInfo: IMoveInfo
        let from: any
        let to: any
        let promotion: string

        if (args.length === 0) {
          return false
        } else if (args.length === 1) {
          if (typeof args[0] === 'string') {
            moveInfo = this.san2MoveInfo(args[0])
            if (!moveInfo) return false 
            from = moveInfo.from
            to = moveInfo.to
            promotion = moveInfo.promotion
          } else {
            return false
          }
        } else {
            [from, to, promotion] = args
            if (typeof from === 'string') {
              from = Game.san2sq(from)
            }  
    
            if (typeof to === 'string') {
              to = Game.san2sq(to)
          }  
        }

        let fObj: IFenObj = Game.fen2obj(this.fens[this.getMaxPos()])
        let pos: string[] = fObj.pos.split('')
        let turn: string = fObj.turn
        let figFrom: string = pos[from]
        let figInTo: string = pos[to]
        let figTo: string = promotion ? promotion : figFrom

        moveInfo = <IMoveInfo>{enPassant: false}

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

    moves(options: object = null): string[] {
      //Must override
      if (!!options) {
        return []
      } else {
        return []
      }
    } 

    pgn(): string {
      return `${[this.pgnHeaders(), this.pgnMoves()].join('\n\n')} ${this.tags.Result}`
    }

    put(figure: string, square: any, index: number = this.getMaxPos()): boolean {
      if ("pnbrqk0".indexOf(figure.toLowerCase()) === -1) return false
      if (typeof square === 'string') square = Game.san2sq(square)
      if (square < 0 || square > 63) return false
      let fen_obj: IFenObj = Game.fen2obj(this.fens[index])
      let posArray: string[] = fen_obj.pos.split('')
      posArray[square] = figure
      delete(fen_obj.fenPos)
      fen_obj.pos = posArray.join('')
      let fen: string = Game.obj2fen(fen_obj)
      this.fens[index] = fen
      return true
    }

    remove(square: any, index: number = this.getMaxPos()): boolean {
      return this.put('0', square, index)
    }

    square_color(square: any): string {
      if (typeof square === 'string') square = Game.san2sq(square)
      return Game.isDark(square) ? 'dark' : 'light'
    }

    turn(index: number = this.getMaxPos()): string {
      return this.getTurn(index)
    }

    undo(): boolean {
      if (this.getMaxPos() < 1) return false
      this.fens.pop()
      this.sans.pop()
      return true
    }

    validate_fen(fen: string): boolean {
      //Must override
      if (fen.length) return true
      return false
    }    

  }
  

