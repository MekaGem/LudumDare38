var CELL_SIZE = 64;
var START_CELL_HP = 100;
var DEFAULT_WATER_DAMAGE = 50;

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
    this.shape = new createjs.Shape();
    this.maximumHp = START_CELL_HP;
    this.hp = this.maximumHp;
    if (type == "W") {
        this.shape = new createjs.Sprite(assets.resourcesSpriteSheet, "water");
    } else if (type == "G") {
        this.shape = new createjs.Sprite(assets.resourcesSpriteSheet, "grass");
    } else {
        var gfx = this.shape.graphics;
        gfx.beginFill("black");
        drawTile(this.shape);
    }
}

Cell.prototype.takeDamage = function(damage) {
    this.hp = Math.max(0, this.hp - damage);
    this.shape.alpha = this.hp / this.maximumHp;
}

Cell.prototype.isAlive = function () {
    return this.hp > 0;
}

function Map(width, height) {
    this.width = width;
    this.height = height;
    this.cells = [];
    this.worlds = [];
    this.container = new createjs.Container();

    var waterContainer = new createjs.Container();
    for (var x = 0; x < width; ++x) {
        this.cells.push([]);
        for (var y = 0; y < height; ++y) {
            this.cells[x].push(new Cell("W"));
            var shape = this.cells[x][y].shape;
            var iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
            shape.x = iso.x;
            shape.y = iso.y;
            waterContainer.addChild(shape);
        }
    }
    var sx = width * CELL_SIZE;
    var sy = height * CELL_SIZE;
    waterContainer.cache(-sy, 0, sx + sy, (sx + sy) / 2.);
    this.container.addChild(waterContainer);

    this.worldsContainer = new createjs.Container();
    this.container.addChild(this.worldsContainer);
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
                this.cells[x].push(new Cell("G"));
                var shape = this.cells[x][y].shape;
                var iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
                shape.x = iso.x;
                shape.y = iso.y;
                this.tilesContainer.addChild(shape);
            } else {
                this.cells[x].push(new Cell("W"));
            }
        }
    }
    this.container.addChild(this.tilesContainer);

    this.selectionContainer = new createjs.Container();
    this.container.addChild(this.selectionContainer);

    this.selectionCallback = null;

    this.unitsContainer = new createjs.Container();
    this.container.addChild(this.unitsContainer);
}

World.prototype.getCenter = function() {
    var x = (this.x + this.width / 2.) * CELL_SIZE;
    var y = (this.y + this.height / 2.) * CELL_SIZE;
    return cartesianToIsometric(x, y);
}

World.prototype.addUnit = function(unit) {
    this.units.push(unit);
    this.unitsContainer.addChild(unit.view);
    updateViewPos(unit);
}

World.prototype.removeUnitByIndex = function(index) {
    //console.log("Removing: " + index);
    this.unitsContainer.removeChild(this.units[index].view);
    this.units.splice(index, 1);
}

World.prototype.removeUnit = function(unit) {
    for (var i = 0; i < this.units.length; i++) {
        if (this.units[i] == unit) {
            this.removeUnitByIndex(i);
            break;
        }
    }
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
    var container = this.tilesContainer;
    var oldCell = this.cells[x][y];
    var oldShape = oldCell.shape;

    oldCell.takeDamage(DEFAULT_WATER_DAMAGE);
    if (oldCell.isAlive()) {
        return;
    }
    this.cells[x][y] = new Cell("W");

    var world = this;
    world.removeUnitsInCell(x, y);
    container.removeChild(oldShape);
}

World.prototype.cellIsValid = function(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
}

World.prototype.cellIsWater = function(x, y) {
    return this.cells[x][y].type == "W";
}

World.prototype.cellIsLand = function(x, y) {
    return this.cells[x][y].type == "G";
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
    for (var d = 0; d < 4; ++d) {
        var nx = x + DIRS[d].x;
        var ny = y + DIRS[d].y;
        if (!this.cellIsValid(nx, ny) || this.cellIsWater(nx, ny)) {
            return true;
        }
    }
    return false;
}

World.prototype.cellIsCutVertex = function(x, y) {
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
    return this.cellIsValid(x, y);
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

// Object with view
function updateViewPos(object) {
    var iso = cartesianToIsometric(object.x * CELL_SIZE, object.y * CELL_SIZE);
    object.view.x = iso.x;
    object.view.y = iso.y;
}

function getBorderCells(world) {
    var borderCells = [];

    var center = {x: (world.width - 1) / 2, y: (world.height - 1) / 2};

    for (var x = 0; x < world.width; ++x) {
        for (var y = 0; y < world.height; ++y) {
            if (world.cellIsLand(x, y) && world.cellIsBorder(x, y) && !world.cellIsCutVertex(x, y)) {
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
