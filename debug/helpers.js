const countListenrs = (src) => {
    if (!src) {
        return null;
    }
    const events = [
        'connect',
        'error',
        'data',
        'end',
        'finish',
        'data-chunk',
        'data-end',
        'data-error',
        'data-transfer-start',
        'data-transfer-end',
        'command-response',
        'parsed'
    ];
    let result = 0;
    for (const event of events) {
        result += src.listenerCount(event);
    }
    return result;
};

module.exports = {
    countListenrs
};