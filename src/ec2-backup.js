const exec = require('child_process').exec;

function getDate(date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * http://docs.aws.amazon.com/cli/latest/reference/ec2/create-snapshot.html
 */
function createSnapshot(volumeId) {
  const today = new Date();
  const description = `automatic snapshot - ${getDate(today)}`;
  const cmd = `aws ec2 create-snapshot --volume-id ${volumeId} --description "${description}"`;

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        // @TODO log the aws cli error
        return reject(err);
      }
      // @TODO log success
      resolve(JSON.parse(stdout));
    });
  });
}

/**
 * http://docs.aws.amazon.com/cli/latest/reference/ec2/delete-snapshot.html
 */
function deleteSnapShot(snapshotId) {
  const cmd = `aws ec2 delete-snapshot --snapshot-id ${snapshotId}`;
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        // @TODO log the aws cli error
        return reject(err);
      }
      // @TODO log success
      resolve(true);
    });
  });
}

module.exports = {
  createSnapshot,
  deleteSnapShot
}
