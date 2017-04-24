TREE_MAX_HP = 200;
GOLEM_MAX_HP = 100;

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
var UNIT_WAITING_BAR = "WAITING_BAR";

function compareUnitViews(a, b) {
    if (a.y != b.y) return a.y - b.y;
    if (a.unit.type == UNIT_BUSH) return 1;
    if (b.unit.type == UNIT_BUSH) return -1;
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

    this.dir = 0;
    this.currentDestination = null;
    this.finalDestination = null;
    this.treeCuttingTime = 3000; // 3 seconds.
    this.golemDamage = 20;
    this.stepOnCellCallback = null;
    this.waitingBar = null;
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
            }, 1000)
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

Human.prototype.startContinuousAction = function (world, actionTime, callbackLoopPeriod, callback) {
    this.stopContinuousAction(world);

    this.waitingBar = new WaitingBar(this.x, this.y);
    this.waitingBar.turnOn(world, this, actionTime);

    callback();
    this.continuousActionTween = createjs.Tween.get(this.view,{loop:true})
        .wait(callbackLoopPeriod)
        .call(function() {
            callback();
        });
}

Human.prototype.stopContinuousAction = function (world) {
    if (this.continuousActionTween) {
        this.continuousActionTween.setPaused(true);
    }
    if (this.waitingBar) {
        this.waitingBar.turnOff(world);
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

WaitingBar.prototype = Object.create(Unit.prototype);
function WaitingBar(x, y) {
    this.currentTween = null;
    var view = new createjs.Sprite(assets.statusBarsSpriteSheet, "wait");
    view.alpha = 0.0;
    Unit.call(this, x, y, view, UNIT_WAITING_BAR);
}

WaitingBar.prototype.turnOn = function(world, unit, waitingTime) {
    var _this = this;
    this.currentTween = createjs.Tween.get(this.view)
        .to({
            alpha: 1.0
        }, waitingTime)
        .call(function() {
            unit.waitingCallback();
            world.removeUnit(_this);
        });
    world.addUnit(this);
}

WaitingBar.prototype.turnOff = function (world) {
    if (this.currentTween) {
        console.log("Ended previous continuous action.");
        this.currentTween.setPaused(true);
        world.removeUnit(this);
    }
    this.currentTween = null;
}
