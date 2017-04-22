var CELL_SIZE = 64;

var DIRS = [
    {x: 1, y: 0},  // down right (SE)
    {x: 0, y: 1},  // down left (SW)
    {x: -1, y: 0}, // up left (NW)
    {x: 0, y: -1}  // up right (NE)
];

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

function isPassable(cell) {
    if (cell.type == "G") {
        return true;
    } else {
        return false;
    }
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
}

Map.prototype.removeUnitsInCell = function(x, y) {
    for (var i = 0; i < this.units.length; ++i) {
        if (this.units[i].x == x && this.units[i].y == y) {
            console.log("Removing: " + i);
            this.container.removeChild(this.units[i].view);
            this.units.splice(i, 1);
        }
    }
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

    var map = this;
    createjs.Tween.get(oldShape)
        .to({alpha : 0}, 1000)
        .call(function() { map.removeUnitsInCell(x, y); });
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
    for (var d = 0; d < 4; ++d) {
        var nx = x + DIRS[d].x;
        var ny = y + DIRS[d].y;
        if (!this.cellIsValid(nx, ny) || this.cellIsWater(nx, ny)) {
            return true;
        }
    }
    return false;
}

Map.prototype.cellIsCutVertex = function (x, y) {
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
    
    var center = {x: (map.width - 1) / 2, y: (map.height - 1) / 2};
    
    for (var x = 0; x < map.width; ++x) {
        for (var y = 0; y < map.height; ++y) {
            if (map.cellIsLand(x, y) && map.cellIsBorder(x, y) && !map.cellIsCutVertex(x, y)) {
                var dist = Math.abs(x - center.x) + Math.abs(y - center.y);
                borderCells.push({x: x, y: y, dist: dist})
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
    
    borderCells.sort(function(a, b){return b.dist - a.dist});
    console.log(borderCells);
    
    var id = getRandomInt(0, Math.ceil(borderCells.length / 3));
    return borderCells[id];
}
