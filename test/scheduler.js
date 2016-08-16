const fs = require('fs');
const schedule = require('node-schedule');
const ec2 = require('./ec2-backup');
const logger = require('./logger');
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

let snapshots = {};
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

function recordWeeksInfo(snapshotsInfo) {
  snapshotsInfo.fourWeeksAgo = snapshotsInfo.threeWeeksAgo;
  snapshotsInfo.threeWeeksAgo = snapshotsInfo.twoWeeksAgo;
  snapshotsInfo.twoWeeksAgo = snapshotsInfo.oneWeekAgo;
  snapshotsInfo.oneWeekAgo = snapshotsInfo.Sunday;
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
      .then(res => {
        logger.info(`${todayDayString}-${volumeId}: Removing old snapshot 4 weeks ago - SUCCESS.`);
      })
      .catch(err => {
        logger.info(`${todayDayString}-${volumeId}: Removing old snapshot 4 weeks ago - ERROR.`);
        logger.info(JSON.stringify(err));
      });

      recordWeeksInfo(volumeState);
    } else {
      ec2.deleteSnapShot(old)
      .then(res => {
        logger.info(`${todayDayString}-${volumeId}: Removing old snapshot previous weeks - SUCCESS.`);
      })
      .catch(err => {
        logger.info(`${todayDayString}-${volumeId}: Removing old snapshot previous weeks - ERROR.`);
        logger.info(JSON.stringify(err));
      });
    }

    saveSnapshotsState(snapshots)
    .then(() => {
      logger.info(`${todayDayString}-${volumeId}: Saving snapshots state - SUCCESS.`);
    })
    .catch(err => {
      logger.info(`${todayDayString}-${volumeId}: Saving snapshots state - ERROR.`);
      logger.info(JSON.stringify(err));
    });
  })
  .catch(err => {
    logger.info(`${todayDayString}-${volumeId} creating snapshot - ERROR.`);
    logger.info(JSON.stringify(err));
  });
}

/**
 * @TODO make the breakpoint flexible
 */
function scheduler(timeString) {
  // https://github.com/node-schedule/node-schedule
  schedule.scheduleJob(timeString, () => {
    for (const volumeId of volumeIds) {
      backupSingleVolume(volumeId);
    }
  });
}

scheduler('* * 11 * * *');
