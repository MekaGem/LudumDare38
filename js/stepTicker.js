function StepTicker(period) {
    this.stepPeriod = period;
    this.timePassed = 0;
    this.listeners = [];
}

StepTicker.prototype.addEventListener = function(period, callback) {
    this.listeners.push({
        currentTick: 0,
        period: period,
        callback: callback
    });
};

StepTicker.prototype.tick = function() {
    for (var i = 0; i < this.listeners.length; ++i) {
        var l = this.listeners[i];
        ++l.currentTick;
        while (l.currentTick >= l.period) {
            l.callback();
            l.currentTick -= l.period;
        }
    }
};

StepTicker.prototype.advanceTime = function(delta) {
    this.timePassed += delta;
    while (this.timePassed > this.stepPeriod) {
        this.tick();
        this.timePassed -= this.stepPeriod;
    }
};

