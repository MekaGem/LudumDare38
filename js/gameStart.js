function startGame(stage) {
    stage.removeAllChildren();
    var gameInfoContainer = new createjs.Container();
    var startButtonContainer = new createjs.Container();
    var gameInfoButton = new createjs.Sprite(assets.resourcesSpriteSheet, "grass");
    var startButton = new createjs.Sprite(assets.resourcesSpriteSheet, "play");
    startButtonContainer.x = stage.canvas.width / 2 - 150;
    startButtonContainer.y = stage.canvas.height / 2;
    gameInfoContainer.x = stage.canvas.width / 2 + 150;
    gameInfoContainer.y = stage.canvas.height / 2;

    gameInfoContainer.addChild(gameInfoButton);
    startButtonContainer.addChild(startButton);

    gameInfoContainer.on("mousedown", function() {
        gameInfo(stage);
    });

    startButtonContainer.on("mousedown", function() {
        var game = initGame();
        gameLoop(game);
    });
    stage.addChild(gameInfoContainer);
    stage.addChild(startButtonContainer);
    stage.update();
}

function gameInfo(stage) {
    stage.removeAllChildren();
    var startGameTitle = new createjs.Text("                                                        WELCOME!!!\n" +
        "                          Are you ready to rate the game for 5 stars?\n" +
        "                            How much time can you survive?\n" +
        "        Controls:\n" +
        "1. Use your mouse!\n" +
        "2. Press 'F' to build fortification, and 'ESC' to cancel building,\n" +
        "3. Press 'H' to eat.\n" +
        "4. Try to interact with water and surroundings(golems, trees, buildings), while standing near them.\n", "bold 40px Arial", "#ff7700");
    var bounds = startGameTitle.getBounds();
    stageWidth = window.innerWidth;
    stageHeight = window.innerHeight;
    stage.canvas.width = stageWidth;
    stage.canvas.height = stageHeight;
    stageCenter = new Point(stageWidth / 2, stageHeight / 2);

    startGameTitle.x = stageCenter.x - bounds.width / 2;
    startGameTitle.y = stageCenter.y - bounds.height / 2;
    stage.addChild(startGameTitle);


    var backContainer = new createjs.Container();
    var backButton = new createjs.Sprite(assets.resourcesSpriteSheet, "play");
    backButton.x = 0;
    backButton.y = 0;
    backContainer.addChild(backButton);
    backContainer.on("mousedown", function() {
        startGame(stage);
    });
    stage.addChild(backContainer);
    stage.update();
}