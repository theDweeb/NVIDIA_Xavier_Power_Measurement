const fs = require('fs');

// Path to tegra release
const BOARD_INFO_PATH = '/etc/nv_tegra_release';
const JETSON_NANO = 't210ref'
const JETSON_XAVIER_TX2 = 't186ref' // Xavier and TX2 are the same

let getPlatform = function() {
    let data = fs.readFileSync(BOARD_INFO_PATH, 'utf-8')

    is_nano = data.search(JETSON_NANO);
    is_xavier_tx2 = data.search(JETSON_XAVIER_TX2);

    if(is_xavier_tx2 > is_nano) {
        board = 'xavier_tx2';
    } else if(is_xavier_tx2 < is_nano) {
        board = 'nano'
    } else {
        board = 'error'
    }
    return board
}

exports.getPlatform = getPlatform