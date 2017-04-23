var stage;
var stageWidth;
var stageHeight;
var stageCenter;
var camera;
var assets;
var muteSoundButton;
var sound;

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
    stageWidth = window.innerWidth;
    stageHeight = window.innerHeight;
    stage.canvas.width = stageWidth;
    stage.canvas.height = stageHeight;
    stageCenter = new Point(stageWidth / 2, stageHeight / 2);
    console.log("Resize to: " + stageWidth + ":" + stageHeight);

    muteSoundButton.x = stageWidth - 32 - 20;
}

function init() {
    loadResources(play);
}

function loadResources(callback) {
    var queue = new createjs.LoadQueue(true);
    var handleComplete = function() {
        assets = {
            spriteSheet: queue.getResult("resources"),
            humanSpriteSheet: queue.getResult("human"),
            golemSpriteSheet: queue.getResult("golem")
        }
        callback();
    };
    queue.on("complete", handleComplete, this);
    queue.loadFile({src: "assets/resources.json", id: "resources", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "assets/human.json", id: "human", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "assets/golem.json", id: "golem", type: createjs.AbstractLoader.SPRITESHEET});
}

function play() {
    var game = initGame();
    gameLoop(game);
}

function initSound() {
    createjs.Sound.registerPlugins([createjs.WebAudioPlugin]);
    createjs.Sound.alternateExtensions = ["mp3"];

    function loadHandler(event) {
        sound = createjs.Sound.play("sound", {loop: -1});
        sound.volume = 0.5;
    }
    createjs.Sound.on("fileload", loadHandler, this);

    createjs.Sound.registerSound("assets/theme.mp3", "sound");
}

