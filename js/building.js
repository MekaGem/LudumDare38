var FORT_STONE_COST = 1;
var RAFT_WOOD_COST = 0;

var BUILDING_FORT = {name: "Fort", type: Fort, buildingTime: 10000};
var BUILDING_RAFT = {name: "Raft", type: Raft, buildingTime: 10000};

Building.prototype = Object.create(Unit.prototype);
function Building(x, y, view, type, buildingTime, onBuild) {
    Unit.call(this, x, y, view, type);
    this.progressBar = new ProgressBar("building_bubble");
    this.progressBar.turnOn(this.container, onBuild, buildingTime);
}

Fort.prototype = Object.create(Building.prototype);
function Fort(x, y, world) {
    var view = new createjs.Sprite(assets.resourcesSpriteSheet, "kamushki");
    view.alpha = 0.5;
    var _this = this;
    var onBuild = function() {
        world.cells[_this.x][_this.y].fortify();
        world.removeUnit(_this);
        _this.progressBar.turnOff();
    }
    Building.call(this, x, y, view, UNIT_FORT, BUILDING_FORT.buildingTime, onBuild);
}

Fort.prototype.requirements = [
    [ITEM_STONES, FORT_STONE_COST]
]

Fort.prototype.name = BUILDING_FORT.name

Raft.prototype = Object.create(Building.prototype);
function Raft(x, y, world) {
    var view = new createjs.Sprite(assets.raftSpriteSheet, "raft");
    view.alpha = 0.5;
    var _this = this;
    var onBuild = function() {
        world.cells[_this.x][_this.y].makeFloating();
        world.removeUnit(_this);
        _this.progressBar.turnOff();
    }
    Building.call(this, x, y, view, UNIT_RAFT, BUILDING_RAFT.buildingTime, onBuild);
}

Raft.prototype.requirements = [
    [ITEM_WOOD, RAFT_WOOD_COST]
]

Raft.prototype.name = BUILDING_RAFT.name
