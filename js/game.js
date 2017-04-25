var stage;
var gameContainer;
var stageWidth;
var stageHeight;
var stageCenter;
var camera;
var assets;
var sound;
var loadingText;
var topBar;

var STARTING_SOUND_VOLUME = 0.1;
var SOUND_VOLUME = 0.5;
var CAMERA_MOVEMENT_BORDER = 80;
var CAMERA_MOVEMENT_SPEED = 500;

var MAX_WIDTH = 1000;
var MAX_HEIGHT = 700;

var NEW_ISLAND_TICKS = 600;
var NEW_ISLAND_MIN_SIZE = 5;
var NEW_ISLAND_MAX_SIZE = 7;
var NEW_ISLAND_MIN_REMOVED = 5;
var NEW_ISLAND_MAX_REMOVED = 7;
var NEW_ISLAND_MAX_GOLEMS = 3;
var DAMAGE_WITH_WATER_TICKS = 5;
var LAST_ISLAND = 15;

var keys = {};

document.onkeydown = function(e) {
	keys[e.keyCode] = true;
};
document.onkeyup = function(e) {
	delete keys[e.keyCode];
};

var rulesText = new createjs.Text(" Are you ready to rate the game for 5 stars?\n" +
        " How much time can you survive?\n" +
        " Controls:\n" +
        "1. Use your mouse!\n" +
        "2. Press 'F' to build fortification, and 'ESC' to cancel building,\n" +
        "3. Press 'H' to eat.\n" +
        "4. Try to interact with water and surroundings(golems, trees, buildings), while standing near them.\n", "bold 14px Arial", "#ff7700");

aboutText = new createjs.Text(" This game was created by:\n" +
        "acid\n" +
        "DeRubiOo\n" +
        "Mekagem\n" +
        "ValNykol\n" +
        "Vol4ica\n", "bold 14px Arial", "#ff7700");


function resize(width, height) {
    stageWidth = Math.min(window.innerWidth, MAX_WIDTH);
    stageHeight = Math.min(window.innerHeight, MAX_HEIGHT);
    stage.canvas.width = stageWidth;
    stage.canvas.height = stageHeight;
    stageCenter = new Point(stageWidth / 2, stageHeight / 2);
    console.log("Resize to: " + stageWidth + ":" + stageHeight);

    if (topBar) {
        topBar.rightContainer.x = stageWidth - topBar.rightX;
    }
}

function init() {
    window.onload = function () { window.focus(); }
    window.onclick = function () { window.focus(); }
    stage = new createjs.Stage("demoCanvas");
    gameContainer = new createjs.Container();
    resize();
    // loadResources(play);
    loadResources(showMenu);
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
        sound.volume = STARTING_SOUND_VOLUME;
        createjs.Tween.get(sound).to({volume: SOUND_VOLUME}, 10000);
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

function getRaftTile() {
    var raft = new createjs.Sprite(assets.raftSpriteSheet, "raft");
    raft.alpha = 0.5;
    return raft;
}

function initGame() {
    initSound();

    var soundContainer = new createjs.Container();
    var soundOnButton = new createjs.Sprite(assets.buttonSpriteSheet, "sound_on");
    var soundOffButton = new createjs.Sprite(assets.buttonSpriteSheet, "sound_off");
    soundOffButton.alpha = 0;
    soundOnButton.muted = false;
    soundContainer.addChild(soundOnButton);
    soundContainer.addChild(soundOffButton);

    soundContainer.on("mousedown", function() {
        this.muted = !this.muted;
        createjs.Tween.removeTweens(sound);
        if (this.muted) {
            soundOnButton.alpha = 0;
            soundOffButton.alpha = 1;
            createjs.Tween.get(sound).to({volume: 0}, 500);
        } else {
            soundOnButton.alpha = 1;
            soundOffButton.alpha = 0;
            createjs.Tween.get(sound).to({volume: SOUND_VOLUME}, 500);
        }
    });

    var restartButton = new createjs.Sprite(assets.buttonSpriteSheet, "restart");
    restartButton.on("mousedown", function() {
        console.log("Restart game.");
        // stage.removeAllChildren();
        // play();
        location.reload();
    });

    // window.addEventListener('resize', resize);

    topBar = new Bar(TOP_BAR_X, TOP_BAR_Y);
    bottomBar = new Bar(TOP_BAR_X, stageHeight - 50);

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

    gameContainer.addChild(map.container);

    var humanX = 5;
    var humanY = 5;

    for (var x = 0; x < world.width; ++x) {
        for (var y = 0; y < world.height; ++y) {
            if (x == humanX && y == humanY) continue;
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

    // KOSTILY
    world.cells[humanX][humanY].view.gotoAndPlay("grass");
    world.cells[humanX][humanY].type = CELL_TYPE_GRASS;

    var human = new Human(5, 5);
    world.addUnit(human);
    game.human = human;

    // TODO: maybe later guys
    // var golem = new Golem(6, 6);
    // world.addUnit(golem);
    // golem.engageHuman(world, human);

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
                } else if (world.units[i].type == UNIT_PORTAL) {
                    // TODO: do something else!!!
                    alert("YOU WIN!!!!");
                    ++i;
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
                    continuousActionCallback,
                    "cutting_bubble"
                );
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
                    continuousActionCallback,
                    "fishing_bubble"
                );
            }
        } else if (!tweenController.shouldStop) {
            human.stopContinuousAction(world);
            human.setFinalDestinationCell(world, cell);
        }
    }

    topBar.addItem(human.healthStatus.view, ALIGN_LEFT);
    topBar.addItem(inventory.container, ALIGN_LEFT);
    topBar.addItem(restartButton, ALIGN_RIGHT);
    topBar.addItem(soundContainer, ALIGN_RIGHT);
    gameContainer.addChild(topBar.container);

    bottomBar.addItem(FortBuildingBar(), ALIGN_LEFT);
    bottomBar.addItem(RaftBuildingBar(), ALIGN_LEFT);
    gameContainer.addChild(bottomBar.container);

    stage.addChild(gameContainer);

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
    if (keys[KEY_R]) {
        changeBuildTool(game, BUILDING_RAFT);
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
    } else if (game.selectedBuildTool === BUILDING_RAFT) {
        console.log("Building Raft");
        game.selectedCellShape.addChild(getRaftTile());
    }
}

