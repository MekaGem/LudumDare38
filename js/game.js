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
            resourcesSpriteSheet: queue.getResult("resources"),
            humanSpriteSheet: queue.getResult("human"),
            golemSpriteSheet: queue.getResult("golem"),
            statusBarsSpriteSheet: queue.getResult("status_bars")
        }
        callback();
    };
    queue.on("complete", handleComplete, this);
    queue.loadFile({src: "assets/resources.json", id: "resources", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "assets/human.json", id: "human", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "assets/golem.json", id: "golem", type: createjs.AbstractLoader.SPRITESHEET});
    queue.loadFile({src: "assets/status_bars.json", id: "status_bars", type: createjs.AbstractLoader.SPRITESHEET});
}

function play() {
    var game = initGame();
    gameLoop(game);
}

function initSound() {
    createjs.Sound.registerPlugins([createjs.WebAudioPlugin]);
    createjs.Sound.alternateExtensions = ["mp3", "wav"];

    function loadHandler(event) {
        sound = createjs.Sound.play("sound", {loop: -1});
        sound.volume = 0.01;
    }
    createjs.Sound.on("fileload", loadHandler, this);

    createjs.Sound.registerSound("assets/theme.ogg", "sound");
}

var SELECTED_CELL_TILE = null;
function getSelectedCellTile() {
    if (SELECTED_CELL_TILE) return SELECTED_CELL_TILE;
    var shape = new createjs.Shape()
    var gfx = shape.graphics;
    gfx.setStrokeStyle(3);
    gfx.beginStroke("white");
    drawTile(shape);
    shape.alpha = 1;
    SELECTED_CELL_TILE = shape;
    return shape;
}

