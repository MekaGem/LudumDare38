function init() {
    var stage = new createjs.Stage("demoCanvas");
    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = 100;
    circle.y = 100;
    stage.addChild(circle);
    stage.update();

    var map = simpleMap();
    stage.addChild(map.container);
    stage.update();

    var data = {
        images: ["assets/tree.png"],
        frames: {
            width: 64, height: 64
        },
        animations: {
            stand: 0
        }
    };
    var spriteSheet = new createjs.SpriteSheet(data);

    var t = new Tree(0, 0, spriteSheet);
    map.addUnit(t);
    stage.update();
}
