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

    // Setup periodic ticker.
    createjs.Ticker.setFPS(30);
    createjs.Ticker.addEventListener("tick", tick);

    var stepPeriod = 1000; // 1 second.
    var timePassed = 0;

    function tick(event) {
        timePassed += event.delta;
        while (timePassed > stepPeriod) {
            // Update game world.
            step();
            timePassed -= stepPeriod;
        }
        // Render.
        stage.update();
    }

    function step() {
        borderCell = pickRandomBorderCell(map);
        if (borderCell) {
            map.transformToWater(borderCell.x, borderCell.y);
        }
        console.log("Step!");
    }
}
