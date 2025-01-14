import multer from "multer"         //multer is middleware used to handle file uploads in web applications.


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
     cb(null, file.originalname)   // original name is name same as user input file name.
    }
  })
  
 export const upload = multer({ storage })