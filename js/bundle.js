(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
class Entity {
    gd = null;
    id = this.constructor.name;
    w = 0;
    h = 0;
    x = 0;
    y = 0;
    img = null;
    src = "";
    max_health = 0;
    health = 0;
    regen_rate_ps = 0;
    dps = 0;
    flat_dmg = false;
    move_speed = 0;
    move_angle = 0;
    explodes_on_death = true;

    _move_left = Math.PI
    _move_right = 0
    _move_up = Math.PI*1.5
    _move_down = Math.PI*0.5

    dead = false;
    
    constructor(gd, w, h, x, y, src) {
        this.gd = gd
        this.w = w
        this.h = h
        this.x = x
        this.y = y

        this.img = new Image()
    }

    move(limited_to_canvas=false) {
        if (this.move_angle == -1) return
        const radians = this.move_angle * Math.PI / 180
        let x_offset = this.move_speed * this.gd.time_between_ticks() * Math.cos(radians)
        let y_offset = this.move_speed * this.gd.time_between_ticks() * Math.sin(radians)
        if (limited_to_canvas) {
            if (this.x + x_offset < 0 || this.x + this.w + x_offset > this.gd.canvas.width*(4/5)) x_offset = 0
            if (this.y + y_offset < 0 || this.y + this.h + y_offset > this.gd.canvas.height) y_offset = 0
        }
        this.x += x_offset
        this.y += y_offset
    }

    tick() {
        this.move()
        if (this.health < this.max_health) {
            this.health += this.regen_rate_ps * this.gd.time_between_ticks()
        }
    }

    die(explodes=true) {
        if (this.dead) return
        if (explodes) {
            let size = this.w
            if (this.w < this.h) size = this.h
            size = size * 1.5
            const boom_x = this.x + this.w/2 - size/2
            const boom_y = this.y + this.h/2 - size/2
            const boom = new Boom(this.gd, size, size, boom_x, boom_y)
            this.gd.entities["Boom"].push(boom)
        }
        if (this.gd.entities[this.id] == null) return
        const index = this.gd.entities[this.id].indexOf(this)
        if (index > -1) this.gd.entities[this.id].splice(this.gd.entities[this.id].indexOf(this), 1)
        this.dead = true
    }

    _damage(entity, damage) {
        entity.health -= damage
        if (entity.health <= 0) {
            entity.die(entity.explodes_on_death)
        }
    }
}

class Ally extends Entity {
    constructor(gd, w, h, x, y) {
        super(gd, w, h, x, y)
    }

    tick() {
        super.tick()
        const collisions = this.check_collisions()
        for (const enemy of collisions) {
            if (this.flat_dmg) {
                this._damage(enemy, this.dps)
            } else {
                this._damage(enemy, this.dps * this.gd.time_between_ticks())
            }
            if (enemy.flat_dmg) {
                this._damage(this, enemy.dps)
            } else {
                this._damage(this, enemy.dps * enemy.gd.time_between_ticks())
            }
        }
    }

    check_collisions() {
        const collisions = []
        for (let i = 0; i < this.gd.enemies.length; i++) {
            const obj_name = this.gd.enemies[i]
            for (const enemy of this.gd.entities[obj_name]) {
                if (this._check_collision(this, enemy)) {
                    collisions.push(enemy)
                }
            }
        }
        return collisions
    }

    _check_collision(entity1, entity2) {
        if (entity1.x < entity2.x + entity2.w && entity1.x + entity1.w > entity2.x && entity1.y < entity2.y + entity2.h && entity1.y + entity1.h > entity2.y) {
            return true
        }
        return false
    }
}

class Enemy extends Entity {
    score_pts = 0;

    constructor(gd, w, h, x, y) {
        super(gd, w, h, x, y)
    }

    tick() {
        super.tick()
        if (this.x + this.w < 0 || this.x > this.gd.canvas.width || this.y + this.h < 0 || this.y > this.gd.canvas.height) {
            this.die(false)
        }
    }

    die(explodes=true) {
        super.die(explodes)
        if (explodes) this.gd.score += this.score_pts * this.gd.player.score_multiplier
    }
}

class Boom extends Entity {
    duration = 1000;
    created = null;
    src = "assets/boom.png";
    explodes_on_death = false;

    constructor(gd, w, h, x, y) {
        super(gd, w, h, x, y)
        this.created = Date.now()
        this.img.src = this.src
    }

    tick() {
        if (Date.now() - this.created > this.duration) {
            this.die(false)
        }
    }
}

class Player extends Ally {
    upgrade_cost = 20;
    score_multiplier = 1;
    shoot_delay = 500;
    max_health = 100;
    health = 100;
    regen_rate_ps = 1;
    dps = 10;
    move_speed = 250;

    lastMove = 0;
    lastShoot = 0;

    src = "assets/nyan.png";

    constructor(gd, w, h, x, y) {
        super(gd, w, h, x, y)
        this.img.src = this.src
    }

    move() {
        super.move(true)
    }

    shoot() {
        if (Date.now() - this.lastShoot < this.shoot_delay) return
        const bullet = new Bullet(this.gd, 20, 20, 0, 0)
        bullet.x = this.x + this.w + 5
        bullet.y = this.y + this.h/2 - bullet.h/2
        this.gd.entities["Bullet"].push(bullet)
        this.lastShoot = Date.now()
    }

    laser() {
        this.gd.laser.use()
    }

    die() {
        this.gd.game_over_flag = true
        let size = this.w
        if (this.w < this.h) size = this.h
        size = size * 5
        const boom_x = this.x + this.w/2 - size/2
        const boom_y = this.y + this.h/2 - size/2
        const boom = new Boom(this.gd, size, size, boom_x, boom_y)
        this.gd.entities["Boom"].push(boom)
    }
}

class Laser extends Ally {
    duration = 3000;
    cooldown = 5000;
    dps = 100;
    move_angle = -1;

    last_shot = 0;

    inuse = false;
    explodes_on_death = false;

    src = "assets/Laser.png";

    constructor(gd, w, h, x, y) {
        super(gd, w, h, x, y)
        this.img.src = this.src
    }

    tick() {
        if (Date.now() - this.lastUse > this.duration) {
            this.inuse = false
        }
        if (!this.inuse) return
        this.x = this.gd.player.x + this.gd.player.w + 5
        this.y = this.gd.player.y + this.gd.player.h/2 - this.h/2
        super.tick()
    }

    use() {
        if (Date.now() - this.lastUse < this.cooldown) return
        this.lastUse = Date.now()
        this.inuse = true
    }
}

class Bullet extends Ally {
    dps = 50;
    move_speed = 500;
    flat_dmg = true;
    explodes_on_death = false;

    src = "assets/bullet.png";

    constructor(gd, w, h, x, y) {
        super(gd, w, h, x, y)
        this.img.src = this.src
    }

    tick() {
        super.tick()
        if (this.x + this.w < 0 || this.x > this.gd.canvas.width || this.y + this.h < 0 || this.y > this.gd.canvas.height) {
            this.die(this.explodes_on_death)
        }
    }
}

class Baddy extends Enemy {
    score_pts = 10;
    max_health = 10;
    health = 10;
    dps = 100;
    move_speed = 100;
    src = "assets/baddy.png";

    lastMove = 0;

    constructor(gd, w, h, x, y) {
        super(gd, w, h, x, y)
        this.img.src = this.src
    }

    tick() {
        if (Date.now() - this.lastMove > 1000) {
            this.move_angle = (Math.random() * (190-170)) + 170
            this.lastMove = Date.now()
        }
        super.tick()
    }
}

module.exports = {
    Boom,
    Player,
    Bullet,
    Laser,
    Baddy,
}
},{}],2:[function(require,module,exports){
class InputHandler {
    constructor(gd) {
        this.gd = gd
        this.pressed_keys = {}
    }

    mouse_position(e, _this) {
        let rect = _this.gd.canvas.getBoundingClientRect()
        let x = e.clientX - rect.left
        let y = e.clientY - rect.top
        return [x,y]
    }

    click_callback(e, _this) {
        if (_this.gd.game_over_flag) return
        if (_this.gd.last_click + 100 > Date.now()) return
        let [x,y] = _this.mouse_position(e, _this)
        const buttons = _this.gd.views[_this.gd.view].buttons
        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i]
            if (x > button.x && x < button.x + button.w && y > button.y && y < button.y + button.h) {
                button.callback()
                _this.gd.last_click = Date.now()
                return
            }
        }
    }

    death_keydown_callback(e, _this) {
        if (e.key == " ") {
            document.removeEventListener("keydown", this._keydown)
            _this.gd.restart()
        }
    }

    game_keydown_callback(e, _this) {
        _this.pressed_keys[e.key] = true
    }
    
    game_keyup_callback(e, _this) {
        delete _this.pressed_keys[e.key]
    }

    check() {
        let move_angle = 0
        
        let move_x = 0
        let move_y = 0
        for (const key in this.pressed_keys) {
            switch (key) {
                case "w":
                    move_y -= 1
                    break
                case "s":
                    move_y += 1
                    break
                case "a":
                    move_x -= 1
                    break
                case "d":
                    move_x += 1
                    break
                case "q":
                    this.gd.player.laser()
                    break
                case " ":
                    this.gd.player.shoot()
                    break
            }
        }
        if (move_x == 0 && move_y == 0) {
            move_angle = -1
        } else {
            move_angle = Math.atan2(move_y, move_x) * 180 / Math.PI
        }
        this.gd.player.move_angle = move_angle
        this.gd.player.move()
    }

    register() {
        const _this = this
        this._keydown = function (e) { _this.game_keydown_callback(e, _this) }
        this._keyup = function (e) { _this.game_keyup_callback(e, _this) }
        this._click = function (e) { _this.click_callback(e, _this) }
        document.addEventListener("keydown", this._keydown)
        document.addEventListener("keyup", this._keyup)
        document.addEventListener("click", this._click)
    }

    unregister() {
        const _this = this
        this._keydown = function (e) { _this.death_keydown_callback(e, _this) }
        document.addEventListener("keydown", this._keydown)
    }
}

