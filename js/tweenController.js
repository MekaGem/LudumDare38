var tweenController = {
    tweenCount: 0,
    shouldStop: false,
    onStop: null,
    onResume: []
};

function tweenAdded() {
    tweenController.tweenCount++;
}

function tweenRemoved(resumeCallback, ifStoppedCallback) {
    tweenController.tweenCount--;
    
    if (tweenController.shouldStop) {
        if (resumeCallback) tweenController.onResume.push(resumeCallback);
        if (ifStoppedCallback) ifStoppedCallback();
        
        if (tweenController.tweenCount == 0) {
            if (tweenController.onStop) tweenController.onStop();
            tweenController.onStop = null;
        }
    } else {
        if (resumeCallback) resumeCallback();
    }
}

function stopTweens(onStopCallback) {
    tweenController.shouldStop = true;
    if (tweenController.tweenCount > 0) {
        tweenController.onStop = onStopCallback;
    } else {
        if (onStopCallback) onStopCallback();
    }
}

function resumeTweens() {
    tweenController.shouldStop = false;
    for (var i = 0; i < tweenController.onResume.length; i++) {
        tweenController.onResume[i]();
    }
    tweenController.onResume = [];
}
