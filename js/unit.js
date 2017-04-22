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
    var view = new createjs.Sprite(spriteSheet, "walk");
    view.regX = 32;
    view.regY = 32;
    this.isoDestinationX = x;
    this.isoDestinationY = y;
    this.stepLength = 2;
    Unit.call(this, x, y, view);
}

// returns shift direction in cartesian coordinates.
Human.prototype.getShiftDirection = function() {
    cartesianOrigin = isometricToCartesian(this.view.x, this.view.y);
    cartesianDestination = isometricToCartesian(this.isoDestinationX, this.isoDestinationY);
    delta = new Point(cartesianDestination.x - cartesianOrigin.x,
        cartesianDestination.y - cartesianOrigin.y);
    answer = new Point(0, 0);
    if (Math.abs(delta.x) > this.stepLength) {
        answer.x = Math.round(delta.x / Math.abs(delta.x)) * this.stepLength;
    } else if (Math.abs(delta.y) > this.stepLength) {
        answer.y = Math.round(delta.y / Math.abs(delta.y)) * this.stepLength;
    }
    return answer;
}
