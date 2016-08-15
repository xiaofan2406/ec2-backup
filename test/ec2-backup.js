const exec = require('child_process').exec;
const { getDateString } = require('./helpers');

const fs = require('fs');
const { v4 } = require('node-uuid');

/**
 * http://docs.aws.amazon.com/cli/latest/reference/ec2/create-snapshot.html
 */
function createSnapshot(volumeId) {
  return new Promise((resolve, reject) => {
    const id = v4();
    const snapshot = {
      "VolumeId": volumeId,
      "StartTime": (new Date()).toString(),
      "SnapshotId": id
    };
    console.log('\tcreating snapshot...');
    fs.writeFile(`./${id}.txt`, JSON.stringify(snapshot, ' ', 2), err => {
      if (err) {
        return reject(err);
      }
      resolve(snapshot);
    })
  });
}

/**
 * http://docs.aws.amazon.com/cli/latest/reference/ec2/delete-snapshot.html
 */
function deleteSnapShot(snapshotId) {
  return new Promise((resolve, reject) => {
    console.log('\tremoving snapshot...');
    fs.unlink(`./${snapshotId}.txt`, err => {
      if (err) {
        return reject(err);
      }
      resolve(true);
    })
  });
}

module.exports = {
  createSnapshot,
  deleteSnapShot
}
