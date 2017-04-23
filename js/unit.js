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
    var view = new createjs.Sprite(assets.humanSpriteSheet, "walk_nw");
    this.currentDestination = new Point(x, y);
    this.finalDestinationCell = new Point(x, y);
    this.stepLength = 20;
    Unit.call(this, x, y, view);
}

// returns shift direction in cartesian coordinates.
Human.prototype.getShiftDirection = function(world) {
    var cartesianOrigin = isometricToCartesian(this.view.x, this.view.y);
    var cartesianDestination = new Point(this.currentDestination.x * CELL_SIZE, this.currentDestination.y * CELL_SIZE);
    var delta = new Point(cartesianDestination.x - cartesianOrigin.x,
        cartesianDestination.y - cartesianOrigin.y);
    var answer = new Point(0, 0);
    if (Math.abs(delta.x) > this.stepLength) {
        answer.x = Math.round(delta.x / Math.abs(delta.x)) * this.stepLength;
    } else if (Math.abs(delta.y) > this.stepLength) {
        answer.y = Math.round(delta.y / Math.abs(delta.y)) * this.stepLength;
    } else {
        answer = delta;
    }

    if (answer.x == 0 && answer.y == 0) {
        // we have reached previous destination point.
        var currentCell = new Point(Math.round(cartesianOrigin.x / CELL_SIZE),
            Math.round(cartesianOrigin.y / CELL_SIZE));
        var route = findPath(world,
            currentCell.x,
            currentCell.y,
            this.finalDestinationCell.x,
            this.finalDestinationCell.y);
        if (route.length > 1) {
            // there is still some distance to go.
            this.currentDestination = new Point(route[1][0], route[1][1]);
        }
        console.log("Human changed his next destination cell to: ("
            + this.currentDestination.x +  ", " + this.currentDestination.y + ")");
    }
    return answer;
}

Human.prototype.setFinalDestinationCell = function(cell) {
    this.finalDestinationCell = cell;
}

Golem.prototype = Object.create(Unit.prototype);
function Golem(x, y) {
    var view = new createjs.Sprite(assets.golemSpriteSheet, "walk_se");
    this.dir = 0;
    Unit.call(this, x, y, view);
}

Golem.prototype.engageHuman = function(world, human) {
    var humanCoords = isometricToCartesian(human.view.x, human.view.y);
    humanCoords.x = Math.round(humanCoords.x / CELL_SIZE);
    humanCoords.y = Math.round(humanCoords.y / CELL_SIZE);
    
    var route = findPath(world, this.x, this.y, humanCoords.x, humanCoords.y);
    if (route.length > 2) {
        var dest = {x: route[1][0], y: route[1][1]};
        var dir = -1;
        for (var d = 0; d < 4; d++) {
            var nx = this.x + DIRS[d].x;
            var ny = this.y + DIRS[d].y;
            if (nx == dest.x && ny == dest.y) {
                dir = d;
                break;
            }
        }
        
        if (dir >= 0 && dir != this.dir) {
            this.dir = dir;
        }
        
        var newAnim;
        switch (this.dir) {
        case 0:
            newAnim = "walk_se";
            break;
        case 1:
            newAnim = "walk_sw";
            break;
        case 2:
            newAnim = "walk_nw";
            break;
        case 3:
            newAnim = "walk_ne";
            break;
        default:
            return;
        }
        
        if (newAnim != this.view.currentAnimation) {
            this.view.gotoAndPlay(newAnim);
        }
        var dPos = cartesianToIsometric(DIRS[this.dir].x * CELL_SIZE, DIRS[this.dir].y * CELL_SIZE);
        var newPos = {x: this.view.x + dPos.x, y: this.view.y + dPos.y};
        var golem = this;
        createjs.Tween.get(this.view).to({x: newPos.x, y: newPos.y}, 1000).call(function(){golem.x = dest.x; golem.y = dest.y; golem.engageHuman(world, human);});
    } else {
        var dir = -1;
        for (var d = 0; d < 4; d++) {
            var nx = this.x + DIRS[d].x;
            var ny = this.y + DIRS[d].y;
            if (nx == humanCoords.x && ny == humanCoords.y) {
                dir = d;
                break;
            }
        }
        
        if (dir >= 0 && dir != this.dir) {
            this.dir = dir;
        }
        
        var newAnim;
        switch (this.dir) {
        case 0:
            newAnim = "attack_se";
            break;
        case 1:
            newAnim = "attack_sw";
            break;
        case 2:
            newAnim = "attack_nw";
            break;
        case 3:
            newAnim = "attack_ne";
            break;
        }
        
        this.view.gotoAndPlay(newAnim);
        var golem = this;
        createjs.Tween.get(this.view).wait(500).call(function(){golem.engageHuman(world, human);});
    }
}
