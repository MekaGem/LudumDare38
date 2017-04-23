function Unit(x, y, view) {
    this.x = x;
    this.y = y;
    this.view = view;
}

Tree.prototype = Object.create(Unit.prototype);
function Tree(x, y, spriteSheet) {
    var view = new createjs.Sprite(spriteSheet, "tree");
    Unit.call(this, x, y, view);
}

Rock.prototype = Object.create(Unit.prototype);
function Rock(x, y, spriteSheet) {
    var view = new createjs.Sprite(spriteSheet, "rock");
    Unit.call(this, x, y, view);
}

Human.prototype = Object.create(Unit.prototype);
function Human(x, y, spriteSheet) {
    var view = new createjs.Sprite(spriteSheet, "walk_nw");
    this.currentDestination = new Point(x, y);
    this.finalDestinationCell = new Point(x, y);
    this.stepLength = 2;
    Unit.call(this, x, y, view);
}

// returns shift direction in cartesian coordinates.
Human.prototype.getShiftDirection = function(world) {
    var cartesianOrigin = isometricToCartesian(this.view.x, this.view.y);
    var cartesianDestination = new Point(this.currentDestination.x * CELL_SIZE, this.currentDestination.y * CELL_SIZE);
    var delta = new Point(cartesianDestination.x - cartesianOrigin.x,
        cartesianDestination.y - cartesianOrigin.y);
    var answer = new Point(0, 0);
    if (Math.abs(delta.x) > this.stepLength) {
        answer.x = Math.round(delta.x / Math.abs(delta.x)) * this.stepLength;
    } else if (Math.abs(delta.y) > this.stepLength) {
        answer.y = Math.round(delta.y / Math.abs(delta.y)) * this.stepLength;
    }

    if (answer.x == 0 && answer.y == 0) {
        // we have reached previous destination point.
        var currentCell = new Point(Math.round(cartesianOrigin.x / CELL_SIZE),
            Math.round(cartesianOrigin.y / CELL_SIZE));
        var route = findPath(world,
            currentCell.x,
            currentCell.y,
            this.finalDestinationCell.x,
            this.finalDestinationCell.y);
        if (route.length > 1) {
            // there is still some distance to go.
            this.currentDestination = new Point(route[1][0], route[1][1]);
        }
        console.log("Human changed his next destination cell to: ("
            + this.currentDestination.x +  ", " + this.currentDestination.y + ")");
    }
    return answer;
}

Human.prototype.setFinalDestinationCell = function(cell) {
    this.finalDestinationCell = cell;
}
