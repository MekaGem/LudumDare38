function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function clamp(value, min, max) {
    return Math.max(Math.min(value, max), min);
}

// Returns direction index if given adjacent points, -1 otherwise
function getDirection(from, to) {
    for (var d = 0; d < 4; d++) {
        var nx = from.x + DIRS[d].x;
        var ny = from.y + DIRS[d].y;
        if (nx == to.x && ny == to.y) {
            return d;
        }
    }
    return -1;
}
