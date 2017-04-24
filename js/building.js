var BUILDING_FORT = {name: "Fort", type: Fort};

Building.prototype = Object.create(Unit.prototype);
function Building(x, y, view, type) {
    Unit.call(this, x, y, view, type);
}

Fort.prototype = Object.create(Building.prototype);
function Fort(x, y) {
    var shape = new createjs.Shape();
    shape.graphics.beginFill("grey");
    drawTile(shape);
    var view = shape;
    // var view = new createjs.Sprite(assets.resourcesSpriteSheet, "tree");
    // var view = new createjs.Sprite(assets.spriteSheet, "fort");
    Building.call(this, x, y, view, UNIT_FORT);
}

Fort.prototype.requirements = [
    [ITEM_STONES, 1]
]