function getFortTile() {
    var fort = new createjs.Sprite(assets.resourcesSpriteSheet, "kamushki");
    fort.alpha = 0.5;
    return fort;
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
        "selectedCellShape": new createjs.Container(),
        "inventory": inventory,
        "finished": false,
        "timePassed": 0,
    };

    game.selectedCellShape.alpha = 1;
    game.selectedCellShape.addChild(getSelectedCellTile());

    // TODO: reassign from the world to the new one when it changes
    game.world.selectionContainer.addChild(game.selectedCellShape);
    stage.on("stagemousedown", function() {
        if (game.world.selectionCallback && game.selectedCellPosition) {
            game.world.selectionCallback(game.selectedCellPosition);
        }
    });

    map.addWorld(world);
    camera = new Point(0, 0);

    addOtherWorld(game);

    stage.addChild(map.container);

    for (var x = 0; x < world.width; ++x) {
        for (var y = 0; y < world.height; ++y) {
            if (world.cells[x][y].type == CELL_TYPE_GRASS) {
                var r = getRandomInt(0, 7);
                if (r == 0) {
                    world.addUnit(new Tree(x, y));
                } else if (r == 1) {
                    world.addUnit(new Rock(x, y));
                } else if (r == 2) {
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

    human.stepOnCellCallback = function() {
        for (var i = 0; i < world.units.length;) {
            if (world.units[i].x == this.x && world.units[i].y == this.y) {
                if (world.units[i].type == UNIT_ROCK) {
                    inventory.addItem(ITEM_STONES, 1);
                    world.removeUnitByIndex(i);
                } else if (world.units[i].type == UNIT_BUSH && world.units[i].hasBerries()) {
                    inventory.addItem(ITEM_FOOD, 1);
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
        human.stopContinuousAction(world);

        console.log(game.selectedBuildTool);
        if (game.selectedBuildTool) {
            console.log("Trying to build");
            building = new game.selectedBuildTool.type(cell.x, cell.y);
            if (tryCreateBuilding(world, inventory, building)) {
                console.log("Created building.");
                changeBuildTool(game, null);
            } else {
                console.log("Can't create building here.");
            }
        } else if (world.cellContainsUnit(cell.x, cell.y, UNIT_GOLEM)) {
            var dir = getDirection(human, cell);
            if (dir >= 0) {
                var golem = world.getUnitFromCellByType(cell.x, cell.y, UNIT_GOLEM);
                human.dir = dir;
                human.gotoDirAnim("attack", true);
                human.dealDamage(this, golem);
                if (!golem.isAlive()) {
                    tweenAdded();
                    createjs.Tween.get(golem.view)
                        .to({alpha: 0}, 1000)
                        .call(function() {
                            world.removeUnit(golem);
                            tweenRemoved();
                        });
                }
            }
        } else if (world.cellContainsUnit(cell.x, cell.y, UNIT_TREE)) {
            var tree = world.getUnitFromCell(cell.x, cell.y);
            var dir = getDirection(human, tree);
            if (dir >= 0) {
                console.log("cutting tree at [" + cell.x + ", " +  cell.y + "]");
                human.dir = dir;

                var continuousActionLoopPeriod = 400;
                var continuousActionCallback = function() {
                    human.gotoDirAnim("attack", true);
                }

                human.waitingCallback = function() {
                    inventory.addItem(ITEM_WOOD, 1);
                    world.removeUnitsInCell(tree.x, tree.y);
                    human.stopContinuousAction(world);
                }

                human.startContinuousAction(
                    world.container,
                    human.treeCuttingTime,
                    continuousActionLoopPeriod,
                    continuousActionCallback);
            }
        } else if (world.cellIsWaterNearLand(cell.x, cell.y)) {
            var dir = getDirection(human, cell);
            if (dir >= 0) {
                console.log("fishing at [" + cell.x + ", " + cell.y + "]");
                human.dir = dir;
                var continuousActionLoopPeriod = 400;
                var continuousActionCallback = function() {
                    human.gotoDirAnim("attack", true);
                }

                human.waitingCallback = function() {
                    inventory.addItem(ITEM_FOOD, 1);
                    human.stopContinuousAction(world);
                }

                human.startContinuousAction(world,
                    human.fishingTime,
                    continuousActionLoopPeriod,
                    continuousActionCallback);
            }
        } else if (!tweenController.shouldStop) {
            human.setFinalDestinationCell(world, cell);
        }
    }

    stage.addChild(inventory.container);
    stage.addChild(muteSoundButton);

    return game;
}

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

function changeBuildTool(game, newBuildTool) {
    if (game.selectedBuildTool !== newBuildTool) {
        game.selectedBuildTool = newBuildTool;
        game.buildToolChanged = true;
    }
}

function updateSelectedBuildTool(game) {
    if (keys[KEY_F]) {
        changeBuildTool(game, BUILDING_FORT);
    }
    if (keys[KEY_ESC]) {
        changeBuildTool(game, null);
    }

    if (!game.buildToolChanged) {
        return;
    }
    game.buildToolChanged = false;

    // TODO: Store all tiles inside and just change alpha values.
    game.selectedCellShape.removeAllChildren();
    if (!game.selectedBuildTool) {
        game.selectedCellShape.addChild(getSelectedCellTile());
    } else if (game.selectedBuildTool === BUILDING_FORT) {
        console.log("Building Fort");
        game.selectedCellShape.addChild(getFortTile());
    }
}

function gameLoop(game) {
    // Setup periodic ticker.
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tick);

    var stepTicker = new StepTicker(100);

    stepTicker.addEventListener(20, function() {
        var borderCell = pickRandomBorderCell(game.world);
        if (borderCell) {
            game.world.damageWithWater(borderCell.x, borderCell.y);
        }
    });

    // Update Units (bushes, buildings, e.t.c)
    stepTicker.addEventListener(10, function() {
        var units = game.world.units;
        for (var i = 0; i < units.length; ++i) {
            if (units[i].type == UNIT_BUSH) {
                units[i].growBerries();
            } else if (units[i].buildTick) {
                units[i].buildTick(game.world);
            }
        }
    });

    stepTicker.addEventListener(10, function() {
        if (isGameEnded(game)) {
            stopTweens(function() {
                endGame(game);
            });
        }
    });

    function tick(event) {
        if (!game.finished && !tweenController.shouldStop) {
            stepTicker.advanceTime(event.delta);
        }
        var seconds = event.delta / 1000.;
        game.timePassed += seconds;

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

        if (!tweenController.shouldStop) game.world.shakeTiles();

        game.world.unitsContainer.sortChildren(compareUnitViews);

        updateSelectedBuildTool(game);
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

        if (keys[KEY_1]) {
            game.otherOff = ClashIslands(game.world, game.otherWorld, 0);
            game.otherDrift = {x: DIRS[0].x, y: DIRS[0].y};
            changed = true;
        } else if (keys[KEY_2]) {
            game.otherOff = ClashIslands(game.world, game.otherWorld, 1);
            game.otherDrift = {x: DIRS[1].x, y: DIRS[1].y};
            changed = true;
        } else if (keys[KEY_3]) {
            game.otherOff = ClashIslands(game.world, game.otherWorld, 2);
            game.otherDrift = {x: DIRS[2].x, y: DIRS[2].y};
            changed = true;
            behind = true;
        } else if (keys[KEY_4]) {
            game.otherOff = ClashIslands(game.world, game.otherWorld, 3);
            game.otherDrift = {x: DIRS[3].x, y: DIRS[3].y};
            changed = true;
            behind = true;
        } else if (keys[KEY_Q]) {
            mergeDir = 0;
        } else if (keys[KEY_W]) {
            mergeDir = 1;
        } else if (keys[KEY_E]) {
            mergeDir = 2;
        } else if (keys[KEY_R]) {
            mergeDir = 3;
        }

        if (mergeDir >= 0) {
            var newWorld = new World(5, 5, 0, 0, 4);

            for (var x = 0; x < newWorld.width; ++x) {
                for (var y = 0; y < newWorld.height; ++y) {
                    if (newWorld.cells[x][y].type == CELL_TYPE_GRASS) {
                        var r = getRandomInt(0, 5);
                        if (r == 0) {
                            newWorld.addUnit(new Tree(x, y));
                        } else if (r < 3) {
                            newWorld.addUnit(new Rock(x, y));
                        } else if (r == 3) {
                            newWorld.addUnit(new Golem(x, y));
                        }
                    }
                }
            }

            stopTweens(function() {
                MergeIslands(game.map, game.world, newWorld, mergeDir);
            });
            game.omck = 300;
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
