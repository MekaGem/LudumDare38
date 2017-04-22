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