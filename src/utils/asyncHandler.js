
// sare async method ye handle krlega 
// error dikhane k liye b format ek bar likhna pda

const asyncHandler = (fn)  =>  async (req, res, next) =>{
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success: false,
            message: error.message
        })
    }
}


export {asyncHandler}


// const asyncHandler = (requestHandler) => {
//     (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next))
//         .catch( (error) => next(error) ) 
//     }
// }

