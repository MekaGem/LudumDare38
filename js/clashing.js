function GetBBox(island) {
    var r = 0;
    var b = 0;
    var l = island.width;
    var t = island.height;
    for (var x = 0; x < island.width; x++) {
        for (var y = 0; y < island.height; y++) {
            if (island.cellIsValid(x, y) && island.cellIsLand(x, y)) {
                l = Math.min(l, x);
                t = Math.min(t, y);
                r = Math.max(r, x);
                b = Math.max(b, y);
            }
        }
    }

    return {l: l, r: r, t: t, b: b};
}

function GetSharedCellsVertical(left, right, lbb, rbb, offset) {
    var shared = 0;
    var xoff = -1;
    while (shared == 0) {
        xoff++;
        for (var x = 0; x <= xoff; x++) {
            for (var y = lbb.t; y <= lbb.b; y++) {
                if (!left.cellIsValid(lbb.r - xoff + x, y) || !left.cellIsLand(lbb.r - xoff + x, y)) continue;
                if (right.cellIsValid(rbb.l + x, y - offset) && right.cellIsLand(rbb.l + x, y - offset)) {
                    shared++;
                }
            }
        }
    }
    return {shared: shared, xoff: xoff, yoff: offset};
}

function GetSharedCellsHorizontal(top, bottom, tbb, bbb, offset) {
    var shared = 0;
    var yoff = -1;
    while (shared == 0) {
        yoff++;
        for (var y = 0; y <= yoff; y++) {
            for (var x = tbb.l; x <= tbb.r; x++) {
                if (!top.cellIsValid(x, tbb.b - yoff + y) || !top.cellIsLand(x, tbb.b - yoff + y)) continue;
                if (bottom.cellIsValid(x - offset, bbb.t + y) && bottom.cellIsLand(x - offset, bbb.t + y)) {
                    shared++;
                }
            }
        }
    }
    return {shared: shared, xoff: offset, yoff: yoff};
}

function ClashIslands(myIsland, theirIsland, clashDir) {
    var myBBox = GetBBox(myIsland);
    var theirBBox = GetBBox(theirIsland);

    var best = {shared: 0};

    switch (clashDir) {
    case 0: // right
        var mid = (myBBox.t + myBBox.b - (theirBBox.b + theirBBox.t)) / 2;
        for (var k = myBBox.t - theirBBox.b; k <= myBBox.b - theirBBox.t; k++) {
            var res = GetSharedCellsVertical(myIsland, theirIsland, myBBox, theirBBox, k);
            if (res.shared > best.shared || (res.shared == best.shared && Math.abs(k - mid) < Math.abs(best.yoff - mid))) {
                best = res;
            }
        }
        break;
    case 1: // down
        var mid = (myBBox.l + myBBox.r - (theirBBox.l + theirBBox.r)) / 2;
        for (var k = myBBox.l - theirBBox.r; k <= myBBox.r - theirBBox.l; k++) {
            var res = GetSharedCellsHorizontal(myIsland, theirIsland, myBBox, theirBBox, k);
            if (res.shared > best.shared || (res.shared == best.shared && Math.abs(k - mid) < Math.abs(best.xoff - mid))) {
                best = res;
            }
        }
        break;
    case 2: // left
        var mid = (theirBBox.t + theirBBox.b - (myBBox.b + myBBox.t)) / 2;
        for (var k = theirBBox.t - myBBox.b; k <= theirBBox.b - myBBox.t; k++) {
            var res = GetSharedCellsVertical(theirIsland, myIsland, theirBBox, myBBox, k);
            if (res.shared > best.shared || (res.shared == best.shared && Math.abs(k - mid) < Math.abs(best.yoff - mid))) {
                best = res;
            }
        }
        break;
    case 3: // up
        var mid = (theirBBox.l + theirBBox.r - (myBBox.l + myBBox.r)) / 2;
        for (var k = theirBBox.l - myBBox.r; k <= theirBBox.r - myBBox.l; k++) {
            var res = GetSharedCellsHorizontal(theirIsland, myIsland, theirBBox, myBBox, k);
            if (res.shared > best.shared || (res.shared == best.shared && Math.abs(k - mid) < Math.abs(best.xoff - mid))) {
                best = res;
            }
        }
        break;
    }

    switch (clashDir) {
    case 0: // right
        return {x: myBBox.r - theirBBox.l + 1 - best.xoff, y: best.yoff};
        break;
    case 1: // down
        return {x: best.xoff, y: myBBox.b - theirBBox.t + 1 - best.yoff};
        break;
    case 2: // left
        return {x: myBBox.l - theirBBox.r - 1 + best.xoff, y: -best.yoff};
        break;
    case 3: // up
        return {x: -best.xoff, y: myBBox.t - theirBBox.b - 1 + best.yoff};
        break;
    }
}

