const fs = require('fs');
const schedule = require('node-schedule');
const ec2 = require('./ec2-backup');
const { VOLUME_ID } = require('../config');
const { getDayString, cloneDeep } = require('./helpers');

/**
 * this keeps track of all snapshots
 * it needs to read its initial state from a file incase of applicaiton failure.
 */
let snapshots = require('./snapshots-state.json');

function saveSnapshotsState(snapshotsState) {
  fs.writeFile('./snapshots-state.json', JSON.stringify(snapshotsState, ' ', 2));
}

function recordWeeksInfo(snapshotsInfo) {
  snapshotsInfo.fourWeeksAgo = snapshotsInfo.threeWeeksAgo;
  snapshotsInfo.threeWeeksAgo = snapshotsInfo.twoWeeksAgo;
  snapshotsInfo.twoWeeksAgo = snapshotsInfo.oneWeekAgo;
  snapshotsInfo.oneWeekAgo = snapshotsInfo.Sunday;
}

/**
 * @TODO make the breakpoint flexible
 */
function scheduler(scheduleString) {
  // https://github.com/node-schedule/node-schedule
  schedule.scheduleJob(scheduleString, () => {
    ec2.createSnapshot()
    .then(snapshot => {
      const today = new Date();
      // string rep of the day
      const todayDayString = getDayString(today);

      // copy the current snapshot info of the same day (which is last week)
      const old = snapshots[todayDayString].SnapshotId;

      // store the new snapshot in the state
      snapshots[todayDayString] = snapshot;

      // manage weeks information
      if (todayDayString === 'Sunday') {
        // delete the snapshot four weeks ago.
        const fourWeeksAgo = snapshots.fourWeeksAgo.SnapshotId;
        ec2.deleteSnapShot(fourWeeksAgo);

        recordWeeksInfo(snapshots);
      } else {
        // delete the old snapshot
        ec2.deleteSnapShot(old);
      }

      // save the snapshot to file for backup
      saveSnapshotsState(snapshots);
    });
  });
}

module.exports = scheduler;
