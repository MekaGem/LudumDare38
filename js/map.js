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
        this.cells[x] = [];
        for (var y = 0; y < height; ++y) {
            if (level[x][y]) {
                this.cells[x][y] = new Cell("W");
                shape = this.cells[x][y].shape;
                iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
                shape.x = iso.x - CELL_SIZE;
                shape.y = iso.y;
                this.container.addChild(shape);
            }
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
