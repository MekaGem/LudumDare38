var CELL_SIZE = 64;
var START_CELL_HP = 100;
var DEFAULT_WATER_DAMAGE = 20;
var CELL_TYPE_WATER = "W";
var CELL_TYPE_GRASS = "G";
var FORT_HP = 50;
var FORT_PROTECTION = 10;
var FORT_HP_BOOST = 20;
var INF_HP = 10000000;

var DIRS = [
    {x: 1, y: 0},  // down right (SE)
    {x: 0, y: 1},  // down left (SW)
    {x: -1, y: 0}, // up left (NW)
    {x: 0, y: -1}  // up right (NE)
];

var DIR_SUFFIX = [
    "se",
    "sw",
    "nw",
    "ne"
];

function drawTile(shape) {
    var gfx = shape.graphics;
    gfx.moveTo(0, CELL_SIZE / 2);
    gfx.lineTo(CELL_SIZE, CELL_SIZE);
    gfx.lineTo(CELL_SIZE * 2, CELL_SIZE / 2);
    gfx.lineTo(CELL_SIZE, 0);
    gfx.lineTo(0, CELL_SIZE / 2);
    shape.regX = CELL_SIZE;
}

function Cell(type) {
    this.type = type;
    this.maximumHp = START_CELL_HP;
    this.hp = this.maximumHp;
    this.fortHP = 0;
    this.vel = 0;
    this.offset = 0;
    this.container = new createjs.Container();

    this.view = new createjs.Shape();
    if (type == CELL_TYPE_WATER) {
        this.view = new createjs.Sprite(assets.resourcesSpriteSheet, "water");
    } else if (type == CELL_TYPE_GRASS) {
        this.view = new createjs.Sprite(assets.resourcesSpriteSheet, "grass");
    } else {
        var gfx = this.view.graphics;
        gfx.beginFill("black");
        drawTile(this.view);
    }
    this.container.addChild(this.view);
}

Cell.prototype.updateAlpha = function() {
    this.container.alpha = Math.min(this.maximumHp, this.hp + this.fortHP) / this.maximumHp;
}

Cell.prototype.takeDamage = function(damage) {
    if (this.fortHP > 0) {
        var fortDamage = Math.min(Math.min(FORT_PROTECTION, damage), this.fortHP);
        this.fortHP -= fortDamage;
        if (this.fortHP == 0) {
            this.view.gotoAndPlay("grass");
        }
        damage -= fortDamage;
    }
    this.hp = Math.max(0, this.hp - damage);
    this.updateAlpha();
}

Cell.prototype.isAlive = function () {
    return this.hp > 0;
}

Cell.prototype.fortify = function() {
    this.fortHP = FORT_HP;
    this.hp = Math.min(this.hp + FORT_HP_BOOST, this.maximumHp);
    this.updateAlpha();
    this.view.gotoAndPlay("kamushki_border");
}

Cell.prototype.makeFloating = function() {
    this.hp = INF_HP;
    this.maximumHp = INF_HP;
    this.updateAlpha();
    this.container.alpha = 1;
    this.type = CELL_TYPE_GRASS;
    var oldView = this.view;
    var newView = new createjs.Sprite(assets.raftSpriteSheet, "raft");
    this.container.addChildAt(newView, 0);
    this.container.removeChild(oldView);
}

function Map(width, height) {
    this.container = new createjs.Container();

    this.waterContainer = null;
    this.updateWater(width, height);

    this.worlds = [];
    this.worldsContainer = new createjs.Container();
    this.container.addChild(this.worldsContainer);
}

Map.prototype.updateWater = function(width, height) {
    this.container.removeChild(this.waterContainer);

    this.width = width;
    this.height = height;
    this.cells = [];
    this.waterContainer = new createjs.Container();
    for (var x = 0; x < width; ++x) {
        this.cells.push([]);
        for (var y = 0; y < height; ++y) {
            this.cells[x].push(new Cell(CELL_TYPE_WATER));
            var view = this.cells[x][y].container;
            var iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
            view.x = iso.x;
            view.y = iso.y;
            this.waterContainer.addChild(view);
        }
    }
    var sx = width * CELL_SIZE;
    var sy = height * CELL_SIZE;
    this.waterContainer.cache(-sy, 0, sx + sy, (sx + sy) / 2.);
    this.container.addChildAt(this.waterContainer, 0);
}

Map.prototype.addWorld = function(world) {
    this.worlds.push(world);
    this.worldsContainer.addChild(world.container);
    updateContainerPos(world);
}

function World(width, height, x, y, k) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.cells = [];
    this.units = [];
    this.container = new createjs.Container();

    var level = GenerateIsland(width, height, k);

    this.tilesContainer = new createjs.Container();
    for (var x = 0; x < width; ++x) {
        this.cells.push([]);
        for (var y = 0; y < height; ++y) {
            if (level[x][y]) {
                this.cells[x].push(new Cell(CELL_TYPE_GRASS));
                var view = this.cells[x][y].container;
                var iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
                view.x = iso.x;
                view.y = iso.y;
                this.tilesContainer.addChild(view);
            } else {
                this.cells[x].push(new Cell(CELL_TYPE_WATER));
            }
        }
    }
    this.container.addChild(this.tilesContainer);

    this.unitsContainer = new createjs.Container();
    this.container.addChild(this.unitsContainer);

    this.selectionContainer = new createjs.Container();
    this.container.addChild(this.selectionContainer);

    this.selectionCallback = null;
}

