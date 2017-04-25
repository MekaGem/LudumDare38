function showMenu() {
    resize();

    aboutText = "";
    var about = new createjs.Text(aboutText);
    var rules = new createjs.Text(rulesText);

    var menuContainer = new createjs.Container();
    var blackScreen = new createjs.Shape();
    blackScreen.graphics.beginFill("balck").drawRect(0, 0, stageWidth, stageHeight);

    var bg = new createjs.Sprite(assets.resourcesSpriteSheet, "bg");
    var playButton = new createjs.Sprite(assets.resourcesSpriteSheet, "play_button");
    var aboutButton = new createjs.Sprite(assets.resourcesSpriteSheet, "about_button");
    var rulesButton = new createjs.Sprite(assets.resourcesSpriteSheet, "rules_button");
    var textContainer = new createjs.Container();

    menuContainer.addChild(bg);

    playButton.x = 160;
    playButton.y = 177;
    menuContainer.addChild(playButton);
    playButton.on("mousedown", function() {
        stage.removeChild(blackScreen);
        stage.removeChild(menuContainer);
        play();
    })

    aboutButton.x = 41;
    aboutButton.y = 245;
    menuContainer.addChild(aboutButton);
    aboutButton.on("mousedown", function() {
        textContainer.removeAllChildren();
        textContainer.addChild(about);
        stage.update();
    });

    rulesButton.x = 282;
    rulesButton.y = 253;
    menuContainer.addChild(rulesButton);
    rulesButton.on("mousedown", function() {
        textContainer.removeAllChildren();
        textContainer.addChild(rules);
        stage.update();
    });

    stage.addChild(blackScreen);
    stage.addChild(menuContainer);
    stage.update();

    menuContainer.x = (stageWidth - bg.getBounds().width) / 2;
    menuContainer.y = (stageHeight - bg.getBounds().height) / 2;

    textContainer.x = 200;
    textContainer.y = (stageHeight + bg.getBounds().height) / 2 + 50;

    stage.update();
}