function MergeIslands(map, myIsland, theirIsland, clashDir) {
    var theirOff = ClashIslands(myIsland, theirIsland, clashDir);

    var myBBox = GetBBox(myIsland);
    var theirBBox = GetBBox(theirIsland);

    var myOff = {};
    var width;
    var height;
    switch (clashDir) {
    case 0: // right
        var right = Math.max(myBBox.r - theirOff.x, theirBBox.r);
        myOff.x = myBBox.l;
        width = (theirOff.x + right) - myBBox.l + 1;
        theirOff.x = myOff.x - theirOff.x;

        var top = Math.min(myBBox.t, theirBBox.t + theirOff.y);
        var bot = Math.max(myBBox.b, theirBBox.b + theirOff.y);
        myOff.y = top;
        height = bot - top + 1;
        theirOff.y = top - theirOff.y;
        break;
    case 1: // down
        var down = Math.max(myBBox.b - theirOff.y, theirBBox.b);
        myOff.y = myBBox.t;
        height = (theirOff.y + down) - myBBox.t + 1;
        theirOff.y = myOff.y - theirOff.y;

        var left = Math.min(myBBox.l, theirBBox.l + theirOff.x);
        var right = Math.max(myBBox.r, theirBBox.r + theirOff.x);
        myOff.x = left;
        width = right - left + 1;
        theirOff.x = left - theirOff.x;
        break;
    case 2: // left
        var left = Math.min(myBBox.l - theirOff.x, theirBBox.l);
        myOff.x = theirOff.x + left;
        width = (myBBox.r - theirOff.x) - left + 1;
        theirOff.x = left;

        var top = Math.min(myBBox.t, theirBBox.t + theirOff.y);
        var bot = Math.max(myBBox.b, theirBBox.b + theirOff.y);
        myOff.y = top;
        height = bot - top + 1;
        theirOff.y = top - theirOff.y;
        break;
    case 3: // up
        var top = Math.min(myBBox.t - theirOff.y, theirBBox.t)
        myOff.y = theirOff.y + top;
        height = (myBBox.b - theirOff.y) - top + 1;
        theirOff.y = top;

        var left = Math.min(myBBox.l, theirBBox.l + theirOff.x);
        var right = Math.max(myBBox.r, theirBBox.r + theirOff.x);
        myOff.x = left;
        width = right - left + 1;
        theirOff.x = left - theirOff.x;
        break;
    }

    { // water around the island
        myOff.x -= 1;
        myOff.y -= 1;
        theirOff.x -= 1;
        theirOff.y -= 1;
        width += 2;
        height += 2;
    }

    var cells = [];
    var tilesContainer = new createjs.Container();
    var willMove = [];

    for (var x = 0; x < width; ++x) {
        cells.push([]);
        for (var y = 0; y < height; ++y) {
            if (myIsland.cellIsValid(x + myOff.x, y + myOff.y) && myIsland.cellIsLand(x + myOff.x, y + myOff.y)) {
                cells[x].push(myIsland.cells[x + myOff.x][y + myOff.y]);
                var container = cells[x][y].container;
                var iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
                container.x = iso.x;
                container.y = iso.y + cells[x][y].offset;
                tilesContainer.addChild(container);
            } else if (theirIsland.cellIsValid(x + theirOff.x, y + theirOff.y) && theirIsland.cellIsLand(x + theirOff.x, y + theirOff.y)) {
                cells[x].push(theirIsland.cells[x + theirOff.x][y + theirOff.y]);
                var container = cells[x][y].container;
                var iso = cartesianToIsometric(x * CELL_SIZE, y * CELL_SIZE);
                container.x = iso.x;
                container.y = iso.y + cells[x][y].offset;
                tilesContainer.addChild(container);
                willMove.push(container);
            } else {
                cells[x].push(new Cell(CELL_TYPE_WATER));
            }
        }
    }
    myIsland.container.addChildAt(tilesContainer, myIsland.container.getChildIndex(myIsland.tilesContainer));
    myIsland.container.removeChild(myIsland.tilesContainer);
    myIsland.tilesContainer = tilesContainer;
    myIsland.cells = cells;
    myIsland.width = width;
    myIsland.height = height;

    map.updateWater(width + 30, height + 30);
    myIsland.x = Math.round((map.width - width) / 2);
    myIsland.y = Math.round((map.height - height) / 2);
    updateContainerPos(myIsland);

    var human;
    for (var i = 0; i < myIsland.units.length; ++i) {
        var unit = myIsland.units[i];
        unit.x -= myOff.x;
        unit.y -= myOff.y;
        updateContainerPos(unit);
        if (myIsland.cellIsValid(unit.x, unit.y)) {
            unit.container.y += myIsland.cells[unit.x][unit.y].offset;
        }
        if (unit.type == UNIT_HUMAN) {
            human = unit;
            if (unit.finalDestination) {
                unit.finalDestination.x -= myOff.x;
                unit.finalDestination.y -= myOff.y;
            }
        }
    }
    var newGolems = [];
    for (var i = 0; i < theirIsland.units.length; ++i) {
        var unit = theirIsland.units[i];
        unit.x -= theirOff.x;
        unit.y -= theirOff.y;
        myIsland.addUnit(unit);
        if (myIsland.cellIsValid(unit.x, unit.y)) {
            unit.container.y += myIsland.cells[unit.x][unit.y].offset;
        }
        willMove.push(unit.container);
        if (unit.type == UNIT_GOLEM) {
            newGolems.push(unit);
        }
    }

    var visualOffset = cartesianToIsometric(DIRS[clashDir].x * 10 * CELL_SIZE, DIRS[clashDir].y * 10 * CELL_SIZE);
    var clashDuration = 1000;
    for (var i = 0; i < willMove.length; ++i) {
        willMove[i].x += visualOffset.x;
        willMove[i].y += visualOffset.y;

        createjs.Tween.get(willMove[i])
            .to({
                x: willMove[i].x - visualOffset.x,
                y: willMove[i].y - visualOffset.y
            }, clashDuration);
    }

    createjs.Tween.get(null).wait(clashDuration + 100).call(function() {
        resumeTweens();
        if (human) {
            for (var i = 0; i < newGolems.length; i++) {
                newGolems[i].engageHuman(myIsland, human);
            }
        }
    });
}
