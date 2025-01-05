
import CircularJSON from 'circular-json';

class ApiResponse {
    constructor(statusCode, data, message="Success"){
        this.statusCode = statusCode,
        this.data= CircularJSON.stringify(data),
        this.message = message,
        this.success = statusCode < 400
    }
}

export {ApiResponse};