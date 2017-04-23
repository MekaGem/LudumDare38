function Unit(x, y, view) {
    this.x = x;
    this.y = y;
    this.view = view;
}

Tree.prototype = Object.create(Unit.prototype);
function Tree(x, y) {
    var view = new createjs.Sprite(assets.spriteSheet, "tree");
    Unit.call(this, x, y, view);
}

Rock.prototype = Object.create(Unit.prototype);
function Rock(x, y) {
    var view = new createjs.Sprite(assets.spriteSheet, "rock");
    Unit.call(this, x, y, view);
}

Human.prototype = Object.create(Unit.prototype);
function Human(x, y) {
    var view = new createjs.Sprite(assets.humanSpriteSheet, "idle_se");

    this.dir = 0;
    this.currentDestination = null;
    this.finalDestination = null;
    this.path = null;

    Unit.call(this, x, y, view);
}

Human.prototype.updatePath = function() {
    if (this.path) {
        this.currentDestination = this.path.shift();
        // console.log("Current destination = " + this.currentDestination.x + ":" + this.currentDestination.y);
        if (this.path.length == 0) this.path = null;

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
        var newAnim = "walk_" + DIR_SUFFIX[this.dir];
        if (this.view.currentAnimation != newAnim) {
            this.view.gotoAndPlay(newAnim);
        }

        createjs.Tween.get(this.view)
            .to({
                x: viewDestinationX,
                y: viewDestinationY
            }, 1000)
            .call(function() {
                console.log("Moved to " + _this.currentDestination);
                _this.x = _this.currentDestination.x;
                _this.y = _this.currentDestination.y;
                _this.currentDestination = null;
                _this.updatePath();
            });
    } else {
        this.finalDestination = null;
        
        this.view.gotoAndPlay("idle_" + DIR_SUFFIX[this.dir]);
    }
}

Human.prototype.setFinalDestinationCell = function(world, cell) {
    var path = null;
    if (this.currentDestination) {
        path = findPath(world, this.currentDestination.x, this.currentDestination.y, cell.x, cell.y);
    } else {
        path = findPath(world, this.x, this.y, cell.x, cell.y);
    }

    if (!path || path.length == 0) {
        return;
    }

    this.path = path;
    this.finalDestination = cell;
    if (!this.currentDestination) {
        this.updatePath();
    }
}

Golem.prototype = Object.create(Unit.prototype);
function Golem(x, y) {
    var view = new createjs.Sprite(assets.golemSpriteSheet, "walk_se");
    this.dir = 0;
    Unit.call(this, x, y, view);
}

Golem.prototype.engageHuman = function(world, human) {
    var route = findPath(world, this.x, this.y, human.x, human.y);
    if (route && route.length > 1) {
        var dest = route[0];
        var dir = getDirection(this, dest);
        
        console.log(dest, dir);
        if (dir >= 0 && dir != this.dir) {
            this.dir = dir;
        }
        
        var newAnim = "walk_" + DIR_SUFFIX[this.dir];
        
        if (newAnim != this.view.currentAnimation) {
            this.view.gotoAndPlay(newAnim);
        }
        var dPos = cartesianToIsometric(DIRS[this.dir].x * CELL_SIZE, DIRS[this.dir].y * CELL_SIZE);
        var newPos = {x: this.view.x + dPos.x, y: this.view.y + dPos.y};
        var golem = this;
        createjs.Tween.get(this.view).to({x: newPos.x, y: newPos.y}, 1000).call(function(){golem.x = dest.x; golem.y = dest.y; golem.engageHuman(world, human);});
    } else {
        var dir = getDirection(this, human);
        
        if (dir >= 0 && dir != this.dir) {
            this.dir = dir;
        }
        
        var newAnim = "attack_" + DIR_SUFFIX[this.dir];
        
        this.view.gotoAndPlay(newAnim);
        var golem = this;
        createjs.Tween.get(this.view).wait(500).call(function(){golem.engageHuman(world, human);});
    }
}