function listenActionKeys(game) {
    if (keys[KEY_H]) {
        delete keys[KEY_H];
        feedHuman(game, game.human);
    }
}

function feedHuman(game, human) {
    if (!game.inventory.hasEnoughResources(game.inventory.mealRequirements)) {
        return;
    }
    var continuousActionLoopPeriod = 200;
    var continuousActionCallback = function() {
        human.gotoDirAnim("attack", true);
    }

    human.waitingCallback = function() {
        game.inventory.takeResources(game.inventory.mealRequirements);
        human.takeHeal(FOOD_HEALING_VALUE);
        human.stopContinuousAction();
    }

    human.startContinuousAction(
        game.world.container,
        human.eatingTime,
        continuousActionLoopPeriod,
        continuousActionCallback,
        "eating_bubble"
    );
}

function gameLoop(game) {
    // Setup periodic ticker.
    createjs.Ticker.setFPS(60);
    createjs.Ticker.addEventListener("tick", tick);

    var stepTicker = new StepTicker(100);

    stepTicker.addEventListener(DAMAGE_WITH_WATER_TICKS, function() {
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
        game.human.takeDamage(1);
    });

    stepTicker.addEventListener(1, function() {
        if (isGameEnded(game)) {
            stopTweens(function() {
                endGame(game);
            });
        }
    });

    var newIslandCounter = 0;
    stepTicker.addEventListener(NEW_ISLAND_TICKS, function() {
        newIslandCounter += 1;
        if (newIslandCounter > LAST_ISLAND) return;

        if (newIslandCounter == LAST_ISLAND) {
            var R = 4;
            var newWorld = new World(2 * R + 1, 2 * R + 1, 0, 0, 0);
            for (var x = 0; x < newWorld.width; ++x) {
                for (var y = 0; y < newWorld.height; ++y) {
                    if ((x - R) * (x - R) + (y - R) * (y - R) < R * R) {
                        if (x == R && y == R) {
                            newWorld.addUnit(new Portal(x, y));
                        } else {
                            newWorld.addUnit(new Tree(x, y));
                        }
                        newWorld.cells[x][y].hp = 1000000;
                    } else {
                        newWorld.cells[x][y].type = CELL_TYPE_WATER;
                        newWorld.cells[x][y].view.gotoAndPlay("water");
                    }
                }
            }
        } else {
            var newWorld = new World(
                getRandomInt(NEW_ISLAND_MIN_SIZE, NEW_ISLAND_MAX_SIZE + 1),
                getRandomInt(NEW_ISLAND_MIN_SIZE, NEW_ISLAND_MAX_SIZE + 1),
                0, 0,
                getRandomInt(NEW_ISLAND_MIN_REMOVED, NEW_ISLAND_MAX_REMOVED + 1)
            );

            var golemsCreated = 0;
            for (var x = 0; x < newWorld.width; ++x) {
                for (var y = 0; y < newWorld.height; ++y) {
                    if (newWorld.cells[x][y].type == "G") {
                        var r = getRandomInt(0, 12);
                        if (r < 2) {
                            newWorld.addUnit(new Tree(x, y));
                        } else if (r < 4) {
                            newWorld.addUnit(new Rock(x, y));
                        } else if (r < 6) {
                            newWorld.addUnit(new Rock(x, y));
                        } else if (r < 7){
                            if (golemsCreated < NEW_ISLAND_MAX_GOLEMS) {
                                golemsCreated += 1;
                                newWorld.addUnit(new Golem(x, y));
                            }
                        }
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
        listenActionKeys(game);

        // Render.
        stage.update();
    }
}