World.prototype.addShapeToTilesContainer = function(shape, x, y) {
    var iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
    shape.x = iso.x;
    shape.y = iso.y;
    this.tilesContainer.addChild(shape);
}

World.prototype.getCenter = function() {
    var x = (this.x + this.width / 2.) * CELL_SIZE;
    var y = (this.y + this.height / 2.) * CELL_SIZE;
    return cartesianToIsometric(x, y);
}

World.prototype.addUnit = function(unit) {
    this.units.push(unit);
    this.unitsContainer.addChild(unit.container);
    updateContainerPos(unit);
}

World.prototype.removeUnitByIndex = function(index) {
    var unit = this.units[index];
    if (unit.wasTaken) {
        var _this = this;
        createjs.Tween.get(this.units[index].container).to({alpha: 0}, 200).call(function() {
            _this.unitsContainer.removeChild(unit.container);
        });
    } else {
        this.unitsContainer.removeChild(unit.container);
    }
    this.units[index].hp = 0;
    this.units.splice(index, 1);
}

World.prototype.removeUnitsInCell = function(x, y) {
    for (var i = 0; i < this.units.length;) {
        if (this.units[i].x == x && this.units[i].y == y) {
            this.removeUnitByIndex(i);
        } else {
            ++i;
        }
    }
}

World.prototype.removeUnit = function(unit) {
    console.log("Removing unit " + unit.x + " " + unit.y + " " + unit.type);
    for (var i = 0; i < this.units.length;) {
        if (this.units[i].x == unit.x &&
            this.units[i].y == unit.y &&
            this.units[i].type == unit.type) {
            this.removeUnitByIndex(i);
        } else {
            ++i;
        }
    }
}

World.prototype.damageWithWater = function(x, y) {
    //console.log("Transforming (" + x + ", " + y + ") to water.");
    var oldCell = this.cells[x][y];
    var oldShape = oldCell.shape;

    oldCell.takeDamage(DEFAULT_WATER_DAMAGE);
    if (oldCell.isAlive()) {
        return;
    }

    this.cells[x][y] = new Cell(CELL_TYPE_WATER);
    this.removeUnitsInCell(x, y);
    this.tilesContainer.removeChild(oldShape);
}

World.prototype.cellIsValid = function(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
}

World.prototype.cellIsWater = function(x, y) {
    if (!this.cellIsValid(x, y)) {
        return true;
    }
    return this.cells[x][y].type == CELL_TYPE_WATER;
}

World.prototype.cellIsLand = function(x, y) {
    if (!this.cellIsValid(x, y)) {
        return false;
    }
    return this.cells[x][y].type == CELL_TYPE_GRASS;
}

World.prototype.cellIsPassable = function(x, y) {
    if (!this.cellIsValid(x, y) || this.cellIsWater(x, y)) return false;
    return !this.cellContainsUnit(x, y, UNIT_TREE) && !this.cellContainsUnit(x, y, UNIT_GOLEM);
}

World.prototype.getUnitFromCell = function(x, y) {
    for (var i = 0; i < this.units.length; ++i) {
        if (this.units[i].x == x && this.units[i].y == y) {
            return this.units[i];
        }
    }
    return null;
}

World.prototype.cellContainsUnit = function (x, y, unitType) {
    var unit = this.getUnitFromCellByType(x, y, unitType);
    return (unit != null) ? true : false;
}

World.prototype.getUnitFromCellByType = function(x, y, unitType) {
    for (var i = 0; i < this.units.length; ++i) {
        if (this.units[i].x == x && this.units[i].y == y && this.units[i].type == unitType) {
            return this.units[i];
        }
    }
    return null;
}

World.prototype.cellIsBorder = function(x, y) {
    if (!this.cellIsValid(x, y)) {
        return false;
    }
    for (var d = 0; d < 4; ++d) {
        var nx = x + DIRS[d].x;
        var ny = y + DIRS[d].y;
        if (!this.cellIsValid(nx, ny) || this.cellIsWater(nx, ny) || this.cells[nx][ny].maximumHp == INF_HP) {
            return true;
        }
    }
    return false;
}

World.prototype.cellIsWaterNearLand = function (x, y) {
    if (!this.cellIsWater(x, y)) {
        return false;
    }
    for (var d = 0; d < 4; ++d) {
        var nx = x + DIRS[d].x;
        var ny = y + DIRS[d].y;
        if (this.cellIsLand(nx, ny)) {
            return true;
        }
    }
    return false;
}

