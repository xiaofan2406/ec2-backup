# ec2 backup

a simple node program to automatically backup ec2 instance

```
npm i

# modify config.js to match your volume-id

npm start
```


#### AWS guide
- make sure `python 2.7` or `python 3.3` is installed

- install aws cli
```
curl "https://s3.amazonaws.com/aws-cli/awscli-bundle.zip" -o "awscli-bundle.zip"
unzip awscli-bundle.zip
sudo ./awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws
```

- test install
```
aws help
```

- configure aws cli
```
aws configure
```

  More information: http://docs.aws.amazon.com/cli/latest/userguide/installing.html

  EC2 documentation: http://docs.aws.amazon.com/cli/latest/reference/ec2/index.html
