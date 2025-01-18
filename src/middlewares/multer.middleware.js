import multer from "multer"         //multer is middleware used to handle file uploads in web applications.

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.originalname+ '-' + uniqueSuffix)
  }
})
  
 export const upload = multer({ storage: storage })