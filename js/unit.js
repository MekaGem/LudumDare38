function Unit(x, y, view) {
    this.x = x;
    this.y = y;
    this.view = view;
}

Tree.prototype = Object.create(Unit.prototype);
function Tree(x, y, spriteSheet) {
    var view = new createjs.Sprite(spriteSheet, "stand");
    view.regX = 32;
    view.regY = 32;
    Unit.call(this, x, y, view);
}
