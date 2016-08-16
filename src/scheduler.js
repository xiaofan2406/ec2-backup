const fs = require('fs');
const schedule = require('node-schedule');
const ec2 = require('./ec2-backup');
const { volumeIds } = require('../config');
const { getDayString, cloneDeep } = require('./helpers');

/**
 * this keeps track of all snapshots
 * it needs to read its initial state from a file incase of applicaiton failure.
 */
const snapshotsFilename = './snapshots-state.json';
const initVolumeState = {
  fourWeeksAgo: {},
  threeWeeksAgo: {},
  twoWeeksAgo: {},
  oneWeekAgo: {},
  Sunday: {},
  Monday: {},
  Tuesday: {},
  Wednesday: {},
  Thursday: {},
  Friday: {},
  Saturday: {}
};

let snapshots;
try {
    fs.accessSync(path, fs.F_OK);
    snapshots = require(snapshotsFilename);
} catch (e) {
  for (const volumeId of volumeIds) {
    snapshots[volumeId] = cloneDeep(initVolumeState);
  }
}

function saveSnapshotsState(snapshotsState) {
  return new Promise((resolve, reject) => {
    fs.writeFile('./snapshots-state.json', JSON.stringify(snapshotsState, ' ', 2), err => {
      if (err) {
        return reject(err);
      }
      resolve(true);
    });
  });
}

function recordWeeksInfo(volumeState) {
  volumeState.fourWeeksAgo = volumeState.threeWeeksAgo;
  volumeState.threeWeeksAgo = volumeState.twoWeeksAgo;
  volumeState.twoWeeksAgo = volumeState.oneWeekAgo;
  volumeState.oneWeekAgo = volumeState.Sunday;
}

function backupSingleVolume(volumeId) {
  const volumeState = snapshots[volumeId];
  ec2.createSnapshot(volumeId)
  .then(snapshot => {
    const today = new Date();
    // string rep of the day
    const todayDayString = getDayString(today);

    // copy the current snapshot info of the same day (which is last week)
    const old = volumeState[todayDayString].SnapshotId;

    // store the new snapshot in the state
    volumeState[todayDayString] = snapshot;

    // manage weeks information
    if (todayDayString === 'Sunday') {
      // delete the snapshot four weeks ago.
      const fourWeeksAgo = volumeState.fourWeeksAgo.SnapshotId;
      ec2.deleteSnapShot(fourWeeksAgo)
      .then(() => {
        // success
      })
      .catch(err => {
        // log err
      });

      recordWeeksInfo(volumeState);
    } else {
      // delete the old snapshot
      ec2.deleteSnapShot(old)
      .then(() => {
        // success
      })
      .catch(err => {
        // log err
      });
    }
  });
}

/**
 * @TODO make the breakpoint flexible
 */
function scheduler(scheduleString) {
  // https://github.com/node-schedule/node-schedule
  schedule.scheduleJob(scheduleString, () => {
    for (const volumeId of volumeIds) {
      backupSingleVolume(volumeId);
    }
    // save the snapshot state to file for backup
    saveSnapshotsState(snapshots)
    .then(() => {
      // log success
    })
    .catch(err => {
      // log err
    });
  });
}

module.exports = scheduler;
