var TREE_MAX_HP = 200;
var GOLEM_MAX_HP = 100;
var HUMAN_MAX_HP = 100;
var TREE_CUTTING_TIME = 3000; // 3 seconds.
var FISHING_TIME = 6000; // 6 seconds.
var HUMAN_GOLEM_DAMATE = 20;

function Unit(x, y, view, type) {
    this.x = x;
    this.y = y;
    this.view = view;
    this.view.unit = this;
    this.type = type;
}

function withDefaultValue(v, default_) {
    if (typeof v === 'undefined') {
        v = default_;
    }
    return v;
}

Unit.prototype.gotoDirAnim = function(anim, refresh) {
    refresh = withDefaultValue(refresh, false);
    var newAnim = anim + "_" + DIR_SUFFIX[this.dir];
    if (refresh || this.view.currentAnimation != newAnim) {
        this.view.gotoAndPlay(newAnim);
    }
}

Unit.prototype.takeDamage = function(damage) {
    this.hp = Math.max(0, this.hp - damage);
}

Unit.prototype.isAlive = function () {
    return this.hp > 0;
}

// Unit types
var UNIT_TREE = "TREE";
var UNIT_ROCK = "ROCK";
var UNIT_BUSH = "BUSH";
var UNIT_HUMAN = "HUMAN";
var UNIT_GOLEM = "GOLEM";
var UNIT_PROGRESS_BAR = "PROGRESS_BAR";
var UNIT_FORT = "FORT";

function unitIsStatic(unitType) {
    return unitType == UNIT_TREE ||
           unitType == UNIT_ROCK ||
           unitType == UNIT_BUSH ||
           unitType == UNIT_FORT;
}

function compareUnitViews(a, b) {
    if (a.unit.type == UNIT_FORT && b.unit.type != UNIT_FORT) return -1;
    if (a.unit.type != UNIT_FORT && b.unit.type == UNIT_FORT) return 1;
    if (a.y != b.y) return a.y - b.y;
    if (a.unit.type != b.unit.type) {
        if (a.unit.type == UNIT_BUSH) return 1;
        if (b.unit.type == UNIT_BUSH) return -1;
        if (a.unit.type == UNIT_GOLEM) return 1;
        if (b.unit.type == UNIT_GOLEM) return -1;
    }
    return 0;
}

Tree.prototype = Object.create(Unit.prototype);
function Tree(x, y) {
    this.hp = TREE_MAX_HP;
    var view = new createjs.Sprite(assets.resourcesSpriteSheet, "tree");
    Unit.call(this, x, y, view, UNIT_TREE);
}

Rock.prototype = Object.create(Unit.prototype);
function Rock(x, y) {
    var view = new createjs.Sprite(assets.resourcesSpriteSheet, "rock");
    Unit.call(this, x, y, view, UNIT_ROCK);
}

Bush.prototype = Object.create(Unit.prototype);
function Bush(x, y) {
    var view = new createjs.Sprite(assets.resourcesSpriteSheet, "bush");
    Unit.call(this, x, y, view, UNIT_BUSH);
    this.berriesMaxGrowth = this.generateGrowthTime();
    this.berriesGrown = getRandomInt(0, this.berriesMaxGrowth);
}

Bush.prototype.generateGrowthTime = function() {
    return 45 + getRandomInt(0, 45);
}

Bush.prototype.hasBerries = function() {
    return this.berriesGrown == this.berriesMaxGrowth;
}

Bush.prototype.pickBerries = function() {
    this.view.gotoAndPlay("bush");
    this.berriesGrown = 0;
    this.berriesMaxGrowth = this.generateGrowthTime();
}

Bush.prototype.growBerries = function() {
    this.berriesGrown = Math.min(this.berriesGrown + 1, this.berriesMaxGrowth);
    if (this.hasBerries()) {
        this.view.gotoAndPlay("bush_with_berries");
    }
}

Human.prototype = Object.create(Unit.prototype);
function Human(x, y) {
    var view = new createjs.Sprite(assets.humanSpriteSheet, "idle_se");
    Unit.call(this, x, y, view, UNIT_HUMAN);
    this.view.regY -= CELL_SIZE / 4.;

    this.hp = HUMAN_MAX_HP;
    this.dir = 0;
    this.currentDestination = null;
    this.finalDestination = null;
    this.treeCuttingTime = TREE_CUTTING_TIME; // 3 seconds.
    this.golemDamage = HUMAN_GOLEM_DAMATE;
    this.fishingTime = FISHING_TIME;
    this.stepOnCellCallback = null;
    this.progressBar = null;
}

