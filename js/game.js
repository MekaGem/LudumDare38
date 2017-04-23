var stage;
var center;
var camera;

var CAMERA_MOVEMENT_BORDER = 80;
var CAMERA_MOVEMENT_SPEED = 500;

var keys = {};

document.onkeydown = function(e) {
	keys[e.keyCode] = true;
};
document.onkeyup = function(e) {
	delete keys[e.keyCode];
};

function resize() {
    stage.canvas.width = window.innerWidth;
    stage.canvas.height = window.innerHeight;
    center = new Point(stage.canvas.width / 2, stage.canvas.height / 2);
    console.log("Resize to: " + stage.canvas.width + ":" + stage.canvas.height);
}

function init() {
    loadResources(play);
}

function loadResources(callback) {
    var queue = new createjs.LoadQueue(true);
    var handleComplete = function() {
        spriteSheet = queue.getResult("resources");
        humanSpriteSheet = queue.getResult("human");
        callback();
    };
    queue.on("complete", handleComplete, this);
    queue.loadFile({src: "assets/resources.json", id: "resources", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "assets/human.json", id: "human", type: createjs.AbstractLoader.SPRITESHEET});
}

function play() {
    var game = initGame();
    gameLoop(game);
}

function initGame() {
    stage = new createjs.Stage("demoCanvas");
    window.addEventListener('resize', resize);
    resize();

    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = 100;
    circle.y = 100;
    stage.addChild(circle);
    stage.update();

    var map = new Map(100, 50);
    var world = new World(10, 10, 10, 10, 10);
    var game = {
        "map": map,
        "world": world,
    };

    map.addWorld(world);
    camera = world.getCenter();
    console.log("Camera at " + camera.x + ":" + camera.y);
    
    addOtherWorld(game);

    stage.addChild(map.container);

    for (var x = 0; x < world.width; ++x) {
        for (var y = 0; y < world.height; ++y) {
            if (world.cells[x][y].type == "G") {
                if (x % 2 == 0) {
                    world.addUnit(new Tree(x, y, spriteSheet));
                } else {
                    world.addUnit(new Rock(x, y, spriteSheet));
                }
            }
        }
    }

    var human = new Human(2, 3, humanSpriteSheet);
    //for testing.
    destination = new Point(2 * CELL_SIZE, 7 * CELL_SIZE);
    isoDest = cartesianToIsometric(destination.x, destination.y);
    human.isoDestinationX = isoDest.x;
    human.isoDestinationY = isoDest.y;
    world.addUnit(human);
    stage.update();
    game.human = human

    return game;
}

function StepTicker(period) {
    this.stepPeriod = period;
    this.timePassed = 0;
    this.listeners = [];
}

StepTicker.prototype.addEventListener = function(period, callback) {
    this.listeners.push({
        currentTick: 0,
        period: period,
        callback: callback
    });
};

StepTicker.prototype.tick = function() {
    for (var i = 0; i < this.listeners.length; ++i) {
        var l = this.listeners[i];
        ++l.currentTick;
        while (l.currentTick >= l.period) {
            l.callback();
            l.currentTick -= l.period;
        }
    }
};

StepTicker.prototype.advanceTime = function(delta) {
    this.timePassed += delta;
    while (this.timePassed > this.stepPeriod) {
        this.tick();
        this.timePassed -= this.stepPeriod;
    }
};

function gameLoop(game) {
    // Setup periodic ticker.
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tick);

    stepTicker = new StepTicker(100);

    var sinkRandomCell = function() {
        borderCell = pickRandomBorderCell(game.world);
        if (borderCell) {
            game.world.transformToWater(borderCell.x, borderCell.y);
        }
    }
    stepTicker.addEventListener(20, sinkRandomCell);

    var shiftHuman = function() {
        game.world.shiftHuman(game.human); // shift in cartesian coordinates.
    }
    stepTicker.addEventListener(1, shiftHuman);

    function tick(event) {
        stepTicker.advanceTime(event.delta);
        seconds = event.delta / 1000.;

        // Move camera.
        if (stage.mouseX < CAMERA_MOVEMENT_BORDER) {
            camera.x -= CAMERA_MOVEMENT_SPEED * seconds;
        }
        if (stage.mouseX > stage.canvas.width - CAMERA_MOVEMENT_BORDER) {
            camera.x += CAMERA_MOVEMENT_SPEED * seconds;
        }
        if (stage.mouseY < CAMERA_MOVEMENT_BORDER) {
            camera.y -= CAMERA_MOVEMENT_SPEED * seconds;
        }
        if (stage.mouseY > stage.canvas.height - CAMERA_MOVEMENT_BORDER) {
            camera.y += CAMERA_MOVEMENT_SPEED * seconds;
        }
        
        tickOtherWorld(game);

        game.map.container.x = center.x;
        game.map.container.y = center.y;

        game.map.container.regX = camera.x;
        game.map.container.regY = camera.y;

        // Render.
        stage.update();
    }
}

function addOtherWorld(game) {
    game.otherWorld = new World(5, 5, 0, 0, 4);
    game.otherOff = {x: -10, y: -10};
    game.omck = 0;
    game.otherDrift = {x: 0, y: 0};
    game.map.addWorld(game.otherWorld);
}

function tickOtherWorld(game) {
    if (game.omck > 0) {
        game.omck--;
    } else {
        var behind = false;
        var changed = false;
        
        if (keys[49]) {
            game.otherOff = ClashIslands(game.world, game.otherWorld, 0);
            game.otherDrift = {x: DIRS[0].x, y: DIRS[0].y};
            changed = true;
        } else if (keys[50]) {
            game.otherOff = ClashIslands(game.world, game.otherWorld, 1);
            game.otherDrift = {x: DIRS[1].x, y: DIRS[1].y};
            changed = true;
        } else if (keys[51]) {
            game.otherOff = ClashIslands(game.world, game.otherWorld, 2);
            game.otherDrift = {x: DIRS[2].x, y: DIRS[2].y};
            changed = true;
            behind = true;
        } else if (keys[52]) {
            game.otherOff = ClashIslands(game.world, game.otherWorld, 3);
            game.otherDrift = {x: DIRS[3].x, y: DIRS[3].y};
            changed = true;
            behind = true;
        }
        
        if (changed) {
            game.omck = 60;
            
            game.map.container.removeChild(game.otherWorld.container);
            if (behind) {
                game.map.container.addChildAt(game.otherWorld.container, game.map.container.getChildIndex(game.world.container));
            } else {
                game.map.container.addChild(game.otherWorld.container);
            }
            
            game.otherWorld.x = game.world.x + game.otherOff.x;
            game.otherWorld.y = game.world.y + game.otherOff.y;
        }
    }
    
    game.otherDrift.x *= 0.95;
    game.otherDrift.y *= 0.95;
    
    var iso = cartesianToIsometric((game.otherWorld.x + game.otherDrift.x) * CELL_SIZE, (game.otherWorld.y + game.otherDrift.y) * CELL_SIZE);
    game.otherWorld.container.x = iso.x;
    game.otherWorld.container.y = iso.y;
}
