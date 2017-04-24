var stage;
var stageWidth;
var stageHeight;
var stageCenter;
var camera;
var assets;
var muteSoundButton;
var sound;
var loadingText;

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
    stage = new createjs.Stage("demoCanvas");

    loadResources(play);
}

function loadResources(callback) {
    loadingText = new createjs.Text("Loading 0%", "30px Arial", "Black");
    loadingText.textAlign = "center";
    loadingText.textBaseline = "middle";
    loadingText.x = stage.canvas.width / 2;
    loadingText.y = stage.canvas.height / 2;
    stage.addChild(loadingText);
    stage.update();
    
    var queue = new createjs.LoadQueue(true);
    var handleComplete = function() {
        stage.removeChild(loadingText);
        assets = {
            resourcesSpriteSheet: queue.getResult("resources"),
            humanSpriteSheet: queue.getResult("human"),
            golemSpriteSheet: queue.getResult("golem"),
            statusBarsSpriteSheet: queue.getResult("status_bars")
        }
        assets.progressBarFill = createjs.SpriteSheetUtils.extractFrame(assets.statusBarsSpriteSheet, 1);
        callback();
    };
    
    var updateLoading = function() {
        loadingText.text = "Loading " + (queue.progress * 100 | 0) + "%";
        stage.update();
    }

    queue.on("complete", handleComplete, this);
    queue.on("progress", updateLoading);
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
                    world.units[i].wasTaken = true;
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

        console.log(game.selectedBuildTool);
        if (game.selectedBuildTool) {
            console.log("Trying to build");
            building = new game.selectedBuildTool.type(cell.x, cell.y, world);
            if (tryCreateBuilding(world, inventory, building)) {
                console.log("Created building.");
                human.stopContinuousAction(world);
                changeBuildTool(game, null);
            } else {
                console.log("Can't create building here.");
            }
        } else if (world.cellContainsUnit(cell.x, cell.y, UNIT_GOLEM)) {
            var dir = getDirection(human, cell);
            if (dir >= 0) {
                human.stopContinuousAction(world);
                var golem = world.getUnitFromCellByType(cell.x, cell.y, UNIT_GOLEM);
                human.dir = dir;
                human.gotoDirAnim("attack", true);
                human.dealDamage(this, golem);
                if (!golem.isAlive()) {
                    tweenAdded();
                    createjs.Tween.get(golem.container)
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
                if (human.hasActionAtDir(dir)) return game;

                console.log("cutting tree at [" + cell.x + ", " +  cell.y + "]");
                human.dir = dir;

                var continuousActionLoopPeriod = 400;
                var continuousActionCallback = function() {
                    human.gotoDirAnim("attack", true);
                }

                human.waitingCallback = function() {
                    inventory.addItem(ITEM_WOOD, 1);
                    tree.wasTaken = true;
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
                if (human.hasActionAtDir(dir)) return game;

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

                human.startContinuousAction(
                    world.container,
                    human.fishingTime,
                    continuousActionLoopPeriod,
                    continuousActionCallback);
            }
        } else if (!tweenController.shouldStop) {
            human.stopContinuousAction(world);
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
    
    stepTicker.addEventListener(100, function() {
        var newWorld = new World(5, 5, 0, 0, 4);

        for (var x = 0; x < newWorld.width; ++x) {
            for (var y = 0; y < newWorld.height; ++y) {
                if (newWorld.cells[x][y].type == "G") {
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
        
        var mergeDir = getRandomInt(0, 4);
        stopTweens(function() {
            MergeIslands(game.map, game.world, newWorld, mergeDir);
        });
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

        game.world.unitsContainer.sortChildren(compareUnitContainers);

        updateSelectedBuildTool(game);
        updateSelectedCell(game);

        // Render.
        stage.update();
    }
}
