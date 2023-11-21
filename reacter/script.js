const container = document.getElementById("GameBoard");
let bounding_box = container.getBoundingClientRect();

const scoreboard = document.getElementById("History")

const good_indicator = document.getElementById("GoodColorSquare");
const bad_indicator = document.getElementById("BadColorSquare");

const good_click_counter = document.getElementById("GoodClicks");
const bad_click_counter = document.getElementById("BadClicks");
const accuracy_counter = document.getElementById("Accuracy");
const best_time_counter = document.getElementById("BestTime");
const average_time_counter = document.getElementById("AvgTime");

const timer = document.getElementById("Timer");

const shapes = ['circle', 'square'];

let logic_interval = null;
let timer_running = false;

let good_clicks = 0;
let bad_clicks = 0;
let accuracy = 1;
let best_time = 0;
let average_time = 0;
let elements_on_screen = [];
let history = [];

let click_time = 0;
let spawn_time = 0;
let next_spawn = 0;

let window_size

function mil_to_sec(mil) {
    return Math.floor(mil/1000*100)/100;
}

function randomShape() {
    return shapes[Math.floor(Math.random() * shapes.length)];
}

function randomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function get_valid_position(size) {
    const left = bounding_box.left;
    const right = bounding_box.right;
    const x = Math.floor(Math.random() * (right - size - left)) + left;
    const top = bounding_box.top;
    const bottom = bounding_box.bottom;
    const y = Math.floor(Math.random() * (bottom - size - top)) + top;
    return [x, y];
}

function bad_callback(event) {
    click_time = Date.now();
    bad_clicks += 1;
    accuracy = good_clicks / (good_clicks + bad_clicks);
    for (let i = 0; i < elements_on_screen.length; i++) {
        elements_on_screen[i].remove()
    }

    next_spawn = Date.now() + Math.floor(Math.random() * 5000) + 1000;

    elements_on_screen = [];
    stop_timer();
}

function good_callback(event) {
    click_time = Date.now();
    
    list_element = document.createElement('li')
    const time = click_time - spawn_time;
    history.push(time)
    average_time = history.reduce((a, b) => a + b, 0) / history.length;
    good_clicks += 1;
    accuracy = good_clicks / (good_clicks + bad_clicks);
    if (time > best_time) best_time = time;

    list_element.innerHTML = mil_to_sec(time)+"s"

    if (scoreboard.childElementCount >= 5) {
        scoreboard.removeChild(scoreboard.lastElementChild)
    }

    scoreboard.prepend(list_element)    

    next_spawn = Date.now() + Math.floor(Math.random() * 5000) + 1000;
    
    for (let i = 0; i < elements_on_screen.length; i++) {
        elements_on_screen[i].remove()
    }
    elements_on_screen = [];
    stop_timer();
}

function stop_timer() {
    timer_running = false;
}

function spawn_element(color, callback) {
    const element = document.createElement('a');
    element.classList.add(randomShape());
    element.style.backgroundColor = color;
    size = Math.floor(Math.random() * 100) +30;
    element.style.width = size + 'px';
    element.style.height = size + 'px';
    const [x, y] = get_valid_position(size);
    element.style.left = x + 'px';
    element.style.top = y + 'px';

    element.addEventListener('click', callback);
    container.appendChild(element);
    elements_on_screen.push(element);
    element_spawned = true;
    spawn_time = Date.now();
}

function spawner() {
    console.log("spawning");
    const bad_color = randomColor();
    bad_indicator.style.backgroundColor = bad_color;
    spawn_element(bad_color, bad_callback);
    bad_indicator.style.backgroundColor = bad_color;

    const good_color = randomColor();
    good_indicator.style.backgroundColor = good_color;
    spawn_element(good_color, good_callback);
    good_indicator.style.backgroundColor = good_color;
}

function logic() {
    if (!elements_on_screen.length && Date.now() > next_spawn) {
        timer_running = true;
        spawner();
    }
   
    if (timer_running) {
        timer.innerHTML = mil_to_sec(Date.now() - spawn_time)+"s";
    }

    good_click_counter.innerHTML = good_clicks;
    bad_click_counter.innerHTML = bad_clicks;
    accuracy_counter.innerHTML = Math.floor(accuracy*100*100)/100 + "%";
    best_time_counter.innerHTML = mil_to_sec(best_time)+"s";
    average_time_counter.innerHTML = mil_to_sec(average_time)+"s";
}

function start_game() {
    bounding_box = container.getBoundingClientRect();
    timer_running = false;

    elements_on_screen = [];
    next_spawn = Date.now() + Math.floor(Math.random() * 5000) + 1000;
    logic_interval = setInterval(logic, 1000/60);
}

function stop_game() {
    for (let i = 0; i < elements_on_screen.length; i++) {
        elements_on_screen[i].remove()
    }
    if (logic_interval) clearInterval(logic_interval);
}

function reset_game() {
    stop_game();
    good_clicks = 0;
    bad_clicks = 0;
    accuracy = 1;
    best_time = 0;
    average_time = 0;
    history = [];

    while (scoreboard.firstChild) {
        scoreboard.removeChild(scoreboard.firstChild);
    }
    for (let i = 0; i < 5; i++) {
        const empty = document.createElement('li');
        empty.innerHTML = "Empty";
        scoreboard.appendChild(empty);
    }

    good_click_counter.innerHTML = good_clicks;
    bad_click_counter.innerHTML = bad_clicks;
    accuracy_counter.innerHTML = Math.floor(accuracy*100*100)/100 + "%";
    best_time_counter.innerHTML = mil_to_sec(best_time)+"s";
    average_time_counter.innerHTML = mil_to_sec(average_time)+"s";
}

addEventListener('resize', function() {
    bounding_box = container.getBoundingClientRect();
    timer.innerHTML = "0.00s";
    stop_game();
    start_game();
})