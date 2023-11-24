(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const { COLORS } = require('./pieces.js')

class RenderHandler {
    fallback_shape = [
        [0,0,0],
        [0,0,0],
        [0,0,0],
    ]

    constructor(gd) {
        this.gd = gd
    }

    init() {
        for (let i = 0; i < this.gd.grid.length-2; i++) {
            let row = document.createElement('div')
            row.setAttribute('class', 'row')
            for (let j = 0; j < this.gd.grid[i].length; j++) {
                let block = document.createElement('div')
                block.setAttribute('class', 'block')
                row.appendChild(block)
            }
            this.gd.playfield.appendChild(row)
        }
    }

    rm_empty(shape) {
        let new_shape = []
        for (let i = 0; i < shape.length; i++) {
            let empty = true
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] != 0) {
                    empty = false
                    break
                }
            }
            if (!empty) new_shape.push(shape[i])
        }
        return new_shape
    }

    mininomiono(display_element, shape, color) {
        if (shape == null) return
        shape = this.rm_empty(shape)
        if (shape.length == 0) return
        let length = shape[0].length
        display_element.innerHTML = ''
        let width = (display_element.offsetWidth)
        let height = width / length
        let border = 0.05 * height
        let margin = (width - (height * shape.length)) / 2
        let rowHeight = height - border
        for (let i = 0; i < shape.length; i++) {
            let row = document.createElement('div')
            row.setAttribute('class', 'row')
            row.style.width = width + 'px'
            row.style.height = rowHeight + 'px'
            for (let j = 0; j < shape[i].length; j++) {
                let block = document.createElement('div')
                block.setAttribute('class', 'block')
                block.style.width = rowHeight  * 0.90 + 'px'
                block.style.height = rowHeight * 0.90 + 'px'
                block.style.borderWidth = border + 'px'
                if (shape[i][j] != 0) {
                    block.style.backgroundColor = color
                } else {
                    block.style.backgroundColor = 'black'
                }
                row.appendChild(block)
            }
            display_element.appendChild(row)
            if (i == 0) row.style.marginTop = margin + 'px'
        }
    }

    draw() {
        if (this.gd.stored_piece == null) this.mininomiono(this.gd.reservefield, this.fallback_shape)
        else this.mininomiono(this.gd.reservefield, this.gd.stored_piece.shape, COLORS[this.gd.stored_piece.id])

        if (this.gd.next_piece == null) this.mininomiono(this.gd.nextfield, this.fallback_shape)
        else this.mininomiono(this.gd.nextfield, this.gd.next_piece.shape, COLORS[this.gd.next_piece.id])

        for (let i = 2; i < this.gd.grid.length; i++) {
            for (let j = 0; j < this.gd.grid[i].length; j++) {
                if (this.gd.grid[i][j] != 0) {
                    this.gd.playfield.children[i-2].children[j].style.backgroundColor = COLORS[this.gd.grid[i][j]]
                } else {
                    this.gd.playfield.children[i-2].children[j].style.backgroundColor = 'black'
                }
            }
        }

        if (this.gd.active_piece == null) return
        const piece_x = Math.ceil(this.gd.active_piece.x)
        const piece_y = Math.ceil(this.gd.active_piece.y)
        const piece_shape = this.gd.active_piece.shape

        const shadow_y = this.gd.active_piece.get_shadow()
        for (let i = 0; i < piece_shape.length; i++) {
            for (let j = 0; j < piece_shape[i].length; j++) {
                if (shadow_y+i-2 < 0) {
                    continue
                }
                if (piece_shape[i][j] != 0) {
                    this.gd.playfield.children[shadow_y+i-2].children[piece_x+j].style.backgroundColor = "#a6a6a6"
                }
            }
        }

        for (let i = 0; i < piece_shape.length; i++) {
            for (let j = 0; j < piece_shape[i].length; j++) {
                if (piece_y+i-2 < 0) {
                    continue
                }
                if (piece_shape[i][j] != 0) {
                    this.gd.playfield.children[piece_y+i-2].children[piece_x+j].style.backgroundColor = COLORS[this.gd.active_piece.id]
                }
            }
        }
    }
}