function initGame() {
    initSound();

    stage = new createjs.Stage("demoCanvas");

    muteSoundButton = new createjs.Shape();
    muteSoundButton.graphics.beginFill("yellow").drawRect(0, 0, 32, 32);
    muteSoundButton.y = 20;
    muteSoundButton.muted = false;

    muteSoundButton.on("mousedown", function() {
        this.muted = !this.muted;
        if (this.muted) {
            muteSoundButton.graphics.clear().beginFill("black").drawRect(0, 0, 32, 32);
            createjs.Tween.get(sound).to({volume: 0}, 500);
        } else {
            muteSoundButton.graphics.clear().beginFill("yellow").drawRect(0, 0, 32, 32);
            createjs.Tween.get(sound).to({volume: 0.5}, 500);
        }
    });

    window.addEventListener('resize', resize);
    resize();

    var inventory = new Inventory();

    var map = new Map(30, 30);
    var world = new World(10, 10, 10, 10, 10);
    var game = {
        "map": map,
        "world": world,
        "selectedCellPosition": null,
        "selectedCellShape": new createjs.Shape(),
        "inventory": inventory,
    };

    {
        var gfx = game.selectedCellShape.graphics;
        gfx.setStrokeStyle(3);
        gfx.beginStroke("white");
        drawTile(game.selectedCellShape);
        game.selectedCellShape.alpha = 0;
    }

    // TODO: reassign from the world to the new one when it changes
    game.world.selectionContainer.addChild(game.selectedCellShape);
    game.world.container.on("mousedown", function() {
        if (game.world.selectionCallback && game.selectedCellPosition) {
            game.world.selectionCallback(game.selectedCellPosition);
        }
    })

    map.addWorld(world);
    camera = new Point(0, 0);

    addOtherWorld(game);

    stage.addChild(map.container);

    for (var x = 0; x < world.width; ++x) {
        for (var y = 0; y < world.height; ++y) {
            if (world.cells[x][y].type == "G") {
                var r = getRandomInt(0, 5);
                if (r == 0) {
                    world.addUnit(new Tree(x, y));
                } else if (r < 3) {
                    world.addUnit(new Rock(x, y));
                } else if (r < 4) {
                    var bush = new Bush(x, y);
                    world.addUnit(bush);
                }
            }
        }
    }

    var human = new Human(2, 3);
    world.addUnit(human);
    game.human = human;

    var golem = new Golem(5, 5);
    world.addUnit(golem);
    golem.engageHuman(world, human);

    human.stepOnCellCallback = function(previousPosition) {
        for (var i = 0; i < world.units.length;) {
            if (world.units[i].x == this.x && world.units[i].y == this.y) {
                if (world.units[i].type == UNIT_ROCK) {
                    inventory.addItem(ITEM_STONES, 1);
                    world.removeUnitByIndex(i);
                } else if (world.units[i].type == UNIT_BUSH && world.units[i].hasBerries()) {
                    inventory.addItem(ITEM_BERRIES, 1);
                    world.units[i].pickBerries();
                } else {
                    ++i;
                }
            } else {
                ++i
            }
        }
    }

    world.selectionCallback = function(cell) {
        console.log("Clicked on cell: " + cell.x + "," + cell.y);
        if (cell.x == golem.x && cell.y == golem.y) {
            var dir = getDirection(human, golem);
            if (dir >= 0) {
                human.dir = dir;
                human.view.gotoAndPlay("attack_" + DIR_SUFFIX[human.dir]);
            }
        } else if (world.cellContainsUnit(cell.x, cell.y, UNIT_TREE)) {
            var tree = world.getUnitFromCell(cell.x, cell.y);
            var dir = getDirection(human, tree);
            if (dir >= 0) {
                human.dir = dir;
                human.view.gotoAndPlay("attack_" + DIR_SUFFIX[human.dir]);
                human.dealDamage(this, tree);
                if (!tree.isAlive()) {
                    inventory.addItem(ITEM_WOOD, 1);
                    world.removeUnitsInCell(tree.x, tree.y);
                }
            }
        } else {
            human.setFinalDestinationCell(world, cell);
        }
    }

    stage.addChild(inventory.container);
    stage.addChild(muteSoundButton);

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

function updateSelectedCell(game) {
    var local = game.world.container.globalToLocal(stage.mouseX, stage.mouseY);
    var cart = isometricToCartesian(local.x, local.y);
    var cell = new Point(Math.floor(cart.x / CELL_SIZE), Math.floor(cart.y / CELL_SIZE));
    if (game.world.cellIsSelectable(cell.x, cell.y)) {
        game.selectedCellPosition = cell;
        var iso = cartesianToIsometric(cell.x * CELL_SIZE, cell.y * CELL_SIZE);
        game.selectedCellShape.x = iso.x;
        game.selectedCellShape.y = iso.y;
        game.selectedCellShape.alpha = 1;
    } else {
        game.selectedCellPosition = null;
        game.selectedCellShape.alpha = 0;
    }
}

function gameLoop(game) {
    // Setup periodic ticker.
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tick);

    stepTicker = new StepTicker(100);

    var sinkRandomCell = function() {
        var borderCell = pickRandomBorderCell(game.world);
        if (borderCell) {
            game.world.damageWithWater(borderCell.x, borderCell.y);
        }
    }
    stepTicker.addEventListener(20, sinkRandomCell);

    stepTicker.addEventListener(10, function() {
        var units = game.world.units;
        for (var i = 0; i < units.length; ++i) {
            if (units[i].type == UNIT_BUSH) {
                units[i].growBerries();
            }
        }
    });

    function tick(event) {
        stepTicker.advanceTime(event.delta);
        var seconds = event.delta / 1000.;

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

        // Camera bounds
        var worldBoundingBoxHalfWidth = (game.world.width + game.world.height) / 2. * CELL_SIZE + 100;
        var xDiff = worldBoundingBoxHalfWidth - stageCenter.x;
        var minCameraX = Math.min(-xDiff, 0);
        var maxCameraX = Math.max(xDiff, 0);

        var worldBoundingBoxHalfHeight = (game.world.width + game.world.height) / 4. * CELL_SIZE + 100;
        var yDiff = worldBoundingBoxHalfHeight - stageCenter.y;
        var minCameraY = Math.min(-yDiff, 0);
        var maxCameraY = Math.max(yDiff, 0);

        camera.x = clamp(camera.x, minCameraX, maxCameraX);
        camera.y = clamp(camera.y, minCameraY, maxCameraY);

        game.map.container.x = stageCenter.x;
        game.map.container.y = stageCenter.y;

        var worldCenter = game.world.getCenter();
        game.map.container.regX = worldCenter.x + camera.x;
        game.map.container.regY = worldCenter.y + camera.y;

        updateSelectedCell(game);

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
        var mergeDir = -1;

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
        } else if (keys[81]) {
            mergeDir = 0;
        } else if (keys[87]) {
            mergeDir = 1;
        } else if (keys[69]) {
            mergeDir = 2;
        } else if (keys[82]) {
            mergeDir = 3;
        }

        if (mergeDir >= 0) {
            var newWorld = new World(5, 5, 0, 0, 4);

            for (var x = 0; x < newWorld.width; ++x) {
                for (var y = 0; y < newWorld.height; ++y) {
                    if (newWorld.cells[x][y].type == "G") {
                        var r = getRandomInt(0, 5);
                        if (r == 0) {
                            newWorld.addUnit(new Tree(x, y));
                        } else if (r < 3) {
                            newWorld.addUnit(new Rock(x, y));
                        }
                    }
                }
            }

            MergeIslands(game.map, game.world, newWorld, mergeDir);
            game.omck = 60;
        }

        if (changed) {
            game.omck = 60;

            game.map.worldsContainer.removeChild(game.otherWorld.container);
            if (behind) {
                var idx = game.map.worldsContainer.getChildIndex(game.world.container);
                game.map.worldsContainer.addChildAt(game.otherWorld.container, idx);
            } else {
                game.map.worldsContainer.addChild(game.otherWorld.container);
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
