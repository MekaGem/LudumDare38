function endGame(game) {
    var endGameTitle = new createjs.Text("GAME OVER, LOSER", "bold 40px Arial", "#ff7700");
    bounds = endGameTitle.getBounds()
    endGameTitle.x = stageCenter.x - bounds.width / 2;
    endGameTitle.y = stageCenter.y - bounds.height / 2;
    stage.addChild(endGameTitle);
    game.finished = true;
}

function isGameEnded(game) {
    if (game.human.isAlive()) {
        return false;
    }
    return true;
}
