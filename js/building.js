var FORT_STONE_COST = 1;
var RAFT_WOOD_COST = 1;

var BUILDING_FORT = {name: "Fort", type: Fort, buildingTime: 10000};
var BUILDING_RAFT = {name: "Raft", type: Raft, buildingTime: 3000};

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

function FortBuildingBar() {
    var container = new createjs.Container();
    var text = new createjs.Text("F", "20px Arial", "#ff7700");
    var view = new createjs.Sprite(assets.resourcesSpriteSheet, "kamushki");
    container.addChild(text);
    view.scaleX = 0.5;
    view.scaleY = 0.5;
    view.x += view.getBounds().width / 2;
    container.addChild(view);
    return container;
}

Raft.prototype = Object.create(Building.prototype);
function Raft(x, y, world) {
    var view = new createjs.Sprite(assets.raftSpriteSheet, "raft");
    view.alpha = 0.5;
    var _this = this;
    var onBuild = function() {
        console.log(_this.x + " " + _this.y);
        world.removeUnit(_this);

        world.cells[_this.x][_this.y] = new Cell(CELL_TYPE_GRASS);
        var newView = world.cells[_this.x][_this.y].container;
        var iso = cartesianToIsometric(_this.x * CELL_SIZE, _this.y * CELL_SIZE);
        newView.x = iso.x;
        newView.y = iso.y;
        world.tilesContainer.addChild(newView);

        world.cells[_this.x][_this.y].makeFloating();
        _this.progressBar.turnOff();
    }
    Building.call(this, x, y, view, UNIT_RAFT, BUILDING_RAFT.buildingTime, onBuild);
}

Raft.prototype.requirements = [
    [ITEM_WOOD, RAFT_WOOD_COST]
]

Raft.prototype.name = BUILDING_RAFT.name

function RaftBuildingBar() {
    var container = new createjs.Container();
    var text = new createjs.Text("R", "20px Arial", "#ff7700");
    var view = new createjs.Sprite(assets.raftSpriteSheet, "raft");
    container.addChild(text);
    view.scaleX = 0.5;
    view.scaleY = 0.5;
    view.x += view.getBounds().width / 2;
    container.addChild(view);
    return container;
}

