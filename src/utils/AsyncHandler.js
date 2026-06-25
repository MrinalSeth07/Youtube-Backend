//asyncHandler is an high order function whihc accpet the function adn return the function

const asyncHandler = (RequestHandler) => {
    (req, res, next) => {
        return Promise.resolve(RequestHandler(req,res,next)).catch((err) => {
            next(err)
        }) 
    }
}
export default asyncHandler;