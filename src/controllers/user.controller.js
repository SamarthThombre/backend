import { asyncHandler } from "../utils/asyncHendler.js"


const regesterUsers = asyncHandler( async (req, res ) => {
    res.status(200).json({
        message: "ok"
    })
})

export { regesterUsers }