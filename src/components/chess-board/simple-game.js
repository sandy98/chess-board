/* Minimal implementation for a Chess validator */

export default class SimpleGame {
    static message() {
        return "Simple chess moves validator"
    }
    static row(sq) {
        if (sq < 0 || sq > 63) return -1
        return Math.floor(sq / 8)
    }
    static col(sq) {
        if (sq < 0 || sq > 63) return -1
        return sq % 8
    }
    static sq2san(sq) {
        if (isNaN(sq) || sq < 0 || sq > 63) return '-'
        return `${String.fromCharCode(SimpleGame.col(sq) + 97)}${SimpleGame.row(sq) + 1}`
    }
    static san2sq(san) {
        if (typeof san !== 'string' || !san.match(/^[a-h][1-8]$/)) return -1
        return (san.charCodeAt(0) - 'a'.charCodeAt(0)) + ((san.charCodeAt(1) - 49) * 8)
    }
    static even(sq) {return sq % 2 === 0}
    static odd(sq) {return !SimpleGame.even(sq)}
    static lightSq(sq) {return SimpleGame.odd(SimpleGame.row(sq)) && SimpleGame.even(SimpleGame.col(sq)) 
        || SimpleGame.even(SimpleGame.row(sq)) && SimpleGame.odd(SimpleGame.col(sq))}
    static darkSq(sq) { return !SimpleGame.lightSq(sq)}
    static inv56(str) {
      let a64 = str.split('')
      let i64 = a64.map((_, i) => a64[i ^ 56])
      return i64.join('')
    }
    static addSlashes(str) {
      return str.replace(/(\w{8})(?=\S)/g, "$1/")
    }
    static removeSlashes(str) {
      return str.replace(/\//g, "")
    }
    static compressFen(str) {
        return SimpleGame.addSlashes(str).replace(/0+/g, (zeros) => zeros.length.toString())
    }
    static expandFen(str) {
        return SimpleGame.removeSlashes(str).replace(/\d/g, (n) => "0".repeat(parseInt(n)))
    }
    static fen2obj(fenStr) {
        let fenArr = fenStr.split(/\s+/)
        return {
            fenStr: fenArr[0],
            position: SimpleGame.inv56(SimpleGame.expandFen(fenArr[0])),
            turn: fenArr[1],
            castling: fenArr[2],
            enPassant: fenArr[3],
            fullMoveNumber: parseInt(fenArr[4]),
            halfMoveClock: parseInt(fenArr[5])
        }
    }
    static obj2fen(fenObj) {
        return `${fenObj.fenStr} ${fenObj.turn} ${fenObj.castling} ${fenObj.enPassant} ${fenObj.fullMoveNumber} ${fenObj.halfMoveClock}`
    }

    static defaultFen() {
      return `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 1 0`
    }

    static emptyFen() {
        return `8/8/8/8/8/8/8/8 w - - 1 0`
    }

    static isWhiteFigure(f) {
        return !!"PNBRQK".match(f)
    }
    
    static isBlackFigure(f) {
        return !!"pnbrqk".match(f)
    }

    static isPromoting(from, to, position) {
        let figure = position[from]
        let r = SimpleGame.row(to)
        return figure === 'P' && r === 7 || figure === 'p' && r === 0
    }
    
    static isEnPassant(from, to, position) {
        let figureFrom = position[from]
        let figureTo = position[to]
        if (!"Pp".match(figureFrom)) return false
        if (figureTo !== '0') return false
        if (SimpleGame.col(from) === SimpleGame.col(to)) return false
        return figureFrom === 'P' ? -8 : 8
    }
    
    static canEnPassant(from, to, position) {
        return position[from].match(/[Pp]/)  && Math.abs(SimpleGame.row(from) - SimpleGame.row(to)) === 2
    }

    static pgnDate(d) {
        return `${d.getFullYear()}.${(d.getMonth() + 1).toString().replace(/^(\d)$/, "0$1")}.${d.getDate().toString().replace(/^(\d)$/, "0$1")}`
    }

    static defaultOptions() {
        return {
            fen: SimpleGame.defaultFen(),
            white: "White Player",
            black: "Black Player",
            date: SimpleGame.pgnDate(new Date()),
            result: '*'
        }
    }

    constructor(options = SimpleGame.defaultOptions()) {
        this.fens = []
        this.sans = []
        this.initialFen = options.fen
        this.whitePlayer = options.white
        this.blackPlayer = options.black
        this.date = options.date
        this.result = options.result

        this.reset()
    }

    clear() {
        this.fens = [SimpleGame.fen2obj(SimpleGame.emptyFen())]
        this.sans = [' ']
    }

    fen() {
      return SimpleGame.obj2fen(this.fens[this.fens.length - 1])
    }

    position() {
        return this.fens[this.fens.length - 1].position
    }
  
    fenObj() {
        return this.fens[this.fens.length - 1]
    }
  
    fenStrings() {
        return this.fens.map(SimpleGame.obj2fen)
    }

    fenObjs() {
        return this.fens
    }

    positions() {
        return this.fens.map((fo) => fo.position)
    }

    history(){
        return this.sans
    }
    
    setCastling(newCastling) {
        let fen = this.fens[this.fens.length - 1]
        fen.castling = newCastling
        return true
    }

    put(sq, figure, destFen) {
        if (typeof sq === 'string') sq = SimpleGame.san2sq(sq)
        if (sq < 0 || sq > 63) return false
        if (!"0pnbrqkPNBRQK".match(figure)) return false
        let fen
        if (!destFen) {
          fen = this.fens[this.fens.length - 1]
        } else {
          fen = destFen
        }
        let position = fen.position
        let arr = position.split('')
        arr[sq] = figure
        position = arr.join('')
        fen.position = position
        fen.fenStr = SimpleGame.compressFen(SimpleGame.inv56(position))
        if (!destFen) {
            this.fens[this.fens.length - 1] = fen
        } else {
            destFen = fen
        }
        return true
    }
    
    reset(fenString = this.initialFen) {
        this.fens = [SimpleGame.fen2obj(fenString)]
        this.sans = [' ']
    }

    undo() {
        console.log('fens length = ' + this.fens.length)
        if (this.fens.length < 2) return false
        this.fens.pop()
        this.sans.pop()
        return true
    }

    cloneFen(n) {
      if (n < 0 || n >= this.fens.length) return false
      let destFen = {}
      let srcFen = this.fens[n]
      destFen.fenStr = srcFen.fenStr
      destFen.position = srcFen.position
      destFen.turn = srcFen.turn
      destFen.castling = srcFen.castling
      destFen.enPassant = srcFen.enPassant
      destFen.fullMoveNumber = srcFen.fullMoveNumber
      destFen.halfMoveClock = srcFen.halfMoveClock
      return destFen
    }
    
    set(property, value) {
        this[property] = value
    }
    
    getWhite() {return this.whitePlayer}
    getBlack() {return this.blackPlayer}

    ascii(flipBoard = false) {
        let dottedPos = this.position().replace(/0/g, '.')
        let header = '   +------------------------+'
        let blank =  ' '.repeat(header.length)
        let footer= '     a  b  c  d  e  f  g  h'
        let rows = []
        for (let y = 0; y < 8; y++) {
            let r = ` ${8 - y} |`
            for (let x = 0; x < 8; x++) {
                r += ` ${dottedPos[(y * 8 + x) ^ (flipBoard ? 7 : 56)]} `
            }
            r += '|'
            rows.push([r, blank].join('\n'))
        }
        return [header, blank, ...rows, header, blank, footer].join('\n')
    }


    move(from, to, promotion) {
        if (typeof to === 'string') to = SimpleGame.san2sq(to)
        if (typeof from === 'string') from = SimpleGame.san2sq(from)
        let fenObj = this.cloneFen(this.fens.length - 1)
        let position = fenObj.position
        let origFigure = position[from]
        let destFigure = position[to]
        let figure = promotion ? promotion : position[from]
        if (SimpleGame.isWhiteFigure(origFigure) && fenObj.turn === 'b' || 
            SimpleGame.isBlackFigure(origFigure) && fenObj.turn === 'w') {
          console.log("Can't move in opponents turn!")
          return false
        }
        if (SimpleGame.isWhiteFigure(origFigure) && SimpleGame.isWhiteFigure(position[to]) || 
            SimpleGame.isBlackFigure(origFigure) && SimpleGame.isBlackFigure(position[to]) ) {
              console.log("Can't take a figure from your own color!")
              return false
        }
    
        let enPass = SimpleGame.isEnPassant(from, to, position)
        
        switch (from) {
            case 4:
             fenObj.castling = fenObj.castling.replace(/[KQ]/g, '')
             break;
            case 60:
             fenObj.castling = fenObj.castling.replace(/[kq]/g, '')
             break;
            case 0:
             fenObj.castling = fenObj.castling.replace('Q', '')
             break; 
            case 7:
             fenObj.castling = fenObj.castling.replace('K', '')
             break; 
            case 56:
             fenObj.castling = fenObj.castling.replace('q', '')
             break; 
            case 63:
             fenObj.castling = fenObj.castling.replace('k', '')
             break;
            default: 
             fenObj.castling = fenObj.castling
        }

        if (!fenObj.castling) fenObj.castling = '-'

        if (SimpleGame.canEnPassant(from, to, position)) {
            let epSq = origFigure === 'p' ? to + 8 : to - 8
            fenObj.enPassant =  SimpleGame.sq2san(epSq)
        } else {
            fenObj.enPassant = '-'
        }

        fenObj.fullMoveNumber = fenObj.turn === 'b' ? fenObj.fullMoveNumber + 1 : fenObj.fullMoveNumber
        fenObj.halfMoveClock = origFigure.match(/[Pp]/) || position[to] !== '0' ? 
          0 : 
          fenObj.halfMoveClock + 1

        fenObj.turn = fenObj.turn === 'w' ? 'b' : 'w'

        this.put(to, figure, fenObj)
        this.put(from, '0', fenObj)
    
        if (enPass) {
          this.put(to + enPass, '0', fenObj)
        }
    
        if (figure === 'K' && from === 4 && to === 6) {
          this.put(7, '0', fenObj)
          this.put(5, 'R', fenObj)
        }
        if (figure === 'K' && from === 4 && to === 2) {
          this.put(0, '0', fenObj)
          this.put(3, 'R', fenObj)
        }
        if (figure === 'k' && from === 60 && to === 62) {
          this.put(63, '0', fenObj)
          this.put(61, 'r', fenObj)
        }
        if (figure === 'k' && from === 60 && to === 58) {
          this.put(56, '0', fenObj)
          this.put(59, 'r', fenObj)
        }

        let getSan = () => {
            if (origFigure === 'K' && from === 4 && to === 6 || origFigure === 'k' && from === 60 && to === 62) {
                return 'O-O'
            }
            if (origFigure === 'K' && from === 4 && to === 2 || origFigure === 'k' && from === 60 && to === 58) {
                return 'O-O-O'
            }
            let capture = destFigure !== '0' || !!enPass ? 'x' : ''
            let figure = origFigure.match(/[Pp]/) ? !!capture ? SimpleGame.sq2san(from)[0] : '' : origFigure.toUpperCase()
            let dest = SimpleGame.sq2san(to)
            let prom = promotion ? `=${promotion.toUpperCase()}` : ''
            return `${figure}${capture}${dest}${prom}`
        }
        this.fens = [...this.fens, fenObj]
        this.sans = [...this.sans, getSan()]
        return true
      }

}

