var INVENTORY_BAR_X = 10;
var INVENTORY_SPACING = 20;

var ITEM_STONES = {name: "stones", index: 0};
var ITEM_FOOD = {name: "food", index: 1};
var ITEM_WOOD = {name: "wood", index: 2};
var ITEM_TYPES = 3;
var FOOD_HEALING_VALUE = 25;

function Inventory() {
    this.container = new createjs.Container();

    var foodSprite = new createjs.Container();
    var berrySprite = new createjs.Sprite(assets.resourcesSpriteSheet, "berry");
    var fishSprite = new createjs.Sprite(assets.resourcesSpriteSheet, "fish");
    foodSprite.addChild(berrySprite);
    fishSprite.x += berrySprite.getBounds().width + 6;
    foodSprite.addChild(fishSprite);

    this.items = [
        {
            amount: 0,
            text: new createjs.Text("", "20px Arial", "#ff7700"),
            view: new createjs.Sprite(assets.resourcesSpriteSheet, "stone"),
        },
        {
            amount: 0,
            text: new createjs.Text("", "20px Arial", "#ff7700"),
            view: foodSprite,
        },
        {
            amount: 0,
            text: new createjs.Text("", "20px Arial", "#ff7700"),
            view: new createjs.Sprite(assets.resourcesSpriteSheet, "log"),
        },
    ];
    this.updateText();

    var x = INVENTORY_BAR_X;
    for (var i = 0; i < ITEM_TYPES; ++i) {
        var item = this.items[i];

        item.view.x = x;
        x += item.view.getBounds().width + INVENTORY_SPACING;
        this.container.addChild(item.view);

        item.text.x = x;
        x += 3 * INVENTORY_SPACING;
        this.container.addChild(item.text);
    }
}

Inventory.prototype.updateText = function() {
    for (var i = 0; i < ITEM_TYPES; ++i) {
        this.items[i].text.text = JSON.stringify(this.items[i].amount);
    }
}

Inventory.prototype.changeItemAmount = function(type, delta) {
    this.items[type.index].amount += delta;
    this.updateText();
}

Inventory.prototype.addItem = function(type, amount) {
    this.changeItemAmount(type, amount);
}

Inventory.prototype.hasEnoughResources = function(requirements) {
    console.log(this.items);
    for (var i = 0; i < requirements.length; ++i) {
        var type = requirements[i][0];
        var amount = requirements[i][1];
        if (this.items[type.index].amount < amount) {
            return false;
        }
    }
    return true;
}

Inventory.prototype.takeResources = function(requirements) {
    for (var i = 0; i < requirements.length; ++i) {
        var type = requirements[i][0];
        var amount = requirements[i][1];
        this.changeItemAmount(type, -amount);
    }
}

Inventory.prototype.mealRequirements = [
    [ITEM_FOOD, 1]
]

