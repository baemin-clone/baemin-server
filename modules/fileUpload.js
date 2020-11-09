const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

const { awsS3 } = require("../config/secret");
const s3 = new aws.S3();

aws.config.update({
    accessKeyId: awsS3.id,
    secretAccessKey: awsS3.secret,
    region: "ap-northeast-2"
});

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: "baemin",
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: "public-read",
        key: (req, file, cb) => {
            const userIdx = req.verifiedToken.idx;
            const filename = `${userIdx}_profile`;
            cb(null, filename);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = {
    upload
};
