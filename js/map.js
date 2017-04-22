var CELL_SIZE = 64;

function Cell(type) {
    this.type = type;
    this.shape = new createjs.Shape();
    gfx = this.shape.graphics;
    if (type == "W") {
        gfx.beginFill("blue");
    } else if (type == "G") {
        gfx.beginFill("green");
    } else {
        gfx.beginFill("black");
    }
    gfx.moveTo(0, CELL_SIZE / 2).lineTo(CELL_SIZE, CELL_SIZE).lineTo(CELL_SIZE * 2, CELL_SIZE / 2).lineTo(CELL_SIZE, 0);
}

function Map(width, height) {
    this.width = width;
    this.height = height;
    this.cells = [];
    this.units = [];
    this.container = new createjs.Container();
    
    var level = GenerateIsland(width, height, 10);
    
    for (var x = 0; x < width; ++x) {
        this.cells.push([]);
        for (var y = 0; y < height; ++y) {
            if (level[x][y]) {
                this.cells[x].push(new Cell("G"));
            } else {
                this.cells[x].push(new Cell("W"));
            }
            shape = this.cells[x][y].shape;
            iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
            shape.x = iso.x - CELL_SIZE;
            shape.y = iso.y;
            this.container.addChild(shape);
        }
    }
}

Map.prototype.addUnit = function(unit) {
    this.units.push(unit);
    this.container.addChild(unit.view);
    iso = cartesianToIsometric(unit.x * CELL_SIZE, unit.y * CELL_SIZE);
    unit.view.x = iso.x;
    unit.view.y = iso.y;
    console.log(unit.view);
}

Map.prototype.transformToWater = function(x, y) {
    console.log("Transforming (" + x + ", " + y + ") to water.");
    var oldShape = this.cells[x][y].shape;
    var oldShapeIndex = this.container.getChildIndex(oldShape);

    var newCell = new Cell("W");
    var newShape = newCell.shape;
    newShape.x = oldShape.x;
    newShape.y = oldShape.y;

    this.container.addChildAt(newCell.shape, oldShapeIndex);
    this.cells[x][y] = newCell;

    var container = this.container
    createjs.Tween.get(oldShape)
        .to({alpha : 0}, 1000)
        .call(function() { container.removeChild(oldShape); });
}

Map.prototype.cellIsValid = function(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
}

Map.prototype.cellIsWater = function (x, y) {
    return this.cells[x][y].type == "W";
}

Map.prototype.cellIsLand = function (x, y) {
    return this.cells[x][y].type == "G";
}

Map.prototype.cellIsBorder = function (x, y) {
    var dirs = [
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 0, y: -1 }
    ];

    for (var d = 0; d < 4; ++d) {
        var nx = x + dirs[d].x;
        var ny = y + dirs[d].y;
        if (!this.cellIsValid(nx, ny) || this.cellIsWater(nx, ny)) {
            return true;
        }
    }
    return false;
}

function Point(x, y) {
    this.x = x;
    this.y = y;
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

function simpleMap() {
    var map = new Map(10, 10);
    map.container.x = 400;
    map.container.y = 300;
    return map;
}

function getBorderCells(map) {
    var borderCells = [];
    for (var x = 0; x < map.width; ++x) {
        for (var y = 0; y < map.height; ++y) {
            if (map.cellIsLand(x, y) && map.cellIsBorder(x, y)) {
                borderCells.push({x: x, y: y})
            }
        }
    }
    return borderCells;
}

function pickRandomBorderCell(map) {
    var borderCells = getBorderCells(map);
    if (borderCells.length == 0) {
        return null;
    }
    var id = getRandomInt(0, borderCells.length);
    return borderCells[id];
}