module.exports = RenderHandler
},{"./pieces.js":4}],2:[function(require,module,exports){
const key_map = {}

const keybinds = {
    'left': ['37', '65'],
    'right': ['39', '68'],
    'down': ['40', '83'],
    'rotate': ['38', '87'],
    'smash': ['32'],
    'store': ['16']
}
const reversed_bindings = {}

function keydown(event) {
    if (key_map.hasOwnProperty(event.keyCode) && key_map[event.keyCode][0]) return
    key_map[event.keyCode] = true
}

function keyup(event) {
    delete key_map[event.keyCode]
}

const delay = 150
function input_handler(gd) {
    for (let key in key_map) {
        if (!reversed_bindings.hasOwnProperty(key)) continue
        const action = reversed_bindings[key]
        if (keybinds[action].last_pressed + delay > Date.now()) continue
        switch (action) {
            case 'left':
                gd.active_piece.move_left()
                break
            case 'right':
                gd.active_piece.move_right()
                break
            case 'down':
                gd.active_piece.move_down()
                break
            case 'rotate':
                gd.active_piece.rotate()
                break
            case 'smash':
                gd.active_piece.smash()
                break
            case 'store':
                gd.active_piece.store()
                break
        }
        keybinds[action].last_pressed = Date.now()
    }
}


function register_input() {
    for (let binding in keybinds) {
        for (let key of keybinds[binding]) {
            reversed_bindings[key] = binding
        }
        keybinds[binding] = {
            'keys': keybinds[binding],
            'last_pressed': 0
        }
    }
    document.addEventListener('keydown', keydown)
    document.addEventListener('keyup', keyup)
}

module.exports = { input_handler, register_input }

},{}],3:[function(require,module,exports){
const RenderHandler = require('./draw.js');
const { PieceI, PieceJ, PieceL, PieceO, PieceS, PieceT, PieceZ } = require('./pieces.js');
const { input_handler, register_input } = require('./input.js');

const gd = {
    PIECES: [PieceI, PieceJ, PieceL, PieceO, PieceS, PieceT, PieceZ],
    STANDARD_FPC: 48,
    NES_FPS: 60,
    SPEED_TABLE: {
        0: 5,
        8: 2,
        9: 1,
        10: 0,
        12: 1,
        13: 0,
        15: 1,
        16: 0,
        18: 1,
        19: 0,
        28: 1,
        29: 0,
    },
    LINE_SCORES: {
        1: 40,
        2: 100,
        3: 300,
        4: 1200,
    },
    storage: null,
    logic_cycle: null,
    last_tick: Date.now(),
    current_tick: Date.now(),
    next_piece: null,
    active_piece: null,
    grid_width: 10,
    grid_height: 22,
    grid: [],
    level: 0,
    lines_cleared: 0,
    score : 0,
    //Each Block equates to 100xy, Speed 100 = 1 block per second
    speed: 100,
    time_between_ticks: function() {
        return (this.current_tick - this.last_tick)/1000
    }
}

function calculate_speed() {
    //nes_fps / frames per cell = cells per second
    //cells per second * 100 = speed
    let last_mod = 0
    let fpc = gd.STANDARD_FPC
    for (let i = 0; i < gd.level; i++) {
        if (gd.SPEED_TABLE.hasOwnProperty(i)) {
            last_mod = gd.SPEED_TABLE[i]
        }
        fpc -= last_mod
    }
    gd.speed = gd.NES_FPS / fpc * 100
}

function calculate_level() {
    if (gd.lines_cleared == 0) return
    gd.level = Math.floor(gd.lines_cleared / 10)
}

function check_rows() {
    let rows_cleared = 0
    for (let i = 0; i < gd.grid.length; i++) {
        let row = gd.grid[i]
        let clear = true
        for (let j = 0; j < row.length; j++) {
            if (row[j] == 0) {
                clear = false
                break
            }
        }
        if (clear) {
            rows_cleared++
            gd.grid.splice(i, 1)
            gd.grid.unshift(new Array(gd.grid_width).fill(0))
        }
    }
    if (rows_cleared > 0) {
        gd.score += gd.LINE_SCORES[rows_cleared] * (gd.level + 1)
        gd.lines_cleared += rows_cleared
    }
}

function logic() {
    gd.score_display.innerHTML = gd.score
    gd.level_display.innerHTML = gd.level
    let spawned = false
    gd.current_tick = Date.now()

    if (gd.active_piece == null) {
        gd.active_piece = gd.next_piece
        gd.next_piece = new gd.PIECES[Math.floor(Math.random() * gd.PIECES.length)](gd)
        spawned = true
    }

    gd.active_piece.tick()

    if (gd.active_piece.hit_ground) {
        if (spawned) reset()
        if (Date.now() - gd.active_piece.hit_ground > 500) {
            if (gd.active_piece._check_collision(0, 1)) {
                gd.active_piece.save_to_grid()
                check_rows()
                gd.active_piece = null
            } else {
                gd.active_piece.hit_ground = null
            }
        }    
    }

    calculate_level()
    calculate_speed()

    input_handler(gd)
    gd.renderer.draw()
    gd.last_tick = gd.current_tick
}

function reset() {
    clearInterval(gd.logic_cycle)
    gd.grid = []
    for (let i = 0; i < gd.grid_height; i++) {
        gd.grid[i] = []
        for (let j = 0; j < gd.grid_width; j++) {
            gd.grid[i][j] = 0
        }
    }
    gd.active_piece = null
    gd.level = 0
    gd.lines_cleared = 0
    gd.score = 0
    gd.logic_cycle = setInterval(logic, 1000/60)
}

function init() {
    gd.playfield = document.getElementById('playfield')
    gd.reservefield = document.getElementById('reserve')
    gd.nextfield = document.getElementById('next')
    gd.score_display = document.getElementById('score')
    gd.level_display = document.getElementById('level')
    gd.grid = []
    for (let i = 0; i < gd.grid_height; i++) {
        gd.grid[i] = []
        for (let j = 0; j < gd.grid_width; j++) {
            gd.grid[i][j] = 0
        }
    }
    register_input()
    gd.next_piece = new gd.PIECES[Math.floor(Math.random() * gd.PIECES.length)](gd)
}

function main() {
    init()
    gd.renderer = new RenderHandler(gd)
    gd.renderer.init()
    gd.logic_cycle = setInterval(logic, 1000/60)
}

main()
},{"./draw.js":1,"./input.js":2,"./pieces.js":4}],4:[function(require,module,exports){
const COLORS = {
    1: '#00fbff',
    2: '#0800ff',
    3: '#ffaa00',
    4: '#ffee00',
    5: '#ff000d',
    6: '#ff000d',
    7: '#b700ff',
}

class Piece {
    gd = null;
    
    hit_ground = null

    id = null;
    shape = null;
    last_move = null;

    swapped = false;

    constructor(gd, x, y) {
        this.gd = gd;
        this.x = x || Math.floor(this.gd.grid_width / 2) - 2;
        this.y = y || -1;
        this.y_f = this.y;
    }

    tick() {
        if (this._check_collision(0, 1)) {
            if (!this.hit_ground) this.hit_ground = Date.now()
            return
        }
        this.y_f += (this.gd.speed * this.gd.time_between_ticks()) / 100
        if (this.y < Math.ceil(this.y_f)) {
            this.gd.score += 1
            this.last_move = "down"
        }
        this.y = Math.ceil(this.y_f)
    }

    move_down() {
        if (this._check_collision(0, 1)) {
            if (!this.hit_ground) this.hit_ground = Date.now()
            return false
        }
        this.gd.score += 1
        this.last_move = "down"
        this.y_f += 1
        this.y = Math.ceil(this.y_f)
        return true
    }

    move_left() {
        if (this._check_collision(-1, 0)) {
            return false
        }
        this.last_move = "left"
        this.x -= 1
        return true
    }

    move_right() {
        if (this._check_collision(1, 0)) return false
        this.last_move = "right"
        this.x += 1
        return true
    }

    smash() {
        let blocks = 0
        while (!this.hit_ground) {
            blocks += 1
            this.move_down()
        }
        this.gd.score += blocks * 2
    }

    rotate() {
        let new_shape = []
        for (let i = 0; i < this.shape[0].length; i++) {
            new_shape[i] = []
            for (let j = 0; j < this.shape.length; j++) {
                new_shape[i][j] = this.shape[this.shape.length-j-1][i]
            }
        }
        
        this._try_wall_kick(new_shape)

        this.last_move = "rotate"
        this.shape = new_shape
    }

    store() {
        if (this.swapped) return
        let temp = this.gd.stored_piece
        this.gd.stored_piece = this.gd.active_piece
        this.gd.active_piece = temp
        this.y = -1
        this.y_f = -1
        this.x = Math.floor(this.gd.grid_width / 2) - 2
        this.swapped = true
    }

    get_shadow() {
        //use _check_collision to find the lowest point
        let y_offset = 0
        while (!this._check_collision(0, y_offset)) {
            y_offset += 1
        }
        y_offset -= 1
        return this.y + y_offset
    }

    _check_collision(x_offset, y_offset, shape = this.shape) {
        for (let i = 0; i < shape.length; i++) {
            for (let j = 0; j < shape[i].length; j++) {
                if (shape[i][j] != 0) {
                    if (this.y+i+y_offset < 0) continue
                    if (this.x+j+x_offset < 0 || this.x+j+x_offset >= this.gd.grid_width) return true
                    if (this.y+i+y_offset < 0 || this.y+i+y_offset >= this.gd.grid_height) return true
                    if (this.gd.grid[this.y+i+y_offset][this.x+j+x_offset] != 0) return true
                }
            }
        }
        return false
    }

    _try_wall_kick(shape) {
        if (!this._check_collision(0, 0, shape)) return true
        for (let i = 0; i < 3; i++) {
            if (!this._check_collision(i, 0, shape)) {
                this.x += i
                return true
            }
            if (!this._check_collision(-i, 0, shape)) {
                this.x -= i
                return true
            }
        }
        return false
    }

    save_to_grid() {
        for (let i = 0; i < this.shape.length; i++) {
            for (let j = 0; j < this.shape[i].length; j++) {
                if (this.y+i < 0 || this.y+i >= this.gd.grid_height) continue
                if (this.shape[i][j] != 0) {
                    this.gd.grid[this.y+i][this.x+j] = this.id
                }
            }
        }
    }
}

class PieceI extends Piece {
    id = 1;
    shape = [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ];
}

class PieceJ extends Piece {
    id = 2;
    shape = [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ];
}

class PieceL extends Piece {
    id = 3;
    shape = [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ];
}

class PieceO extends Piece {
    id = 4;
    shape = [
        [1, 1],
        [1, 1],
    ];
}

class PieceS extends Piece {
    id = 5;
    shape = [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ];
}

class PieceZ extends Piece {
    id = 6;
    shape = [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ];
}

class PieceT extends Piece {
    id = 7;
    shape = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ];

    tick() {
        super.tick()
        if (this._t_spin()) {
            this.gd.score += 100
        }
    }

    _t_spin() {
        if (this.last_move != "rotate") return false
        let corners = 0
        for (let i = 0; i < this.shape.length; i+=2) {
            for (let j = 0; j < this.shape[i].length; j+=2) {
                if (this.shape[i][j] != 0) {
                    if (this.gd.grid[this.y+i][this.x+j] != 0) {
                        corners++
                    }
                }
            }
        }
        if (corners >= 3) {
            return true
        }
        return false
    }
}

module.exports = {
    COLORS,
    PieceI,
    PieceJ,
    PieceL,
    PieceO,
    PieceS,
    PieceZ,
    PieceT,
}

},{}]},{},[3]);
