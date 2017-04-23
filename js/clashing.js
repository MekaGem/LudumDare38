function GetBBox(island) {
    var r = b = 0;
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