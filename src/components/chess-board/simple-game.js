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
    
}

