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
    this.cells = []
    for (var x = 0; x < width; ++x) {
        this.cells[x] = []
        for (var y = 0; y < height; ++y) {
            this.cells[x][y] = new Cell("W");
        }
    }
    this.cells[width / 2][height / 2] = new Cell("G");
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

function simpleMap(stage) {
    var map = new Map(10, 10);
    var mapContainer = new createjs.Container();
    for (var x = 0; x < map.width; ++x) {
        for (var y = 0; y < map.height; ++y) {
            shape = map.cells[x][y].shape;
            iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
            shape.x = iso.x;
            shape.y = iso.y;
            mapContainer.addChild(shape);
        }
    }
    mapContainer.x = 200;
    mapContainer.y = 300;
    stage.addChild(mapContainer);
    isometricToCartesian(0, 0);
}
