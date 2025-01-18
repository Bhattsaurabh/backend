import {v2 as cloudinary} from "cloudinary"
import fs from "fs"     //file system
import dotenv from "dotenv"


dotenv.config({
    path: './.env'
})


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET
});


//pehle user se file leke local system m save krenge tb usko yaha se cloud pe upload krenge

const uploadOnCloudinary = async (localFilePath) =>  {
    
    try {

        if(!localFilePath)
            return null;
       
        // upload the file on cloudinary
        const response =  await cloudinary.uploader.upload(localFilePath, {
             resource_type: "auto"
        })

        //file has been uploaded successfully
        console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        console.log(response);
        return response
        
    } catch (error) {
        console.log("Files are not uploaded.", error)
        fs.unlinkSync(localFilePath)    //remove the locally saved temporary file as the upload operation failed !
        return null; 
    }

}


export {uploadOnCloudinary}