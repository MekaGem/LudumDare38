var INVENTORY_BAR_X = 5;
var INVENTORY_BAR_Y = 5;

var ITEM_STONE = "stone";

function Inventory() {
    this.container = new createjs.Container();

    this.items = {
        stone: 0
    };

    this.items_text = new createjs.Text("", "20px Arial", "#ff7700");
    this.updateText();

    this.items_text.x = INVENTORY_BAR_X;
    this.items_text.y = INVENTORY_BAR_Y;
    this.items_text.testBaseline = "alphabetic";

    this.container.addChild(this.items_text);
}

Inventory.prototype.updateText = function() {
    this.items_text.text = JSON.stringify(this.items);
}

Inventory.prototype.addItem = function(name, amount) {
    if (!this.items[name]) {
        this.items[name] = 0;
    }
    this.items[name] += amount;
    this.updateText();
}