Human.prototype.updatePath = function(world) {
    var path = findPath(world, this.x, this.y, this.finalDestination.x, this.finalDestination.y);

    if (path && path.length > 0) {
        this.currentDestination = path.shift();

        var iso = cartesianToIsometric(
            (this.currentDestination.x - this.x) * CELL_SIZE,
            (this.currentDestination.y - this.y) * CELL_SIZE
        );

        var _this = this;
        var viewDestinationX = this.view.x + iso.x;
        var viewDestinationY = this.view.y + iso.y;

        var dir = getDirection(this, this.currentDestination);
        if (dir >= 0 && this.dir != dir) {
            this.dir = dir;
        }
        this.gotoDirAnim("walk");

        this.x = this.currentDestination.x;
        this.y = this.currentDestination.y;

        tweenAdded();
        createjs.Tween.get(this.view)
            .to({
                x: viewDestinationX,
                y: viewDestinationY
            }, 800)
            .call(function() {
                //console.log("Moved to " + _this.currentDestination);
                updateViewPos(_this);
                _this.currentDestination = null;
                _this.stepOnCellCallback();
                tweenRemoved(function() {
                    _this.updatePath(world);
                }, function() {
                    _this.gotoDirAnim("idle");
                });
            });
    } else {
        this.finalDestination = null;

        this.gotoDirAnim("idle");
    }
}

Human.prototype.setFinalDestinationCell = function(world, cell) {
    this.finalDestination = cell;
    if (!this.currentDestination) {
        this.updatePath(world);
    }
}

Human.prototype.dealDamage = function(world, unit) {
    if (unit.type == UNIT_TREE) {
        unit.takeDamage(this.treeDamage);
        return true;
    } else if (unit.type == UNIT_GOLEM) {
        unit.takeDamage(this.golemDamage);
        return true;
    }
    return false;
}

Human.prototype.startContinuousAction = function(container, actionTime, callbackLoopPeriod, callback) {
    this.stopContinuousAction(container);

    this.progressBar = new ProgressBar(this.x, this.y);
    this.progressBar.view.x = this.view.x;
    this.progressBar.view.y = this.view.y;
    this.progressBar.turnOn(container, this.waitingCallback, actionTime);

    callback();
    this.continuousActionTween = createjs.Tween.get(this.view,{loop:true})
        .wait(callbackLoopPeriod)
        .call(callback);
}

Human.prototype.stopContinuousAction = function() {
    if (this.continuousActionTween) {
        this.continuousActionTween.setPaused(true);
    }
    if (this.progressBar) {
        this.progressBar.turnOff();
    }
}

Golem.prototype = Object.create(Unit.prototype);
function Golem(x, y) {
    var view = new createjs.Sprite(assets.golemSpriteSheet, "idle_se");
    this.dir = 0;
    this.hp = GOLEM_MAX_HP;
    Unit.call(this, x, y, view, UNIT_GOLEM);
}

Golem.prototype.engageHuman = function(world, human) {
    if (!this.isAlive()) return;

    var route = findPath(world, this.x, this.y, human.x, human.y);
    if (route && route.length > 1) {
        var dest = route[0];
        var dir = getDirection(this, dest);

        if (dir >= 0 && dir != this.dir) {
            this.dir = dir;
        }

        this.gotoDirAnim("walk");
        var dPos = cartesianToIsometric(DIRS[this.dir].x * CELL_SIZE, DIRS[this.dir].y * CELL_SIZE);
        var newPos = {x: this.view.x + dPos.x, y: this.view.y + dPos.y};
        this.x = dest.x;
        this.y = dest.y;

        var golem = this;

        tweenAdded();
        createjs.Tween.get(this.view)
            .to({
                x: newPos.x,
                y: newPos.y
            }, 1000)
            .call(function() {
                updateViewPos(golem);
                tweenRemoved(function() {
                    golem.engageHuman(world, human);
                }, function() {
                    golem.gotoDirAnim("idle");
                });
            });
    } else {
        var dir = getDirection(this, human);

        if (dir >= 0) {
            this.dir = dir;
            this.gotoDirAnim("attack", true);
        } else {
            this.gotoDirAnim("idle");
        }

        var golem = this;
        tweenAdded();
        createjs.Tween.get(this.view).wait(500).call(function() {
            tweenRemoved(function() {
                golem.engageHuman(world, human);
            }, function() {
                golem.gotoDirAnim("idle");
            });
        });
    }
}

function ProgressBar(x, y) {
    this.currentTween = null;
    this.view = new createjs.Sprite(assets.statusBarsSpriteSheet, "wait");
}

ProgressBar.prototype.turnOn = function(container, onCompleteCallback, waitingTime) {
    this.view.alpha = 0.1;
    container.addChild(this.view);

    var _this = this;
    this.currentTween = createjs.Tween.get(this.view)
        .to({
            alpha: 1.0
        }, waitingTime)
        .call(onCompleteCallback);

    this._container = container;
}

ProgressBar.prototype.turnOff = function() {
    if (this.currentTween) {
        console.log("Ended previous continuous action.");
        this.currentTween.setPaused(true);
    }
    this._container.removeChild(this.view);
    this.currentTween = null;
}
