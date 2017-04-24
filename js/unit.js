var TREE_MAX_HP = 200;
var GOLEM_MAX_HP = 100;
var HUMAN_MAX_HP = 100;
var TREE_CUTTING_TIME = 3000; // 3 seconds.
var FISHING_TIME = 6000; // 6 seconds.
var HUMAN_GOLEM_DAMATE = 20;
var HUMAN_EATING_TIME = 2000 // 2 seconds.
var GOLEM_DAMAGE = 10;

function Unit(x, y, view, type) {
    this.x = x;
    this.y = y;
    this.container = new createjs.Container();
    this.container.addChild(view);
    this.container.unit = this;
    this.view = view;
    this.type = type;
    this.maxHP = 0;
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
    if (this.healthStatus) {
        this.healthStatus.updateHP(this.hp);
    }
}

Unit.prototype.takeHeal = function (hp) {
    this.hp = Math.min(this.maxHP, this.hp + hp)
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

function compareUnitContainers(a, b) {
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
    this.maxHP = TREE_MAX_HP;
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

function HealthStatus(hp) {
    this.view = new createjs.Container();
    this.fill = new createjs.Bitmap(assets.heartFill);
    this.heart = new createjs.Sprite(assets.healthSpriteSheet, "heart");
    this.hpText = new createjs.Text(hp, "20px Arial", "#ff7700");
    this.hpText.x += this.heart.getBounds().width + INVENTORY_SPACING;

    var bounds = this.heart.getBounds();

    this.fill.sourceRect = {
        x: 0,
        y: 0,
        width: bounds.width,
        height: 0
    };

    this.view.addChild(this.hpText);
    this.view.addChild(this.heart);
    this.view.addChild(this.fill);
}

HealthStatus.prototype.updateHP = function(hp) {
    this.hpText.text = hp;

    var bounds = this.heart.getBounds();
    createjs.Tween.get(this.fill.sourceRect)
        .to({
            height: bounds.height * (1 - hp / HUMAN_MAX_HP)
        }, 100);
}

Human.prototype = Object.create(Unit.prototype);
function Human(x, y) {
    var view = new createjs.Sprite(assets.humanSpriteSheet, "idle_se");
    Unit.call(this, x, y, view, UNIT_HUMAN);
    this.view.regY -= CELL_SIZE / 4.;

    this.hp = HUMAN_MAX_HP;
    this.maxHP = HUMAN_MAX_HP;
    this.dir = 0;
    this.currentDestination = null;
    this.finalDestination = null;
    this.treeCuttingTime = TREE_CUTTING_TIME; // 3 seconds.
    this.golemDamage = HUMAN_GOLEM_DAMATE;
    this.fishingTime = FISHING_TIME;
    this.eatingTime = HUMAN_EATING_TIME;
    this.stepOnCellCallback = null;
    this.progressBar = null;
    this.oldDir = null;

    this.healthStatus = new HealthStatus(this.hp);
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
        var viewDestinationX = this.container.x + iso.x;
        var viewDestinationY = this.container.y + iso.y;

        var dir = getDirection(this, this.currentDestination);
        if (dir >= 0 && this.dir != dir) {
            this.dir = dir;
        }
        this.gotoDirAnim("walk");

        this.x = this.currentDestination.x;
        this.y = this.currentDestination.y;

        tweenAdded();
        createjs.Tween.get(this.container)
            .to({
                x: viewDestinationX,
                y: viewDestinationY
            }, 800)
            .call(function() {
                //console.log("Moved to " + _this.currentDestination);
                updateContainerPos(_this);
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

Human.prototype.hasActionAtDir = function(dir) {
    return dir == this.oldDir;
}

Human.prototype.startContinuousAction = function(container, actionTime, callbackLoopPeriod, callback) {
    this.stopContinuousAction(container);

    this.oldDir = this.dir;

    this.progressBar = new ProgressBar();
    this.progressBar.turnOn(this.container, this.waitingCallback, actionTime);

    callback();
    this.continuousActionTween = createjs.Tween.get(this.container,{loop:true})
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
    this.oldDir = null;
}

Golem.prototype = Object.create(Unit.prototype);
function Golem(x, y) {
    var view = new createjs.Sprite(assets.golemSpriteSheet, "idle_se");
    this.dir = 0;
    this.hp = GOLEM_MAX_HP;
    this.maxHP = GOLEM_MAX_HP;
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
        var newPos = {x: this.container.x + dPos.x, y: this.container.y + dPos.y};
        this.x = dest.x;
        this.y = dest.y;

        var golem = this;

        tweenAdded();
        createjs.Tween.get(this.container)
            .to({
                x: newPos.x,
                y: newPos.y
            }, 1000)
            .call(function() {
                updateContainerPos(golem);
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
            human.takeDamage(GOLEM_DAMAGE);
            this.gotoDirAnim("attack", true);
        } else {
            this.gotoDirAnim("idle");
        }

        var golem = this;
        tweenAdded();
        createjs.Tween.get(this.container).wait(500).call(function() {
            tweenRemoved(function() {
                golem.engageHuman(world, human);
            }, function() {
                golem.gotoDirAnim("idle");
            });
        });
    }
}

function ProgressBar() {
    this.currentTween = null;
    this.bg = new createjs.Sprite(assets.statusBarsSpriteSheet, "background");
    this.fill = new createjs.Bitmap(assets.progressBarFill);

    var bounds = this.bg.getBounds();
    this.fill.regX = -bounds.x;
    this.fill.regY = -bounds.y;

    this.fill.sourceRect = {
        x: 0,
        y: 0,
        width: 0,
        height: bounds.height
    };

    console.log(this, this.bg.getBounds());
}

ProgressBar.prototype.turnOn = function(container, onCompleteCallback, waitingTime) {
    container.addChild(this.bg);
    container.addChild(this.fill);

    var bounds = this.bg.getBounds();
    this.currentTween = createjs.Tween.get(this.fill.sourceRect)
        .to({
            width: bounds.width
        }, waitingTime)
        .call(onCompleteCallback);

    this._container = container;
}

ProgressBar.prototype.turnOff = function() {
    if (this.currentTween) {
        console.log("Ended previous continuous action.");
        this.currentTween.setPaused(true);
    }
    this._container.removeChild(this.bg);
    this._container.removeChild(this.fill);
    this.currentTween = null;
}
