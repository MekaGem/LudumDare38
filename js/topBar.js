var TOP_BAR_X = 20;
var BOTTOM_BAR_X = 20;
var TOP_BAR_Y = 20;
var ALIGN_LEFT = "left";
var ALIGN_RIGHT = "right";
var SPACING = 30
var RIGHT_SPACING = 10;

function Bar(shift_x, shift_y) {
    this.container = new createjs.Container();
    this.container.y = shift_y;

    this.shift_x = shift_x
    this.shift_y = shift_y

    this.leftContainer = new createjs.Container();
    this.rightContainer = new createjs.Container();

    this.leftX = 0;
    this.rightX = 0;

    this.container.addChild(this.leftContainer);
    this.container.addChild(this.rightContainer);
}

Bar.prototype.addItem = function(item, alignment) {
    var bounds = item.getBounds();
    if (alignment == ALIGN_LEFT) {
        item.x += this.leftX + this.shift_x;
        this.leftContainer.addChild(item);
        this.leftX += bounds.width + SPACING;
    } else if (alignment == ALIGN_RIGHT) {
        item.x += this.rightX;
        this.rightX += bounds.width + RIGHT_SPACING;
        this.rightContainer.addChild(item);
        this.rightContainer.x = stageWidth - this.rightX;
    }
}
