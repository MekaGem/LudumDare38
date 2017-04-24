var TOP_BAR_X = 20;
var TOP_BAR_Y = 20;
var ALIGN_LEFT = "left";
var ALIGN_RIGHT = "right";
var SPACING = 30;

function TopBar() {
    this.container = new createjs.Container();
    this.x = 0;
    this.container.y = TOP_BAR_Y
}

TopBar.prototype.addItem = function(item, alignment) {
    if (alignment == ALIGN_LEFT) {
        var bounds = item.getBounds();
        item.x += this.x + TOP_BAR_X;
        topBar.container.addChild(item);
        this.x += bounds.width + SPACING;
    } else if (alignment == ALIGN_RIGHT) {
        topBar.container.addChild(item);
    }
}
