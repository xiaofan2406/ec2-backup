const schedule = require('node-schedule');
const ec2 = require('./ec2-backup');
const { VOLUME_ID } = require('../config');
const { getDayString, cloneDeep } = require('./helpers');

/**
 * this keeps track of all snapshots
 * it needs to read its initial state from a file incase of applicaiton failure.
 */
let snapshots = require('../snapshots-state.json');

function saveSnapshotsState(snapshotsState) {
  fs.writeFile('../snapshots-state.json', JSON.stringify(snapshotsState, ' ', 2));
}

function recordWeeksInfo(snapshotsInfo) {
  snapshotsInfo.fourWeeksAgo = snapshotsInfo.threeWeeksAgo;
  snapshotsInfo.threeWeeksAgo = snapshotsInfo.twoWeeksAgo;
  snapshotsInfo.twoWeeksAgo = snapshotsInfo.oneWeekAgo;
  snapshotsInfo.oneWeekAgo = snapshotsInfo.Sunday;
}

/**
 *
 */
function dailySchedule() {
  // https://github.com/node-schedule/node-schedule
  schedule.scheduleJob('0 0 23 * * *', () => {
    ec2.createSnapshot()
    .then(snapshot => {
      // string rep of the day
      const todayDayString = getDayString(today);

      // copy the current snapshot info of the same day (which is last week)
      const old = _.cloneDeep(snapshots[todayDayString]);

      // store the new snapshot in the state
      snapshots[getDayString(today)] = snapshot;

      // manage weeks information
      if (todayDayString === 'Sunday') {
        const fourWeeksAgo = _.cloneDeep(snapshots.fourWeeksAgo);
        recordWeeksInfo();

        // delete the snapshot four weeks ago.
        deleteSnapShot(fourWeeksAgo.SnapshotId);
      } else {
        // delete the old snapshot
        deleteSnapShot(old.SnapshotId);
      }

      // save the snapshot to file for backup
      saveSnapshotsState(snapshots);
    });
  });
}

module.exports = dailySchedule;
