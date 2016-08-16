const fs = require('fs');
const schedule = require('node-schedule');
const ec2 = require('./ec2-backup');
const logger = require('./logger');
const { volumeIds } = require('../config');
const { getDayString, cloneDeep } = require('./helpers');

/**
 * this file keeps track of all snapshots state
 * it needs to read its initial state from a file incase of applicaiton failure.
 */
let snapshots = {};
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
    logger.info(`${todayDayString}-${volumeId}: creating snapshot - SUCCESS.`);

    // copy the current snapshot info of the same day (which is last week)
    const old = volumeState[todayDayString].SnapshotId;

    // store the new snapshot in the state
    volumeState[todayDayString] = snapshot;

    // manage weeks information
    if (todayDayString === 'Sunday') {
      const fourWeeksAgo = volumeState.fourWeeksAgo.SnapshotId;
      ec2.deleteSnapShot(fourWeeksAgo)
      .then(() => {
        logger.info(`${todayDayString}-${volumeId}: Removing old snapshot 4 weeks ago - SUCCESS.`);
      })
      .catch(err => {
        logger.info(`${todayDayString}-${volumeId}: Removing old snapshot 4 weeks ago - ERROR.`);
        logger.info(err);
      });

      recordWeeksInfo(volumeState);
    } else {
      ec2.deleteSnapShot(old)
      .then(() => {
        logger.info(`${todayDayString}-${volumeId}: Removing old snapshot previous weeks - SUCCESS.`);
      })
      .catch(err => {
        logger.info(`${todayDayString}-${volumeId}: Removing old snapshot previous weeks - ERROR.`);
        logger.info(err);
      });
    }

    saveSnapshotsState(snapshots)
    .then(() => {
      logger.info(`${todayDayString}-${volumeId}: Saving snapshots state - SUCCESS.`);
    })
    .catch(err => {
      logger.info(`${todayDayString}-${volumeId}: Saving snapshots state - ERROR.`);
      logger.info(err);
    });
  })
  .catch(err => {
    logger.info(`${todayDayString}-${volumeId} creating snapshot - ERROR.`);
    logger.info(err);
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
  });
}

module.exports = scheduler;