module.exports = InputHandler
},{}],3:[function(require,module,exports){
class Button {
    text = ""
    sub_text = null
    text_size = 30
    text_color = "white"
    color = "red"

    w=90
    h=30

    constructor(gd, x, y, w, h) {
        this.gd = gd
        this.x = x
        this.y = y
        this.w = w || this.w
        this.h = h || this.h
    }
}

class View {
    id = this.constructor.name;

    bg_img = new Image()
    buttons = []
    
    constructor(gd) {
        this.gd = gd
    }

    draw() {
        this.gd.ctx.clearRect(0,0,this.gd.maxWidth,this.gd.maxHeigth)
        const ratio = this.bg_img.width/this.bg_img.height
        this.gd.ctx.drawImage(this.bg_img,0,0,this.gd.maxHeigth*ratio,this.gd.maxHeigth)
    }

    _draw_buttons() {
        for (let i = 0; i < this.buttons.length; i++) {
            const button = this.buttons[i]
            this.gd.ctx.fillStyle = button.color
            this.gd.ctx.fillRect(button.x, button.y, button.w, button.h)
            this.gd.ctx.font = button.text_size + "px Arial"
            this.gd.ctx.fillStyle = button.text_color
            this.gd.ctx.textAlign = "center"
            if (!button.sub_text) this.gd.ctx.fillText(button.text, button.x + button.w/2, button.y + button.h/2 + button.text_size/3)
            else {
                this.gd.ctx.fillText(button.text, button.x + button.w/2, button.y + button.h/2 - button.text_size/3 + 5)
                this.gd.ctx.font = button.text_size/3*2 + "px Arial"
                this.gd.ctx.fillText(button.sub_text, button.x + button.w/2, button.y + button.h/2 + button.text_size/3*2 + 5)
            }
        }
    }
}

module.exports = { Button, View }
},{}],4:[function(require,module,exports){
const { Player, Laser, Baddy } = require("./classes/entities.js")
const InputHandler = require("./classes/input.js")
const GameView = require("./views/game/game_view.js")
const ShopView = require("./views/shop/shop_view.js")

const gd = {
    canvas: null,
    ctx: null,
    maxWidth: null,
    maxHeigth: null,

    player: null,
    laser: null,

    entities: {
        "Baddy": [],
        "Bullet": [],
        "Boom": [],
    },
    enemies: ["Baddy"],

    view: "game",
    views: {
        "game": GameView,
        "shop": ShopView,
    },

    last_baddy: 0,
    next_baddy: 0,

    hiscore: 0,
    score: 0,

    paused: false,
    game_over_flag: false,

    logic_cycle: null,
    current_tick: Date.now(),
    last_tick: Date.now(),
    time_between_ticks: function() {
        return (gd.current_tick-gd.last_tick)/1000
    },

    setup() {
        this.input_handler.register()
        this.game_over_flag = false
        this.score = 1000
    
        for (let [entity] of Object.entries(this.entities)) {
            this.entities[entity] = []
        }
    
        this.player = new Player(gd, 100, 50, 10, this.maxWidth/2-50/2)
        this.laser = new Laser(gd, 150, 50, 0, 0)
        draw()
    },
    restart() {
        this.paused = false
        this.view = "game"
        this.setup()
        this.logic_cycle = setInterval(logic, 1000/60)
    },
    game_over() {
        clearInterval(this.logic_cycle)
        this.game_over_flag = true
        this.input_handler.unregister()
        this.pressed_keys = {}
        document.cookie = gd.hiscore + ";"
        this.laser.inuse = false
        this.paused = false
    }
}

let cookies = document.getElementById("cookies")
if (cookies) {
    cookies = cookies.split(";")
    if (cookies[0]) gd.hiscore = cookies[0]
}

function spawnBaddy() {
    const baddy = new Baddy(gd, 50, 50, 0, 0)
    baddy.w = baddy.w * ((Math.random())+0.8)
    baddy.h = baddy.w
    baddy.x = gd.maxWidth - baddy.w
    baddy.y = Math.floor(Math.random() * (gd.maxHeigth - baddy.h))
    baddy.move_speed = baddy.move_speed * ((Math.random())+0.5)

    gd.entities["Baddy"].push(baddy)
}

function draw() {
    gd.views[gd.view].draw(gd)
    requestAnimationFrame(draw)
}

function logic() {
    gd.current_tick = Date.now()

    if (gd.paused) {
        gd.last_tick = gd.current_tick
        return
    }
    if (gd.game_over_flag) {
        gd.game_over()
        return
    }
    if (gd.score>gd.hiscore) gd.hiscore = Math.floor(gd.score)

    gd.input_handler.check()

    if (gd.next_baddy < gd.current_tick) {
        spawnBaddy()
        gd.next_baddy = gd.current_tick + (Math.random() * 2000-500)+500
    }

    gd.player.tick()
    gd.laser.tick()

    for (let [entity, entity_arr] of Object.entries(gd.entities)) {
        for (let i = 0; i < entity_arr.length; i++) {
            entity_arr[i].tick()
        }
    }


    gd.last_tick = gd.current_tick
}

function main() {
    gd.canvas = document.getElementById("game")
    gd.ctx = gd.canvas.getContext("2d")
    gd.maxWidth = gd.ctx.canvas.width
    gd.maxHeigth = gd.ctx.canvas.height

    for ([view_name, view] of Object.entries(gd.views)) {
        gd.views[view_name] = new gd.views[view_name](gd)
    }
    gd.input_handler = new InputHandler(gd),

    gd.setup()
    gd.logic_cycle = setInterval(logic, 1000/60)
}
window.main = main
},{"./classes/entities.js":1,"./classes/input.js":2,"./views/game/game_view.js":7,"./views/shop/shop_view.js":10}],5:[function(require,module,exports){
const ShopButton = require("./buttons/open_shop_btn.js")

module.exports = {
    ShopButton,
}
},{"./buttons/open_shop_btn.js":6}],6:[function(require,module,exports){
const { Button } = require("../../../classes/views.js")

class ShopButton extends Button {
    text_size = 20
    color = "green"
    text_color = "white"
    text = "Shop"
    sub_text = null
    callback = function() {
        this.gd.paused = true
        this.gd.view = "shop"
    }
}

module.exports = ShopButton
},{"../../../classes/views.js":3}],7:[function(require,module,exports){
const { View } = require("../../classes/views.js")
const { ShopButton } = require("./buttons.js")

class GameView extends View {
    bg_img_src = "assets/game_bg.png"

    constructor(gd) {
        super(gd)
        this.bg_img.src = this.bg_img_src

        const enter_shop_btn = new ShopButton(gd, this.gd.maxWidth, this.gd.maxHeight)
        enter_shop_btn.x = this.gd.maxWidth-enter_shop_btn.w-10
        enter_shop_btn.y = this.gd.maxHeigth-enter_shop_btn.h-10
        this.buttons.push(enter_shop_btn)
    }

    draw() {
        super.draw()
        if (this.gd.laser.inuse) {
            this.gd.ctx.drawImage(this.gd.laser.img,this.gd.laser.x,this.gd.laser.y,this.gd.laser.w,this.gd.laser.h)
        }
        this.gd.ctx.drawImage(this.gd.player.img,this.gd.player.x,this.gd.player.y,this.gd.player.w,this.gd.player.h)

        for (const [entity, entity_arr] of Object.entries(this.gd.entities)) {
            for (let i = 0; i < entity_arr.length; i++) {
                const ent = entity_arr[i]
                this.gd.ctx.drawImage(ent.img,ent.x,ent.y,ent.w,ent.h)
            }
        }

        this.gd.ctx.font = "30px Arial"
        this.gd.ctx.textAlign = "left"
        this.gd.ctx.strokeStyle = "black"
        this.gd.ctx.strokeText("Score: " + Math.floor(this.gd.score), 10, 70)
        
        this.gd.ctx.fillStyle = "black"
        this.gd.ctx.fillRect(10, 10, 200, 30)
        this.gd.ctx.fillStyle = "red"
        this.gd.ctx.fillRect(12, 12, 196 * (this.gd.player.health/100), 26)

        this.gd.ctx.font = "20px Arial"
        this.gd.ctx.fillStyle = "white"
        this.gd.ctx.textAlign = "center"
        if (this.gd.player.health < 0) this.gd.player.health = 0
        const health_text = Math.ceil(this.gd.player.health) + "/" + this.gd.player.max_health
        this.gd.ctx.fillText(health_text, 110, 32)

        this.gd.ctx.textAlign = "right"
        this.gd.ctx.strokeText("Hiscore: " + this.gd.hiscore, this.gd.maxWidth-10, 30)

        this.gd.ctx.textAlign = "left"
        let cd = this.gd.laser.last_shot+this.gd.laser.cooldown+this.gd.laser.duration-Date.now()
        let cd_text = "laser CD: "+ Math.ceil(cd/1000) + "s"
        if (cd < 0) cd_text = "laser Ready"
        if (this.gd.laser.inuse) cd_text = "laser Active"
        if (this.gd.score < 100) cd_text = "laser requires 100 score"
        this.gd.ctx.strokeText(cd_text, 10, this.gd.maxHeigth-10)

        if (this.gd.game_over_flag) {
            this.gd.ctx.font = "30px Arial"
            this.gd.ctx.fillStyle = "red"
            this.gd.ctx.textAlign = "center"
            this.gd.ctx.strokeText("Game Over", this.gd.maxWidth/2, this.gd.maxHeigth/2)
            this.gd.ctx.fillText("Game Over", this.gd.maxWidth/2, this.gd.maxHeigth/2)

            this.gd.ctx.font = "20px Arial"
            this.gd.ctx.fillStyle = "black"
            this.gd.ctx.textAlign = "center"
            this.gd.ctx.fillText("Press space to restart", this.gd.maxWidth/2, this.gd.maxHeigth/2 + 30)
            return
        }

        this._draw_buttons()
    }
}

module.exports = GameView
},{"../../classes/views.js":3,"./buttons.js":5}],8:[function(require,module,exports){
const ExitButton = require("./buttons/close_shop_btn.js")

module.exports = {
    ExitButton
}
},{"./buttons/close_shop_btn.js":9}],9:[function(require,module,exports){
const { Button } = require("../../../classes/views.js")

class ExitButton extends Button {
    text_size = 20
    color = "green"
    text_color = "white"
    text = "Close"
    sub_text = null
    callback = function() {
        this.gd.view = "game"
        this.gd.paused = false
    }
}

module.exports = ExitButton
},{"../../../classes/views.js":3}],10:[function(require,module,exports){
const { View } = require("../../classes/views.js")
const { ExitButton } = require("./buttons.js")

class ShopView extends View {
    bg_img_src = "assets/shop_bg.png"

    constructor(gd) {
        super(gd)
        this.bg_img.src = this.bg_img_src

        const exit_btn = new ExitButton(gd)
        exit_btn.x = this.gd.maxWidth - exit_btn.w - 10
        exit_btn.y = this.gd.maxHeigth - exit_btn.h - 10
        this.buttons.push(exit_btn)
    }

    draw() {
        super.draw()
        this.gd.ctx.font = "30px Arial"
        this.gd.ctx.fillStyle = "white"
        this.gd.ctx.strokeStyle = "red"
        this.gd.ctx.textAlign = "center"
        this.gd.ctx.fillText("Shop", this.gd.maxWidth/2, 50)
        this.gd.ctx.strokeText("Shop", this.gd.maxWidth/2, 50)
        this.gd.ctx.font = "20px Arial"
        this.gd.ctx.fillText("All Upgrades cost "+ this.gd.player.upgrade_cost +" Score", this.gd.maxWidth/2, 80)
        this.gd.ctx.fillText("All Upgrades add +1%", this.gd.maxWidth/2, 100)

        this.gd.ctx.textAlign = "left"
        this.gd.ctx.font = "30px Arial"
        this.gd.ctx.fillText("Score: " + Math.floor(this.gd.score), 10, 40)
        this.gd.ctx.strokeText("Score: " + Math.floor(this.gd.score), 10, 40)

        this._draw_buttons()
    }
}

module.exports = ShopView
},{"../../classes/views.js":3,"./buttons.js":8}]},{},[4]);
