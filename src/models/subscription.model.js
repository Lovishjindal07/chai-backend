import { mongoos ,Schema} from "mongoose";

const subscriptionSchema = new Schema({  
    subsciber: {
        type: Schema.Types.ObjectId,   //one who is subscibing
        ref: "User"

    },
    channel: {
        type: Schema.Types.ObjectId, //onw to whom 'subsciber' is subscibing
        ref: "User"
    }
})

export const Subscription = mongoose.model("Subscription",
    subscriptionSchema
);