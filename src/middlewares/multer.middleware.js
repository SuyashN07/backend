import multer from "multer";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/temp/')
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname)
//   }
// });

const storage = multer.diskStorage({ 
  destination: "../../public/filesUpload",
  filename: (req, file, cb) => { 
    cb(null, Date.now() + "-" + file.originalname); 
  },
});

export const upload = multer({ storage })