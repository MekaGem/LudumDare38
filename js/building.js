var BUILDING_FORT = {name: "Fort", type: Fort};

Building.prototype = Object.create(Unit.prototype);
function Building(x, y, view, type, buildingTime) {
    Unit.call(this, x, y, view, type);
    this.onBuildCallback = null;
    this.buildingTime = buildingTime;
    this.buildingProgress = 0;
}

Building.prototype.buildTick = function(world) {
    if (this.buildingProgress < this.buildingTime) {
        this.buildingProgress += 1;
        if (this.buildingProgress == this.buildingTime) {
            world.cells[this.x][this.y].fortify();
            world.removeUnit(this);
        }
    }
}

Fort.prototype = Object.create(Building.prototype);
function Fort(x, y) {
    var view = new createjs.Sprite(assets.resourcesSpriteSheet, "kamushki");
    view.alpha = 0.5;
    Building.call(this, x, y, view, UNIT_FORT, 10);
}

Fort.prototype.requirements = [
    [ITEM_STONES, 1]
]
