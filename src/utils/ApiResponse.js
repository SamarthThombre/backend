class ApiResponce {
    constructor(statuscode, message = "Success", data) {
        this.statuscode = statuscode
        this.message = message
        this.data = data
        this.statuscode = statuscode < 400
    }
}