World.prototype.cellIsCutVertex = function(x, y) {
    if (!this.cellIsValid(x, y)) {
        return false;
    }
    var neighbor;
    for (var d = 0; d < 4; ++d) {
        var nx = x + DIRS[d].x;
        var ny = y + DIRS[d].y;
        if (this.cellIsValid(nx, ny) && !this.cellIsWater(nx, ny)) {
            neighbor = {x: nx, y: ny};
            break;
        }
    }

    if (!neighbor) return false;

    var visited = [];
    for (var xx = 0; xx < this.width; xx++) visited[xx] = [];
    visited[neighbor.x][neighbor.y] = true;
    var q = [neighbor];
    while (q.length > 0) {
        var pos = q.shift();

        for (var d = 0; d < 4; d++) {
            var npos = {x: pos.x + DIRS[d].x, y: pos.y + DIRS[d].y};
            if ((npos.y != y || npos.x != x) && this.cellIsValid(npos.x, npos.y) && !this.cellIsWater(npos.x, npos.y) && !visited[npos.x][npos.y]) {
                visited[npos.x][npos.y] = true;
                q.push(npos);
            }
        }
    }

    var cutVertex = false;
    for (var d = 0; d < 4; d++) {
        var nx = x + DIRS[d].x;
        var ny = y + DIRS[d].y;
        if (this.cellIsValid(nx, ny) && !this.cellIsWater(nx, ny) && !visited[nx][ny]) {
            cutVertex = true;
            break;
        }
    }

    return cutVertex;
}

World.prototype.cellIsSelectable = function(x, y) {
    return this.cellIsWaterNearLand(x, y) || this.cellIsLand(x, y);
}

var MAX_TILE_OFFSET = 3;
var MAX_TILE_VEL = 0.1;
var TILE_VEL_D = 0.01;
World.prototype.shakeTiles = function() {
    for (var x = 0; x < this.width; x++) {
        for (var y = 0; y < this.height; y++) {
            if (!this.cellIsLand(x, y)) continue;

            var cell = this.cells[x][y];
            var view = cell.container;
            cell.vel += (Math.random() * 2 - 1) * TILE_VEL_D;
            cell.vel = clamp(cell.vel, -MAX_TILE_VEL, MAX_TILE_VEL);
            cell.offset += cell.vel;
            cell.offset = clamp(cell.offset, -MAX_TILE_OFFSET, MAX_TILE_OFFSET);
            var iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
            view.y = iso.y + cell.offset;
        }
    }

    for (var i = 0; i < this.units.length; i++) {
        var unit = this.units[i];
        if (!this.cellIsValid(unit.x, unit.y)) continue;
        if (!unitIsStatic(unit.type)) continue;

        var iso = cartesianToIsometric(unit.x * CELL_SIZE, unit.y * CELL_SIZE);
        unit.container.y = iso.y + this.cells[unit.x][unit.y].offset;
    }
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype.toString = function() {
    return "(" + this.x + ", " + this.y + ")";
}

function cartesianToIsometric(cX, cY) {
    var isoX = cX - cY;
    var isoY = (cX + cY) / 2
    return new Point(isoX, isoY);
}

function isometricToCartesian(isoX, isoY) {
    var cX = (2 * isoY + isoX) / 2;
    var cY = (2 * isoY - isoX) / 2;
    return new Point(cX, cY);
}

// Object with container
function updateContainerPos(object) {
    var iso = cartesianToIsometric(object.x * CELL_SIZE, object.y * CELL_SIZE);
    object.container.x = iso.x;
    object.container.y = iso.y;
}

function getBorderCells(world) {
    var borderCells = [];

    var center = {x: (world.width - 1) / 2, y: (world.height - 1) / 2};

    for (var x = 0; x < world.width; ++x) {
        for (var y = 0; y < world.height; ++y) {
            if (world.cellIsLand(x, y) && world.cellIsBorder(x, y) && !world.cellIsCutVertex(x, y) && !(world.cells[x][y].maximumHp == INF_HP)) {
                var dist = Math.abs(x - center.x) + Math.abs(y - center.y);
                borderCells.push({x: x, y: y, dist: dist})
            }
        }
    }
    return borderCells;
}

function pickRandomBorderCell(world) {
    var borderCells = getBorderCells(world);
    if (borderCells.length == 0) {
        return null;
    }

    borderCells.sort(function(a, b){return b.dist - a.dist});

    var id = getRandomInt(0, Math.ceil(borderCells.length / 3));
    return borderCells[id];
}

function canBuildBuilding(world, inventory, building) {
    if (building.name == BUILDING_FORT.name) {
        if (!world.cellIsLand(building.x, building.y)) {
            return false;
        }
    } else if (building.name == BUILDING_RAFT.name) {
        if (!world.cellIsWaterNearLand(building.x, building.y)) {
            return false;
        }
    }
    return inventory.hasEnoughResources(building.requirements);
}

function tryCreateBuilding(world, inventory, building) {
    if (!canBuildBuilding(world, inventory, building)) {
        return false;
    }
    inventory.takeResources(building.requirements);
    world.addUnit(building);
    return true;
}
