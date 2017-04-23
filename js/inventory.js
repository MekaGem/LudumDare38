var INVENTORY_BAR_X = 10;
var INVENTORY_BAR_Y = 20;
var INVENTORY_SPACING = 20;

var ITEM_STONES = {name: "stones", index: 0};
var ITEM_BERRIES = {name: "berries", index: 1};
var ITEM_WOOD = {name: "wood", index: 2};
var ITEM_TYPES = 3;

function Inventory() {
    this.container = new createjs.Container();

    this.items = [
        {
            amount: 0,
            text: new createjs.Text("", "20px Arial", "#ff7700"),
            view: new createjs.Sprite(assets.spriteSheet, "rock"),
        },
        {
            amount: 0,
            text: new createjs.Text("", "20px Arial", "#ff7700"),
            view: new createjs.Sprite(assets.spriteSheet, "bush_with_berries"),
        },
        {
            amount: 0,
            text: new createjs.Text("", "20px Arial", "#ff7700"),
            view: new createjs.Sprite(assets.spriteSheet, "tree"),
        },
    ];
    this.updateText();

    var x = INVENTORY_BAR_X;
    for (var i = 0; i < ITEM_TYPES; ++i) {
        var item = this.items[i];
        if (i == ITEM_STONES.index) {
            item.view.regX = -22;
            item.view.regY = 12.5 - 20;
        } else if (i == ITEM_BERRIES.index) {
            item.view.regX = -17;
            item.view.regY = 22 - 20;
        } else if (i == ITEM_WOOD.index) {
            item.view.regX = -27.5;
            item.view.regY = -32;
        }

        item.view.x = x;
        x += item.view.getBounds().width + INVENTORY_SPACING;
        item.view.y = INVENTORY_BAR_Y;
        this.container.addChild(item.view);

        item.text.x = x;
        x += 3 * INVENTORY_SPACING;
        item.text.y = INVENTORY_BAR_Y;
        this.container.addChild(item.text);
    }
}

Inventory.prototype.updateText = function() {
    for (var i = 0; i < ITEM_TYPES; ++i) {
        this.items[i].text.text = JSON.stringify(this.items[i].amount);
    }
}

Inventory.prototype.addItem = function(type, amount) {
    this.items[type.index] += amount;
    this.updateText();
}
